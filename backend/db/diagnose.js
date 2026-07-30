// Standalone Neon/Postgres connection diagnostic.
// Run locally with:  node db/diagnose.js
// (from the backend/ folder, with your real .env in place)
//
// This checks each layer independently — DNS, TCP, SSL, auth, query — so we
// can see EXACTLY where the connection is failing instead of guessing.

require("dotenv").config();
const dns = require("dns").promises;
const net = require("net");
const tls = require("tls");
const { Client } = require("pg");

const RAW_URL = process.env.DATABASE_URL;

function section(title) {
  console.log("\n" + "=".repeat(60));
  console.log(title);
  console.log("=".repeat(60));
}

async function main() {
  section("1. Is DATABASE_URL set?");
  if (!RAW_URL) {
    console.log("❌ DATABASE_URL is not set in backend/.env. Stopping here.");
    process.exit(1);
  }
  console.log("✅ DATABASE_URL is set.");

  let parsed;
  try {
    parsed = new URL(RAW_URL);
  } catch (e) {
    console.log("❌ DATABASE_URL is not a valid URL:", e.message);
    process.exit(1);
  }

  const host = parsed.hostname;
  const port = Number(parsed.port || 5432);
  console.log(`   host: ${host}`);
  console.log(`   port: ${port}`);
  console.log(`   database: ${parsed.pathname.replace("/", "")}`);
  console.log(`   user: ${parsed.username}`);
  console.log(`   uses pooler: ${host.includes("-pooler") ? "yes" : "NO — see note below"}`);
  if (!host.includes("-pooler")) {
    console.log(
      "   ⚠️  Your host does not contain '-pooler'. On Render (and most serverless\n" +
        "       hosts) you should use Neon's POOLED connection string, not the direct one.\n" +
        "       Neon console -> your project -> Connection Details -> 'Pooled connection'."
    );
  }

  section("2. DNS resolution");
  try {
    const addrs = await dns.lookup(host, { all: true });
    console.log("✅ DNS resolved:", addrs.map((a) => a.address).join(", "));
  } catch (e) {
    console.log("❌ DNS lookup failed:", e.message);
    console.log(
      "   This usually means the hostname is wrong/typo'd, or the Neon project/branch\n" +
        "   was deleted (Neon deletes the endpoint hostname when a project is removed)."
    );
    process.exit(1);
  }

  section("3. Raw TCP connection to the port");
  await new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout: 8000 });
    socket.on("connect", () => {
      console.log(`✅ TCP connection to ${host}:${port} succeeded.`);
      socket.end();
      resolve();
    });
    socket.on("timeout", () => {
      console.log(`❌ TCP connection to ${host}:${port} timed out after 8s.`);
      console.log(
        "   This means the network can't reach Neon's host at all — check for a\n" +
          "   firewall/network restriction, or that the endpoint isn't paused/deleted."
      );
      socket.destroy();
      resolve();
    });
    socket.on("error", (e) => {
      console.log(`❌ TCP connection failed: ${e.message}`);
      resolve();
    });
  });

  section("4. TLS handshake (raw, no libpq)");
  await new Promise((resolve) => {
    const socket = tls.connect(
      { host, port, servername: host, rejectUnauthorized: false, timeout: 8000 },
      () => {
        console.log("✅ TLS handshake succeeded (cert verification relaxed).");
        console.log("   Certificate subject:", socket.getPeerCertificate()?.subject?.CN);
        socket.end();
        resolve();
      }
    );
    socket.on("timeout", () => {
      console.log("❌ TLS handshake timed out.");
      socket.destroy();
      resolve();
    });
    socket.on("error", (e) => {
      console.log("❌ TLS handshake failed:", e.message);
      resolve();
    });
  });

  section("5. Full Postgres connection + query (what your app actually does)");
  const url = new URL(RAW_URL);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");
  const client = new Client({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  try {
    await client.connect();
    const res = await client.query("select current_database(), current_user, now()");
    console.log("✅ Connected and queried successfully:");
    console.log("  ", res.rows[0]);
    await client.query(
      "select table_name from information_schema.tables where table_schema='public' order by 1"
    );
    const tables = await client.query(
      "select table_name from information_schema.tables where table_schema='public' order by 1"
    );
    if (tables.rows.length === 0) {
      console.log(
        "\n⚠️  Connected fine, but there are NO TABLES in this database.\n" +
          "    Run `npm run db:migrate` to apply backend/db/schema.sql."
      );
    } else {
      console.log(
        "\n✅ Tables found:",
        tables.rows.map((r) => r.table_name).join(", ")
      );
    }
    await client.end();
  } catch (e) {
    console.log("❌ Full connection/query failed:", e.message);
    console.log("   Full error:", e);
  }

  section("Done");
  console.log(
    "If steps 1-4 pass but step 5 fails, it's an auth/SSL config issue.\n" +
      "If step 2 or 3 fails, the Neon endpoint itself is unreachable (paused/deleted project,\n" +
      "wrong host, or network block) — this is NOT something app code can fix.\n" +
      "If everything here passes but the live site still fails, the problem is specifically\n" +
      "in Render's environment (stale DATABASE_URL) or CORS (CLIENT_ORIGIN mismatch), not the DB."
  );
}

main();
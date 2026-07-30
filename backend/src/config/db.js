const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. On Render this must be added manually in " +
      "Dashboard -> your service -> Environment (render.yaml marks it sync:false, " +
      "so it is NOT filled in automatically from the repo)."
  );
}

// IMPORTANT: newer versions of `pg` (8.16+) parse "sslmode=require" out of the
// connection string as an alias for "verify-full" (strict CA verification),
// and that parsed value SILENTLY OVERRIDES any explicit `ssl` option passed
// alongside `connectionString` — even though the code below sets
// rejectUnauthorized:false. The result: strict cert verification runs anyway,
// which can hang or fail against Neon depending on the host's CA bundle, with
// no clear error. Stripping sslmode/channel_binding here and controlling SSL
// only through the explicit `ssl` option below fixes that mismatch.
function toPoolConfig(rawUrl) {
  if (!rawUrl) return { connectionString: rawUrl, ssl: false };
  try {
    const url = new URL(rawUrl);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("channel_binding");
    return { connectionString: url.toString() };
  } catch {
    // Not a parseable URL (shouldn't normally happen) — fall back as-is.
    return { connectionString: rawUrl };
  }
}

const { connectionString } = toPoolConfig(process.env.DATABASE_URL);

// Neon (and most managed Postgres hosts) require SSL. rejectUnauthorized:false
// keeps this working without needing to install a CA bundle.
const pool = new Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === "production" || process.env.DATABASE_URL?.includes("neon.tech")
      ? { rejectUnauthorized: false }
      : false,
  // Neon's free-tier compute auto-suspends when idle and needs a few seconds
  // to wake on the first query after a gap. Give it real room to connect
  // instead of hanging forever or failing instantly.
  connectionTimeoutMillis: 20000,
  idleTimeoutMillis: 30000,
  max: 10,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client", err);
});

// Fail loud and clear at boot if Neon can't be reached, instead of every
// request silently timing out with no explanation in the logs.
pool
  .query("select 1")
  .then(() => console.log("✅ Connected to Postgres (Neon) successfully."))
  .catch((err) => {
    console.error("❌ Could not connect to the database at startup:", err.message);
    console.error(
      "Check: 1) DATABASE_URL is set correctly in Render's Environment tab, " +
        "2) the Neon project/branch is not deleted or paused indefinitely, " +
        "3) the connection string uses the pooled host (contains '-pooler')."
    );
  });

module.exports = pool;
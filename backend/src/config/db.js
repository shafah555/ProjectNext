const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. On Render this must be added manually in " +
      "Dashboard -> your service -> Environment (render.yaml marks it sync:false, " +
      "so it is NOT filled in automatically from the repo)."
  );
}

// Neon (and most managed Postgres hosts) require SSL. rejectUnauthorized:false
// keeps this working without needing to install a CA bundle.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
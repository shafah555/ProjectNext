const { Pool } = require("pg");

// Neon (and most managed Postgres hosts) require SSL. rejectUnauthorized:false
// keeps this working without needing to install a CA bundle.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production" || process.env.DATABASE_URL?.includes("neon.tech")
      ? { rejectUnauthorized: false }
      : false,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client", err);
});

module.exports = pool;
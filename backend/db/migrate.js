// Applies schema.sql to the database at DATABASE_URL.
// Run with:  npm run db:migrate
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is not set. Add it to backend/.env (local) or to your Render service's Environment tab (production)."
    );
    process.exit(1);
  }

  // Same fix as src/config/db.js: strip sslmode/channel_binding so newer `pg`
  // versions don't silently force strict cert verification over rejectUnauthorized:false.
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");

  const pool = new Pool({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false }, // required by Neon
  });

  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  console.log(`Connecting to database and applying ${schemaPath} ...`);

  try {
    await pool.query(sql);
    console.log("✅ Schema applied successfully. Tables are ready.");
  } catch (err) {
    console.error("❌ Migration failed:");
    console.error(err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
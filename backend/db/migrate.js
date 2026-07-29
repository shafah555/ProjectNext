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

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
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
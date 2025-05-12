import { pool } from "./db";

async function createSessionsTable() {
  console.log("Creating sessions table...");
  
  try {
    // Create sessions table manually since connect-pg-simple expects a specific schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "sid" varchar NOT NULL PRIMARY KEY,
        "sess" jsonb NOT NULL,
        "expire" timestamp(6) NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");
    `);
    
    console.log("✅ Sessions table created successfully!");
  } catch (error) {
    console.error("❌ Error creating sessions table:", error);
  } finally {
    // Don't close the pool as it might be used elsewhere
  }
}

createSessionsTable();
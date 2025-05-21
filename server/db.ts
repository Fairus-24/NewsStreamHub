import "dotenv/config";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const dbFile =
  process.env.DATABASE_URL.startsWith("file:")
    ? process.env.DATABASE_URL.slice(5)
    : process.env.DATABASE_URL;
const sqlite = new Database(dbFile);
export const db = drizzle(sqlite, { schema });
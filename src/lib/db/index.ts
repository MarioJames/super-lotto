import Database from 'better-sqlite3';
import path from 'path';
import { initSchema } from './schema';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'lottery.db');

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function runInTransaction<T>(fn: (db: Database.Database) => T): T {
  const database = getDatabase();
  return database.transaction(fn)(database);
}

export type { Database };

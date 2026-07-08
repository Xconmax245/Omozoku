import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// This is required to load environment variables from the root .env file
import { config } from 'dotenv';
config({ path: '../../.env' });

const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  console.warn('⚠️ DATABASE_URL is missing in environment variables. Using a dummy connection string for build time.');
}

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString || 'postgres://postgres:postgres@localhost:5432/dummy', { prepare: false });
export const db = drizzle(client, { schema });

export * from './schema';

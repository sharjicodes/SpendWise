import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as env from '$app/env/private';
import { schema } from './schema';

let database: ReturnType<typeof drizzle> | undefined;

export function getDb() {
	if (database) return database;
	if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required to use the SpendWise database.');
	const client = postgres(env.DATABASE_URL, {
		max: Number(env.DATABASE_POOL_SIZE || 5),
		prepare: false
	});
	database = drizzle(client, { schema });
	return database;
}

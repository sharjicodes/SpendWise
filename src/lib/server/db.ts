import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as env from '$app/env/private';
import { schema } from './schema';

const databaseUrl = env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required to use the SpendWise database.');

const client = postgres(databaseUrl, {
	max: Number(env.DATABASE_POOL_SIZE || 5),
	prepare: false
});

export const db = drizzle(client, { schema });

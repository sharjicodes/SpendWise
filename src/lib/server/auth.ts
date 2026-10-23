import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import * as env from '$app/env/private';
import { db } from './db';
import { schema } from './schema';

const authSecret = env.BETTER_AUTH_SECRET;
const authUrl = env.BETTER_AUTH_URL || 'http://localhost:3000';
if (!authSecret || authSecret.length < 32) {
	throw new Error('Set BETTER_AUTH_SECRET to a random value with at least 32 characters.');
}

export const auth = betterAuth({
	secret: authSecret,
	baseURL: authUrl,
	basePath: '/api/auth',
	database: drizzleAdapter(db, { provider: 'pg', schema }),
	emailAndPassword: { enabled: true },
	trustedOrigins: [authUrl]
});

import { defineEnvVars } from '@sveltejs/kit/env';

// These are read at runtime by the deployment adapter; they are optional so the landing page can run
// before a local or hosted PostgreSQL database has been configured.
export const variables = defineEnvVars({
	DATABASE_URL: { schema: (value) => value },
	DATABASE_POOL_SIZE: { schema: (value) => value },
	BETTER_AUTH_URL: { schema: (value) => value },
	BETTER_AUTH_SECRET: { schema: (value) => value }
});

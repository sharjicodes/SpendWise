import { building } from '$app/env';
import * as env from '$app/env/private';
import type { Handle } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
	const authPath = event.url.pathname.startsWith('/api/auth');
	if (!env.DATABASE_URL || !env.BETTER_AUTH_SECRET) {
		if (authPath) {
			return Response.json(
				{ message: 'Authentication is not configured yet. Add DATABASE_URL and BETTER_AUTH_SECRET.' },
				{ status: 503 }
			);
		}
		return resolve(event);
	}

	const { auth } = await import('#lib/server/auth.js');
	const session = await auth.api.getSession({ headers: event.request.headers });
	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;
	return svelteKitHandler({ event, resolve, auth, building });
};

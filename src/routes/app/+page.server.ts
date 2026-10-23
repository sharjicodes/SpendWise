import * as env from '$app/env/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!env.DATABASE_URL || !env.BETTER_AUTH_SECRET) {
		return { user: null, configured: false };
	}
	return { user: locals.user, configured: true };
};

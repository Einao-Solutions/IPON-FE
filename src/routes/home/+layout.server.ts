import type { LayoutServerLoad } from '../../../.svelte-kit/types/src/routes/dataview/$types';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { loggedInUser } from '$lib/store';

// export const load: LayoutServerLoad = ({ cookies }) => {
// 	const user = cookies.get('user');
// 	if (user) {
// 		return {
// 			user: JSON.parse(user)
// 		};
// 	}
// 	else {
// 		redirect(301, "/auth");
// 	}
// };

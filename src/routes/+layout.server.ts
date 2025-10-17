import { redirect } from '@sveltejs/kit';
export const prerender = true;
export const trailingSlash = 'always';
// export const load = ({ url, cookies }) => {
// 	const user = cookies.get('user');
// 	if (!user) {
// 		if (!url.pathname.includes('/auth')) {
// 			console.log('taking you back to auth');
// 			redirect(303, '/auth');
// 		} else {
// 			return {};
// 		}
// 	}
// };
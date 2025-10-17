// import { type Handle, redirect } from '@sveltejs/kit';
//
// export const handle: Handle = async ({ event, resolve }) => {
// 	const id=event.cookies.get('user')
// 	const url = new URL(event.request.url);
// 	if (!id) {
// 		// user doesn't exist or is null
// 		if (!url.pathname.includes("/auth")) {
// 			return new Response('unauthorized', {
// 				status: 303,
// 				headers: { location: '/auth' }
// 			});
// 		}
// 		return resolve(event);
// 	}
// 	else
// 	{
// 		if (url.pathname.includes("/auth"))
// 		{
// 			throw redirect(302, '/home/dashboard')
// 		}
// 		else {
// 			const authorizedPaths=["/home/dashboard"]
// 			if (authorizedPaths.includes(event.url.pathname))
// 			resolve(event);
// 		}
// 	}
//
// 	return resolve(event);
// };
// import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';
//
// export const load=({cookies})=>{
// 	const res=cookies.get('user')
// 	if (res===undefined){
// 		redirect(300, "/auth");
// 	}
// }
//
// export const actions={
// 	logout:async (event)=>{
// 	console.log("logout");
// 	event.cookies.delete('user', {path:"/"})
// 	// 	redirect(300, "auth");
// 	}
// } satisfies  Actions
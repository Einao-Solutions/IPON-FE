// import type { PageServerLoad } from '../../../../.svelte-kit/types/src/routes/$types';
// import { baseURL, type FileStatsType } from '$lib/helpers';

export const load=async ({cookies})=>{
	// const user=  JSON.parse(cookies.get('user'));
	// return {
	// 	user: user
	// }
	// const userId=user.id;
	// const showId= user.type==="Staff"|| user.type==="Admin";
	// const id=showId?null:userId;
	// console.log('finding stats for ', id)
	// const url=`${baseURL}/api/files/FileStatistics?userId=${id}`;
	// const data=await fetch(url);
	// if (data.ok)
	// {
	// 	const body=await data.json();
	// 	const values=body.result as FileStatsType[];
	// 	console.log(values.filter(x=>x.count>0));
	// 	return {
	// 		values:values,
	// 		isStaff: user.type==="Staff"
	// 	}
	// }
}
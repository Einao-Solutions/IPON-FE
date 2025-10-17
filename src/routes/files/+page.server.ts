// import type { PageServerLoad } from '../../../.svelte-kit/types/src/routes/$types';
// import { faker } from '@faker-js/faker';
// import { ApplicationStatuses } from '$lib/helpers';
// import { fileTypeToString, mapStatusToString, mapTypeToString } from '../home/components/dashboardutils';

// export const load: PageServerLoad = async ({ url, cookies }) => {
	// 	const type=url.searchParams.get('fileType');
	// 	const typeconverted=type? type.split(",").map(Number) as number[]:null;
	// 	const PriorityNumber=url.searchParams.get('PriorityNumber');
	// 	const priConverted= PriorityNumber? PriorityNumber:null;
	// 	const status=url.searchParams.get('status');
	// 	const statusConverted=status? status?.split(",").map(Number) as number[]:null;
	// 	const applicationType=url.searchParams.get('appType');
	// 	const appTypeConverted= applicationType?applicationType?.split(",").map(Number) as number[]:null;
	// 	const indexString=url.searchParams.get('index');
	// 	const quantityString=url.searchParams.get('quantity');
	// 	const title=url.searchParams.get('title');
	// 	const userId = '3717'
// 	const user = cookies.get('user');
// 	const userId = JSON.parse(user).id.toString();
// 	return {
// 		userId: userId
// 	};
// };
// 	const index= indexString? parseInt(indexString):0;
// 	const quantity= quantityString? parseInt(quantityString):10;
// 	const fileUrl =`http://localhost:5044/api/files/summary?index=${index}&quantity=${quantity}`;
// 	const body={
// 		userType:0,
// 		userId,
// 		types:typeconverted,
// 		status:statusConverted,
// 		applicationTypes:appTypeConverted,
// 		Title:title??null,
// 		PriorityNumber:priConverted,
// 	};
// 	console.log(body)
// 	const result=await fetch(fileUrl,{
// 		method:'POST',
// 		headers:{
// 			'Content-Type': 'application/json'
// 		},
// 		body:JSON.stringify({...body}),
// 	});
// 	const resp=await result.json();
// 	const values:any[]=(resp).result;
// 	const count :number = resp.count;
// 	let dataList=[];
// 	for (let i=0;i<values.length;i++){
// 		const curr = values[i];
// 		const allPending=(curr.summaries as []).filter(x=>![0, 1, 11, 13, 14].includes(x.applicationStatus));
// 		dataList.push({
// 			"s/n":i+1,
// 			"date": Intl.DateTimeFormat('en-NG', {year:'2-digit', month:'short', day:'numeric', weekday:'short', hour:'numeric', minute:'numeric'} ).format(new Date(curr.summaries[0].applicationDate)),
// 			"fileId":curr.fileId,
// 			"fileStatus": Object.values(ApplicationStatuses)[curr.fileStatus],
// 			"title":curr.title,
// 			"fileType":fileTypeToString(curr.type),
// 			"id":curr.id,
//
// 			"status": allPending.length>1?'Multiple': mapStatusToString(allPending[0].applicationStatus),
// 			"appType":allPending.length>1?'Multiple':mapTypeToString(allPending[0].applicationType)
// 		})
// 	}
// for (let i=0;i<values.length;i++){
// 	const curr = values[i];
// 	dataList.push({
// 		"s/n":i+1,
// 		"date":  faker.date.soon().toString().split('GMT')[0],
// 		"fileId":"F/NC/O/2024/32434",
// 		"fileStatus": ApplicationStatuses.AwaitingPayment,
// 		"title":faker.lorem.sentences(3),
// 		"fileType":"Patent",
// 		"status": ApplicationStatuses.AwaitingSearch,
// 		"id":faker.person.fullName(),
// 		"appType":FormApplicationTypes.NewApplication
// 	})
// }
// return {
// 	data: dataList,
// 	showAppStatus: type!=='patents',
// 	showType: type!=='patents',
// 	title: "Patent files",
// 	count:count
// }
// }

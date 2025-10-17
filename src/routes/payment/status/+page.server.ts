// export const load=({url, cookies})=>{
// 	const status=url.searchParams.get('status');
// 	const statuscode=url.searchParams.get('statuscode');
// 	const paymentType=url.searchParams.get('paymentType');
// 	const paymentId=url.searchParams.get('rrr');
// 	const title=url.searchParams.get('title');
// 	const applicantName=url.searchParams.get('applicantName');
// 	const amount=url.searchParams.get('amount');
// 	//022 invalid request //027 Transaction Already Processed
// 	const user=JSON.parse(cookies.get('user'))
// 	return {
// 		status:status,
// 		statuscode:statuscode,
// 		fileId: url.searchParams.get('fileId'),
// 		applicationId:  url.searchParams.get('applicationId'),
// 		userName: user.name ,
// 		paymentId: paymentId,
// 		userId: user.id,
// 		paymentType: paymentType,
// 		title : title,
// 		applicantName : applicantName,
// 		amount : amount,
// 	};
// 	// switch(status){}
// 	// case 'Payment'
// }
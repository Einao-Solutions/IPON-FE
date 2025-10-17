import { redirect } from '@sveltejs/kit';
// export const load=({cookies})=>{
// 	const user=cookies.get('user')
// 	if(!user)
// 	{
// 		redirect(301, "/auth");
// 	}
// };


// import { ApplicationStatuses, FilingType, UserRoles, UserTypes } from '$lib/helpers';
// import { fail } from 'sveltekit-superforms';
// import {  FormApplicationTypes, type PatentData } from '$lib/helpers';
// import { faker } from '@faker-js/faker';
// import type { LayoutServerLoad } from './$types';
// import { getLocalTimeZone, today } from '@internationalized/date';
// import { CanTreatApplication, CanUpdateApplication } from './datahelpers';
// import { redirect } from '@sveltejs/kit';
// // we need the logged in user type
//
// export const load: LayoutServerLoad = async ({ url, cookies }) => {
// 	const id = url.searchParams.get('id');
// 	console.log(id)
// 	const loggeduser = JSON.parse(cookies.get("user"));
// 	if (!id) {
// 		console.log("going back")
// 		return redirect(404, "home/dashboard");}
// 	if (!loggeduser) return fail(404,{message:"no logged user"});
// 	// return;
// // 	const res=await fetch(`http://localhost:5044/api/files/${id}`)
// // 	const file=await res.json();
// // 	console.log(file)
// // 	const user = UserTypes.Staff;
// // 	const userRoles=[UserRoles.PatentExaminer];
// // 	const filingType= FilingType.Patent;
// // 	const appStatus=file.fileStatus;
// 	console.log(loggeduser);
// 	return {
// 		user:loggeduser,
// // 		CanUpdateApplication:
// // 			CanUpdateApplication(user, 'staff', file.creatorAccount, userRoles, appStatus),
// // 		CanTreatApplication: CanTreatApplication(user,userRoles, filingType, appStatus ),
// // 		CurrentStatus: appStatus,
// // 		data:file
// 	}
// };
//
// async function FetchData(id: string):Promise<PatentData> {
// 	const inventors=[], applicants=[], priority=[]
// 	for (let i = 0; i <= 10; i += 2) {
// 		inventors.push({
// 			id:"Sample id",
// 			name:faker.person.fullName(),
// 			country:faker.location.country(),
// 			city:faker.location.city(),
// 		})
// 		applicants.push({
// 			id:"dasda",
// 			name:faker.company.name(),
// 			country:faker.location.country(),
// 			city: faker.location.city()
// 		})
// 		priority.push({
// 			id:"sdasd",
// 			country:faker.location.country(),
// 			number:"1234,456",
// 			date: today(getLocalTimeZone()).toString()
// 		})
// 	}
// 	const patentData:PatentData={
// 		FileId:"F/PT/NC/O/2024/342344",
// 		Type: FilingType.Patent,
// 		FormApplicationType:FormApplicationTypes.NewApplication,
// 		status:ApplicationStatuses.AwaitingPayment,
// 		attachments: [
// 			{
// 				name:"pct",
// 				url:"sample url",
// 			},
// 			{
// 				name:"cs",
// 				url:"sample url",
// 			},
// 			{
// 				name:"any",
// 				url:"sample url",
// 			},
// 			{
// 				name:"form2",
// 				url:"sample url",
// 			},
// 			{
// 				name:"pdoc",
// 				url:"https://hacktest7184409098.blob.core.windows.net/fillings/gu1zcbmi.pdf",
// 			},
// 			{
// 				name:"patentDrawing",
// 				url:"https://hacktest7184409098.blob.core.windows.net/fillings/uh0m3p3g.png",
// 			}
// 		], inventors: inventors, patentType: 2,
// 		id: id,
// 		titleOfInvention: faker.lorem.lines(7),
// 		patentAbstract: faker.lorem.paragraph(20),
// 		correspondence: {
// 			id:"sample id",
// 			name:faker.company.name(),
// 			address:faker.location.streetAddress(),
// 			email:faker.internet.email(),
// 			phone:faker.phone.number(),
// 			state:faker.location.state(),
// 		},
// 		priorityInfo:priority,
// 		applicants:applicants
// 	};
// 	return patentData;
// }

// // import type { PageServerLoad } from "./$types.js";
// import { fail, superValidate } from 'sveltekit-superforms';
// import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema } from './schema';
// import { zod } from 'sveltekit-superforms/adapters';
// import { type Actions, redirect } from '@sveltejs/kit';
// import { UserRoles, UserTypes } from '$lib/helpers';
//
// export const load = async () => {
// 	const loginForm = await superValidate(zod(loginSchema));
// 	const signUpForm = await superValidate(zod(signupSchema));
// 	const forgotPasswordForm = await superValidate(zod(forgotPasswordSchema));
// 	return {
// 		loginForm,
// 		signUpForm,
// 		forgotPasswordForm
// 	};
// };
//
// export const actions: Actions = {
//   login: async (event) => {
//     const loginForm = await superValidate(event, zod(loginSchema));
//     if (!loginForm.valid) {
//       return fail(400, {
//         loginForm,
//       });
//     }
//     else {
//       const email=loginForm.data.email;
//       const password = loginForm.data.password;
//       let user={};
//       // switch (email) {
//       //   case "agent@agent.com":
//       //     user={
//       //       id: 'agent',
//       //       email:email,
//       //       name: "agent 007",
//       //       type: UserTypes.User,
//       //       roles: [UserRoles.User]
//       //     }
//       //     break;
//       //   case "ps@gmail.com":
//       //     user={
//       //       id: 'ps',
//       //       email:email,
//       //       name: "Patent Search",
//       //       type: UserTypes.Staff,
//       //       roles: [UserRoles.PatentSearch]
//       //     }
//       //     break;
//       //   case "pe@gmail.com":
//       //     user={
//       //       id: 'pe',
//       //       email:email,
//       //       name: "Patent Examiner",
//       //       type: UserTypes.Staff,
//       //       roles: [UserRoles.PatentExaminer]
//       //     }
//       //     break;
//       //   case "ds@gmail.com":
//       //     user={
//       //       id: 'ds',
//       //       email:email,
//       //       name: "Design Search",
//       //       type: UserTypes.Staff,
//       //       roles: [UserRoles.DesignSearch]
//       //     }
//       //     break;
//       //   case "de@gmail.com":
//       //     user={
//       //       id: 'de',
//       //       email:email,
//       //       name: "Design Examiner",
//       //       type: UserTypes.Staff,
//       //       roles: [UserRoles.DesignExaminer]
//       //     }
//       //     break;
//       //   case "ad@gmail.com":
//       //     user={
//       //       id: 'ad',
//       //       email:email,
//       //       name: "Admin",
//       //       type: UserTypes.Admin,
//       //       roles: [UserRoles.SuperAdmin]
//       //     }
//       //     break;
//       // }
//       // event.cookies.set('user', JSON.stringify(user), {path:"/"});
//       // redirect(300, "/home/dashboard");
//       // console.log("uhmmm")
//       const response=await fetch("https://api.iponigeria.com/api/UserManagement/Authenticate", {
//         method: "POST",
//         headers:{
//           "Content-Type": "application/json"
//         },
//         // body: JSON.stringify({
//         //   Password : 'BestIPlaw$firm00',
//         //   RememberMe : false,
//         //   Username : 'Banwigho@banwo-ighodalo.com'
//         // })
//         body: JSON.stringify({
//           Password : password,
//           RememberMe : false,
//           Username : email
//         })
//       });
//       if (response.status===406)
//       {
//         console.log('invalid login details')
//       }
//
//       if (response.status===401)
//       {
//         console.log('unauthorized access');
//       }
//
//       if (response.ok)
//       {
//         const reader = await response.json();
//         console.log(reader)
//         event.cookies.set('token', reader.content.token, {path:"/"});
//         const userId=reader.content.roleId;
//         let userRoles:UserRoles[]=[];
//         if ([3,4,18,19].includes(userId))
//         {
//           userRoles=[UserRoles.User]
//         }
//         if ([15].includes(userId))
//         {
//           userRoles=[UserRoles.PatentExaminer]
//         }
//         if ([22].includes(userId))
//       {
//         userRoles=[UserRoles.PatentSearch]
//       }
//         if ([28].includes(userId))
//         {
//           userRoles=[UserRoles.DesignSearch]
//         }
//         if ([29].includes(userId))
//         {
//           userRoles=[UserRoles.DesignExaminer]
//         }
//         if ([58].includes(userId))
//         {
//           userRoles=[UserRoles.SuperAdmin]
//         }
//         const user={
//           id: reader.content.userId,
//           email:reader.content.email,
//           name: reader.content.loggeduser,
//           type: [3,4,18,19].includes(reader.content.roleId)? UserTypes.User: [15, 22, 28, 29].includes(reader.content.roleId)? UserTypes.Staff: [58].includes(reader.content.roleId)?UserTypes.Admin:UserTypes.User,
//           roles:userRoles
//         };
//         console.log(user)
//         event.cookies.set('user', JSON.stringify(user), {path:"/"});
//         redirect(300, "/home/dashboard");
//       }
//     }
//   },
//
//   register: async (event) => {
//     const signupForm = await superValidate(event, zod(signupSchema));
//     if(!signupForm.valid)
//     {return fail(400, {signupForm})}
//   },
//
//   resetPassword:async (event) => {
//     const resetPassworForm = await superValidate(event, zod(resetPasswordSchema));
//   },
//
//   forgot: async (event) => {
//     const forgotPasswordForm = await superValidate(event, zod(forgotPasswordSchema));
//   }
// };
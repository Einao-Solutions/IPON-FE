<script lang="ts">
	// import type { PageData } from './$types.js';
	// import * as Form from '$lib/components/ui/form';
	import Input from '$lib/components/ui/input/input.svelte';

	import ministry from '$lib/assets/ministry.png';
	import logo from "$lib/assets/logo.png"
	// import { superForm } from 'sveltekit-superforms';
	// import { zodClient } from 'sveltekit-superforms/adapters';
	// import { loginSchema, signupSchema } from './schema';
	// import { forgotPasswordSchema } from './schema.js';
	// import { BackgroundBoxes } from '$lib/components/ui/BackgroundBoxes';
	// import { cn } from '$lib/utils/cn';
	// import { UserRoles, UserTypes } from '$lib/helpers';
	// import { redirect } from '@sveltejs/kit';
	import { page } from '$app/stores';

	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Toaster } from '$lib/components/ui/sonner';
	import { toast } from 'svelte-sonner';
	import Icon from '@iconify/svelte';
	import { baseURL, setDefaultCorr, UserRoles, type UsersType, UserTypes } from '$lib/helpers';
	import { initializeApp } from "firebase/app";
	import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail
	} from "firebase/auth"
	import { goto } from '$app/navigation';
	import { loggedInUser } from '$lib/store';
	import { onMount } from 'svelte';

	const firebaseConfig = {
		apiKey: "AIzaSyA-ibjb9kkscUzUDegAFjuGTYKd2KKxIgM",
		authDomain: "iponigeria-9f42f.firebaseapp.com",
		projectId: "iponigeria-9f42f",
		storageBucket: "iponigeria-9f42f.firebasestorage.app",
		messagingSenderId: "591246107795",
		appId: "1:591246107795:web:01afabf57571c859359966"
	};


	const app=initializeApp(firebaseConfig);
	let createUser ={
		email:"",
		password:"",
		verifypassword:"",
		firstName:"",
		lastName:"",
		phoneNumber:"",
	}
	let currentScreen: number = 0;
	let email: string, password: string;
	let showInvalidEmail: boolean = false;
	let showInvalidPassword: boolean = false;
	let showVerificationEmail:boolean = false;
	let isLoading:boolean=false;
	onMount(async()=>{
		// get verify user
		const url = $page.url;
	var cookieUser=document.cookie.split(';').find(x=>x.startsWith(" user=")||x.startsWith("user="))
	if(cookieUser) {
		await goto("/home/dashboard")
	}
		const verify_user = url.searchParams.get('verify_user') ?? null;
	if (verify_user!==null){
			await verifyUser(verify_user)
	}
})

	async function verifyUser(userId:string){
		currentScreen=1;
		const response=await fetch(`${baseURL}/api/users/verify?userId=${userId}`);
		if (response.ok)
		{
			email= (await response.json()).email
			currentScreen=0;
			toast.success("Successfully verified account, please login to continue", {
				position: 'top-right',
			});
		}
	}

	async function sendEmail(user, userId){
			// url: `https://patentdesign.iponigeria.com/auth?verify_user=${userId}`,
		await sendEmailVerification(user, {
			url: `https://patentdesign.iponigeria.com/auth?verify_user=${userId}`,
				})
	}

	let showInvalidDetails:boolean=false;

	async function CreateUserAccount(){

		if (createUser.firstName!==""&& createUser.lastName!=="")
		{
			if (createUser.password!==""&& createUser.verifypassword!==""&& createUser.password===createUser.verifypassword) {
				const auth = getAuth();

				createUserWithEmailAndPassword(auth, createUser.email, createUser.password).then(async (result) => {
					// save to actual DB
						const newUserID= crypto.randomUUID();
					var saveUserResponse = await fetch(`${baseURL}/api/users/CreateUser`, {
						method: 'POST',
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							id:newUserID,
							uuid: result.user.uid,
							roles: [UserRoles.Agent],
							verified: false,
							name: createUser.firstName + " " + createUser.lastName,
							firstName: createUser.firstName,
							lastName: createUser.lastName,
							password: createUser.password,
							email: result.user.email,
						})
					});
					if (saveUserResponse.ok) {
						await sendEmail(result.user, newUserID )
						toast.error("Verification", {
							position: 'top-right',
							description: `Verification email has been sent to ${createUser.email}, please check your email to continue`,
						})
						currentScreen = 0;
						showVerificationEmail=true;
					}
				}).catch((error) => {
					toast.error(error.message, {
						position: "top-right"
					})
				})
			}
			else {
				toast.error("invalid password, please check again", {
					position:"top-right"
				})

			}
		}
		else {
			toast.error("invalid name, please check again", {
				position:"top-right"
			})
		}
	}
	async function fetchUserDetails(uuid:string){
		const response=await fetch(`${baseURL}/api/users/getUser?userId=${uuid}`, {
			method:"POST",
			headers:{"Content-Type":"application/json"},
			body:JSON.stringify({
				email:email,
				password:password
			})
		});
		if (response.ok) {
			const userDetails = await response.json();
			loggedInUser.set(userDetails)
			const encoded=encodeURIComponent(JSON.stringify(userDetails))
			const userCookie = `user=${encoded}; path=/`
			document.cookie = userCookie.trimStart();
			return true;
		}
		return false;
	}
	let resetEmail:string|undefined=undefined
	async function resetPassword() {
		const auth = getAuth();
		sendPasswordResetEmail(auth, resetEmail).then((_) => {
			toast.success("Password reset", {
				position: 'top-right',
				description: `Password reset email has been sent to ${resetEmail}. Please check your email to reset your password`
			})
			resetEmail="";
		}).catch((error) => {
			console.log(error)
			toast.error(error.message, {
				position: "top-right"
			})
		})
	}
	async function login() {
		isLoading = true;
		const auth=getAuth();
		 signInWithEmailAndPassword(auth,email, password).then(async (userDetails)=>{
				 const response=await fetchUserDetails(userDetails.user?.uid);
			 if (response){
				 await goto(`/home/dashboard`)
			 }
		})
			.catch((error)=>{
				console.log(email, password)
				switch (error.code) {
					case "auth/invalid-email":
						toast.error("Invalid email", {position:"top-right"})
						break;
					default:
						toast.error(error.code, {position:"top-right"})
						break;
				}
				console.log(error.code);
				console.log(error.message);
			});
		 isLoading=false;
		return;
	let signatureUrl:string|undefined=undefined;
		let user: UsersType = {};
		if ([ 'to@gmail.com', 'agent@agent.com', 'agent2@agent.com', 'jaklint16@gmail.com'.toLowerCase(), 'Brightc764@gmail.com'.toLowerCase(), 'staff@einao.com', 'ts@gmail.com','te@gmail.com', 'ps@gmail.com', "pe@gmail.com", "ds@gmail.com", "de@gmail.com", "tc@gmail.com"].includes(email.toLowerCase())) {
			// set up as fake
			switch (email) {
				case "jaklint16@gmail.com".toLowerCase():
					if (password==="AD7)&*va12"){
						user = {
							id: 'jaklint16',
							email: email.toLowerCase(),
							name: "Jane igwe",
							type: UserTypes.Staff,
							roles: [UserRoles.PatentExaminer, UserRoles.DesignExaminer, UserRoles.PatentSearch, UserRoles.DesignSearch]
						}
						break;
					}
					else {
						toast.error("Invalid login details", { position: 'top-right' });
						email = "";
						password = "";
						isLoading = false;
						break;
					}
				case "Brightc764@gmail.com".toLowerCase():
					if (password==="%&GnsP91HaC"){
						user = {
							id: 'Brightc764',
							email: email.toLowerCase(),
							name: "Bright Onyebinanma",
							type: UserTypes.Staff,
							roles: [UserRoles.PatentExaminer, UserRoles.DesignExaminer, UserRoles.PatentSearch, UserRoles.DesignSearch]
						}
						break;
					}
					else {
						toast.error("Invalid login details", { position: 'top-right' });
						email = "";
						password = "";
						isLoading = false;
						break;
					}
				case "staff@einao.com":
					user = {
						id: '1234_support',
						email: email,
						name: "Support Staff",
						type: UserTypes.Admin,
						roles: [UserRoles.SuperAdmin]
					}
					break;
				case "agent@agent.com":
					user = {
						id: 'asdfkjadsf9',
						// id: '6883',
						email: email,
						name: "agent 007",
						password:password,
						type: UserTypes.User,
						roles: [UserRoles.User]
					}
					break;
				case "agent2@agent.com":
					user = {
						id: '4717',
						email: email,
						name: "agent 008",
						type: UserTypes.User,
						roles: [UserRoles.User]
					}
					break;
				case "ps@gmail.com":
					user = {
						id: 'ps',
						email: email,
						name: "Patent Search",
						type: UserTypes.Staff,
						roles: [UserRoles.PatentSearch]
					}
					break;
				case "pe@gmail.com":
					user = {
						id: 'pe',
						email: email,
						name: "Patent Examiner",
						type: UserTypes.Staff,
						roles: [UserRoles.PatentExaminer]
					}
					break;
				case "ds@gmail.com":
					user = {
						id: 'ds',
						email: email,
						name: "Design Search",
						type: UserTypes.Staff,
						roles: [UserRoles.DesignSearch]
					}
					break;
				case "de@gmail.com":
					user = {
						id: 'de',
						email: email,
						name: "Design Examiner",
						type: UserTypes.Staff,
						roles: [UserRoles.DesignExaminer]
					}
					break;
				case "ad@gmail.com":
					user = {
						id: 'ad',
						email: email,
						name: "Admin",
						type: UserTypes.Admin,
						roles: [UserRoles.SuperAdmin]
					}
					break;
				case "ts@gmail.com":
					user = {
						id: 'ts',
						email: email,
						name: "Trademark Search",
						type: UserTypes.Staff,
						roles: [UserRoles.TrademarkSearch]
					}
					break;
				case "te@gmail.com":
					user = {
						id: 'te',
						email: email,
						name: "Trademark Examiner",
						type: UserTypes.Staff,
						roles: [UserRoles.TrademarkExaminer]
					}
					break;
				case "to@gmail.com":
					user = {
						id: 'to',
						email: email,
						name: "Trademark Opposition",
						type: UserTypes.Staff,
						roles: [UserRoles.TrademarkOpposition]
					}
					break;
// sign in, sign up, reset password
				case "tc@gmail.com":
					user = {
						id: 'tc',
						email: email,
						name: "Trademark Certification",
						type: UserTypes.Staff,
						roles: [UserRoles.TrademarkCertification]
					}
					break;
			}
			if (user.roles.includes(UserRoles.PatentExaminer) || user.roles.includes(UserRoles.DesignExaminer) || user.roles.includes(UserRoles.TrademarkExaminer)){
				// try get signature url;
				const response=await fetch(`${baseURL}/api/users/getSignature/?userId=${user.id}`)
				if (response.ok){
					const url=await response.text()
					if (url!=="-")
					{
						signatureUrl=url;
					}
					console.log(url)
				}
				user['signatureUrl']=signatureUrl;
			}
			loggedInUser.set(user);
			const userCookie = `user=${JSON.stringify(user)}; path=/`
			document.cookie = userCookie.trimStart();
			await goto(`/home/dashboard`)

		} else {
			const response = await fetch("https://api.iponigeria.com/api/UserManagement/Authenticate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					Password: password,
					RememberMe: false,
					Username: email
				})
			});
			if (response.status === 406) {
				console.log('invalid login details')
				toast.error("Invalid login details", { position: 'top-right' });
				email = "";
				password = "";
			}

			if (response.status === 401) {
				console.log('unauthorized access');
				toast.error("unauthorized access, please use correct password", { position: 'top-right' });
			}

			if (response.ok) {
				const reader = await response.json();
				const userId = reader.content.roleId;
				let userRoles: UserRoles[] = [];
				if ([3, 4, 18, 19].includes(userId)) {
					userRoles = [UserRoles.User]
				}
				if ([15].includes(userId)) {
					userRoles = [UserRoles.PatentExaminer]
				}
				if ([22].includes(userId)) {
					userRoles = [UserRoles.PatentSearch]
				}
				if ([28].includes(userId)) {
					userRoles = [UserRoles.DesignSearch]
				}
				if ([29].includes(userId)) {
					userRoles = [UserRoles.DesignExaminer]
				}
				if ([58].includes(userId)) {
					userRoles = [UserRoles.SuperAdmin]
				}
				let user = {
					id: reader.content.userId.toString(),
					email: reader.content.email,
					name: reader.content.loggeduser,
					type: [3, 4, 18, 19].includes(reader.content.roleId) ?
						UserTypes.User : [15, 22, 28, 29].includes(reader.content.roleId) ?
							UserTypes.Staff : [58].includes(reader.content.roleId) ? UserTypes.Admin : UserTypes.User,
					roles: userRoles,
					password:password
				};
				if (user.roles.includes(UserRoles.PatentExaminer) || user.roles.includes(UserRoles.DesignExaminer)){
					// try get signature url;
					const response=await fetch(`${baseURL}/api/users/getSignature/?userId=${user.id}`)
					if (response.ok){
						const url=await response.text()
						if (url!=="-")
						{
							signatureUrl=url;
						}
						console.log(url)
					}
					user['signatureUrl']=signatureUrl;
				}
				loggedInUser.set(user);
				const userCookie = `user=${JSON.stringify(user)}; path=/`
				document.cookie = userCookie.trimStart();
				if (user.type === UserTypes.User){
					// load default corr.
					loadDefaultCorr(user.id, user.name, user.password, user.email)
				}
				await goto(`/home/dashboard`)
			}
			isLoading = false;
		}
	}
</script>

<Toaster />
<div class="h-screen">
	<div
		class="relative flex h-full w-full items-center justify-between overflow-hidden rounded-lg p-10"
	>
		<div class="space-y-5">
			<img alt="logo" src="{logo}" class="object-contain h-20 "/>
			<br/>
			<div>
				<Icon icon="hugeicons:file-add" width="1.2rem" height="1.2rem" />
				<strong >REGISTER YOUR TRADEMARKS, PATENTS AND DESIGNS</strong>
				<p>Protect your intellectual property and secure your competitive edge. </p>
				<p>Register your trademarks, patents and designs today</p>

			</div>
			<div>
				<Icon icon="ant-design:file-done-outlined" width="1.2rem" height="1.2rem" />
				<strong>RENEW YOUR RIGHTS</strong>
				<p>Don't let your rights expire. Renew it now to maintain uninterrupted operations.</p>
			</div>
			<div>
				<Icon icon="ic:baseline-sync" width="1.2rem" height="1.2rem" />
				<strong>UPDATE YOUR DATA</strong>
				<p>Keep your information current. Update your data for a seamless experience.</p>
			</div>
		</div>
		<div class="w-full space-y-1 sm:w-1/2 sm:space-y-6 z-20 border rounded-md p-6">
			{#if currentScreen === 0}
				<div class="space-y-3 ">
					<strong>IPONigeria</strong>
					{#if showVerificationEmail}
					<div class="bg-green-50 border border-green-400 p-3 m-2">
						Email verification link sent to {createUser.email}, please check your email to verify your account and continue
					</div>
						{/if}
					<div>
						<Label>Email</Label>
						<Input bind:value={email} />
<!--						<Label class="text-red-600 {showInvalidDetails?'':'hidden'}">Invalid email</Label>-->
					</div>
					<div>
						<Label>Password</Label>
						<Input type="password" bind:value={password} />
<!--						<Label class="text-red-600 {showInvalidDetails?'':'hidden'} ">Invalid password</Label>-->
					</div>
					<Button class="bg-green-800 space-x-2" on:click={() => login()}>
						<Icon class="{isLoading?'':'hidden'}" icon="line-md:loading-twotone-loop" width="1.2rem" height="1.2rem" />
						<p>Login</p></Button>
					<div class="pt-5 space-y-2">
						<Button variant="ghost" on:click={()=>currentScreen=2}>Don't have an account? sign up here</Button>
					</div>
					<div class="pt-5 space-y-2">
						<Button variant="ghost" on:click={()=>currentScreen=4}>Forgotten your password? click here</Button>
					</div>
				</div>
				{:else if currentScreen===4}
				<div class="space-y-2">
					<p>reset password</p>
					<Label>Enter email</Label>
						<Input placeholder="Enter email to reset password" bind:value={resetEmail} />
					<div class="flex mt-2 space-x-3">
						<Button variant="destructive"  on:click={()=>currentScreen=0}>Back</Button>
						<Button  on:click={()=>resetPassword()}>Reset</Button>
					</div>
				</div>
				{:else if currentScreen===2}
				<div class="flex flex-col">
					<strong>Sign up</strong>
					<br />
					<div>
						<Label>First Name</Label>
						<Input bind:value={createUser.firstName} />
					</div>
					<div>
						<Label>Last Name</Label>
						<Input bind:value={createUser.lastName} />
					</div>
					<div>
						<Label>Email</Label>
						<Input bind:value={createUser.email} />
					</div>
					<div>
						<Label>Phone number</Label>
						<Input bind:value={createUser.phoneNumber} />
					</div>

					<div>
						<Label>Password</Label>
						<Input type="password" bind:value={createUser.password} />
					</div>
					<div>
						<Label>Verify Password</Label>
						<Input type="password" bind:value={createUser.verifypassword} />
					</div>
					<br />
					<Button on:click={()=>CreateUserAccount()} >Create new account</Button>
					<br />
					<Button class="justify-start" variant="ghost" on:click={()=>currentScreen=0} >Already have an account? login</Button>
				</div>
				{:else if currentScreen===1}
				<div class="space-y-3 items-center flex flex-col">
					<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
					<p>Verifying user......</p>
				</div>
			{/if}
		</div>
	</div>
</div>

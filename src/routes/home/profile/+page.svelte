<script lang="ts">
	import { Button } from '$lib/components/ui/button/index';
	import { Label } from '$lib/components/ui/label/index';
	import { onMount, tick } from 'svelte';
	import {  loggedInToken, loggedInUser } from '$lib/store.js';
	import * as Dialog from "$lib/components/ui/dialog"
	import {
		arrayBufferToBase64,
		baseURL, correspondenceDescription,
		toByteArray,
		UserRoles,
		type UsersType, UserTypes
	} from '$lib/helpers.js';
	import { parseLoggedInUser } from '../../dataview/datahelpers';
	import { goto } from '$app/navigation';
	import { Input } from '$lib/components/ui/input';
	import {Textarea} from '$lib/components/ui/textarea';
	import * as Popover from "$lib/components/ui/popover"
	import * as Command from "$lib/components/ui/command"
	import { toast } from 'svelte-sonner';
	import Icon from '@iconify/svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { nigeriaStates } from '$lib/constants';
	import { cn } from '$lib/utils';
	import { writable } from 'svelte/store';
	import { isValidPhoneNumber } from 'libphonenumber-js';
	import * as valid from "validator"

	let selectedSignature: File | undefined = undefined;
	let selectedSignatureUrl: undefined | string = undefined;
	let isSignatureSaving: boolean = false;
	let user: UsersType;
	let profileLoading: boolean = true;
	onMount(async () => {
		profileLoading = true;
		 if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth')) {
      return;
    }
		if ($loggedInUser !== null) {
			user = $loggedInUser;
		} else {
			const user = parseLoggedInUser(document.cookie);
			const name = user?.firstName + " " + user?.lastName;
			if (!user) {
				toast.error("Please login", {
					position: 'top-right'
				});
				await goto('/auth');
			} else {
				loggedInUser.set(user);
			}
		}
		loadDefaultCorr()
		profileLoading = false;
	});

	  function logout() {
    document.cookie = "auth_token=; path=/; max-age=0";
    document.cookie = "user=; path=/; max-age=0";
    loggedInToken.set(null);
    loggedInUser.set(null);
    goto('/auth');
  }

	function userIsExaminer(): boolean {
		return (
			user?.userRoles.includes(UserRoles.PatentExaminer) ||
			user?.userRoles.includes(UserRoles.DesignExaminer) ||
			user?.userRoles.includes(UserRoles.TrademarkExaminer)
		);
	}
	let showCorrDialog=false;
	function defaultCorrespondence(){
		showCorrDialog=true;
	}

	async function fileSelected(event: Event | null) {
		const input = event?.target as HTMLInputElement;
		if (input.files) {
			if (input.files.length > 1) {
				selectedSignatureUrl = undefined;
				selectedSignature = undefined;
				toast.error('maximum of 1 images', {
					position: 'top-right'
				});
				return;
			}
			for (let i = 0; i < input.files.length; i++) {
				if (input.files[i].size > 5000000) {
					selectedSignatureUrl = undefined;
					selectedSignature = undefined;
					toast.error('maximum file size of 5MB exceeded', {
						position: 'top-right'
					});
					return;
				}
			}
			const fileType = input.files[0].type;
			if (!['image/jpeg', 'image/png'].includes(fileType)) {
				selectedSignatureUrl = undefined;
				selectedSignature = undefined;
				toast.error('unsupported file type, .png, .jpeg only are supported', {
					position: 'top-right'
				});
				return;
			}
			selectedSignatureUrl = URL.createObjectURL(input.files[0] as File);
			selectedSignature = input.files[0] as File;
		}
	}
	async function saveSignature() {
		isSignatureSaving = true;
		const result = await fetch(`${baseURL}/api/users/updateSignature`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				fileName: selectedSignature?.name,
				userId: user?.id,
				contentType: selectedSignature?.type,
				data: arrayBufferToBase64(await toByteArray(selectedSignature))
			})
		});
		if (result.ok) {
			const newUrl = await result.text()
			loggedInUser.update((dat) => {
				if (dat) dat.signatureUrl = newUrl;
				return dat;
			});
			const user = parseLoggedInUser(document.cookie);
			user['signatureUrl'] = newUrl;
			const userCookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/`
			document.cookie = userCookie.trimStart();
			isSignatureSaving = false;
			toast.success("successfully uploaded new signature", {
				position:'top-right'
			})
		}
	}
	let name="", address="", phoneNumber="", email="", state="";
	let showNameError=false, showPhoneError=false, showEmailError=false
	let showAddressError=false,showStateError=false
	let openCitySelection= writable<boolean>(false);
	function closeCountryAndFocusTrigger(triggerId: string) {
		openCitySelection.update(()=>false)
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}

	function loadDefaultCorr() {

		name = $loggedInUser?.firstName + " " + $loggedInUser?.lastName;
		address = $loggedInUser?.address ?? "";
		email = $loggedInUser?.email ?? "";
		phoneNumber = $loggedInUser?.defaultCorrespondence?.phone ?? "";
		state = $loggedInUser?.defaultCorrespondence?.state ?? "";
	}

	let isCorrLoading=false
	async function saveNewCorrespondence(){
		isCorrLoading=true;
		if (validateCorrespondence()) {
			const response = await fetch(`${baseURL}/api/users/UpdateCorr`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					user: {
						id: $loggedInUser?.id,
						name: $loggedInUser?.name,
						email: $loggedInUser?.email,
						password: $loggedInUser?.password,
					},
					corr: {
						name: name,
						address: address,
						email: email,
						phone: phoneNumber,
						state: state,
					}
				})
			})
			if (response.ok) {
				const data = await response.json()
				loggedInUser.update((currentData)=>{
					currentData.defaultCorrespondence=data;
					return currentData
				});
				toast.success("successfully updated default correspondence", {position: 'top-right'})
			}
		}
			isCorrLoading=false;



	}
	function validateCorrespondence(): boolean
	{
		showNameError=name===null || name==="";
		showPhoneError = phoneNumber===null || phoneNumber==="" || validateNumber()==false;
		showStateError = state===null || state==="";
		showEmailError = email===null || email==="" || validateEmail()==false;
		showAddressError = address===null || address==="";
		return !(showNameError || showPhoneError || showStateError || showEmailError || showAddressError);
	}
	function validateNumber(): boolean {
		return isValidPhoneNumber(phoneNumber ?? "", "NG")
	}
	function validateEmail(): boolean {
		return valid.isEmail(email ?? "");
	}
</script>

<Toaster />

<Dialog.Root bind:open={showCorrDialog}>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title class="text-2xl font-semibold">
				Default Correspondence
			</Dialog.Title>
			<Dialog.Description class="text-muted-foreground">
				{correspondenceDescription}
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="name" class="text-sm font-medium">Correspondence Name</Label>
				<Input bind:value={name} id="name" class="transition-all" placeholder="Enter full name" />
				{#if showNameError}
					<p class="text-sm text-red-600 flex items-center gap-1">
						<Icon icon="ph:warning-circle" width="1rem" height="1rem" />
						Name is required
					</p>
				{/if}
			</div>
			
			<div class="space-y-2">
				<Label for="number" class="text-sm font-medium">Phone Number</Label>
				<Input bind:value={phoneNumber} id="number" class="transition-all" placeholder="+234 xxx xxx xxxx" />
				{#if showPhoneError}
					<p class="text-sm text-red-600 flex items-center gap-1">
						<Icon icon="ph:warning-circle" width="1rem" height="1rem" />
						Invalid Nigerian phone number
					</p>
				{/if}
			</div>
			
			<div class="space-y-2">
				<Label for="email" class="text-sm font-medium">Email Address</Label>
				<Input bind:value={email} id="email" type="email" class="transition-all" placeholder="name@example.com" />
				{#if showEmailError}
					<p class="text-sm text-red-600 flex items-center gap-1">
						<Icon icon="ph:warning-circle" width="1rem" height="1rem" />
						Invalid email address
					</p>
				{/if}
			</div>
			
			<div class="space-y-2">
				<Label for="address" class="text-sm font-medium">Address</Label>
				<Textarea bind:value={address} id="address" class="transition-all min-h-[80px]" placeholder="Enter full address" />
				{#if showAddressError}
					<p class="text-sm text-red-600 flex items-center gap-1">
						<Icon icon="ph:warning-circle" width="1rem" height="1rem" />
						Address is required
					</p>
				{/if}
			</div>
			
			<div class="space-y-2">
				<Label class="text-sm font-medium">State</Label>
				<Popover.Root open="{$openCitySelection}" let:ids>
					<Popover.Trigger asChild let:builder>
						<Button
							builders={[builder]}
							variant="outline"
							role="combobox"
							aria-expanded={$openCitySelection}
							class="w-full justify-between font-normal"
						>
							<span class={cn(!state && "text-muted-foreground")}>
								{(state!=="" && state!==null) ? state : "Select a state"}
							</span>
							<Icon icon="ph:caret-up-down" width="1.2rem" height="1.2rem" class="opacity-50 shrink-0" />
						</Button>
					</Popover.Trigger>
					<Popover.Content class="w-full p-0">
						<Command.Root>
							<Command.Input placeholder="Search states..." class="h-9" />
							<Command.Empty>No states found.</Command.Empty>
							<Command.Group class="max-h-[200px] overflow-y-auto">
								{#each nigeriaStates as stateselect}
									<Command.Item
										value={stateselect}
										onSelect={(currentValue) => {
											state = currentValue;
											closeCountryAndFocusTrigger(ids.trigger);
										}}>
										<Icon icon="ph:check"
											class={cn(
												"mr-2 h-4 w-4",
												state !== stateselect && "text-transparent"
											)}
										/>
										{stateselect}
									</Command.Item>
								{/each}
							</Command.Group>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
				{#if showStateError}
					<p class="text-sm text-red-600 flex items-center gap-1">
						<Icon icon="ph:warning-circle" width="1rem" height="1rem" />
						State is required
					</p>
				{/if}
			</div>
		</div>
		<Dialog.Footer>
			<Button on:click={()=>saveNewCorrespondence()} disabled={isCorrLoading} class="w-full sm:w-auto">
				{#if isCorrLoading}
					<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" class="mr-2" />
				{/if}
				Save Changes
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

{#if !profileLoading}
	<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
		<div class="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold tracking-tight">Profile Settings</h1>
					<p class="text-muted-foreground mt-1">Manage your account information and preferences</p>
				</div>
			</div>

			<!-- Main Content Card -->
			<div class="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
				<!-- Profile Info Section -->
				<div class="p-6 md:p-8 space-y-6">
					<div>
						<h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
							<Icon icon="ph:user-circle" width="1.5rem" height="1.5rem" />
							Personal Information
						</h2>
						<div class="grid gap-4 md:grid-cols-2">
							<div class="space-y-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md">
								<Label class="text-xs uppercase tracking-wide text-muted-foreground font-medium">Name</Label>
								<p class="text-base font-medium">{name}</p>
							</div>
							<div class="space-y-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md">
								<Label class="text-xs uppercase tracking-wide text-muted-foreground font-medium">Email</Label>
								<p class="text-base font-medium break-all">{user?.email}</p>
							</div>
						</div>
					</div>

					{#if userIsExaminer()}
						<div class="pt-6 border-t border-slate-200 dark:border-slate-800">
							<h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
								<Icon icon="ph:signature" width="1.5rem" height="1.5rem" />
								Digital Signature
							</h2>
							
							<div class="space-y-4">
								{#if user.signatureUrl}
									<div class="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
										<Label class="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2 block">Current Signature</Label>
										<a 
											class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors" 
											href={user.signatureUrl}
											target="_blank"
										>
											<Icon icon="ph:file-image" width="1.2rem" height="1.2rem" />
											View signature
											<Icon icon="ph:arrow-square-out" width="1rem" height="1rem" />
										</a>
									</div>
								{/if}
								
								<div class="space-y-3">
									<Label class="text-sm font-medium flex items-center gap-2">
										<Icon icon="ph:upload-simple" width="1.2rem" height="1.2rem" />
										Upload New Signature
									</Label>
									<div class="flex flex-col sm:flex-row gap-3">
										<Input
											id="signatureUrl"
											accept=".png, .jpeg, .jpg"
											multiple={false}
											type="file"
											on:change={(event) => fileSelected(event)}
											class="flex-1"
										/>
									</div>
									<p class="text-xs text-muted-foreground">PNG or JPEG format, maximum 5MB</p>
								</div>
								
								{#if selectedSignatureUrl}
									<div class="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
										<a 
											class="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-3" 
											target="_blank" 
											href={selectedSignatureUrl}
										>
											<Icon icon="ph:file-image" width="1.2rem" height="1.2rem" />
											Preview uploaded signature
											<Icon icon="ph:arrow-square-out" width="1rem" height="1rem" />
										</a>
										<Button 
											on:click={() => saveSignature()} 
											disabled={isSignatureSaving}
											class="w-full sm:w-auto"
										>
											{#if isSignatureSaving}
												<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" class="mr-2" />
											{:else}
												<Icon icon="ph:check-circle" width="1.2rem" height="1.2rem" class="mr-2" />
											{/if}
											Save Signature
										</Button>
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<!-- Actions Section -->
				<div class="p-6 md:p-8 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800">
					<h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
						<Icon icon="ph:gear" width="1.5rem" height="1.5rem" />
						Account Actions
					</h2>
					<div class="flex flex-col sm:flex-row gap-3">
						<Button 
							on:click={()=>defaultCorrespondence()} 
							variant="outline"
							class="flex items-center gap-2"
						>
							<Icon icon="ph:envelope" width="1.2rem" height="1.2rem" />
							Update Correspondence
						</Button>
						<Button 
							on:click={logout} 
							variant="destructive"
							class="flex items-center gap-2"
						>
							<Icon icon="ph:sign-out" width="1.2rem" height="1.2rem" />
							Logout
						</Button>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
		<div class="text-center space-y-4">
			<Icon icon="line-md:loading-loop" width="3rem" height="3rem" class="text-blue-600 dark:text-blue-400" />
			<p class="text-muted-foreground">Loading profile...</p>
		</div>
	</div>
{/if}
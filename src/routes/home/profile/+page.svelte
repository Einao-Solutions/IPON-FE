<script lang="ts">
	import { Button } from '$lib/components/ui/button/index';
	import { Label } from '$lib/components/ui/label/index';
	import { onMount, tick } from 'svelte';
	import {  loggedInUser } from '$lib/store.js';
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
		if ($loggedInUser !== null) {
			user = $loggedInUser;
		} else {
			const user = parseLoggedInUser(document.cookie);
			if (!user) {
				await goto('/auth');
			} else {
				loggedInUser.set(user);
			}
		}
		loadDefaultCorr()
		profileLoading = false;
	});

	async function logout() {
		await goto('/logout');
	}

	function userIsExaminer(): boolean {
		return (
			user?.roles.includes(UserRoles.PatentExaminer) ||
			user?.roles.includes(UserRoles.DesignExaminer) ||
			user?.roles.includes(UserRoles.TrademarkExaminer)
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

		name = $loggedInUser.defaultCorrespondence?.name ?? "";
		address = $loggedInUser.defaultCorrespondence?.address ?? "";
		email = $loggedInUser.defaultCorrespondence?.email ?? "";
		phoneNumber = $loggedInUser.defaultCorrespondence?.phone ?? "";
		state = $loggedInUser.defaultCorrespondence?.state ?? "";
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
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				<p>Default Correspondence</p>
			</Dialog.Title>
			<Dialog.Description>
				<p>{correspondenceDescription}</p>
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-3 p-3 m-3">
			<div class="flex flex-col space-y-1.5">
				<Label for="name">Correspondence Name</Label>
				<Input bind:value={name} id="name" />
				<Label class="{showNameError===false?'hidden':'block'}" style="color: darkred">Name is required</Label>
			</div>
			<div class="flex flex-col space-y-1.5">
				<Label for="name">Correspondence Phone Number</Label>
				<Input bind:value={phoneNumber} id="number" />
				<Label class="{showPhoneError===false?'hidden':'block'}" style="color: darkred">invalid Nigerian Phone number </Label>
			</div>
			<div class="flex flex-col space-y-1.5">
				<Label for="name">Correspondence Email address</Label>
				<Input bind:value={email} id="email" />
				<Label class="{showEmailError===false?'hidden':'block'}" style="color: darkred">Invalid Email</Label>
			</div>
			<div class="flex flex-col space-y-1.5">
				<Label for="address">Correspondence address</Label>
				<Textarea bind:value={address} id="address" />
				<Label class="{showAddressError===false?'hidden':'block'}" style="color: darkred">Address is required</Label>
			</div>
			<div class="flex flex-col space-y-1.5">
				<Popover.Root open="{$openCitySelection}" let:ids>
					<Popover.Trigger asChild let:builder>
						<Button
							builders={[builder]}
							variant="outline"
							role="combobox"
							aria-expanded={$openCitySelection}
							class="w-[200px] justify-between"
						>
							{(state!=="" && state!==null) ?state:"Select a state"}
							<Icon icon="ph:caret-up-down-thin" width="1.2rem" height="1.2rem" class="opacity-50 shrink-0 ml-2" />
						</Button>
					</Popover.Trigger>
					<Popover.Content class="w-[250px] h-[250px] p-0 z-50">
						<Command.Root>
							<Command.Input placeholder="Search countries..." />
							<Command.Empty>No states found.</Command.Empty>
							<Command.Group class="overflow-y-auto">
								{#each nigeriaStates as stateselect}
									<Command.Item
										value={stateselect}
										onSelect={(currentValue) => {
              state = currentValue;
              closeCountryAndFocusTrigger(ids.trigger);}}>
										<Icon icon="basil:check-solid"
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
				<Label class="{showStateError===false?'hidden':'block'}" style="color: darkred">State is required</Label>
			</div>

			<Button on:click={()=>saveNewCorrespondence()}>
				<Icon class="{isCorrLoading?'':'hidden'}" icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
				Save updated default correspondence </Button>

		</div>

	</Dialog.Content>
</Dialog.Root>
{#if !profileLoading}
	<div class="space-y-2 p-2 m-2 flex flex-col">
		<div class="p-2 rounded-md border">
			<Label>Name</Label>
			<p>{user?.name}</p>
		</div>
		<div class="p-2 rounded-md border">
			<Label>Email</Label>
			<p>{user?.email}</p>
		</div>
		{#if userIsExaminer()}
			<Label>Signature</Label>
			{#if user.signatureUrl}
				<a class="p-2 border rounded-md" href={user.signatureUrl}>View signature</a>
			{/if}
			<div class="flex">
			<Label>Change signature</Label>
			<Input
				id="signatureUrl"
				accept=".png, .jpeg, .jpg"
				multiple={false}
				type="file"
				on:change={(event) => fileSelected(event)}
			/>
			</div>
			{#if selectedSignatureUrl}
				<a class="flex p-2 border rounded-md" target="_blank" href={selectedSignatureUrl}
					>View uploaded signature</a
				>
				<Button class="w-fit" on:click={() => saveSignature()}>
					<Icon
						class={isSignatureSaving ? '' : 'hidden'}
						icon="line-md:loading-loop"
						width="1.2rem"
						height="1.2rem"
					/>
					Save new Signature</Button
				>
			{/if}
		{/if}
		<!--{#if $loggedInUser?.roles.includes(UserRoles.Agent)}-->
			<Button on:click={()=>defaultCorrespondence()}>Change Default Correspondence</Button>
		<!--{/if}-->
		<Button class="w-fit" on:click={() => logout()}>Logout</Button>
	</div>
{:else}
	<div class="items-center justify-center flex h-screen">
		<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
	</div>
{/if}

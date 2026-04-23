<script lang="ts">
	import {  correspondenceDescription, type CorrespondenceType } from '$lib/helpers';
import { Input } from '$lib/components/ui/input/index';
import { Label } from '$lib/components/ui/label/index';
	import {
		formsData,
		applicationScreen,
		savePageData,
		pageSaveStatus,
		changesMade,
		applicationData,
		applicationMode,
		validatePage,
		validatedPages,
		newApplicationType, loggedInUser
	} from '$lib/store';
	import { onMount, tick } from 'svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import {nigeriaStates } from '$lib/constants';
	import { cn } from '$lib/utils';
	import * as Popover from "$lib/components/ui/popover"
	import * as Command from "$lib/components/ui/command"
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import { writable } from 'svelte/store';
	import { toast, Toaster } from 'svelte-sonner';
	import * as valid from "validator"
	import { isValidPhoneNumber } from 'libphonenumber-js'

	let name:string|null=null
let phoneNumber:string|null=null;
let address:string|null=null;
let state:string|null=null;
let email:string|null=null;
let openCitySelection= writable<boolean>(false);
$: showNameError=false;
$: showPhoneError=false;
$: showStateError=false;
$: showEmailError=false;
$: showAddressError=false;
let showResetButton:boolean=false;

function validate(): boolean
{
	showNameError=name===null || name==="";
	showPhoneError = phoneNumber===null || phoneNumber==="" || validateNumber()==false;
	showStateError = state===null || state==="";
	showEmailError = email===null || email==="" || validateEmail()==false;
	showAddressError = address===null || address==="";
	return !(showNameError || showPhoneError || showStateError || showEmailError || showAddressError);
}
	$:{
	if ((name!==$applicationData?.correspondence?.name ||
			phoneNumber!==$applicationData?.correspondence?.phone ||
			email!==$applicationData?.correspondence?.email ||
			address!==$applicationData?.correspondence?.address ||
			state!==$applicationData?.correspondence?.state
	) && $applicationMode===1)
	{
		showResetButton = true;
		changesMade.update((changes) => {
			changes = changes ?? [];
			let index = changes.findIndex(x => x.name === 'correspondence');
			if (index !== -1) {
				changes[index].hasChanges = true;
			} else {

				changes.push({ name: "correspondence", hasChanges: true })
			}
			return [...changes];
		})
	} else {
		showResetButton = false;
		changesMade.update((changes) => {
			changes = changes ?? [];
			let index = changes.findIndex(x => x.name == 'correspondence');
			if (index !== -1) {
				changes.splice(index, 1);
				return [...changes]
			}
			return [...changes];
		})
	}
	}
function validateNumber(): boolean {
	return isValidPhoneNumber(phoneNumber ?? "", "NG")
}
function validateEmail(): boolean {
	return valid.isEmail(email ?? "");
}

	validatePage.subscribe((x) => {
		if (x === 'correspondence') {
			const status = validate();
			if($validatedPages===null) {
				validatedPages.set([{ name: 'correspondence', status: status }]);
			}
			else
			{
				validatedPages.update((pages) => {
					pages= pages!;
					const index = pages.findIndex((x) => x.name === 'correspondence');
					if (index === -1) {
						pages.push({ name: 'correspondence', status: status });
					} else {
						pages[index].status = status;
					}
					return [...pages];
				});
			}

			if (!status)
			{

			}
		}
	});

	savePageData.subscribe((toValidate) => {
		if (toValidate==='correspondence' && ($applicationScreen===3 || ($newApplicationType==2 && $applicationScreen===2))) {
				if ($formsData === null) {
					formsData.set([{name:"correspondence", data: {name:name, phone:phoneNumber, email: email, address:address, state:state}}]);
				} else {

					formsData.update((forms) => {
						let index = forms!.findIndex(x=>x.name==="correspondence");
						if (index!==-1)
						{
							forms![index].data ={name:name, phone:phoneNumber, email: email, address:address, state:state};
						}
						else {
							forms!.push({name:"correspondence", data:{name:name, phone:phoneNumber, email: email, address:address, state:state}} );
						}
						return [...forms!];
					})
				}
			pageSaveStatus.set(true);
		}
	})

	onMount(() => {
		let initialData=$formsData?.find(x=>x.name==="correspondence");
		if ($applicationMode===2)
		{
			// creation mode
		if(initialData)
		{
			let mappedData= initialData.data as CorrespondenceType
			name=mappedData.name??null;
			address=mappedData.address??null;
			phoneNumber=mappedData.phone??null;
			email=mappedData.email??null;
			state=mappedData.state??null;
		}
		}
		else if ($applicationMode===1) {
			// edit mode
			const original= JSON.parse(JSON.stringify($applicationData?.correspondence))
			let corresData = initialData?.data as CorrespondenceType ?? original as CorrespondenceType
			name = corresData?.name??null;
			address = corresData?.address??null;
			phoneNumber = corresData?.phone ??null;
			email = corresData?.email??null;
			state = corresData?.state??null;
		}

		if ($validatedPages?.find(x=>x.name==="correspondence")) {
			validate();
		}
	});

	function useDefault() {
		if ($loggedInUser.defaultCorrespondence===undefined || $loggedInUser.defaultCorrespondence.name==="")
		{
			toast.info("no correspondence configured, edit in profile", { position:'top-right' })
		}
		else {
			name = $loggedInUser?.firstName + " " + $loggedInUser?.lastName;
			address = $loggedInUser?.Address ?? "";
			phoneNumber = $loggedInUser?.Phone ?? "";
			email = $loggedInUser?.email ?? "";
			state = $loggedInUser?.state ?? "";
		}
	}
function ResetCorr()
{
	const corresData = $applicationData?.correspondence;
	name = corresData?.name??null;
	address = corresData?.address??null;
	phoneNumber = corresData?.phone ??null;
	email = corresData?.email??null;
	state = corresData?.state??null;
}
	function closeCountryAndFocusTrigger(triggerId: string) {
		openCitySelection.update(() => false)
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}
</script>
<Toaster />
<div class="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-md space-y-6">
	<h2 class="text-2xl font-semibold text-gray-800">Correspondence Information</h2>
	<p class="text-sm text-gray-500">
		{correspondenceDescription}
	</p>
	<div class="flex justify-between items-center">
		<h3 class="text-lg font-medium text-gray-700">Contact Details</h3>
		<div class="flex gap-4">
			<Button variant="ghost" class="{showResetButton? 'inline':'hidden'} text-blue-500" on:click={()=>ResetCorr()}>Reset</Button>
			<button type="button" class="bg-black text-white px-6 py-2 rounded-md hover:opacity-90" on:click={()=>useDefault()}>Use Default</button>
		</div>
	</div>
	<div class="border p-4 rounded-lg space-y-4">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium mb-1" for="name">Correspondence Name</label>
				<input class="input" bind:value={name} id="name" placeholder="Enter name" />
				{#if showNameError}
					<p class="error">Name is required</p>
				{/if}
			</div>
			<div>
				<label class="block text-sm font-medium mb-1" for="number">Phone Number</label>
				<input class="input" bind:value={phoneNumber} id="number" placeholder="Enter phone number" />
				{#if showPhoneError}
					<p class="error">Invalid Nigerian phone number</p>
				{/if}
			</div>
			<div>
				<label class="block text-sm font-medium mb-1" for="email">Email Address</label>
				<input class="input" bind:value={email} id="email" placeholder="Enter email address" />
				{#if showEmailError}
					<p class="error">Invalid email</p>
				{/if}
			</div>
			<div>
				<!-- svelte-ignore a11y-label-has-associated-control -->
				<label class="block text-sm font-medium mb-1">State</label>
				<Popover.Root open="{$openCitySelection}" let:ids>
					<Popover.Trigger asChild let:builder>
						<Button
							builders={[builder]}
							variant="outline"
							role="combobox"
							aria-expanded={$openCitySelection}
							class="w-full justify-between h-[46px]"
						>
							{(state!=="" && state!==null) ?state:"Select a state"}
							<Icon icon="ph:caret-up-down-thin" width="1.2rem" height="1.2rem" class="opacity-50 shrink-0 ml-2" />
						</Button>
					</Popover.Trigger>
					<Popover.Content class="w-[250px] h-[250px] p-0 z-50">
						<Command.Root>
							<Command.Input placeholder="Search states..." />
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
				{#if showStateError}
					<p class="error">State is required</p>
				{/if}
			</div>
			<div class="col-span-2">
				<label class="block text-sm font-medium mb-1" for="address">Address</label>
				<Textarea bind:value={address} id="address" placeholder="Enter address" class="h-24" />
				{#if showAddressError}
					<p class="error">Address is required</p>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.input {
		@apply p-3 border rounded-md w-full;
	}
	.error {
		@apply text-red-500 text-sm mt-1;
	}
</style>
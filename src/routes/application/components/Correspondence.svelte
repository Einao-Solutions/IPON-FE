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
<div class="flex-grow flex flex-col w-full h-full gap-2">
	<div class="rounded-md bg-accent h-20 pl-2 pr-2 text-center flex flex-col justify-center ">
		{correspondenceDescription}
	</div>
	<div class="flex justify-between items-center">
		<strong>Correspondence Information</strong>
		<Button variant="ghost" class="{showResetButton? 'inline':'hidden'} text-blue-500" on:click={()=>ResetCorr()}>reset</Button>
		<Button on:click={()=>useDefault()}>Use Default</Button>
	</div>
	<div class="rounded-md border flex flex-col gap-5 py-2 px-3">
<div class="flex flex-col space-y-1.5">
	<Label for="name">Correspondence Name</Label>
	<Input bind:value={name} id="name" />
	<Label class="{showNameError===false?'hidden':'block'}" style="color: darkred">Name is required</Label>
</div>
		<div class="flex flex-col space-y-1.5">
			<Label for="name">Correspondence Phone Number</Label>
			<Input bind:value={phoneNumber} id="number" />
			<Label class="{showPhoneError===false?'hidden':'block'}" style="color: darkred">Invalid Nigerian phone number</Label>
		</div>
		<div class="flex flex-col space-y-1.5">
			<Label for="name">Correspondence Email address</Label>
			<Input bind:value={email} id="email" />
			<Label class="{showEmailError===false?'hidden':'block'}" style="color: darkred">invalid Email</Label>
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
	</div>
</div>
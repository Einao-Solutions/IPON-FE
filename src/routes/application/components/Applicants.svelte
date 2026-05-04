<script lang="ts">
	import {
		applicantDesignDescription,
		applicantPatentDescription, applicantTrademarkDescription,
		type ApplicantValidator
	} from '$lib/helpers.js';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type {Applicant} from '$lib/helpers';
	import {
		formsData, savePageData, applicationScreen,
		applicationMode, applicationData, pageSaveStatus, changesMade, validatePage, validatedPages, newApplicationType
	} from '$lib/store';
	import { get, writable } from 'svelte/store';
	import { onMount, tick } from 'svelte';
	import * as Table from "$lib/components/ui/table/index";
	import * as Popover from "$lib/components/ui/popover"
	import * as Command from "$lib/components/ui/command"
	import { countriesMap } from '$lib/constants';
	import { cn } from '$lib/utils';
	import { Input } from '$lib/components/ui/input';
	import { objsHasDiff } from '../apphelper';
	let allApplicants=writable<Applicant[]>([]);
	let listofValidatedApplicants = writable<ApplicantValidator[]>([])
	let listOfOpenCountries = writable<boolean[]>([])
	let isEditing:boolean = true
	let showResetButton:boolean = true
	function addApplicant()
	{
	allApplicants.update((applicants)=>
		[...applicants, {id:crypto.randomUUID(), phone:"",country:"",name:"",address:"", email:"", type:null}]);
	listofValidatedApplicants.update((valid)=>[...valid, {
		phone:null,country:null,email:null,address:null, name:null,type:null}]);
		listOfOpenCountries.update((countries)=>[...countries, false])
		isEditing=true;
	}
	allApplicants.subscribe((data)=>{
		if($applicationMode===1 && data.length>=1 && objsHasDiff(data, $applicationData?.applicants))
		{
			showResetButton=true;
			changesMade.update((changes)=>{
				changes= changes??[];
				let index=changes.findIndex(x=>x.name==='applicants');
				if (index!==-1)
				{
					changes[index].hasChanges=true;
				}
				else {

					changes.push({name:"applicants", hasChanges:true })
				}
				return [...changes];
			})
		}
		else {
			showResetButton=false;
			changesMade.update((changes)=>{
				changes= changes??[];
				let index=changes.findIndex(x=>x.name=='applicants');
				if (index!==-1)
				{
					changes.splice(index,1);
					return [...changes]
				}
				return [...changes];
			})
		}
	})

	savePageData.subscribe((pageToSave)=>{
		if (pageToSave==='applicant' && ($applicationScreen===2 || ($newApplicationType==2 && $applicationScreen===1)))
		{
			pageSaveStatus.set(null);
			if ($formsData === null) {
				formsData.set([{name:"applicant", data: $allApplicants }]);
			} else {
				formsData.update((forms) => {
					let index = forms!.findIndex(x=>x.name==="applicant");
					if (index!==-1)
					{
						forms![index].data = $allApplicants;
					}
					else {
						forms!.push({name:"applicant", data:$allApplicants} );
					}
					return [...forms!];
				})
			}
			pageSaveStatus.set(true);
		}
	})

	onMount(() => {
		let initialData=$formsData?.filter(x=>x.name==="applicant")[0]?.data ;
		if ($applicationMode===2)
		{
			initialData=initialData??[];
		$allApplicants=initialData as Applicant[];
		allApplicants.update((applicants)=>[...applicants]);
		listofValidatedApplicants.set(Array.from({length: $allApplicants.length }, ()=>({
			country:null,name:null, type:null,
		address:null, phone:null, email:null
		})));
		listOfOpenCountries.set(Array.from({length: $allApplicants.length }, ()=>false));
		}

		else if ($applicationMode===1)
		{
			// edit mode
			const ogData= get(applicationData)?.applicants??[];
			const data=initialData?[...initialData as Applicant[]] : [...ogData];
			allApplicants.set(data);
			listofValidatedApplicants.set(Array.from({ length: $allApplicants.length }, () => ({
				address: null,
				phone: null,
				email: null,
				country: null,
				name: null,
				type:null
			})));
			listOfOpenCountries.set(Array.from({length: $allApplicants.length }, ()=>false));
		}
		isEditing=false;

		if ($validatedPages?.find(x=>x.name==="applicant")) {
			const status=validate();
			if(!status)
			{
				isEditing=true;
			}
		}
	});

	function resetValues()
	{
		allApplicants.set([...$applicationData?.applicants??[]]);
		listofValidatedApplicants.set(Array.from({length: $allApplicants.length },
			()=>({ address:null, country:null,name:null, type:null, phone:null, email:null })));
		listOfOpenCountries.set(Array.from({length: $allApplicants.length }, ()=>false));
	}

	function removeApplicant(index:number)
	{
		allApplicants.update((applicants)=>{
			applicants.splice(index,1);
			return [...applicants];
		});
		listOfOpenCountries.update((opener)=>{
			opener.splice(index, 1);
			return [...opener]});
		listofValidatedApplicants.update((valid)=>{
			valid.splice(index,1);
			return [...valid];
		})

	}

	function UpdateApplicantName(name:string, index:number)
	{
		allApplicants.update((applicants)=>{
			let dt={...applicants[index]};
			dt.name = name;
			applicants[index]=dt;
			return [...applicants];
		})
	}


	function UpdateApplicantCountry(country:string, index:number)
	{
		allApplicants.update((applicants)=>{
			let dt={...applicants[index]};
			dt.country = country;
			applicants[index]=dt;
			return [...applicants];
		})
	}
	function UpdateApplicantPhone(phone:string, index:number)
	{
		allApplicants.update((applicants)=>{
			let dt={...applicants[index]};
			dt.phone = phone;
			applicants[index]=dt;
			return [...applicants];
		})
	}
	function UpdateApplicantEmail(email:string, index:number)
	{
		allApplicants.update((applicants)=>{
			let dt={...applicants[index]};
			dt.email = email;
			applicants[index]=dt;
			return [...applicants];
		})
	}
	function UpdateApplicantAddress(address:string, index:number)
	{
		allApplicants.update((applicants)=>{
			let dt={...applicants[index]};
			dt.address = address;
			applicants[index]=dt;
			return [...applicants];
		})
	}
	function EditorSave(){
		if(isEditing)
		{
			if(validate())
			{isEditing=false;
				if ($formsData === null) {
					formsData.set([{name:"applicant", data: $allApplicants }]);

				} else {
					formsData.update((forms) => {
						let index = forms!.findIndex(x=>x.name==="applicant");
						if (index!==-1)
						{
							forms![index].data = $allApplicants;
						}
						else {
							forms!.push({name:"applicant", data:$allApplicants} );
						}
						return [...forms!];
					})
				}
			}
			return;
		}
		isEditing=!isEditing;
	}

	function validate():boolean{
		let listOfStatus:boolean[]=[];
		for (let i = 0; i < $allApplicants.length; i++) {
			$listofValidatedApplicants[i].name = $allApplicants[i].name !== "";
			$listofValidatedApplicants[i].phone = $allApplicants[i].phone !== "";
			$listofValidatedApplicants[i].email = $allApplicants[i].email !== "";
			$listofValidatedApplicants[i].address = $allApplicants[i].address !== "";
			$listofValidatedApplicants[i].country = $allApplicants[i].country !== "";
			listOfStatus.push(
				$listofValidatedApplicants[i].name!&&
				$listofValidatedApplicants[i].phone!&&
				$listofValidatedApplicants[i].email!&&
				$listofValidatedApplicants[i].address!&&
				$listofValidatedApplicants[i].country!
			);
		}
		return listOfStatus.every(x=>x===true) && $allApplicants.length>=1
	}
	function GetCountryImageLink(country:string)
	{
		let key= Object.keys(countriesMap).find(key => countriesMap[key] === country);
		return `https://flagcdn.com/20x15/${key}.png`;
	}
	function closeCountryAndFocusTrigger(triggerId: string, index:number) {
		$listOfOpenCountries[index] =false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}
	validatePage.subscribe((x) => {
		if (x === 'applicant') {
			const status = validate();
			if($validatedPages===null) {
				validatedPages.set([{ name: 'applicant', status: status }]);
			}
			else
			{
				validatedPages.update((pages) => {
					pages = pages!;
					const index = pages.findIndex((x) => x.name === 'applicant');
					if (index === -1) {
						pages.push({ name: 'applicant', status: status });
					} else {
						pages[index].status = status;
					}
					return [...pages];
				});
			}
		}
	});

</script>

<div class="flex-grow flex flex-col w-full h-full gap-2">
<div class="rounded-md bg-accent h-20 pl-2 pr-2 text-center flex flex-col justify-center ">
	{$newApplicationType===0?applicantPatentDescription :$newApplicationType===1?applicantDesignDescription: applicantTrademarkDescription}
</div>
	<div class="flex justify-between items-center">
		<strong>List of Applicants</strong>
		<div class="flex gap-4">
				<Button variant="ghost" class="{showResetButton?'inline':'hidden'}  text-blue-500"
								on:click={()=>resetValues()}>reset</Button>
			{#if $allApplicants.length!==0}
				<Button variant="outline" on:click={()=>EditorSave()}>{isEditing?'Save':'Edit'}</Button>
			{/if}
			<Button variant="default" on:click={()=>addApplicant()}>
				<Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
				Add Applicant
			</Button>
		</div>
	</div>

	<div class="rounded-md border overflow-y-auto h-[300px] flex-grow overflow-x-auto">
		<Table.Root >
			{#if $allApplicants.length===0}
				<p class="text-center justify-center text-xl flex flex-col h-[400px] ">Enter at least one applicant</p>
			{:else}
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-1">s/n</Table.Head>
						<Table.Head class="w-1"></Table.Head>
						<Table.Head>Name</Table.Head>
						<Table.Head>Country</Table.Head>
						<Table.Head>Phone</Table.Head>
						<Table.Head>Email</Table.Head>
						<Table.Head>Address</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each $allApplicants as applicant, i (i)}
						<Table.Row>
							{#if isEditing}
								<Table.Cell>{i+1}</Table.Cell>
								<Table.Cell><Button variant="outline" size="icon" style="color: darkred" on:click={()=>removeApplicant(i)}>
									<Icon icon="ei:minus" class="h-7 w-7" />
								</Button> </Table.Cell>
								<Table.Cell class="min-w-40" >
									<Input
												 value={applicant.name} on:input={(event)=>UpdateApplicantName(event.target?.value, i)}/>
									{#if $listofValidatedApplicants[i].name!==true && $listofValidatedApplicants[i].name!==null }
										<span style="color: darkred">name cannot be empty</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="flex flex-col">
									<Popover.Root open="{$listOfOpenCountries[i]}" let:ids>
										<Popover.Trigger asChild let:builder>
											<Button
												builders={[builder]}
												variant="outline"
												role="combobox"
												aria-expanded={false}
												class="w-[200px] justify-between"
											>
												<img class="{applicant.country!==''?'block':'hidden'}" src="{GetCountryImageLink(applicant.country)}" width="20" height="15" alt="@flag"/>
												{applicant.country!==""?applicant.country:"Select a country"}
												<Icon icon="ph:caret-up-down-thin" width="1.2rem" height="1.2rem" class="opacity-50 shrink-0 ml-2" />
											</Button>
										</Popover.Trigger>
										<Popover.Content class="w-[250px] h-[250px] p-0 z-50">
											<Command.Root>
												<Command.Input placeholder="Search countries..." />
												<Command.Empty>No countries found.</Command.Empty>
												<Command.Group class="overflow-y-auto">
													{#each Object.values(countriesMap) as country}
														<Command.Item
															value={country}
															onSelect={(currentValue) => {
																UpdateApplicantCountry(currentValue, i);
              closeCountryAndFocusTrigger(ids.trigger, $allApplicants.indexOf(applicant));}}>
															<Icon icon="basil:check-solid"
																		class={cn(
                "mr-2 h-4 w-4",
                applicant.country !== country && "text-transparent"
              )}
															/>
															{country}
														</Command.Item>
													{/each}
												</Command.Group>
											</Command.Root>
										</Popover.Content>
									</Popover.Root>
									{#if $listofValidatedApplicants[i].country!==true && $listofValidatedApplicants[i].country!==null }
										<span style="color: darkred">select a country</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="min-w-40">
									<Input value={applicant.phone} on:input={(event)=>UpdateApplicantPhone(event.target?.value, i)}/>
									{#if $listofValidatedApplicants[i].phone!==true && $listofValidatedApplicants [i].phone!==null }
										<span style="color: red">enter phone number</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="min-w-40">
									<Input value={applicant.email} on:input={(event)=>UpdateApplicantEmail(event.target?.value, i)}/>
									{#if $listofValidatedApplicants[i].email!==true && $listofValidatedApplicants [i].email!==null }
										<span style="color: red">enter email address</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="min-w-40">
									<Input value={applicant.address} on:input={(event)=>UpdateApplicantAddress(event.target?.value, i)}/>
									{#if $listofValidatedApplicants[i].address!==true && $listofValidatedApplicants [i].address!==null }
										<span style="color: red">enter address</span>
									{/if}
								</Table.Cell>
							{:else }
								<Table.Cell class="w-1">{i+1}</Table.Cell>
								<Table.Cell><Button variant="outline" size="icon" style="color: darkred" on:click={()=>removeApplicant(i)}>
									<Icon icon="ei:minus" class="h-7 w-7" />
								</Button> </Table.Cell>
								<Table.Cell class="min-w-52">{applicant.name}</Table.Cell>
								<Table.Cell>
									<span class="flex gap-2">
									<img src="{GetCountryImageLink(applicant.country)}" width="20" height="15" alt="@flag"/>
										{applicant.country}
									</span>
								</Table.Cell>
								<Table.Cell>{applicant.phone}</Table.Cell>
								<Table.Cell>{applicant.email}</Table.Cell>
								<Table.Cell class="min-w-60">{applicant.address}</Table.Cell>
							{/if}
						</Table.Row>
					{/each}
				</Table.Body>
			{/if}
		</Table.Root>
	</div>

</div>
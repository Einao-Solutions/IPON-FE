<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Table from "$lib/components/ui/table/index.js";
	import type { Inventor, InventorValidator } from '$lib/helpers';
	import * as Popover from "$lib/components/ui/popover"
	import * as Command from "$lib/components/ui/command"
	import Icon from '@iconify/svelte';
	import { get, writable } from 'svelte/store';
	import { cn } from "$lib/utils.js";
	import { type FormInputEvent, Input } from '$lib/components/ui/input';
	import { countriesMap } from '$lib/constants';
	import { onMount, tick } from 'svelte';
	import {
		formsData, pageValidationStatus, savePageData, applicationData,
		applicationScreen, pageSaveStatus, applicationMode, changesMade, validatePage, validatedPages
	} from '$lib/store';
	// import { objsHasDiff } from '../apphelper';
	let listOfCreators= writable<Inventor[]>([]);
	// let listofValidated = writable<InventorValidator[]>([])
	let listOfOpen = writable<boolean[]>([])
	let isEditing:boolean = true
	// let showResetButton:boolean=true;
	function addCreator(){
		const inventor:Inventor={country:"", city:"", id:crypto.randomUUID(), name:""};
		listOfCreators.update((inventors)=>[...inventors, inventor ]);
		// listofValidated.update((valid)=>[...valid, { city:null, country:null,name:null }])
		listOfOpen.update((opener)=>[...opener, false])
		isEditing=true;
	}

	// savePageData.subscribe((pageToValidate)=>{
	// 	if (pageToValidate==="inventors" && $applicationScreen===1)
	// 	{
	// 		if ($formsData === null) {
	// 			formsData.set([{name:"inventors",data: $listOfCreators }])
	// 		} else {
	// 			formsData.update((forms) => {
	// 				let index = forms!.findIndex(x=>x.name==="inventors");
	// 				if (index!==-1)
	// 				{
	// 					forms![index].data = $listOfCreators;
	// 				}
	// 				else {
	// 					forms!.push({name:"inventors", data:$listOfCreators} );
	// 				}
	// 				return [...forms!];
	// 			})
	// 		}
	// 		pageSaveStatus.set(true);
	// 	}
	// })


	// validatePage.subscribe((x) => {
	// 	if (x === 'inventors') {
	// 		const status = validate();
	// 		if($validatedPages===null) {
	// 			validatedPages.set([{ name: 'inventors', status: status }]);
	// 		}
	// 		else
	// 		{
	// 			validatedPages.update((pages) => {
	// 				pages=pages!
	// 				const index = pages.findIndex((y) => y.name === 'inventors');
	// 				if (index === -1) {
	// 					pages.push({ name: 'inventors', status: status });
	// 				} else {
	// 					pages[index].status = status;
	// 				}
	// 				return [...pages];
	// 			});
	// 		}
	// 	}
	// });

	// listOfCreators.subscribe((data)=>{
	// 	if($applicationMode===1) {
	// 		if (data.length >= 1 && objsHasDiff(data, $applicationData?.inventors)) {
	// 			showResetButton = true;
	// 			changesMade.update((changes) => {
	// 				changes = changes ?? [];
	// 				let index = changes.findIndex(x => x.name === 'inventors');
	// 				if (index !== -1) {
	// 					changes[index].hasChanges = true;
	// 				} else {
	//
	// 					changes.push({ name: "inventors", hasChanges: true })
	// 				}
	// 				return [...changes];
	// 			})
	// 		} else {
	// 			showResetButton = false;
	// 			changesMade.update((changes) => {
	// 				changes = changes ?? [];
	// 				let index = changes.findIndex(x => x.name == 'inventors');
	// 				if (index !== -1) {
	// 					changes.splice(index, 1);
	// 					return [...changes]
	// 				}
	// 				return [...changes];
	// 			})
	// 		}
	// 	}
	// })
	onMount(() => {
		let initialData=$formsData?.filter(x=>x.name==='inventors')[0]?.data;
		if ($applicationMode===2) {
			// creation mode
			initialData=initialData??[];
			$listOfCreators = initialData as Inventor[];
			listOfCreators.update((inventors) => [...inventors]);
			// listofValidated.set(Array.from({ length: $listOfCreators.length }, () => ({
			// 	city: null,
			// 	country: null,
			// 	name: null
			// })));
			listOfOpen.set(Array.from({ length: $listOfCreators.length }, () => false));
		}
		else if ($applicationMode===1) {
			// edit mode
			const ogData= get(applicationData).designCreators ??[];
			const data=initialData?[...initialData as Inventor[]] : [...ogData];
			listOfCreators.set(data);
			// listofValidated.set(Array.from({ length: $listOfCreators.length }, () => ({
			// 	city: null,
			// 	country: null,
			// 	name: null
			// })));
			listOfOpen.set(Array.from({ length: $listOfCreators.length }, () => false));
		}
		isEditing=false;
		// if ($validatedPages?.find(x=>x.name==="inventors")) {
		// 	const status=validate();
		// 	if(!status)
		// 	{
		// 		isEditing=true;
		// 	}
		// }
	});

	function removeInventor(index:number)
	{
		listOfCreators.update((creators)=>{
			creators.splice(index,1);
			return [...creators];
		});
		listOfOpen.update((opener)=>{
			opener.splice(index, 1);
			return [...opener]});
		// listofValidated.update((valid)=>{
		// 	valid.splice(index,1);
		// 	return [...valid];
		// })

	}
	function EditorSave(){
		// if(isEditing)
		// {
		// 	if(validate())
		// 	{
		// 		isEditing=false;
		// 		if ($formsData === null) {
		// 			formsData.set([{name:"inventors",data: $listOfCreators }])
		//
		// 		} else {
		// 			formsData.update((forms) => {
		// 				let index = forms!.findIndex(x=>x.name==="inventors");
		// 				if (index!==-1)
		// 				{
		// 					forms![index].data = $listOfCreators;
		// 				}
		// 				else {
		// 					forms!.push({name:"inventors", data:$listOfCreators} );
		// 				}
		// 				return [...forms!];
		// 			})
		// 		}
		// 		listOfCreators.set([...$listOfCreators])
		// 	}
		// 	return;
		// }
		isEditing=!isEditing;
	}

	// function validate():boolean{
	// 	let listOfStatus:boolean[]=[];
	// 	for (let i = 0; i < $listOfCreators.length; i++) {
	// 		$listofValidated[i].name = $listOfCreators[i].name !== "";
	// 		$listofValidated[i].city = $listOfCreators[i].city !== "";
	// 		$listofValidated[i].country = $listOfCreators[i].country !== "";
	// 		listOfStatus.push(
	// 			$listofValidated[i].name!&&
	// 			$listofValidated[i].city!&&
	// 			$listofValidated[i].country!
	// 		);
	// 	}
	// 	return listOfStatus.every(x=>x===true) && $listOfCreators.length>=1
	// }

	// function ResetInventors()
	// {
	// 	listOfCreators.set([...$applicationData?.creators??[]]);
	// 	listofValidated.set(Array.from({ length: $listOfCreators.length }, () => ({
	// 		city: null,
	// 		country: null,
	// 		name: null
	// 	})));
	// 	listOfOpen.set(Array.from({ length: $listOfCreators.length }, () => false));
	// }

	function GetCountryImageLink(country:string)
	{
		let key= Object.keys(countriesMap).find(key => countriesMap[key] === country);
		return `https://flagcdn.com/20x15/${key}.png`;
	}
	function closeAndFocusTrigger(triggerId: string, index:number) {
		$listOfOpen[index] =false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}

	function updateName(name:string, index:number)
	{
		listOfCreators.update(x=>{
			let dt={...x[index]};
			dt.name=name;
			x[index]=dt;
			return [...x];
		});
	}

	function updateCountry(country:string, index:number)
	{
		listOfCreators.update(x=>{
			let dt={...x[index]};
			dt.country=country;
			x[index]=dt;
			return [...x];
		});
	}
	function updateCity(city:string, index:number)
	{
		listOfCreators.update(x=>{
			let dt={...x[index]};
			dt.city=city;
			x[index]=dt;
			return [...x];
		});
	}


</script>
<div class="flex-grow flex flex-col w-full h-full">
	<div class="flex justify-between items-center">
		<strong>List of inventors</strong>
		<div class="flex gap-4 my-2">
			{#if $listOfCreators.length!==0}
				<Button variant="outline" on:click={()=>EditorSave()}>{isEditing?'Save':'Edit'}</Button>
<!--				<Button variant="ghost" class="text-blue-500 {showResetButton?'inline':'hidden'}" on:click={()=>ResetInventors()}>reset</Button>-->
			{/if}
			<Button variant="default" on:click={()=>addCreator()}>
				<Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
				Add Inventor
			</Button>
		</div>
	</div>
	<div class="rounded-md border overflow-y-auto h-[300px] flex-grow overflow-x-auto">
		<Table.Root >
			{#if $listOfCreators.length===0}
				<p class="text-center justify-center flex flex-col h-[400px] text-2xl ">Enter at least one Inventor</p>
			{:else}
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-1">s/n</Table.Head>
						<Table.Head class="w-1"></Table.Head>
						<Table.Head>Name</Table.Head>
						<Table.Head>Country</Table.Head>
						<Table.Head>City</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each $listOfCreators as inventor, i (i)}
						<Table.Row>
							{#if isEditing}
								<Table.Cell>{i+1}</Table.Cell>
								<Table.Cell><Button variant="outline" size="icon" style="color: darkred" on:click={()=>removeInventor(i)}>
									<Icon icon="ei:minus" class="h-7 w-7" />
								</Button> </Table.Cell>
								<Table.Cell class="min-w-40"  >
									<Input value={inventor.name} on:input={(event)=>updateName(event.target?.value??"", i)}/>
									<!--{#if $listofValidated[i].name!==true && $listofValidated[i].name!==null }-->
									<!--	<span style="color: darkred">cannot be empty</span>-->
									<!--{/if}-->
								</Table.Cell>
								<Table.Cell class="flex flex-col">
									<Popover.Root open="{$listOfOpen[i]}" let:ids>
										<Popover.Trigger asChild let:builder>
											<Button
												builders={[builder]}
												variant="outline"
												role="combobox"
												aria-expanded={false}
												class="w-[200px] justify-between"
											>
												<img class="{inventor.country!==''?'block':'hidden'}" src="{GetCountryImageLink(inventor.country)}" width="20" height="15" alt="@flag"/>
												{inventor.country!==""?inventor.country:"Select a country"}
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
							updateCountry(currentValue, i);
              closeAndFocusTrigger(ids.trigger, $listOfCreators.indexOf(inventor));}}>
															<Icon icon="basil:check-solid"
																		class={cn(
                "mr-2 h-4 w-4",
                inventor.country !== country && "text-transparent"
              )}
															/>
															{country}
														</Command.Item>
													{/each}
												</Command.Group>
											</Command.Root>
										</Popover.Content>
									</Popover.Root>
									<!--{#if $listofValidated[i].country!==true && $listofValidated[i].country!==null }-->
									<!--	<span style="color: darkred">select a country</span>-->
									<!--{/if}-->
								</Table.Cell>
								<Table.Cell class="min-w-40">
									<Input value={inventor.city} on:input={(event)=>updateCity(event.target?.value??"", i)}/>
									<!--{#if $listofValidated[i].city!==true && $listofValidated[i].city!==null }-->
									<!--	<span style="color: red">enter a city</span>-->
									<!--{/if}-->
								</Table.Cell>
							{:else }
								<Table.Cell class="w-1">{i+1}</Table.Cell>
								<Table.Cell><Button variant="outline" size="icon" style="color: darkred" on:click={()=>removeInventor(i)}>
									<Icon icon="ei:minus" class="h-7 w-7" />
								</Button> </Table.Cell>
								<Table.Cell>{inventor.name}</Table.Cell>
								<Table.Cell >
						<span class="flex gap-2">
						<img src="{GetCountryImageLink(inventor.country)}" width="20" height="15" alt="@flag"/>
							{inventor.country}
						</span>
								</Table.Cell>
								<Table.Cell>{inventor.city}</Table.Cell>
							{/if}
						</Table.Row>
					{/each}
				</Table.Body>
			{/if}
		</Table.Root>
	</div>
</div>
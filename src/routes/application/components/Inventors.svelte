<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { Inventor, InventorValidator } from '$lib/helpers';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import Icon from '@iconify/svelte';
	import { get, writable } from 'svelte/store';
	import { cn } from '$lib/utils.js';
	import { countriesMap } from '$lib/constants';
	import { onMount, tick } from 'svelte';
	import {
		formsData,
		savePageData,
		applicationData,
		applicationScreen,
		pageSaveStatus,
		applicationMode,
		changesMade,
		validatePage,
		validatedPages,
		newApplicationType
	} from '$lib/store';
	import { objsHasDiff } from '../apphelper';
	import { Input } from '$lib/components/ui/input';
	let listOfInventors = writable<Inventor[]>([]);
	let listofValidated = writable<InventorValidator[]>([]);
	let listOfOpen = writable<boolean[]>([]);
	let isEditing: boolean = true;
	let showResetButton: boolean = false;
	function addInventor() {
		const inventor: Inventor = { country: '', id: crypto.randomUUID(), name: '', email:'', phone:"", address:"" };
		listOfInventors.update((inventors) => [...inventors, inventor]);
		listofValidated.update((valid) => [...valid, { address: null, country: null, name: null, phone:null, email:null }]);
		listOfOpen.update((opener) => [...opener, false]);
		isEditing = true;
	}

	savePageData.subscribe((pageToValidate) => {
		if ((pageToValidate === 'inventors' || pageToValidate === 'designCreators' ) && $applicationScreen === 1) {
			if ($formsData === null) {
				formsData.set([{ name: 'inventors', data: $listOfInventors }]);
			} else {
				formsData.update((forms) => {
					let index = forms!.findIndex((x) => x.name === 'inventors');
					if (index !== -1) {
						forms![index].data = $listOfInventors;
					} else {
						forms!.push({ name: 'inventors', data: $listOfInventors });
					}
					return [...forms!];
				});
			}
			pageSaveStatus.set(true);
			// if (validation)
			// {pageValidationStatus.set(validation);}
			// else {
			// 	validationPage.set(null);
			// }
		}
	});

	validatePage.subscribe((x) => {
		if (x === 'inventors' || x === 'designCreators') {
			const status = validate();
			if ($validatedPages === null) {
				if ($newApplicationType === 0) {
					//patent
					validatedPages.set([{ name: 'inventors', status: status }]);
				} else if ($newApplicationType === 1) {
					//design
					validatedPages.set([{ name: 'designCreators', status: status }]);
				}
			} else {
				validatedPages.update((pages) => {
					pages = pages!;
					if ($newApplicationType === 0) {
						const index = pages.findIndex((y) => y.name === 'inventors');
						if (index === -1) {
							pages.push({ name: 'inventors', status: status });
						} else {
							pages[index].status = status;
						}
					}
					if ($newApplicationType === 1) {
						const index = pages.findIndex((y) => y.name === 'designCreators');
						if (index === -1) {
							pages.push({ name: 'designCreators', status: status });
						} else {
							pages[index].status = status;
						}
					}
					return [...pages];
				});
			}
		}
	});

	listOfInventors.subscribe((data) => {
		if ($applicationMode === 1) {
			// edit mode
			if($newApplicationType===0) {
				if (data.length >= 1 && objsHasDiff(data, $applicationData?.inventors)) {
					showResetButton = true;
					changesMade.update((changes) => {
						changes = changes ?? [];
						let index = changes.findIndex((x) => x.name === 'inventors');
						if (index !== -1) {
							changes[index].hasChanges = true;
						} else {
							changes.push({ name: 'inventors', hasChanges: true });
						}
						return [...changes];
					});
				} else {
					showResetButton = false;
					changesMade.update((changes) => {
						changes = changes ?? [];
						let index = changes.findIndex((x) => x.name == 'inventors');
						if (index !== -1) {
							changes.splice(index, 1);
							return [...changes];
						}
						return [...changes];
					});
				}
			}

			if($newApplicationType===1)
			{
				console.log("changes noted")
				if (data.length >= 1 && objsHasDiff(data, $applicationData?.designCreators)) {
					showResetButton = true;
					changesMade.update((changes) => {
						changes = changes ?? [];
						let index = changes.findIndex((x) => x.name === 'inventors');
						if (index !== -1) {
							changes[index].hasChanges = true;
						} else {
							changes.push({ name: 'inventors', hasChanges: true });
						}
						return [...changes];
					});
				} else {
					showResetButton = false;
					changesMade.update((changes) => {
						changes = changes ?? [];
						let index = changes.findIndex((x) => x.name == 'inventors');
						if (index !== -1) {
							changes.splice(index, 1);
							return [...changes];
						}
						return [...changes];
					});
				}
			}
		}
	});
	onMount(() => {
		let initialData = $formsData?.filter((x) => x.name === 'inventors')[0]?.data;
		if ($applicationMode === 2) {
			// creation mode
			initialData = initialData ?? [];
			$listOfInventors = initialData as Inventor[];
			listOfInventors.update((inventors) => [...inventors]);
			listofValidated.set(
				Array.from({ length: $listOfInventors.length }, () => ({
					address: null,
					country: null,
					name: null,
					email:null, phone:null
				}))
			);
			listOfOpen.set(Array.from({ length: $listOfInventors.length }, () => false));
		} else if ($applicationMode === 1) {
			// edit mode
			let ogData
			if ($newApplicationType === 0) {
				ogData = get(applicationData)?.inventors ?? [];
			}
			else {
				 ogData = get(applicationData)?.designCreators ?? [];
			}
			const data = initialData ? [...(initialData as Inventor[])] : [...ogData];
			listOfInventors.set(data);
			listofValidated.set(
				Array.from({ length: $listOfInventors.length }, () => ({
					address: null,
					country: null,
					name: null,email:null, phone:null,
				}))
			);
			listOfOpen.set(Array.from({ length: $listOfInventors.length }, () => false));
		}
		isEditing = false;
		if ($validatedPages?.find((x) => x.name === 'inventors')) {
			const status = validate();
			if (!status) {
				isEditing = true;
			}
		}
	});

	function removeInventor(index: number) {
		listOfInventors.update((inventors) => {
			inventors.splice(index, 1);
			return [...inventors];
		});
		listOfOpen.update((opener) => {
			opener.splice(index, 1);
			return [...opener];
		});
		listofValidated.update((valid) => {
			valid.splice(index, 1);
			return [...valid];
		});
	}
	function EditorSave() {
		if (isEditing) {
			if (validate()) {
				isEditing = false;
				if ($formsData === null) {
					formsData.set([{ name: 'inventors', data: $listOfInventors }]);
				} else {
					formsData.update((forms) => {
						let index = forms!.findIndex((x) => x.name === 'inventors');
						if (index !== -1) {
							forms![index].data = $listOfInventors;
						} else {
							forms!.push({ name: 'inventors', data: $listOfInventors });
						}
						return [...forms!];
					});
				}
				listOfInventors.set([...$listOfInventors]);
			}
			return;
		}
		isEditing = !isEditing;
	}

	function validate(): boolean {
		let listOfStatus: boolean[] = [];
		for (let i = 0; i < $listOfInventors.length; i++) {
			$listofValidated[i].name = $listOfInventors[i].name !== '';
			$listofValidated[i].email = $listOfInventors[i].email !== '';
			$listofValidated[i].phone = $listOfInventors[i].phone !== '';
			$listofValidated[i].country = $listOfInventors[i].country !== '';
			$listofValidated[i].address = $listOfInventors[i].address !== '';
			listOfStatus.push(
				$listofValidated[i].name!
				&& $listofValidated[i].phone!
				&& $listofValidated[i].address!
				&& $listofValidated[i].country!  && $listofValidated[i].email!
			);
		}
		return listOfStatus.every((x) => x === true) && $listOfInventors.length >= 1;
	}

	function ResetInventors() {
		if ($newApplicationType===0)
		{listOfInventors.set([...($applicationData?.inventors ?? [])]);}
		else {
			listOfInventors.set([...($applicationData?.designCreators ?? [])]);
		}
		listofValidated.set(
			Array.from({ length: $listOfInventors.length }, () => ({
				country: null,
				name: null,
				email:null, phone:null, address:null,
			}))
		);
		listOfOpen.set(Array.from({ length: $listOfInventors.length }, () => false));
	}

	function GetCountryImageLink(country: string) {
		let key = Object.keys(countriesMap).find((key) => countriesMap[key] === country);
		return `https://flagcdn.com/20x15/${key}.png`;
	}
	function closeAndFocusTrigger(triggerId: string, index: number) {
		$listOfOpen[index] = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}

	function updateName(name: string, index: number) {
		listOfInventors.update((x) => {
			let dt = { ...x[index] };
			dt.name = name;
			x[index] = dt;
			return [...x];
		});
	}

	function updateCountry(country: string, index: number) {
		listOfInventors.update((x) => {
			let dt = { ...x[index] };
			dt.country = country;
			x[index] = dt;
			return [...x];
		});
	}
	function updatePhone(phone: string, index: number) {
		listOfInventors.update((x) => {
			let dt = { ...x[index] };
			dt.phone = phone;
			x[index] = dt;
			return [...x];
		});
	}
	function updateEmail(email: string, index: number) {
		listOfInventors.update((x) => {
			let dt = { ...x[index] };
			dt.email = email;
			x[index] = dt;
			return [...x];
		});
	}
	function updateAddress(address: string, index: number) {
		listOfInventors.update((x) => {
			let dt = { ...x[index] };
			dt.address = address;
			x[index] = dt;
			return [...x];
		});
	}
</script>

<div class="flex-grow flex flex-col w-full h-full">
	<div class="flex justify-between items-center">
		<strong>List of{$newApplicationType === 0 ? ' patent inventors' : ' design creators'}</strong>
		<div class="flex gap-4 my-2">
			{#if $listOfInventors.length !== 0}
				<Button variant="outline" on:click={() => EditorSave()}
					>{isEditing ? 'Save' : 'Edit'}</Button
				>
				<Button
					variant="ghost"
					class="text-blue-500 {showResetButton ? 'inline' : 'hidden'}"
					on:click={() => ResetInventors()}>reset</Button
				>
			{/if}
			<Button variant="default" on:click={() => addInventor()}>
				<Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
				Add {$newApplicationType === 0 ? 'inventor' : 'creator'}
			</Button>
		</div>
	</div>
	<div class="rounded-md border overflow-y-auto h-[300px] flex-grow  overflow-x-auto">
		<Table.Root >
			{#if $listOfInventors.length === 0}
				<p class="text-center justify-center flex flex-col h-[400px] text-2xl">
					Enter at least one {$newApplicationType === 0 ? 'inventor' : 'creator'}
				</p>
			{:else}
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-1">s/n</Table.Head>
						<Table.Head class="w-1"></Table.Head>
						<Table.Head>Name</Table.Head>
						<Table.Head>Country</Table.Head>
						<Table.Head>Phone number</Table.Head>
						<Table.Head>Email</Table.Head>
						<Table.Head>Address</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each $listOfInventors as inventor, i (i)}
						<Table.Row>
							{#if isEditing}
								<Table.Cell>{i + 1}</Table.Cell>
								<Table.Cell
									><Button
										variant="outline"
										size="icon"
										style="color: darkred"
										on:click={() => removeInventor(i)}
									>
										<Icon icon="ei:minus" class="h-7 w-7" />
									</Button>
								</Table.Cell>
								<Table.Cell class="min-w-40">
									<Input
										value={inventor.name}
										on:input={(event) => updateName(event.target?.value ?? '', i)}
									/>
									{#if $listofValidated[i].name !== true && $listofValidated[i].name !== null}
										<span style="color: darkred">cannot be empty</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="flex flex-col">
									<Popover.Root open={$listOfOpen[i]} let:ids>
										<Popover.Trigger asChild let:builder>
											<Button
												builders={[builder]}
												variant="outline"
												role="combobox"
												aria-expanded={false}
												class="w-[200px] justify-between"
											>
												<img
													class={inventor.country !== '' ? 'block' : 'hidden'}
													src={GetCountryImageLink(inventor.country)}
													width="20"
													height="15"
													alt="@flag"
												/>
												{inventor.country !== '' ? inventor.country : 'Select a country'}
												<Icon
													icon="ph:caret-up-down-thin"
													width="1.2rem"
													height="1.2rem"
													class="opacity-50 shrink-0 ml-2"
												/>
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
																closeAndFocusTrigger(
																	ids.trigger,
																	$listOfInventors.indexOf(inventor)
																);
															}}
														>
															<Icon
																icon="basil:check-solid"
																class={cn(
																	'mr-2 h-4 w-4',
																	inventor.country !== country && 'text-transparent'
																)}
															/>
															{country}
														</Command.Item>
													{/each}
												</Command.Group>
											</Command.Root>
										</Popover.Content>
									</Popover.Root>
									{#if $listofValidated[i].country !== true && $listofValidated[i].country !== null}
										<span style="color: darkred">select a country</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="min-w-40">
									<Input
										value={inventor.phone}
										on:input={(event) => updatePhone(event.target?.value ?? '', i)}
									/>
									{#if $listofValidated[i].phone !== true && $listofValidated[i].phone !== null}
										<span style="color: red">enter phone number</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="min-w-40">
									<Input
										value={inventor.email}
										on:input={(event) => updateEmail(event.target?.value ?? '', i)}
									/>
									{#if $listofValidated[i].email !== true && $listofValidated[i].email !== null}
										<span style="color: red">Enter email</span>
									{/if}
								</Table.Cell>	<Table.Cell class="min-w-40">
								<Input
									value={inventor.address}
									on:input={(event) => updateAddress(event.target?.value ?? '', i)}
								/>
								{#if $listofValidated[i].address !== true && $listofValidated[i].address !== null}
									<span style="color: red">enter address</span>
								{/if}
							</Table.Cell>
							{:else}
								<Table.Cell class="w-1">{i + 1}</Table.Cell>
								<Table.Cell
									><Button
										variant="outline"
										size="icon"
										style="color: darkred"
										on:click={() => removeInventor(i)}
									>
										<Icon icon="ei:minus" class="h-7 w-7" />
									</Button>
								</Table.Cell>
								<Table.Cell class="min-w-40">{inventor.name}</Table.Cell>
								<Table.Cell>
									<span class="flex gap-2">
										<img
											src={GetCountryImageLink(inventor.country)}
											width="20"
											height="15"
											alt="@flag"
										/>
										{inventor.country}
									</span>
								</Table.Cell>
								<Table.Cell>{inventor.phone}</Table.Cell>
								<Table.Cell>{inventor.email}</Table.Cell>
								<Table.Cell class="min-w-60">{inventor.address}</Table.Cell>
							{/if}
						</Table.Row>
					{/each}
				</Table.Body>
			{/if}
		</Table.Root>
	</div>
</div>

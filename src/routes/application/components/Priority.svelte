<script lang="ts">
	import {
		formsData,
		applicationScreen,
		savePageData,
		pageSaveStatus,
		hasPriority,
		changesMade,
		applicationMode,
		applicationData,
		validatePage,
		validatedPages
	} from '$lib/store';
	import { onMount, tick } from 'svelte';
	import {
		priorityDescription,
		type Priority,
		type PriorityValidator,
		type PatentData
	} from '$lib/helpers';
	import { get, writable } from 'svelte/store';
	import { countriesMap } from '$lib/constants';
	import { Button } from '$lib/components/ui/button/index';
	import { Input } from '$lib/components/ui/input';

	import { cn } from '$lib/utils';
	import * as Table from '$lib/components/ui/table/index';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import Icon from '@iconify/svelte';
	import DatePickerCustom from './DatePickerCustom.svelte';
	import { objsHasDiff } from '../apphelper';
	import type { DateValue } from '@internationalized/date';

	let allPriorities = writable<Priority[]>([]);
	let listofValidatedPriorities = writable<PriorityValidator[]>([]);
	let listOfOpenCountries = writable<boolean[]>([]);
	let listOfOpenDates = writable<boolean[]>([]);
	let isEditing: boolean = true;
	let showResetButton: boolean = false;

	function addPriority() {
		allPriorities.update((priority) => [
			...priority,
			{ id: crypto.randomUUID(), number: '', country: '', date: undefined }
		]);
		listofValidatedPriorities.update((valid) => [
			...valid,
			{ number: null, country: null, date: null }
		]);
		listOfOpenCountries.update((countries) => [...countries, false]);
		listOfOpenDates.update((dates) => [...dates, false]);
		isEditing = true;
		hasPriority.set(true);
	}
	allPriorities.subscribe((data) => {
		if ($applicationMode === 1) {
			if (objsHasDiff(data, $applicationData?.priorityInfo)) {
				showResetButton = true;
				changesMade.update((changes) => {
					changes = changes ?? [];
					let index = changes.findIndex((x) => x.name === 'correspondence');
					if (index !== -1) {
						changes[index].hasChanges = true;
					} else {
						changes.push({ name: 'correspondence', hasChanges: true });
					}
					return [...changes];
				});
			} else {
				showResetButton = false;
				changesMade.update((changes) => {
					changes = changes ?? [];
					let index = changes.findIndex((x) => x.name == 'correspondence');
					if (index !== -1) {
						changes.splice(index, 1);
						return [...changes];
					}
					return [...changes];
				});
			}
		}
	});

	savePageData.subscribe((pageToValidate) => {
		if (pageToValidate === 'priority' && $applicationScreen === 4) {
			if ($formsData === null) {
				formsData.set([{ name: 'priority', data: $allPriorities }]);
			} else {
				formsData.update((forms) => {
					let index = forms!.findIndex((x) => x.name === 'priority');
					if (index !== -1) {
						forms![index].data = $allPriorities;
					} else {
						forms!.push({ name: 'priority', data: $allPriorities });
					}
					return [...forms!];
				});
			}
			pageSaveStatus.set(true);
		}
	});

	validatePage.subscribe((x) => {
		if (x === 'priority') {
			const status = validate();
			if ($validatedPages === null) {
				validatedPages.set([{ name: 'priority', status: status }]);
			} else {
				validatedPages.update((pages) => {
					pages = pages!;
					const index = pages.findIndex((x) => x.name === 'priority');
					if (index === -1) {
						pages.push({ name: 'priority', status: status });
					} else {
						pages[index].status = status;
					}
					return [...pages];
				});
			}
		}
	});

	onMount(() => {
		let initialData = $formsData?.find((x) => x.name === 'priority');
		if ($applicationMode === 2) {
			if (initialData) {
				$allPriorities = initialData.data as Priority[];
				allPriorities.update((priorities) => [...priorities]);
			}
		} else if ($applicationMode === 1) {
			// edit mode
			const clone = get(applicationData)?.priorityInfo ?? [];

			// const clone = JSON.parse(JSON.stringify($applicationData?.priorityInfo));
			const mapped: Priority[] = initialData ? (initialData.data as Priority[]) : [...clone];
			allPriorities.set([...mapped]);
		}
		listofValidatedPriorities.set(
			Array.from({ length: $allPriorities.length }, () => ({
				number: null,
				country: null,
				date: null
			}))
		);
		listOfOpenCountries.set(Array.from({ length: $allPriorities.length }, () => false));
		listOfOpenDates.set(Array.from({ length: $allPriorities.length }, () => false));
		isEditing = false;
		if ($validatedPages?.find((x) => x.name === 'priority')) {
			const status = validate();
			if (!status) {
				isEditing = true;
			}
		}
	});

	function removepriority(index: number) {
		allPriorities.update((priorities) => {
			priorities.splice(index, 1);
			if (priorities.length == 0) {
				hasPriority.set(false);
			}
			return [...priorities];
		});
		listOfOpenCountries.update((opener) => {
			opener.splice(index, 1);
			return [...opener];
		});
		listOfOpenDates.update((opener) => {
			opener.splice(index, 1);
			return [...opener];
		});
		listofValidatedPriorities.update((valid) => {
			valid.splice(index, 1);
			return [...valid];
		});
	}
	function EditorSave() {
		if (isEditing) {
			if (validate()) {
				isEditing = false;
				if ($formsData === null) {
					formsData.set([{ name: 'priority', data: $allPriorities }]);
				} else {
					formsData.update((forms) => {
						let curr = forms!.find((x) => x.name === 'priority');
						if (curr) {
							curr.data = $allPriorities;
						} else {
							let temp = JSON.parse(JSON.stringify(forms!));
							temp!.push({ name: 'priority', data: $allPriorities });
							return [...temp];
						}
						return [...forms!];
					});
				}
			}
			return;
		}
		isEditing = !isEditing;
	}
	function validate(): boolean {
		let listOfStatus: boolean[] = [];
		for (let i = 0; i < $allPriorities.length; i++) {
			$listofValidatedPriorities[i].number = $allPriorities[i].number !== '';
			$listofValidatedPriorities[i].date = $allPriorities[i].date !== undefined;
			$listofValidatedPriorities[i].country = $allPriorities[i].country !== '';
			listOfStatus.push(
				$listofValidatedPriorities[i].number! &&
					$listofValidatedPriorities[i].date! &&
					$listofValidatedPriorities[i].country!
			);
		}
		return listOfStatus.every((x) => x === true) || $allPriorities.length == 0;
	}
	function GetCountryImageLink(country: string) {
		let key = Object.keys(countriesMap).find((key) => countriesMap[key] === country);
		return `https://flagcdn.com/20x15/${key}.png`;
	}
	function closeCountryAndFocusTrigger(triggerId: string, index: number) {
		$listOfOpenCountries[index] = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}

	function reset() {
		allPriorities.set([...($applicationData?.priorityInfo ?? [])]);
		listofValidatedPriorities.set(
			Array.from({ length: $allPriorities.length }, () => ({
				number: null,
				country: null,
				date: null
			}))
		);
		listOfOpenCountries.set(Array.from({ length: $allPriorities.length }, () => false));
		listOfOpenDates.set(Array.from({ length: $allPriorities.length }, () => false));
	}

	function updateNumber(index: number, num: string) {
		allPriorities.update((priorities) => {
			let temp = { ...priorities[index] };
			temp.number = num;
			priorities[index] = temp;
			return [...priorities];
		});
	}

	function updateCountry(index: number, country: string) {
		allPriorities.update((priorities) => {
			let temp = { ...priorities[index] };
			temp.country = country;
			priorities[index] = temp;
			return [...priorities];
		});
	}

	function updateDate(index: number, date: string) {
		allPriorities.update((priorities) => {
			let temp = { ...priorities[index] };
			temp.date = date;
			priorities[index] = temp;
			return [...priorities];
		});
	}
</script>

<div class="flex-grow flex flex-col w-full h-full gap-2">
	<div class="rounded-md bg-accent h-20 pl-2 pr-2 text-center flex flex-col justify-center">
		{priorityDescription}
	</div>
	<div class="flex justify-between items-center">
		<strong>List of priorities</strong>
		<Button
			variant="outline"
			class="text-blue-500 {showResetButton ? 'inline' : 'hidden'}"
			on:click={() => reset()}>reset</Button
		>
		<div class="flex gap-4">
			{#if $allPriorities.length !== 0}
				<Button variant="outline" on:click={() => EditorSave()}
					>{isEditing ? 'Save' : 'Edit'}</Button
				>
			{/if}
			<Button variant="default" on:click={() => addPriority()}>
				<Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
				Add priority
			</Button>
		</div>
	</div>

	<div class="rounded-md border overflow-y-auto h-[300px] flex-grow overflow-x-auto">
		<Table.Root>
			{#if $allPriorities.length === 0}
				<p class="text-center justify-center flex flex-col h-[400px]">
					Enter priority details (optional)
				</p>
			{:else}
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-1">s/n</Table.Head>
						<Table.Head class="w-1"></Table.Head>
						<Table.Head>Number</Table.Head>
						<Table.Head>Country</Table.Head>
						<Table.Head>Date</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each $allPriorities as priority, i (i)}
						<Table.Row>
							{#if isEditing}
								<Table.Cell>{i + 1}</Table.Cell>
								<Table.Cell
									><Button
										variant="outline"
										size="icon"
										style="color: darkred"
										on:click={() => removepriority(i)}
									>
										<Icon icon="ei:minus" class="h-7 w-7" />
									</Button>
								</Table.Cell>
								<Table.Cell class="min-w-40">
									<Input
										value={priority.number}
										on:input={(event) => updateNumber(i, event.target?.value)}
									/>
									{#if $listofValidatedPriorities[i].number !== true && $listofValidatedPriorities[i].number !== null}
										<span style="color: darkred">Number cannot be empty</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="flex flex-col">
									<Popover.Root open={$listOfOpenCountries[i]} let:ids>
										<Popover.Trigger asChild let:builder>
											<Button
												builders={[builder]}
												variant="outline"
												role="combobox"
												aria-expanded={false}
												class="w-[200px] justify-between"
											>
												<img
													class={priority.country !== '' ? 'block' : 'hidden'}
													src={GetCountryImageLink(priority.country)}
													width="20"
													height="15"
													alt="@flag"
												/>
												{priority.country !== '' ? priority.country : 'Select a country'}
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
																updateCountry(i, currentValue);
																closeCountryAndFocusTrigger(
																	ids.trigger,
																	$allPriorities.indexOf(priority)
																);
															}}
														>
															<Icon
																icon="basil:check-solid"
																class={cn(
																	'mr-2 h-4 w-4',
																	priority.country !== country && 'text-transparent'
																)}
															/>
															{country}
														</Command.Item>
													{/each}
												</Command.Group>
											</Command.Root>
										</Popover.Content>
									</Popover.Root>
									{#if $listofValidatedPriorities[i].country !== true && $listofValidatedPriorities[i].country !== null}
										<span style="color: darkred">select a country</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="w-max-40">
									<Popover.Root>
										<Popover.Trigger asChild let:builder>
											<Button
												variant="outline"
												class={cn(
													'w-[280px] justify-start text-left font-normal',
													!priority.date && 'text-muted-foreground'
												)}
												builders={[builder]}
											>
												<Icon icon="uis:calender" width="1.2rem" height="1.2rem" />
												{priority.date ? priority.date : 'Pick a date'}
											</Button>
										</Popover.Trigger>
										<Popover.Content class="w-auto p-0">
											<DatePickerCustom
												value={priority.date}
												onValueChange={(event) => updateDate(i, event)}
											/>
										</Popover.Content>
									</Popover.Root>
									{#if $listofValidatedPriorities[i].date !== true && $listofValidatedPriorities[i].date !== null}
										<span style="color: red">select a date</span>
									{/if}
								</Table.Cell>
							{:else}
								<Table.Cell class="w-1">{i + 1}</Table.Cell>
								<Table.Cell
									><Button
										variant="outline"
										size="icon"
										style="color: darkred"
										on:click={() => removepriority(i)}
									>
										<Icon icon="ei:minus" class="h-7 w-7" />
									</Button>
								</Table.Cell>
								<Table.Cell>{priority.number}</Table.Cell>
								<Table.Cell>
									<span class="flex gap-2">
										<img
											src={GetCountryImageLink(priority.country)}
											width="20"
											height="15"
											alt="@flag"
										/>
										{priority.country}
									</span>
								</Table.Cell>
								<Table.Cell>{priority.date}</Table.Cell>
							{/if}
						</Table.Row>
					{/each}
				</Table.Body>
			{/if}
		</Table.Root>
	</div>
</div>

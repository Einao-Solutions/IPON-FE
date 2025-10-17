<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { baseURL, type CorrespondenceType } from '$lib/helpers';
	import { Toaster } from '$lib/components/ui/sonner';
	import { toast } from 'svelte-sonner';
	import Icon from '@iconify/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import { nigeriaStates } from '$lib/constants';
	import { cn } from '$lib/utils';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { writable } from 'svelte/store';
	import { tick } from 'svelte';
	import { applicationData, loggedInUser } from '$lib/store';
	let openCitySelection = writable<boolean>(false);

	export let requiredData: {
		fileId: string;
		oldCorrespondence: CorrespondenceType;
		oldId: string;
	};
	let name_id = '';
	type Usermatches = {
		name: string;
		id: string;
		email: string;
	};
	let newCorrespondence: CorrespondenceType | undefined = {
		name: '',
		state: '',
		address: '',
		email: '',
		phone: ''
	};
	let selectedUser: Usermatches | undefined = undefined;
	export let closed: () => void;
	let currentView = 'name_id_search';
	let matchesList: Usermatches[] | null = [];
	let open = true;
	async function Search() {
		if (name_id.length < 3) {
			toast.error('please enter at least 3 characters.', { position: 'top-right' });
			return;
		}
		currentView = 'loading';
		const response = await fetch(`${baseURL}/api/users/SearchNameId?nameId=${name_id}`);
		if (response.ok) {
			matchesList = await response.json();
			console.log(matchesList);
			currentView = 'result';
		} else {
			currentView = 'error';
		}
	}

	function closeCountryAndFocusTrigger(triggerId: string) {
		openCitySelection.update(() => false);
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}

	async function saveCorr() {
		currentView = 'loading';
		const name_search_ = await fetch(
			`${baseURL}/api/users/SearchNameId?nameId=${requiredData.oldId}`
		);
		let old_name = 'none';
		if (name_search_.ok) {
			const text = await name_search_.text();
			if (text) {
				try {
					const json = JSON.parse(text);
					old_name = json[0]?.name ?? 'none';
				} catch (e) {
					old_name = 'none';
				}
			}
		}
		var response = await fetch(`${baseURL}/api/files/ReAssign`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				fileId: requiredData.fileId,
				userName: $loggedInUser.name,
				userId: $loggedInUser.id,
				newOwner: selectedUser?.id,
				oldId: requiredData.oldId,
				oldName: old_name ?? '',
				oldCorrespondence: requiredData.oldCorrespondence,
				newCorrespondence: newCorrespondence
			})
		});
		if (response.ok) {
			const latest = await response.json();
			applicationData.set(latest);
			currentView = 'success';
		} else {
			currentView = 'error';
		}
	}
</script>

<Toaster />
<Dialog.Root
	bind:open
	onOpenChange={(val) => {
		if (!val) {
			closed();
		}
	}}
>
	<Dialog.Content>
		{#if currentView === 'name_id_search'}
			<p>Search for new owner details</p>
			<Input placeholder="Search by name or id" bind:value={name_id} />
			<Button on:click={() => Search()}>Search</Button>
		{:else if currentView === 'loading'}
			<div class="items-center justify-center flex h-screen">
				<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
			</div>
		{:else if currentView === 'id_confirmation'}
			<div class="space-y-3 p-2">
				<p>Confirmation</p>
				<p>Confirm selected new owner</p>
				<p>Are you sure you want to make {selectedUser.name} the new file owner?</p>
				<div class="space-x-3 flex">
					<Button
						variant="destructive"
						on:click={() => {
							selectedUser = null;
							closed();
						}}>Cancel</Button
					>
					<Button on:click={() => (currentView = 'new_correspondence')}>Continue</Button>
				</div>
			</div>
		{:else if currentView === 'result'}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Cell>ID</Table.Cell>
						<Table.Cell>Name</Table.Cell>
						<Table.Cell>Email</Table.Cell>
						<Table.Cell>Option</Table.Cell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each matchesList as option}
						<Table.Row>
							<Table.Cell>{option.id}</Table.Cell>
							<Table.Cell>{option.name}</Table.Cell>
							<Table.Cell>{option.email}</Table.Cell>
							<Table.Cell>
								<Button
									on:click={() => {
										currentView = 'id_confirmation';
										selectedUser = option;
									}}>Select</Button
								>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{:else if currentView === 'new_correspondence'}
			<div class="space-y-2 p-2">
				<Input placeholder="Enter new correspondence name" bind:value={newCorrespondence.name} />
				<Input placeholder="Enter new correspondence email" bind:value={newCorrespondence.email} />
				<Input placeholder="Enter new correspondence phone" bind:value={newCorrespondence.phone} />
				<Textarea
					placeholder="Enter new correspondence address"
					bind:value={newCorrespondence.address}
				/>
				<div class="flex flex-col space-y-1.5">
					<Popover.Root open={$openCitySelection} let:ids>
						<Popover.Trigger asChild let:builder>
							<Button
								builders={[builder]}
								variant="outline"
								role="combobox"
								aria-expanded={$openCitySelection}
								class="w-[200px] justify-between"
							>
								{newCorrespondence.state !== '' && newCorrespondence.state !== null
									? newCorrespondence.state
									: 'Select a state'}
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
								<Command.Empty>No states found.</Command.Empty>
								<Command.Group class="overflow-y-auto">
									{#each nigeriaStates as stateselect}
										<Command.Item
											value={stateselect}
											onSelect={(currentValue) => {
												newCorrespondence.state = currentValue;
												closeCountryAndFocusTrigger(ids.trigger);
											}}
										>
											<Icon
												icon="basil:check-solid"
												class={cn(
													'mr-2 h-4 w-4',
													newCorrespondence.state !== stateselect && 'text-transparent'
												)}
											/>
											{stateselect}
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.Root>
						</Popover.Content>
					</Popover.Root>
				</div>
				<div>
					<Button
						variant="destructive"
						on:click={() => {
							selectedUser = null;
							closed();
						}}>Cancel</Button
					>
					<Button on:click={() => saveCorr()}>Continue</Button>
				</div>
			</div>
		{:else if currentView === 'error'}
			<p>failed to search. please try again later</p>
		{:else if currentView === 'success'}
			<div class="space-y-2">
				<p>Successfully updated the file ownership details</p>
				<Button
					on:click={() => {
						selectedUser = null;
						closed();
					}}>Ok</Button
				>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

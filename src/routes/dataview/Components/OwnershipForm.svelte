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
	import { tick, onMount } from 'svelte';
	import { applicationData, loggedInUser } from '$lib/store';
	import { browser } from '$app/environment';

	let openCitySelection = writable<boolean>(false);

	export let requiredData: {
		fileId: string;
		oldCorrespondence: CorrespondenceType;
		oldId: string;
	};
	
	let name_id = '';
	
	type Usermatches = {
		id: string;
		creatorId?: string;
		firstName?: string;
		lastName?: string;
		name?: string;
		email?: string;
	};
	
	let newCorrespondence: CorrespondenceType = {
		name: '',
		state: '',
		address: '',
		email: '',
		phone: ''
	};
	
	let selectedUser: Usermatches | undefined = undefined;
	export let closed: () => void;
	let currentView = 'name_id_search';
	let matchesList: Usermatches[] = [];
	let open = true;
	let isSearching = false;

	async function Search() {
		if (name_id.length < 3) {
			toast.error('Please enter at least 3 characters.', { position: 'top-right' });
			return;
		}
		
		isSearching = true;
		currentView = 'loading';
		
		try {
			const response = await fetch(`${baseURL}/api/users/SearchNameId?nameId=${name_id}`);
			if (response.ok) {
				matchesList = await response.json();
				currentView = matchesList.length > 0 ? 'result' : 'no_results';
			} else {
				currentView = 'error';
			}
		} catch (error) {
			console.error('Search error:', error);
			currentView = 'error';
		} finally {
			isSearching = false;
		}
	}

	function closeCountryAndFocusTrigger(triggerId: string) {
		openCitySelection.update(() => false);
		tick().then(() => {
			if (browser) {
				document.getElementById(triggerId)?.focus();
			}
		});
	}

	async function saveCorr() {
		// Validate correspondence data
		if (!newCorrespondence.name || !newCorrespondence.email || !newCorrespondence.phone) {
			toast.error('Please fill in all required fields.', { position: 'top-right' });
			return;
		}

		currentView = 'loading';
		
		try {
			// Fetch old owner name
			const name_search_ = await fetch(
				`${baseURL}/api/users/SearchNameId?nameId=${requiredData.oldId}`
			);
			
			let old_name = 'none';
			if (name_search_.ok) {
				const text = await name_search_.text();
				if (text) {
					try {
						const json = JSON.parse(text);
						old_name = json[0]?.name ?? json[0]?.firstName + ' ' + json[0]?.lastName ?? 'none';
					} catch (e) {
						console.error('Error parsing old name:', e);
						old_name = 'none';
					}
				}
			}

			// Reassign file
			const response = await fetch(`${baseURL}/api/files/ReAssign`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					fileId: requiredData.fileId,
					userName: $loggedInUser?.firstName + ' ' + $loggedInUser?.lastName,
					userId: $loggedInUser?.creatorId,
					newOwner: selectedUser?.creatorId ?? selectedUser?.id,
					oldId: requiredData.oldId,
					oldName: old_name,
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
		} catch (error) {
			console.error('Save error:', error);
			currentView = 'error';
		}
	}

	function resetAndClose() {
		selectedUser = undefined;
		name_id = '';
		matchesList = [];
		newCorrespondence = {
			name: '',
			state: '',
			address: '',
			email: '',
			phone: ''
		};
		closed();
	}
</script>

<Toaster />

<Dialog.Root
	bind:open
	onOpenChange={(val) => {
		if (!val) {
			resetAndClose();
		}
	}}
>
	<Dialog.Content class="max-w-4xl max-h-[90vh] overflow-hidden">
		<!-- SEARCH VIEW -->
		{#if currentView === 'name_id_search'}
			<div class="space-y-6 p-6">
				<div class="space-y-2">
					<Dialog.Title class="text-2xl font-semibold tracking-tight">
						Transfer File Ownership
					</Dialog.Title>
					<Dialog.Description class="text-muted-foreground">
						Search for the new owner by name or ID to begin the transfer process
					</Dialog.Description>
				</div>
				
				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="search-input" class="text-sm font-medium">Search Owner</Label>
						<div class="relative">
							<Icon 
								icon="ph:magnifying-glass" 
								class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
								width="1.2rem" 
								height="1.2rem" 
							/>
							<Input 
								id="search-input"
								placeholder="Enter name or ID (min 3 characters)" 
								bind:value={name_id} 
								class="pl-10 h-11"
								disabled={isSearching}
								on:keydown={(e) => e.key === 'Enter' && !isSearching && Search()}
							/>
						</div>
					</div>
					
					<Button 
						on:click={Search} 
						class="w-full h-11" 
						size="lg"
						disabled={isSearching || name_id.length < 3}
					>
						{#if isSearching}
							<Icon icon="line-md:loading-loop" class="mr-2" width="1.2rem" height="1.2rem" />
							Searching...
						{:else}
							<Icon icon="ph:magnifying-glass-bold" class="mr-2" width="1.2rem" height="1.2rem" />
							Search Users
						{/if}
					</Button>
				</div>
			</div>

		<!-- LOADING VIEW -->
		{:else if currentView === 'loading'}
			<div class="flex flex-col items-center justify-center py-20 px-6">
				<div class="relative mb-4">
					<div class="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
					<Icon 
						icon="line-md:loading-loop" 
						width="4rem" 
						height="4rem" 
						class="absolute inset-0 text-primary"
					/>
				</div>
				<p class="text-sm text-muted-foreground animate-pulse">
					Processing your request...
				</p>
			</div>

		<!-- CONFIRMATION VIEW -->
		{:else if currentView === 'id_confirmation'}
			<div class="space-y-6 p-6">
				<div class="space-y-4">
					<div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
						<Icon 
							icon="ph:warning-bold" 
							class="text-amber-600 dark:text-amber-500" 
							width="1.5rem" 
							height="1.5rem" 
						/>
					</div>
					
					<div class="space-y-2">
						<Dialog.Title class="text-2xl font-semibold tracking-tight">
							Confirm New Owner
						</Dialog.Title>
						<Dialog.Description class="text-muted-foreground">
							Please review the selected user before proceeding
						</Dialog.Description>
					</div>
				</div>
				
				<div class="rounded-lg border bg-muted/50 p-4">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
							<Icon icon="ph:user-bold" class="text-primary" width="1.2rem" height="1.2rem" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="font-semibold truncate">
								{selectedUser?.firstName ?? ''} {selectedUser?.lastName ?? ''}
							</p>
							<p class="text-sm text-muted-foreground truncate">
								{selectedUser?.email ?? 'No email provided'}
							</p>
							{#if selectedUser?.creatorId}
								<p class="text-xs text-muted-foreground font-mono mt-0.5">
									ID: {selectedUser.creatorId}
								</p>
							{/if}
						</div>
					</div>
				</div>
				
				<p class="text-sm text-muted-foreground">
					This action will transfer file ownership to <strong>{selectedUser?.firstName ?? ''} {selectedUser?.lastName ?? ''}</strong>. 
					You'll need to provide correspondence details in the next step.
				</p>
				
				<div class="flex gap-3 pt-2">
					<Button
						variant="outline"
						class="flex-1 h-11"
						on:click={() => {
							selectedUser = undefined;
							currentView = 'name_id_search';
						}}
					>
						<Icon icon="ph:arrow-left" class="mr-2" width="1.2rem" height="1.2rem" />
						Back
					</Button>
					<Button 
						class="flex-1 h-11" 
						on:click={() => (currentView = 'new_correspondence')}
					>
						Continue
						<Icon icon="ph:arrow-right" class="ml-2" width="1.2rem" height="1.2rem" />
					</Button>
				</div>
			</div>

		<!-- RESULTS VIEW -->
		{:else if currentView === 'result'}
			<div class="space-y-6 p-6">
				<div class="space-y-2">
					<Dialog.Title class="text-2xl font-semibold tracking-tight">
						Search Results
					</Dialog.Title>
					<Dialog.Description class="text-muted-foreground">
						Found {matchesList.length} user{matchesList.length !== 1 ? 's' : ''} matching your search
					</Dialog.Description>
				</div>
				
				<div class="border rounded-lg overflow-hidden">
					<div class="max-h-[400px] overflow-y-auto">
						<Table.Root>
							<Table.Header class="bg-muted/50 sticky top-0 z-10">
								<Table.Row>
									<Table.Head class="w-auto font-semibold">ID</Table.Head>
									<Table.Head class="font-semibold">Name</Table.Head>
									<Table.Head class="font-semibold">Email</Table.Head>
									<Table.Head class="font-semibold text-right">Action</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each matchesList as option (option.creatorId ?? option.id)}
									<Table.Row class="hover:bg-muted/50 transition-colors">
										<Table.Cell class="font-mono text-sm">
											{option.creatorId ?? option.id}
										</Table.Cell>
										<Table.Cell class="font-medium">
											{option.firstName ?? ''} {option.lastName ?? option.name ?? ''}
										</Table.Cell>
										<Table.Cell class="text-muted-foreground truncate max-w-[200px]">
											{option.email ?? 'N/A'}
										</Table.Cell>
										<Table.Cell class="text-right">
											<Button
												size="sm"
												on:click={() => {
													selectedUser = option;
													currentView = 'id_confirmation';
												}}
											>
												<Icon icon="ph:check-bold" class="mr-1.5" width="1rem" height="1rem" />
												Select
											</Button>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				</div>
				
				<Button
					variant="outline"
					class="w-full h-11"
					on:click={() => {
						currentView = 'name_id_search';
						name_id = '';
					}}
				>
					<Icon icon="ph:arrow-left" class="mr-2" width="1.2rem" height="1.2rem" />
					New Search
				</Button>
			</div>

		<!-- NO RESULTS VIEW -->
		{:else if currentView === 'no_results'}
			<div class="flex flex-col items-center justify-center py-16 px-6 space-y-4">
				<div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
					<Icon icon="ph:magnifying-glass" class="text-muted-foreground" width="2rem" height="2rem" />
				</div>
				<div class="text-center space-y-2">
					<h3 class="text-lg font-semibold">No Users Found</h3>
					<p class="text-sm text-muted-foreground max-w-sm">
						We couldn't find any users matching "{name_id}". Try a different search term.
					</p>
				</div>
				<Button 
					variant="outline" 
					on:click={() => {
						currentView = 'name_id_search';
						name_id = '';
					}}
				>
					<Icon icon="ph:arrow-left" class="mr-2" width="1.2rem" height="1.2rem" />
					Try Another Search
				</Button>
			</div>

		<!-- CORRESPONDENCE FORM VIEW -->
		{:else if currentView === 'new_correspondence'}
			<div class="flex flex-col max-h-[90vh]">
				<div class="space-y-2 p-6 pb-4">
					<Dialog.Title class="text-2xl font-semibold tracking-tight">
						Correspondence Details
					</Dialog.Title>
					<Dialog.Description class="text-muted-foreground">
						Provide the new owner's contact information
					</Dialog.Description>
				</div>
				
				<div class="flex-1 overflow-y-auto px-6">
					<div class="space-y-4 pb-4">
						<div class="space-y-2">
							<Label for="corr-name" class="text-sm font-medium">
								Full Name <span class="text-destructive">*</span>
							</Label>
							<Input 
								id="corr-name"
								placeholder="Enter full name" 
								bind:value={newCorrespondence.name}
								class="h-11"
								required
							/>
						</div>
						
						<div class="space-y-2">
							<Label for="corr-email" class="text-sm font-medium">
								Email Address <span class="text-destructive">*</span>
							</Label>
							<Input 
								id="corr-email"
								type="email"
								placeholder="name@example.com" 
								bind:value={newCorrespondence.email}
								class="h-11"
								required
							/>
						</div>
						
						<div class="space-y-2">
							<Label for="corr-phone" class="text-sm font-medium">
								Phone Number <span class="text-destructive">*</span>
							</Label>
							<Input 
								id="corr-phone"
								type="tel"
								placeholder="+234 XXX XXX XXXX" 
								bind:value={newCorrespondence.phone}
								class="h-11"
								required
							/>
						</div>
						
						<div class="space-y-2">
							<Label for="corr-address" class="text-sm font-medium">Address</Label>
							<Textarea
								id="corr-address"
								placeholder="Enter complete address"
								bind:value={newCorrespondence.address}
								class="min-h-[100px] resize-none"
							/>
						</div>
						
						<div class="space-y-2">
							<Label class="text-sm font-medium">State</Label>
							<Popover.Root bind:open={$openCitySelection} let:ids>
								<Popover.Trigger asChild let:builder>
									<Button
										builders={[builder]}
										variant="outline"
										role="combobox"
										aria-expanded={$openCitySelection}
										class="w-full h-11 justify-between font-normal"
									>
										<span class={cn(!newCorrespondence.state && "text-muted-foreground")}>
											{newCorrespondence.state || 'Select a state'}
										</span>
										<Icon
											icon="ph:caret-up-down"
											width="1.2rem"
											height="1.2rem"
											class="opacity-50 shrink-0"
										/>
									</Button>
								</Popover.Trigger>
								<Popover.Content class="w-[var(--radix-popover-trigger-width)] p-0">
									<Command.Root>
										<Command.Input placeholder="Search states..." class="h-11" />
										<Command.Empty>No states found.</Command.Empty>
										<Command.Group class="max-h-[200px] overflow-y-auto">
											{#each nigeriaStates as stateselect}
												<Command.Item
													value={stateselect}
													onSelect={(currentValue) => {
														newCorrespondence.state = currentValue;
														closeCountryAndFocusTrigger(ids.trigger);
													}}
													class="flex items-center"
												>
													<Icon
														icon="ph:check-bold"
														class={cn(
															'mr-2 h-4 w-4 transition-opacity',
															newCorrespondence.state !== stateselect && 'opacity-0'
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
					</div>
				</div>
				
				<div class="flex gap-3 p-6 pt-4 border-t bg-background">
					<Button
						variant="outline"
						class="flex-1 h-11"
						on:click={resetAndClose}
					>
						Cancel
					</Button>
					<Button 
						class="flex-1 h-11" 
						on:click={saveCorr}
						disabled={!newCorrespondence.name || !newCorrespondence.email || !newCorrespondence.phone}
					>
						<Icon icon="ph:floppy-disk-bold" class="mr-2" width="1.2rem" height="1.2rem" />
						Save & Transfer
					</Button>
				</div>
			</div>

		<!-- ERROR VIEW -->
		{:else if currentView === 'error'}
			<div class="flex flex-col items-center justify-center py-16 px-6 space-y-4">
				<div class="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
					<Icon icon="ph:x-circle-bold" class="text-destructive" width="2rem" height="2rem" />
				</div>
				<div class="text-center space-y-2">
					<h3 class="text-lg font-semibold">Operation Failed</h3>
					<p class="text-sm text-muted-foreground max-w-sm">
						We couldn't complete your request. Please check your connection and try again.
					</p>
				</div>
				<Button 
					variant="outline" 
					on:click={() => (currentView = 'name_id_search')}
				>
					<Icon icon="ph:arrow-counter-clockwise" class="mr-2" width="1.2rem" height="1.2rem" />
					Try Again
				</Button>
			</div>

		<!-- SUCCESS VIEW -->
		{:else if currentView === 'success'}
			<div class="flex flex-col items-center justify-center py-16 px-6 space-y-6">
				<div class="relative">
					<div class="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
						<Icon 
							icon="ph:check-circle-bold" 
							class="text-green-600 dark:text-green-500" 
							width="2.5rem" 
							height="2.5rem" 
						/>
					</div>
					<div class="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-green-500 animate-ping opacity-20"></div>
				</div>
				<div class="text-center space-y-2">
					<Dialog.Title class="text-2xl font-semibold tracking-tight">
						Transfer Complete!
					</Dialog.Title>
					<Dialog.Description class="text-muted-foreground max-w-sm">
						File ownership has been successfully transferred to {selectedUser?.firstName ?? ''} {selectedUser?.lastName ?? ''}.
					</Dialog.Description>
				</div>
				<Button
					size="lg"
					class="min-w-[200px] h-11"
					on:click={resetAndClose}
				>
					<Icon icon="ph:check-bold" class="mr-2" width="1.2rem" height="1.2rem" />
					Done
				</Button>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
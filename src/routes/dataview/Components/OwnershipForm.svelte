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
		id: string;
		creatorId?: string;
		firstName?: string;
		lastName?: string;
		name?: string;
		email?: string;
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
			toast.error('Please enter at least 3 characters.', { position: 'top-right' });
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
				userName: $loggedInUser?.firstName + ' ' + $loggedInUser?.lastName,
				userId: $loggedInUser?.creatorId,
				newOwner: selectedUser?.creatorId,
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
	<Dialog.Content class="max-w-2xl max-h-[85vh] overflow-hidden">
		{#if currentView === 'name_id_search'}
			<div class="space-y-6">
				<div class="space-y-2">
					<Dialog.Title class="text-2xl font-semibold">Transfer File Ownership</Dialog.Title>
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
								class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
								width="1.2rem" 
								height="1.2rem" 
							/>
							<Input 
								id="search-input"
								placeholder="Enter name or ID (min 3 characters)" 
								bind:value={name_id} 
								class="pl-10 h-11"
								on:keydown={(e) => e.key === 'Enter' && Search()}
							/>
						</div>
					</div>
					
					<Button on:click={() => Search()} class="w-full h-11" size="lg">
						<Icon icon="ph:magnifying-glass-bold" class="mr-2" width="1.2rem" height="1.2rem" />
						Search Users
					</Button>
				</div>
			</div>
		{:else if currentView === 'loading'}
			<div class="flex flex-col items-center justify-center py-16 space-y-4">
				<div class="relative">
					<div class="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
					<Icon 
						icon="line-md:loading-loop" 
						width="4rem" 
						height="4rem" 
						class="absolute inset-0 text-primary"
					/>
				</div>
				<p class="text-sm text-muted-foreground animate-pulse">Processing your request...</p>
			</div>
		{:else if currentView === 'id_confirmation'}
			<div class="space-y-6">
				<div class="space-y-2">
					<div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-4">
						<Icon icon="ph:warning-bold" class="text-amber-600 dark:text-amber-500" width="1.5rem" height="1.5rem" />
					</div>
					<Dialog.Title class="text-2xl font-semibold">Confirm New Owner</Dialog.Title>
					<Dialog.Description class="text-muted-foreground">
						Please review the selected user before proceeding
					</Dialog.Description>
				</div>
				
				<div class="rounded-lg border bg-muted/50 p-4 space-y-2">
					<div class="flex items-center space-x-3">
						<div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
							<Icon icon="ph:user-bold" class="text-primary" width="1.2rem" height="1.2rem" />
						</div>
						<div>
							<p class="font-semibold">{selectedUser?.firstName} {selectedUser?.lastName}</p>
							<p class="text-sm text-muted-foreground">{selectedUser?.email}</p>
						</div>
					</div>
				</div>
				
				<p class="text-sm text-muted-foreground">
					This action will transfer file ownership to <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>. You'll need to provide correspondence details in the next step.
				</p>
				
				<div class="flex gap-3 pt-2">
					<Button
						variant="outline"
						class="flex-1"
						on:click={() => {
							selectedUser = undefined;
							currentView = 'name_id_search';
						}}
					>
						<Icon icon="ph:arrow-left" class="mr-2" width="1.2rem" height="1.2rem" />
						Back
					</Button>
					<Button class="flex-1" on:click={() => (currentView = 'new_correspondence')}>
						Continue
						<Icon icon="ph:arrow-right" class="ml-2" width="1.2rem" height="1.2rem" />
					</Button>
				</div>
			</div>
		{:else if currentView === 'result'}
			<div class="space-y-6">
				<div class="space-y-2">
					<Dialog.Title class="text-2xl font-semibold">Search Results</Dialog.Title>
					<Dialog.Description class="text-muted-foreground">
						{matchesList?.length || 0} user(s) found matching your search
					</Dialog.Description>
				</div>
				
				<div class="border rounded-lg overflow-hidden">
					<div class="max-h-[400px] overflow-y-auto">
						<Table.Root>
							<Table.Header class="bg-muted/50 sticky top-0">
								<Table.Row>
									<Table.Head class="font-semibold">ID</Table.Head>
									<Table.Head class="font-semibold">Name</Table.Head>
									<Table.Head class="font-semibold">Email</Table.Head>
									<Table.Head class="font-semibold text-right">Action</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each matchesList || [] as option}
									<Table.Row class="hover:bg-muted/50 transition-colors">
										<Table.Cell class="font-mono text-sm">{option.creatorId}</Table.Cell>
										<Table.Cell class="w-64 font-medium">{option.firstName} {option.lastName}</Table.Cell>
										<Table.Cell class="text-muted-foreground">{option.email}</Table.Cell>
										<Table.Cell class="text-right">
											<Button
												size="sm"
												on:click={() => {
													currentView = 'id_confirmation';
													selectedUser = option;
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
					class="w-full"
					on:click={() => (currentView = 'name_id_search')}
				>
					<Icon icon="ph:arrow-left" class="mr-2" width="1.2rem" height="1.2rem" />
					New Search
				</Button>
			</div>
		{:else if currentView === 'new_correspondence'}
			<div class="space-y-6">
				<div class="space-y-2">
					<Dialog.Title class="text-2xl font-semibold">Correspondence Details</Dialog.Title>
					<Dialog.Description class="text-muted-foreground">
						Provide the new owner's contact information
					</Dialog.Description>
				</div>
				
				<div class="space-y-4 max-h-[450px] overflow-y-auto pr-2">
					<div class="space-y-2">
						<Label for="corr-name" class="text-sm font-medium">Full Name</Label>
						<Input 
							id="corr-name"
							placeholder="Enter full name" 
							bind:value={newCorrespondence.name}
							class="h-11"
						/>
					</div>
					
					<div class="space-y-2">
						<Label for="corr-email" class="text-sm font-medium">Email Address</Label>
						<Input 
							id="corr-email"
							type="email"
							placeholder="name@example.com" 
							bind:value={newCorrespondence.email}
							class="h-11"
						/>
					</div>
					
					<div class="space-y-2">
						<Label for="corr-phone" class="text-sm font-medium">Phone Number</Label>
						<Input 
							id="corr-phone"
							type="tel"
							placeholder="+234 XXX XXX XXXX" 
							bind:value={newCorrespondence.phone}
							class="h-11"
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
						<Popover.Root open={$openCitySelection} let:ids>
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
							<Popover.Content class="w-[var(--radix-popover-trigger-width)] p-0 z-50">
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
														'mr-2 h-4 w-4',
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
				
				<div class="flex gap-3 pt-2 border-t">
					<Button
						variant="outline"
						class="flex-1"
						on:click={() => {
							selectedUser = undefined;
							closed();
						}}
					>
						Cancel
					</Button>
					<Button class="flex-1" on:click={() => saveCorr()}>
						<Icon icon="ph:floppy-disk-bold" class="mr-2" width="1.2rem" height="1.2rem" />
						Save & Transfer
					</Button>
				</div>
			</div>
		{:else if currentView === 'error'}
			<div class="flex flex-col items-center justify-center py-12 space-y-4">
				<div class="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
					<Icon icon="ph:x-circle-bold" class="text-destructive" width="2rem" height="2rem" />
				</div>
				<div class="text-center space-y-2">
					<h3 class="text-lg font-semibold">Operation Failed</h3>
					<p class="text-sm text-muted-foreground max-w-sm">
						We couldn't complete your request. Please check your connection and try again.
					</p>
				</div>
				<Button variant="outline" on:click={() => (currentView = 'name_id_search')}>
					<Icon icon="ph:arrow-counter-clockwise" class="mr-2" width="1.2rem" height="1.2rem" />
					Try Again
				</Button>
			</div>
		{:else if currentView === 'success'}
			<div class="flex flex-col items-center justify-center py-12 space-y-6">
				<div class="relative">
					<div class="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
						<Icon icon="ph:check-circle-bold" class="text-green-600 dark:text-green-500" width="2.5rem" height="2.5rem" />
					</div>
					<div class="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center animate-ping opacity-20"></div>
				</div>
				<div class="text-center space-y-2">
					<Dialog.Title class="text-2xl font-semibold">Transfer Complete!</Dialog.Title>
					<Dialog.Description class="text-muted-foreground max-w-sm">
						File ownership has been successfully transferred to {selectedUser?.firstName} {selectedUser?.lastName}.
					</Dialog.Description>
				</div>
				<Button
					size="lg"
					class="min-w-[200px]"
					on:click={() => {
						selectedUser = undefined;
						closed();
					}}
				>
					Done
				</Button>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
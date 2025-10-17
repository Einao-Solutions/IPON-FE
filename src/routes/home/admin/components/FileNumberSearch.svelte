<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Icon from '@iconify/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Card from '$lib/components/ui/card';

	export let open = false;
	export let loading = false;

	const dispatch = createEventDispatcher();

	let fileNumber = '';
	let searchError = '';

	function handleSearch() {
		if (!fileNumber.trim()) {
			searchError = 'Please enter a file number';
			return;
		}

		searchError = '';
		dispatch('search', { fileNumber: fileNumber.trim() });
	}

	function handleClose() {
		fileNumber = '';
		searchError = '';
		open = false;
		dispatch('close');
	}

	// Handle Enter key press
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSearch();
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={handleClose}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Icon icon="mdi:file-search" width="1.5em" height="1.5em" class="text-green-800" />
				Search by File Number
			</Dialog.Title>
			<Dialog.Description>
				Enter the file number to search for associated applications
			</Dialog.Description>
		</Dialog.Header>
		
		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="fileNumber">File Number</Label>
				<Input
					id="fileNumber"
					bind:value={fileNumber}
					on:keydown={handleKeydown}
					placeholder="Enter file number..."
					class="w-full"
					disabled={loading}
				/>
				{#if searchError}
					<p class="text-sm text-red-600" transition:fade={{ duration: 200 }}>
						{searchError}
					</p>
				{/if}
			</div>
		</div>

		<Dialog.Footer class="flex gap-2">
			<Button variant="outline" on:click={handleClose} disabled={loading}>
				Cancel
			</Button>
			<Button on:click={handleSearch} disabled={loading || !fileNumber.trim()}>
				{#if loading}
					<Icon icon="mdi:loading" width="1em" height="1em" class="animate-spin mr-2" />
				{/if}
				Search
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
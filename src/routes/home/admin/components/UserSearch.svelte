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

	let email = '';
	let searchError = '';

	function handleSearch() {
		if (!email.trim()) {
			searchError = 'Please enter an email';
			return;
		}

		searchError = '';
		dispatch('search', { email: email.trim() });
	}

	function handleClose() {
		email = '';
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
				Search by User Email
			</Dialog.Title>
			<Dialog.Description>
				Enter user email to search 
			</Dialog.Description>
		</Dialog.Header>
		
		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="email">Email</Label>
				<Input
					id="email"
					bind:value={email}
					on:keydown={handleKeydown}
					placeholder="Enter email..."
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
			<Button on:click={handleSearch} disabled={loading || !email.trim()}>
				{#if loading}
					<Icon icon="mdi:loading" width="1em" height="1em" class="animate-spin mr-2" />
				{/if}
				Search
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
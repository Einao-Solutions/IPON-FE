<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import * as Dialog from '$lib/components/ui/dialog';

	export let open = false;
	export let user: { email: string; firstName: string; lastName: string; phoneNumber: string } | null = null;
	export let loading = false;
	export let resetSuccess = false;
	export let resetError = '';

	const dispatch = createEventDispatcher();

	function handleResetPassword() {
		if (!user?.email) return;
		dispatch('reset', { email: user.email });
	}

	function handleClose() {
		open = false;
		resetSuccess = false;
		resetError = '';
		dispatch('close');
	}
</script>

<Dialog.Root bind:open onOpenChange={handleClose}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Icon icon="mdi:account-details" width="1.5em" height="1.5em" class="text-green-800" />
				User Details
			</Dialog.Title>
			<Dialog.Description>
				Review user information and reset password
			</Dialog.Description>
		</Dialog.Header>

		{#if user}
			<div class="space-y-4 py-4">
				<div class="grid grid-cols-2 gap-3 text-sm">
					<div class="space-y-1">
						<p class="text-gray-500 font-medium">First Name</p>
						<p class="text-gray-900">{user.firstName || 'N/A'}</p>
					</div>
					<div class="space-y-1">
						<p class="text-gray-500 font-medium">Last Name</p>
						<p class="text-gray-900">{user.lastName || 'N/A'}</p>
					</div>
					<div class="space-y-1 col-span-2">
						<p class="text-gray-500 font-medium">Email</p>
						<p class="text-gray-900">{user.email}</p>
					</div>
					<div class="space-y-1 col-span-2">
						<p class="text-gray-500 font-medium">Phone Number</p>
						<p class="text-gray-900">{user.phoneNumber || 'N/A'}</p>
					</div>
				</div>

				{#if resetSuccess}
					<div class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md" transition:fade={{ duration: 200 }}>
						<Icon icon="mdi:check-circle" width="1.2em" height="1.2em" class="text-green-600" />
						<p class="text-sm text-green-700">Password reset email sent successfully.</p>
					</div>
				{/if}

				{#if resetError}
					<div class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md" transition:fade={{ duration: 200 }}>
						<Icon icon="mdi:alert-circle" width="1.2em" height="1.2em" class="text-red-600" />
						<p class="text-sm text-red-700">{resetError}</p>
					</div>
				{/if}
			</div>

			<Dialog.Footer class="flex gap-2">
				<Button variant="outline" on:click={handleClose} disabled={loading}>
					Close
				</Button>
				<Button variant="destructive" on:click={handleResetPassword} disabled={loading || resetSuccess}>
					{#if loading}
						<Icon icon="mdi:loading" width="1em" height="1em" class="animate-spin mr-2" />
					{/if}
					<Icon icon="mdi:lock-reset" width="1em" height="1em" class="mr-1" />
					Reset Password
				</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>

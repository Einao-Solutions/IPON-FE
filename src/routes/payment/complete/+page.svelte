<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { DashStats, loggedInUser } from '$lib/store';
	import {
		confirmResumedPayment,
		getPaymentApplicationUrl,
		readResumePaymentDetails,
		type ResumePaymentDetails,
	} from '$lib/utils/applicationPayment';
	import { requestOtherApplicationsRefresh } from '$lib/utils/otherApplicationsRefresh';

	let status: 'loading' | 'success' | 'failed' = 'loading';
	let errorMessage = '';
	let details: ResumePaymentDetails | null = null;

	onMount(confirmPayment);

	async function confirmPayment() {
		status = 'loading';
		try {
			details = readResumePaymentDetails($page.url.searchParams);
			const user = $loggedInUser;
			if (!user)
				throw new Error(
					'Please sign in again, then reopen this payment confirmation page.',
				);
			await confirmResumedPayment(details, user);
			DashStats.set(null);
			requestOtherApplicationsRefresh();
			status = 'success';
		} catch (error) {
			console.error('Failed to confirm resumed payment', error);
			errorMessage =
				error instanceof Error
					? error.message
					: 'Could not confirm payment. Please try again.';
			status = 'failed';
		}
	}
</script>

<main class="min-h-screen flex items-center justify-center bg-gray-50 p-6">
	<div
		class="w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center space-y-6"
	>
		{#if status === 'loading'}
			<h1 class="text-2xl font-semibold">Confirming payment</h1>
			<p role="status">
				Verifying your payment and updating the application...
			</p>
		{:else if status === 'success'}
			<h1 class="text-2xl font-semibold text-green-700">Payment Successful</h1>
			<p>
				Your payment has been confirmed and the application has been updated.
			</p>
		{:else}
			<h1 class="text-2xl font-semibold text-red-600">Payment Not Confirmed</h1>
			<p role="alert">{errorMessage}</p>
			<Button on:click={confirmPayment}>Retry Confirmation</Button>
		{/if}
		{#if status !== 'loading'}
			<div class="flex flex-col gap-3">
				{#if details}
					<Button
						on:click={() => details && goto(getPaymentApplicationUrl(details))}
					>
						View Application
					</Button>
				{/if}
				<Button variant="outline" on:click={() => goto('/home/dashboard')}
					>Go to Dashboard</Button
				>
			</div>
		{/if}
	</div>
</main>

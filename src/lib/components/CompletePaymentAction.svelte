<script lang="ts">
	import { goto } from '$app/navigation';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { toast } from 'svelte-sonner';
	import {
		getResumePaymentUrl,
		isAwaitingApplicationPayment,
		type PendingPaymentApplication,
	} from '$lib/utils/applicationPayment';

	export let application: PendingPaymentApplication;
	let redirecting = false;

	async function completePayment() {
		if (redirecting) return;
		redirecting = true;
		try {
			await goto(getResumePaymentUrl(application));
		} catch (error) {
			console.error('Failed to resume application payment', error);
			toast.error(
				error instanceof Error
					? error.message
					: 'Could not start payment. Please try again.',
			);
		} finally {
			redirecting = false;
		}
	}
</script>

{#if isAwaitingApplicationPayment(application.status)}
	<DropdownMenu.Item disabled={redirecting} on:click={completePayment}>
		{redirecting ? 'Opening payment...' : 'Complete Payment'}
	</DropdownMenu.Item>
{/if}

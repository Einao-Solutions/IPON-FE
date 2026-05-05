<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { baseURL } from '$lib/helpers';
	import { toast } from 'svelte-sonner';
	import ministry from '$lib/assets/ministry.png';
	import cldLogo from '$lib/assets/cld.png';
	let checkVisible = false;
	let messageVisible = false;
	let subMessageVisible = false;
	let isStatusUpdating: boolean = true;
	let paymentId: string | null;

	onMount(async () => {
		setTimeout(() => { checkVisible = true; }, 300);
		setTimeout(() => { messageVisible = true; }, 1000);
		setTimeout(() => { subMessageVisible = true; }, 1800);

		const rrr = $page.url.searchParams.get('rrr') ?? localStorage.getItem('rrr') ?? undefined;
		paymentId = rrr ?? null;

		await updateCounterStatementPayment(paymentId);
	});

	async function updateCounterStatementPayment(paymentId: string | null) {
		if (!paymentId) {
			toast.error('Payment ID is missing.');
			isStatusUpdating = false;
			return;
		}
		const result = await fetch(
			`${baseURL}/api/opposition/UpdateCounterStatementPayment?paymentId=${paymentId}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status: 'success',
					transactionRef: paymentId,
					amount: 11500
				})
			}
		);
		if (result.ok) {
			checkVisible = true;
			messageVisible = true;
			subMessageVisible = true;
			sessionStorage.removeItem('counterStatementPayload');
		} else {
			const error = await result.json();
			toast.error(`Error updating status: ${error.message}`);
		}
		isStatusUpdating = false;
	}
</script>

<main class="flex justify-center items-center min-h-screen bg-gray-50">
	<div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
		<div class="mb-8 text-center">
			<img src={cldLogo} alt="Nigerian Coat of Arms" class="mx-auto w-32 h-32" />
			<h2 class="text-lg font-bold">FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT</h2>
			<h3 class="text-md">Commercial Law Department</h3>
		</div>

		<h1 class="text-3xl font-bold text-gray-900 mb-8 text-center">Counter Statement</h1>

		<div class="h-32 w-32 mx-auto mb-6 relative">
			{#if checkVisible}
				<div
					class="h-full w-full bg-green-50 rounded-full flex justify-center items-center"
					in:fade={{ duration: 400 }}
				>
					<svg class="w-16 h-16 text-green-500" viewBox="0 0 24 24">
						<path
							class="checkmark-path"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M5 13l4 4L19 7"
						>
						</path>
					</svg>
				</div>
			{/if}
		</div>

		{#if messageVisible}
			<h1 class="text-3xl font-bold text-gray-900 mt-2 mb-4" in:fly={{ y: 20, duration: 500 }}>
				Payment Successful
			</h1>
		{/if}

		{#if subMessageVisible}
			<p
				class="text-base font-medium text-gray-600 mb-8 max-w-xs mx-auto"
				in:fly={{ y: 15, duration: 500 }}
			>
				YOUR APPLICATION HAS BEEN RECEIVED AND IS RECEIVING DUE ATTENTION
			</p>

			<div class="mt-4 flex flex-col gap-3" in:fade={{ duration: 300, delay: 300 }}>
				<a href="https://www.iponigeria.com" target="_blank" rel="noopener noreferrer">
					<button
						class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200"
					>
						Return to IPO Nigeria
					</button>
				</a>
				<button
					on:click={() => goto('/home/dashboard')}
					class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-md transition-colors duration-200"
				>
						Go to Dashboard
				</button>
			</div>
		{/if}
		<img
			src={ministry}
			alt="Nigerian Coat of Arms"
			class="mx-auto object-contain w-40 h-auto py-10"
		/>
	</div>
</main>

<style>
	.checkmark-path {
		stroke-dasharray: 80;
		stroke-dashoffset: 80;
		animation: checkmark 0.8s ease-in-out forwards;
	}

	@keyframes checkmark {
		0% {
			stroke-dashoffset: 80;
		}
		100% {
			stroke-dashoffset: 0;
		}
	}
</style>

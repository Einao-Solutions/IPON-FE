<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import coatOfArms from '$lib/assets/logo.png';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { applicationData, DashStats, loggedInUser } from '$lib/store';
	import { baseURL, decodeUser, type ApplicationHistoryType } from '$lib/helpers';
	import { toast } from 'svelte-sonner';
	import { packSiblings } from 'd3';
	let checkVisible = false;
	let messageVisible = false;
	let subMessageVisible = false;
	let isStatusUpdating: boolean = true;
	let code: string;
	let paymentType: string;
	let orderID: string;
	let receiptUrl: string | null;
	let ackUrl: string | null;
	let fileId: string | null;
	let applicationId: string | null;
	let fileType: number | null;
	let userName: string | null;
	let userId: string | null;
	let paymentId: string | null;
	let title: string | null;
	let applicantName: string | null;
	let amount: string | null;
	let patentChangeType: string | null;
	let simulate = false;

	onMount(async () => {
		setTimeout(() => {
			checkVisible = true;
		}, 300);
		setTimeout(() => {
			messageVisible = true;
		}, 1000);
		setTimeout(() => {
			subMessageVisible = true;
		}, 1800);

		const rrr = localStorage.getItem('rrr') ?? undefined;
		paymentId = rrr ?? null;
		console.log('Updating status for opposition payment');
		await updateOppositionPayment(paymentId);
	});

	async function updateOppositionPayment(paymentId: string | null) {
		if (!paymentId) {
			toast.error('Payment ID is missing.');
			isStatusUpdating = false;
			return;
		}

		console.log('Updating opposition payment status...');
		const result = await fetch(
			`${baseURL}/api/opposition/UpdateOppositionPayment?paymentId=${paymentId}`,
			{ method: 'POST' }
		);
		if (result.ok) {
			checkVisible = true;
			messageVisible = true;
			subMessageVisible = true;
		}
		if (!result.ok) {
			const error = await result.json();
			toast.error(`Error updating status: ${error.message}`);
			isStatusUpdating = false;
			return;
		}

		isStatusUpdating = false;
	}
</script>

<main class="flex justify-center items-center min-h-screen bg-gray-50">
	<div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
		<div class="mb-8 text-center">
			<img src={coatOfArms} alt="Nigerian Coat of Arms" class="mx-auto w-32 h-32" />
			<h2 class="text-lg font-bold">FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT</h2>
			<h3 class="text-md">Commercial Law Department</h3>
		</div>

		<h1 class="text-3xl font-bold text-gray-900 mb-8 text-center">File Opposition</h1>

		<div class="h-32 w-32 mx-auto mb-6 relative">
			{#if (checkVisible = true)}
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

			<div class="mt-4" in:fade={{ duration: 300, delay: 300 }}>
				<!-- svelte-ignore a11y-missing-attribute -->
				<a href="https://www.iponigeria.com" target="_blank" rel="noopener noreferrer">
					<button
						class="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200"
					>
						Return to IPO Nigeria
					</button>
				</a>
			</div>
		{/if}
	</div>
</main>

<style>
	/* SVG checkmark animation */
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

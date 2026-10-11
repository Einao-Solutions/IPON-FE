<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { loggedInUser } from '$lib/store';
	import { requestOtherApplicationsRefresh } from '$lib/utils/otherApplicationsRefresh';
	import {
		confirmAvailabilitySearchPayment,
		getLatestPendingAvailabilitySearchRrr,
		getPendingAvailabilitySearchAppId,
		readRrrFromParams
	} from '$lib/utils/availabilitySearchPayment';
	import { parseLoggedInUser } from '../../dataview/datahelpers';
	import cldLogo from '$lib/assets/cld.png';
	import ministry from '$lib/assets/ministry.png';

	// Like the opposition paid page, reaching this page with an RRR is the success signal.
	// The backend record is updated in the background; Other Applications retries if that lags.
	let status: 'loading' | 'success' | 'failed' = 'loading';
	let errorMessage: string | null = null;
	let paymentId: string | null = null;
	let isRecording = false;

	const AUTO_RETRY_ATTEMPTS = 3;
	const AUTO_RETRY_DELAY_MS = 2000;

	onMount(async () => {
		if (!$loggedInUser) {
			const user = parseLoggedInUser(document.cookie);
			if (!user) {
				await goto('/auth');
				return;
			}
			loggedInUser.set(user);
		}

		paymentId = readRrrFromParams($page.url.searchParams) ?? getLatestPendingAvailabilitySearchRrr();
		if (!paymentId) {
			errorMessage = 'Payment ID is missing.';
			status = 'failed';
			return;
		}

		status = 'success';
		await recordPayment();
	});

	function readAppId(rrr: string): string | null {
		const fromUrl = $page.url.searchParams.get('appId');
		if (fromUrl) return fromUrl;
		const stored = getPendingAvailabilitySearchAppId(rrr);
		if (stored) return stored;
		try {
			return JSON.parse(sessionStorage.getItem('searchParams') ?? 'null')?.appId ?? null;
		} catch {
			return null;
		}
	}

	// Asks the backend to mark the search paid (Auto Approved). A 400 is retried a few times because
	// Remita's own status check can briefly lag after the redirect.
	async function recordPayment() {
		if (isRecording || !paymentId) return;
		isRecording = true;

		try {
			for (let attempt = 1; attempt <= AUTO_RETRY_ATTEMPTS; attempt++) {
				const result = await confirmAvailabilitySearchPayment(paymentId, readAppId(paymentId));

				if (result.outcome === 'confirmed') {
					requestOtherApplicationsRefresh();
					return;
				}
				if (result.outcome !== 'pending') {
					console.warn('Availability search payment was not recorded:', result.message);
					return;
				}
				if (attempt < AUTO_RETRY_ATTEMPTS) {
					await new Promise((resolve) => setTimeout(resolve, AUTO_RETRY_DELAY_MS));
				}
			}
			console.warn('Availability search payment was not recorded: backend says payment not confirmed');
		} finally {
			isRecording = false;
		}
	}
</script>

<main class="flex justify-center items-center min-h-screen bg-gray-50">
	<div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
		<div class="mb-8 text-center">
			<img src={cldLogo} alt="Nigerian Coat of Arms" class="mx-auto w-32 h-32" />
			<h2 class="text-lg font-bold">FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT</h2>
			<h3 class="text-md">Commercial Law Department</h3>
		</div>

		<h1 class="text-3xl font-bold text-gray-900 mb-8 text-center">Availability Search</h1>

		{#if status === 'loading'}
			<p class="text-base font-medium text-gray-600 mb-8">Loading...</p>
		{:else if status === 'success'}
			<div class="h-32 w-32 mx-auto mb-6">
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
						/>
					</svg>
				</div>
			</div>
			<h1 class="text-3xl font-bold text-gray-900 mt-2 mb-4" in:fly={{ y: 20, duration: 500 }}>
				Payment Successful
			</h1>
			<p
				class="text-base font-medium text-gray-600 mb-8 max-w-xs mx-auto"
				in:fly={{ y: 15, duration: 500 }}
			>
				YOUR AVAILABILITY SEARCH PAYMENT HAS BEEN RECEIVED
			</p>
		{:else}
			<h1 class="text-3xl font-bold text-red-600 mt-2 mb-4">Payment Not Confirmed</h1>
			<p class="text-base font-medium text-gray-600 mb-8 max-w-xs mx-auto">
				{errorMessage ?? 'We could not confirm your payment.'}
			</p>
		{/if}

		{#if status !== 'loading'}
			<div class="mt-4 flex flex-col gap-3" in:fade={{ duration: 300, delay: 300 }}>
				{#if status === 'success'}
					<button
						on:click={() => goto('/availabilitysearch')}
						class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200"
					>
						View Search Results
					</button>
				{/if}
				<button
					on:click={() => goto('/home/other-applications?tab=availabilitysearch')}
					class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-md transition-colors duration-200"
				>
					View in Other Applications
				</button>
				<button
					on:click={() => goto('/home/dashboard')}
					class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-md transition-colors duration-200"
				>
					Go to Dashboard
				</button>
			</div>
		{/if}
		<img src={ministry} alt="Ministry" class="mx-auto object-contain w-40 h-auto py-10" />
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

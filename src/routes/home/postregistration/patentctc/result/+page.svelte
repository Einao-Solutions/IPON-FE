<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { baseURL } from '$lib/helpers';
	import { toast } from 'svelte-sonner';

	let checkVisible = false;
	let messageVisible = false;
	let subMessageVisible = false;
	let isLoading = true;
	let submissionSuccess = false;
	let submissionError: string | null = null;

	let paymentId: string | null = null;
	let fileId: string | null = null;
	let amount: string | null = null;

	onMount(async () => {
		// Extract query parameters
		paymentId = $page.url.searchParams.get('rrr');
		fileId = $page.url.searchParams.get('fileId');
		amount = $page.url.searchParams.get('amount');

		// Submit the form data to backend
		await submitToBackend();
		
		isLoading = false;

		// Start animations if successful
		if (submissionSuccess) {
			setTimeout(() => {
				checkVisible = true;
			}, 300);
			setTimeout(() => {
				messageVisible = true;
			}, 1000);
			setTimeout(() => {
				subMessageVisible = true;
			}, 1800);
		}
	});

	async function submitToBackend() {
		try {
			const payloadData = sessionStorage.getItem('patentCTCPayload');
			if (!payloadData) {
				submissionError = 'No form data found. Please try again.';
				return;
			}

			const payload = JSON.parse(payloadData);

			const response = await fetch(`${baseURL}/api/files/PatentCTCApplication`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			const result = await response.json();

			if (!response.ok) {
				submissionError = result.message || 'Submission failed.';
				toast.error(`Submission failed: ${submissionError}`);
				return;
			}

			submissionSuccess = true;
			
			// Clear the stored data after successful submission
			sessionStorage.removeItem('patentCTCPayload');
			
			// Store success data for potential future reference
			localStorage.setItem('patentCTCSubmission', JSON.stringify({
				submissionDate: new Date().toISOString(),
				fileId: fileId,
				rrr: paymentId,
				amount: amount,
				success: true
			}));

			toast.success('Patent CTC application submitted successfully!');

		} catch (err) {
			submissionError = 'Form submission failed. Please try again.';
			toast.error(`Submission error: ${submissionError}`);
			console.error('Submission error:', err);
		}
	}

	function goToDashboard() {
		goto('/home/dashboard');
	}

	function goToPostRegistration() {
		goto('/home/postregistration');
	}

	function printPage() {
		window.print();
	}
</script>

<svelte:head>
	<title>Patent CTC Application - Submission Result</title>
</svelte:head>

{#if isLoading}
	<main class="flex justify-center items-center min-h-screen bg-gray-50">
		<div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
			<div class="h-32 w-32 mx-auto mb-6 relative">
				<div class="h-full w-full bg-blue-50 rounded-full flex justify-center items-center">
					<svg class="w-16 h-16 text-blue-500 animate-spin" viewBox="0 0 24 24">
						<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="32" stroke-linecap="round"/>
					</svg>
				</div>
			</div>
			<h1 class="text-2xl font-bold text-gray-900 mb-4">Processing Application</h1>
			<p class="text-gray-600">Submitting your patent CTC application...</p>
		</div>
	</main>
{:else if submissionError}
	<main class="flex justify-center items-center min-h-screen bg-gray-50">
		<div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
			<div class="h-32 w-32 mx-auto mb-6 relative">
				<div class="h-full w-full bg-red-50 rounded-full flex justify-center items-center">
					<svg class="w-16 h-16 text-red-500" viewBox="0 0 24 24">
						<path fill="currentColor" d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
					</svg>
				</div>
			</div>
			<h1 class="text-2xl font-bold text-gray-900 mb-4">Submission Failed</h1>
			<p class="text-gray-600 mb-6">{submissionError}</p>
			<button
				class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200 mr-3"
				on:click={() => goto('/home/postregistration/patentctc')}
			>
				Try Again
			</button>
			<button
				class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200"
				on:click={goToDashboard}
			>
				Dashboard
			</button>
		</div>
	</main>
{:else if submissionSuccess}
	<main class="flex justify-center items-center min-h-screen bg-gray-50">
		<div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
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
					Application Submitted
				</h1>
			{/if}

			{#if subMessageVisible}
				<p
					class="text-base font-medium text-gray-600 mb-8 max-w-xs mx-auto"
					in:fly={{ y: 15, duration: 500 }}
				>
					YOUR PATENT CERTIFIED TRUE COPY (CTC) APPLICATION HAS BEEN RECEIVED AND IS RECEIVING DUE ATTENTION
				</p>

				<div class="mt-4 space-x-3" in:fade={{ duration: 300, delay: 300 }}>
					<button
						class="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200"
						on:click={goToDashboard}
					>
						Return to Dashboard
					</button>
				</div>
			{/if}
		</div>
	</main>
{/if}

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

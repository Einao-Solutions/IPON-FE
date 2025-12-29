<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index';
	import Icon from '@iconify/svelte';

	let paymentId: string | null = null;
	let paymentType: string | null = null;
	let fileId: string | null = null;
	let amount: string | null = null;
	let applicantName: string | null = null;
	let isLoading = true;
	let submissionDate: string = '';

	onMount(() => {
		// Extract query parameters
		paymentId = $page.url.searchParams.get('rrr');
		paymentType = $page.url.searchParams.get('paymentType');
		fileId = $page.url.searchParams.get('fileId');
		amount = $page.url.searchParams.get('amount');
		applicantName = $page.url.searchParams.get('applicantName');

		// Set submission date to current date
		submissionDate = new Date().toLocaleDateString('en-GB', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
        
		isLoading = false;
	});

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
	<title>Patent Assignment Application - Payment Successful</title>
	<style>
		@media print {
			.no-print { display: none !important; }
			.print-only { display: block !important; }
		}
		.print-only { display: none; }
	</style>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8 px-4">
	<div class="max-w-4xl mx-auto">
		{#if isLoading}
			<div class="flex items-center justify-center p-12">
				<div class="flex flex-col items-center gap-3">
					<Icon icon="line-md:loading-loop" width="2.5rem" height="2.5rem" class="text-blue-600" />
					<span class="text-gray-600">Processing payment confirmation...</span>
				</div>
			</div>
		{:else}
			<!-- Success Header -->
			<div class="text-center mb-8">
				<div class="flex justify-center mb-4">
					<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
						<Icon icon="lucide:check" width="2rem" height="2rem" class="text-green-600" />
					</div>
				</div>
				<h1 class="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
				<p class="text-gray-600">Your patent assignment application has been submitted successfully.</p>
			</div>

			<!-- Payment Details Card -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
				<div class="bg-green-50 px-6 py-4 border-b border-green-200">
					<h2 class="text-lg font-semibold text-green-800">Patent Assignment Application Confirmation</h2>
				</div>
				
				<div class="p-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<!-- Payment Information -->
						<div class="space-y-4">
							<h3 class="font-semibold text-gray-900 border-b pb-2">Payment Information</h3>
							<div class="space-y-3">
								<div class="flex justify-between">
									<span class="text-gray-600">Payment Reference (RRR):</span>
									<span class="font-mono font-medium">{paymentId || 'N/A'}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-600">Amount Paid:</span>
									<span class="font-medium text-green-600">₦{amount ? Number(amount).toLocaleString() : 'N/A'}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-600">Payment Date:</span>
									<span class="font-medium">{submissionDate}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-600">Service Type:</span>
									<span class="font-medium">Patent Assignment Application</span>
								</div>
							</div>
						</div>

						<!-- Application Details -->
						<div class="space-y-4">
							<h3 class="font-semibold text-gray-900 border-b pb-2">Application Details</h3>
							<div class="space-y-3">
								<div class="flex justify-between">
									<span class="text-gray-600">Patent File ID:</span>
									<span class="font-mono font-medium">{fileId || 'N/A'}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-600">Applicant:</span>
									<span class="font-medium">{applicantName || 'N/A'}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-600">Submission Date:</span>
									<span class="font-medium">{submissionDate}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-600">Status:</span>
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
										Payment Completed
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Important Information -->
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
				<div class="flex items-start gap-3">
					<Icon icon="lucide:info" width="1.25rem" height="1.25rem" class="text-blue-600 mt-0.5" />
					<div>
						<h3 class="font-semibold text-blue-900 mb-2">Important Information</h3>
						<ul class="text-sm text-blue-800 space-y-1">
							<li>• Your patent assignment application has been successfully submitted and payment confirmed.</li>
							<li>• The assignment documents you uploaded are now being processed by our office.</li>
							<li>• You will receive email notifications about the progress of your application.</li>
							<li>• Please keep your payment reference (RRR) number for your records.</li>
							<li>• Processing time is typically 5-10 business days depending on document complexity.</li>
						</ul>
					</div>
				</div>
			</div>

			<!-- Next Steps -->
			<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
				<div class="flex items-start gap-3">
					<Icon icon="lucide:clock" width="1.25rem" height="1.25rem" class="text-yellow-600 mt-0.5" />
					<div>
						<h3 class="font-semibold text-yellow-900 mb-2">What's Next?</h3>
						<ol class="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
							<li>Our patent office will review your assignment documents for completeness.</li>
							<li>If additional documents are required, you will be notified via email.</li>
							<li>Once approved, the patent assignment will be recorded in our records.</li>
							<li>You will receive a confirmation certificate upon successful completion.</li>
							<li>The updated patent ownership will be reflected in our public database.</li>
						</ol>
					</div>
				</div>
			</div>

			<!-- Print Receipt (visible when printing) -->
			<div class="print-only bg-white p-8 mb-6">
				<div class="text-center mb-6 border-b pb-4">
					<h1 class="text-2xl font-bold">Patent Assignment Application Receipt</h1>
					<p class="text-gray-600">Payment Confirmation</p>
				</div>
				
				<div class="grid grid-cols-2 gap-8">
					<div>
						<h3 class="font-semibold mb-3">Payment Details</h3>
						<p><strong>RRR:</strong> {paymentId}</p>
						<p><strong>Amount:</strong> ₦{amount ? Number(amount).toLocaleString() : 'N/A'}</p>
						<p><strong>Date:</strong> {submissionDate}</p>
					</div>
					<div>
						<h3 class="font-semibold mb-3">Application Details</h3>
						<p><strong>Patent File ID:</strong> {fileId}</p>
						<p><strong>Applicant:</strong> {applicantName}</p>
						<p><strong>Service:</strong> Patent Assignment Application</p>
					</div>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="flex flex-col sm:flex-row gap-4 justify-center no-print">
				<Button on:click={printPage} variant="outline" class="flex items-center gap-2">
					<Icon icon="lucide:printer" width="1rem" height="1rem" />
					Print Receipt
				</Button>
				
				<Button on:click={goToPostRegistration} variant="outline" class="flex items-center gap-2">
					<Icon icon="lucide:file-text" width="1rem" height="1rem" />
					Post-Registration Services
				</Button>
				
				<Button on:click={goToDashboard} class="flex items-center gap-2">
					<Icon icon="lucide:home" width="1rem" height="1rem" />
					Back to Dashboard
				</Button>
			</div>
		{/if}
	</div>
</div>

<style>
	@media print {
		.min-h-screen { min-height: auto; }
		.bg-gray-50 { background: white !important; }
		.shadow-sm { box-shadow: none !important; }
	}
</style>

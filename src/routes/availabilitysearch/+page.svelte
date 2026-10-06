<script lang="ts">
	import { Label } from '$lib/components/ui/label/index';
	import * as Table from '$lib/components/ui/table/index';
	import { Button } from '$lib/components/ui/button/index';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { baseURL, normalizeImageUrl, UserRoles } from '$lib/helpers';
	import { Cell } from '$lib/components/ui/calendar';
	import { mapDateToString } from '../home/components/dashboardutils';
	import { loggedInUser, loggedInToken } from '$lib/store';
	import { Toaster } from '$lib/components/ui/sonner';
	import { toast } from 'svelte-sonner';
	import { requestOtherApplicationsRefresh } from '$lib/utils/otherApplicationsRefresh';
	import { parseLoggedInUser } from '../dataview/datahelpers';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';

	interface SearchResult {
		titleOfTradeMark: string;
		tradeMarkClass: string | null;
		trademarkType: number; // 1 = Foreign, 0 = Local
		fileApplicant: string | null;
		filingDate: string;
		tradeMarkLogo: string | null;
		fileId: string | null;
		fileStatus: string | null;
		logoUrl: string;
		similarity: number;
	}

	let results: SearchResult[] = [];
	let isLoading = true;
	let error: string | null = null;
	let paymentConfirmationError: string | null = null;
	let searchParams: {
		query: string;
		classId?: number;
		fileType: string;
		appId?: string;
	} | null = null;
	let fileNumber: string | null = null;
	let viewMode: 'list' | 'grid' = 'list'; // New state for view toggle

	onMount(async () => {
		try {
			// Retrieve search parameters from sessionStorage
			const storedParams = sessionStorage.getItem('searchParams');
			searchParams = storedParams ? JSON.parse(storedParams) : null;
			
			// Retrieve saved view mode from localStorage
			const savedViewMode = localStorage.getItem('searchResultsViewMode');
			if (savedViewMode === 'grid' || savedViewMode === 'list') {
				viewMode = savedViewMode;
			}

			if (!$loggedInUser) {
				const user = parseLoggedInUser(document.cookie);
				if (!user) {
					await goto('/auth');
					return;
				}
				loggedInUser.set(user);
			}

			const rrr = $page.url.searchParams.get('rrr');
			const appId = $page.url.searchParams.get('appId') ?? searchParams?.appId ?? null;

			if (searchParams) {
				const params = new URLSearchParams({
					title: searchParams.query,
					classNo: searchParams.classId?.toString() ?? '',
					type: searchParams.fileType
				});
				const response = await fetch(
					`${baseURL}/api/files/GetAvailabilitySearch?${params.toString()}`
				);

				if (response.ok) {
					results = await response.json();
					if (rrr && appId && $loggedInUser?.id) {
						try {
							await confirmAvailabilitySearchPayment(appId, $loggedInUser.id);
							paymentConfirmationError = null;
							toast.success(
								'Payment confirmed. A confirmation email has been sent to your registered address.'
							);
							requestOtherApplicationsRefresh();
						} catch (err) {
							console.error('Availability search payment confirmation failed:', err);
							const reason = err instanceof Error ? err.message : '';
							paymentConfirmationError = `Search results loaded, but the payment could not be confirmed${
								reason ? `: ${reason}` : '.'
							}`;
						}
					} else if (rrr) {
						console.warn(
							'Availability search payment confirmation skipped: application ID or logged-in user is missing.'
						);
						paymentConfirmationError =
							'Search results loaded, but payment status could not be updated. Please refresh Other Applications later.';
					}
				} else {
					error = 'Failed to fetch search results';
				}
			} else {
				error = 'Search parameters are missing';
			}
		} catch (err) {
			console.error('Error fetching search results:', err);
			error = 'An error occurred while fetching search results';
		} finally {
			isLoading = false;
		}
	});

	class NonRetryableConfirmationError extends Error {}

	// Retries because Remita's own status check can briefly lag right after the redirect back
	async function confirmAvailabilitySearchPayment(appId: string, userId: string): Promise<void> {
		const maxAttempts = 3;
		let lastError = 'Payment confirmation failed. Please retry.';
		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				const res = await fetch(`${baseURL}/api/files/UpdateAvailabilitySearchPayment`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${$loggedInToken}`
					},
					body: JSON.stringify({ appId, userId })
				});
				const body = await res.json().catch(() => null);
				if (res.ok && body?.success) {
					return;
				}
				if (res.status === 401) {
					throw new NonRetryableConfirmationError('Session expired, please log in again.');
				}
				if (res.status === 403) {
					throw new NonRetryableConfirmationError('You are not allowed to confirm this payment.');
				}
				lastError =
					typeof body?.message === 'string' && body.message
						? body.message
						: `Payment confirmation failed (${res.status}).`;
			} catch (err) {
				if (err instanceof NonRetryableConfirmationError) throw err;
				console.error(`Availability search payment confirmation attempt ${attempt} errored:`, err);
				lastError = err instanceof Error ? err.message : 'Payment confirmation request failed.';
			}
			if (attempt < maxAttempts) {
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}
		}
		throw new Error(lastError);
	}

	function goBack() {
		window.history.back();
	}

	function toggleView(mode: 'list' | 'grid') {
		viewMode = mode;
		// Save view preference to localStorage
		localStorage.setItem('searchResultsViewMode', mode);
	}

	function getSimilarityColor(similarity: number): string {
		if (similarity >= 80) return 'bg-red-100 text-red-800 border-red-200';
		if (similarity >= 60) return 'bg-orange-100 text-orange-800 border-orange-200';
		if (similarity >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		return 'bg-green-100 text-green-800 border-green-200';
	}

	function handlePrint() {
		// Add a class to body to indicate print mode
		document.body.classList.add('printing');
		
		// Trigger print
		window.print();
		
		// Remove the class after print dialog closes (small delay)
		setTimeout(() => {
			document.body.classList.remove('printing');
		}, 1000);
	}

	function getCurrentDate(): string {
		return new Date().toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="space-y-4 m-4 p-2">
	<!-- Header with Back Button and Title -->
	<div class="flex items-center justify-between no-print">
		<Button variant="outline" on:click={goBack} class="flex items-center gap-2">
			<Icon icon="lucide:arrow-left" width="1rem" height="1rem" />
			Back
		</Button>
		<h1 class="text-xl font-semibold">Availability Search Results</h1>
		<div></div>
	</div>

	<!-- Print Header (Only visible when printing) -->
	<div class="print-only print-header">
		<div class="text-center mb-6">
			<h1 class="text-2xl font-bold mb-2">Trademark Availability Search Results</h1>
			<p class="text-sm text-gray-600">Generated on {getCurrentDate()}</p>
		</div>
	</div>

	<!-- Search Criteria Display -->
	{#if searchParams}
		<div class="bg-gray-50 p-4 rounded-md mb-4 print-search-criteria">
			<h2 class="text-sm font-medium text-gray-500 mb-2">Search Criteria</h2>
			<div class="flex flex-wrap gap-4">
				{#if searchParams.query}
					<div class="flex items-center gap-2">
						<span class="text-sm font-medium">Term:</span>
						<span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded"
							>{searchParams.query}</span
						>
					</div>
				{/if}
				{#if searchParams.classId}
					<div class="flex items-center gap-2">
						<span class="text-sm font-medium">Class:</span>
						<span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded"
							>{searchParams.classId}</span
						>
					</div>
				{/if}
				{#if searchParams.fileType}
					<div class="flex items-center gap-2">
						<span class="text-sm font-medium">Type:</span>
						<span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded"
							>{searchParams.fileType === '1' ? 'Foreign' : 'Local'}</span
						>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if paymentConfirmationError}
		<div class="bg-amber-50 text-amber-800 p-4 rounded-md" role="status">
			<p>{paymentConfirmationError}</p>
		</div>
	{/if}

	<!-- View Toggle Controls and Print Button -->
	{#if results.length > 0 && !isLoading && !error}
		<div class="flex items-center justify-between mb-4 no-print">
			<div class="flex items-center gap-2">
				<span class="text-sm text-gray-600">Found {results.length} result{results.length !== 1 ? 's' : ''}</span>
			</div>
			<div class="flex items-center gap-3">
				<!-- Print Button -->
				<Button
					variant="outline"
					size="sm"
					on:click={handlePrint}
					class="flex items-center gap-2 px-3 py-1.5 text-sm"
				>
					<Icon icon="lucide:printer" width="1rem" height="1rem" />
					Print
				</Button>
				
				<!-- View Toggle -->
				<div class="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
					<Button
						variant={viewMode === 'list' ? 'default' : 'ghost'}
						size="sm"
						on:click={() => toggleView('list')}
						class="flex items-center gap-2 px-3 py-1.5 text-sm transition-all duration-200"
					>
						<Icon icon="lucide:list" width="1rem" height="1rem" />
						List
					</Button>
					<Button
						variant={viewMode === 'grid' ? 'default' : 'ghost'}
						size="sm"
						on:click={() => toggleView('grid')}
						class="flex items-center gap-2 px-3 py-1.5 text-sm transition-all duration-200"
					>
						<Icon icon="lucide:grid-3x3" width="1rem" height="1rem" />
						Grid
					</Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Loading State -->
	{#if isLoading}
		<div class="flex items-center justify-center p-12">
			<div class="flex flex-col items-center gap-2">
				<Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" />
				<span class="text-sm text-gray-500">Loading results...</span>
			</div>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="bg-red-50 text-red-600 p-4 rounded-md text-center">
			<p>{error}</p>
		</div>
	{:else if results.length === 0}
		<!-- No Similarity State -->
		<div
			class="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 px-6 py-8 text-center text-white shadow-lg"
			role="status"
		>
			<span class="balloon balloon-left" aria-hidden="true">🎈</span>
			<span class="balloon balloon-right" aria-hidden="true">🎈</span>
			<div class="text-4xl mb-3" aria-hidden="true">🎈🎉🎈</div>
			<h3 class="text-xl font-extrabold uppercase tracking-wide sm:text-2xl">
				Congratulations! There is no similarity to the search title on the portal
			</h3>
			{#if searchParams?.query}
				<p class="mt-3 text-sm text-green-50">
					Search title: <span class="rounded bg-white/20 px-2 py-0.5 font-semibold">{searchParams.query}</span>
				</p>
			{/if}
		</div>
	{:else}
		<!-- Results Display -->
		<div class="transition-all duration-300 ease-in-out">
			{#if viewMode === 'list'}
				<!-- List View (Table) -->
				<div class="bg-white rounded-md shadow overflow-hidden print-table">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="w-16">S/N</Table.Head>
								{#if $loggedInUser?.userRoles?.some( (x) => [UserRoles.Staff, UserRoles.Tech].includes(x) )}
									<Table.Head>File Number</Table.Head>
								{/if}
								<Table.Head>File Title</Table.Head>
								<Table.Head class="w-32">% Similarity</Table.Head>
								<Table.Head class="w-48">File Applicant</Table.Head>
								<Table.Head class="w-32">Filing Date</Table.Head>
								<Table.Head class="w-24">Class</Table.Head>
								<Table.Head class="w-32">File Type</Table.Head>
								<Table.Head class="w-32">Representation</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each results as result, index}
								<Table.Row class="hover:bg-gray-50 transition-colors duration-150">
									<Table.Cell class="font-medium">{index + 1}</Table.Cell>
									{#if $loggedInUser?.userRoles?.some( (x) => [UserRoles.Staff, UserRoles.Tech].includes(x) )}
										<Table.Cell class="font-mono text-sm">{result.fileId}</Table.Cell>
									{/if}
									<Table.Cell class="font-medium">{result.titleOfTradeMark}</Table.Cell>
									<Table.Cell>
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border {getSimilarityColor(result.similarity)}">
											{result.similarity}%
										</span>
									</Table.Cell>
									<Table.Cell class="text-sm">{result.fileApplicant}</Table.Cell>
									<Table.Cell class="text-sm">{result.filingDate.slice(0, 10)}</Table.Cell>
									<Table.Cell class="text-sm">{result.tradeMarkClass}</Table.Cell>
									<Table.Cell>
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {result.trademarkType === 1 ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
											{result.trademarkType === 1 ? 'Foreign' : 'Local'}
										</span>
									</Table.Cell>
									<Table.Cell>
										{#if Number(result.tradeMarkLogo) === 1}
											<span class="text-sm text-gray-600 italic">Wordmark</span>
										{:else}
											<img src={normalizeImageUrl(result.logoUrl)} alt="Representation" class="h-8 w-8 object-contain rounded" />
										{/if}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{:else}
				<!-- Grid View -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print-grid">
					{#each results as result, index}
						<div class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-gray-300 overflow-hidden print-card">
							<!-- Card Header -->
							<div class="p-4 border-b border-gray-100">
								<div class="flex items-start justify-between mb-2">
									<div class="flex items-center gap-2">
										<span class="text-xs font-medium text-gray-500">#{index + 1}</span>
										{#if $loggedInUser?.userRoles?.some( (x) => [UserRoles.Staff, UserRoles.Tech].includes(x) )}
											<span class="text-xs font-mono text-gray-400">{result.fileId}</span>
										{/if}
									</div>
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border {getSimilarityColor(result.similarity)}">
										{result.similarity}%
									</span>
								</div>
								<h3 class="font-semibold text-sm text-gray-900 line-clamp-2 mb-2">{result.titleOfTradeMark}</h3>
							</div>

							<!-- Card Body -->
							<div class="p-4 space-y-3">
								<!-- Representation -->
								<div class="flex items-center justify-center h-16 bg-gray-50 rounded-md">
									{#if Number(result.tradeMarkLogo) === 1}
										<span class="text-sm text-gray-600 italic">Wordmark</span>
									{:else}
										<img src={normalizeImageUrl(result.logoUrl)} alt="Representation" class="max-h-12 max-w-full object-contain" />
									{/if}
								</div>

								<!-- Details -->
								<div class="space-y-2 text-sm">
									<div class="flex items-center justify-between">
										<span class="text-gray-500">Applicant:</span>
										<span class="font-medium text-right text-xs max-w-32 truncate" title={result.fileApplicant}>{result.fileApplicant}</span>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-gray-500">Filing Date:</span>
										<span class="font-medium">{result.filingDate.slice(0, 10)}</span>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-gray-500">Class:</span>
										<span class="font-medium">{result.tradeMarkClass}</span>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-gray-500">Type:</span>
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {result.trademarkType === 1 ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
											{result.trademarkType === 1 ? 'Foreign' : 'Local'}
										</span>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<Toaster />

<style>
	.balloon {
		position: absolute;
		bottom: -2rem;
		font-size: 2rem;
		opacity: 0.85;
		animation: balloon-float 5s ease-in infinite;
	}

	.balloon-left {
		left: 8%;
	}

	.balloon-right {
		right: 8%;
		animation-delay: 1.5s;
	}

	@keyframes balloon-float {
		0% {
			transform: translateY(0);
			opacity: 0;
		}
		15% {
			opacity: 0.85;
		}
		100% {
			transform: translateY(-12rem);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.balloon {
			animation: none;
			display: none;
		}
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Print Styles */
	@media print {
		/* Hide elements that shouldn't be printed */
		.no-print {
			display: none !important;
		}

		/* Show print-only elements */
		.print-only {
			display: block !important;
		}

		/* General print styling */
		body {
			font-size: 11px;
			line-height: 1.3;
			color: #000;
			margin: 0;
			padding: 0;
		}

		/* Hide all scrollbars */
		* {
			overflow: visible !important;
			-ms-overflow-style: none !important;
			scrollbar-width: none !important;
		}

		*::-webkit-scrollbar {
			display: none !important;
		}

		/* Print header styling */
		.print-header {
			border-bottom: 2px solid #000;
			margin-bottom: 15px;
			padding-bottom: 8px;
		}

		/* Search criteria styling for print */
		.print-search-criteria {
			background: #f8f9fa !important;
			border: 1px solid #dee2e6;
			margin-bottom: 12px;
			padding: 8px !important;
			page-break-inside: avoid;
		}

		/* Table container styling for print */
		.print-table {
			box-shadow: none;
			border: none;
			overflow: visible !important;
			width: 100% !important;
		}

		/* Table styling for print */
		.print-table table {
			border-collapse: collapse;
			width: 100% !important;
			table-layout: fixed;
			border: 1px solid #000;
		}

		.print-table th,
		.print-table td {
			border: 1px solid #000;
			padding: 3px 4px;
			font-size: 9px;
			word-wrap: break-word;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.print-table th {
			background-color: #f0f0f0 !important;
			font-weight: bold;
			text-align: center;
		}

		/* Specific column widths for better layout */
		.print-table th:nth-child(1),
		.print-table td:nth-child(1) { width: 8%; } /* S/N */
		
		.print-table th:nth-child(2),
		.print-table td:nth-child(2) { width: 12%; } /* File Number */
		
		.print-table th:nth-child(3),
		.print-table td:nth-child(3) { width: 20%; } /* File Title */
		
		.print-table th:nth-child(4),
		.print-table td:nth-child(4) { width: 10%; } /* Similarity */
		
		.print-table th:nth-child(5),
		.print-table td:nth-child(5) { width: 18%; } /* Applicant */
		
		.print-table th:nth-child(6),
		.print-table td:nth-child(6) { width: 12%; } /* Filing Date */
		
		.print-table th:nth-child(7),
		.print-table td:nth-child(7) { width: 8%; } /* Class */
		
		.print-table th:nth-child(8),
		.print-table td:nth-child(8) { width: 8%; } /* Type */
		
		.print-table th:nth-child(9),
		.print-table td:nth-child(9) { width: 4%; } /* Representation */

		/* When File Number column is hidden, adjust widths */
		.print-table.no-file-number th:nth-child(1),
		.print-table.no-file-number td:nth-child(1) { width: 8%; } /* S/N */
		
		.print-table.no-file-number th:nth-child(2),
		.print-table.no-file-number td:nth-child(2) { width: 25%; } /* File Title */
		
		.print-table.no-file-number th:nth-child(3),
		.print-table.no-file-number td:nth-child(3) { width: 12%; } /* Similarity */
		
		.print-table.no-file-number th:nth-child(4),
		.print-table.no-file-number td:nth-child(4) { width: 22%; } /* Applicant */
		
		.print-table.no-file-number th:nth-child(5),
		.print-table.no-file-number td:nth-child(5) { width: 13%; } /* Filing Date */
		
		.print-table.no-file-number th:nth-child(6),
		.print-table.no-file-number td:nth-child(6) { width: 8%; } /* Class */
		
		.print-table.no-file-number th:nth-child(7),
		.print-table.no-file-number td:nth-child(7) { width: 8%; } /* Type */
		
		.print-table.no-file-number th:nth-child(8),
		.print-table.no-file-number td:nth-child(8) { width: 4%; } /* Representation */

		/* Grid styling for print */
		.print-grid {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 12px;
			width: 100%;
		}

		.print-card {
			border: 1px solid #000;
			box-shadow: none;
			page-break-inside: avoid;
			margin-bottom: 8px;
		}

		/* Image styling for print */
		img {
			max-width: 100%;
			height: auto;
			print-color-adjust: exact;
		}

		/* Page break controls */
		.print-table {
			page-break-inside: auto;
		}

		.print-table thead {
			display: table-header-group;
		}

		.print-table tbody tr {
			page-break-inside: avoid;
		}

		/* Ensure proper margins */
		@page {
			margin: 0.4in;
			size: A4 landscape;
		}

		/* Remove rounded corners and shadows in print */
		* {
			box-shadow: none !important;
			border-radius: 0 !important;
		}

		/* Color adjustments for better print quality */
		.bg-red-100 { background-color: #fee !important; }
		.bg-orange-100 { background-color: #ffedd5 !important; }
		.bg-yellow-100 { background-color: #fef3c7 !important; }
		.bg-green-100 { background-color: #dcfce7 !important; }
		.bg-purple-100 { background-color: #f3e8ff !important; }
		.bg-blue-100 { background-color: #dbeafe !important; }
		.bg-gray-50 { background-color: #f9fafb !important; }

		/* Ensure proper text wrapping */
		.print-table td {
			white-space: normal !important;
			word-break: break-word;
		}

		/* Container adjustments */
		.space-y-4 {
			margin: 0 !important;
			padding: 0 !important;
		}
	}

	/* Hide print-only elements by default */
	.print-only {
		display: none;
	}
</style>
<script lang="ts">
	import { onMount } from 'svelte';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import {
		adjustmentType,
		applicationData,
		loggedInUser,
		metaDataInfo,
		newApplicationType,
		viewUpdatesMade
	} from '$lib/store';
	import {
		type ApplicationHistoryType,
		ApplicationStatuses,
		baseURL,
		hasValidCorrespondenceDetails,
		UserRoles
	} from '$lib/helpers';
	interface ClaimDetailsDto {
		fileNumber: string;
		filingDate: string;
		class: string;
		fileStatus: number;
		title: string;
		paymentId?: string;
		requestDate: string;
		documents?: string[];
	}

	let claims: ClaimDetailsDto[] = [];
	let selectedClaim: ClaimDetailsDto | null = null;
	let showModal = false;
	let loading = true;
	let error = '';

	async function fetchAllClaims() {
		try {
			loading = true;
			const response = await fetch(`${baseURL}/api/migration/GetAllClaimRequests`);
			if (!response.ok) throw new Error('Failed to fetch claims');
			claims = await response.json();
			error = '';
		} catch (err) {
			error = 'Failed to load claims. Please try again.';
			console.error('Error fetching claims:', err);
		} finally {
			loading = false;
		}
	}

	async function fetchClaimDetails(fileId: string) {
		try {
			const response = await fetch(`${baseURL}/api/migration/GetClaimRequest?fileId=${fileId}`);
			if (!response.ok) throw new Error('Failed to fetch claim details');
			selectedClaim = await response.json();
			showModal = true;
		} catch (err) {
			error = 'Failed to load claim details. Please try again.';
			console.error('Error fetching claim details:', err);
		}
	}

	function closeModal() {
		showModal = false;
		selectedClaim = null;
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString();
	}
	async function migrate(fileId: string | undefined) {
		if (!fileId) return;
		try {
			const response = await fetch(`${baseURL}/api/migration/migrate?fileId=${fileId}`, {
				method: 'POST'
			});
			if (!response.ok) throw new Error('Migration failed');
			alert('Migration successful!');
			closeModal();
			fetchAllClaims(); // Refresh the claims list
		} catch (err) {
			alert('Migration failed. Please try again.');
			console.error('Error during migration:', err);
		}
	}

	onMount(() => {
		fetchAllClaims();
	});

	// Stats calculations
	$: totalClaims = claims.length;
	$: activeStatuses = ['Active', 'Pending', 'Approved']; // Adjust based on your actual statuses
	$: activeClaims = claims.filter((c) => activeStatuses.includes(c.fileStatus)).length;
	$: recentClaims = claims.filter((c) => {
		const claimDate = new Date(c.requestDate);
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		return claimDate >= thirtyDaysAgo;
	}).length;
</script>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Claim Requests</h1>
			<p class="text-gray-600">Manage and view all trademark claim requests</p>
		</div>

		<!-- Stats Cards -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
			<div class="bg-white p-3 rounded-lg shadow-md border-l-3">
				<div class="flex items-center">
					<div class="flex-1">
						<h3 class="text-lg font-semibold text-gray-700">Total Claims</h3>
						<p class="text-3xl font-bold text-black">{totalClaims}</p>
					</div>
					<div class="p-3 bg-blue-100 rounded-full">
						<svg class="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
				</div>
			</div>

			<!-- <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
        <div class="flex items-center">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-700">Active Claims</h3>
            <p class="text-3xl font-bold text-green-600">{activeClaims}</p>
          </div>
          <div class="p-3 bg-green-100 rounded-full">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
        <div class="flex items-center">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-700">Recent (30 days)</h3>
            <p class="text-3xl font-bold text-purple-600">{recentClaims}</p>
          </div>
          <div class="p-3 bg-purple-100 rounded-full">
            <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>-->
		</div>

		<!-- Error Message -->
		{#if error}
			<div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
				<div class="flex">
					<svg
						class="w-5 h-5 text-red-400 mr-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<p class="text-red-700">{error}</p>
				</div>
			</div>
		{/if}

		<!-- Main Table -->
		<div class="bg-white rounded-lg shadow-md overflow-hidden">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-xl font-semibold text-gray-800">All Claim Requests</h2>
			</div>

			{#if loading}
				<div class="p-8 text-center">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
					<p class="mt-4 text-gray-600">Loading claims...</p>
				</div>
			{:else if claims.length === 0}
				<div class="p-8 text-center text-gray-500">
					<svg
						class="w-16 h-16 mx-auto mb-4 text-gray-300"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					<p class="text-lg">No claims found</p>
					<p class="text-sm">There are no claim requests to display.</p>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-gray-50">
							<tr>
								<th
									class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>File Number</th
								>
								<th
									class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>Title</th
								>
								<th
									class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>Class</th
								>
								<th
									class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>Status</th
								>
								<th
									class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>Filing Date</th
								>
								<th
									class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>Request Date</th
								>
								<th
									class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>Actions</th
								>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each claims as claim}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
										{claim.fileNumber}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
										{claim.title}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{claim.class}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<AppStatusTag value={claim.fileStatus} />
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{formatDate(claim.filingDate)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{formatDate(claim.requestDate)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">
										<button
											on:click={() => fetchClaimDetails(claim.fileNumber)}
											class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 font-medium"
										>
											View Details
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Modal -->
{#if showModal && selectedClaim}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
		on:click={closeModal}
	>
		<div
			class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white"
			on:click|stopPropagation
		>
			<div class="mt-3">
				<!-- Modal Header -->
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-2xl font-bold text-gray-900">Claim Details</h3>
					<button on:click={closeModal} class="text-gray-400 hover:text-gray-600 transition-colors">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<!-- Modal Content -->
				<div class="space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<!-- svelte-ignore a11y-label-has-associated-control -->
							<label class="block text-sm font-medium text-gray-700 mb-1">File Number</label>
							<p class="text-lg text-gray-900 bg-gray-50 p-2 rounded">{selectedClaim.fileNumber}</p>
						</div>
						<div>
							<!-- svelte-ignore a11y-label-has-associated-control -->
							<label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
							<AppStatusTag value={selectedClaim.fileStatus} />
						</div>
					</div>

					<div>
						<!-- svelte-ignore a11y-label-has-associated-control -->
						<label class="block text-sm font-medium text-gray-700 mb-1">Trademark Title</label>
						<p class="text-lg text-gray-900 bg-gray-50 p-2 rounded">{selectedClaim.title}</p>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<!-- svelte-ignore a11y-label-has-associated-control -->
							<label class="block text-sm font-medium text-gray-700 mb-1">Class</label>
							<p class="text-lg text-gray-900 bg-gray-50 p-2 rounded">{selectedClaim.class}</p>
						</div>
						<div>
							<!-- svelte-ignore a11y-label-has-associated-control -->
							<label class="block text-sm font-medium text-gray-700 mb-1">Payment ID</label>
							<p class="text-lg text-gray-900 bg-gray-50 p-2 rounded">
								{selectedClaim.paymentId || 'N/A'}
							</p>
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<!-- svelte-ignore a11y-label-has-associated-control -->
							<label class="block text-sm font-medium text-gray-700 mb-1">Filing Date</label>
							<p class="text-lg text-gray-900 bg-gray-50 p-2 rounded">
								{formatDate(selectedClaim.filingDate)}
							</p>
						</div>
						<div>
							<!-- svelte-ignore a11y-label-has-associated-control -->
							<label class="block text-sm font-medium text-gray-700 mb-1">Request Date</label>
							<p class="text-lg text-gray-900 bg-gray-50 p-2 rounded">
								{formatDate(selectedClaim.requestDate)}
							</p>
						</div>
					</div>
					<div>
						<!-- svelte-ignore a11y-label-has-associated-control -->
						<label class="block text-sm font-medium text-gray-700 mb-1">Claim Documents</label>
						{#if selectedClaim.documents}
							<ul class="list-disc list-inside bg-gray-50 p-2 rounded">
								{#each selectedClaim.documents as doc}
									<li class="text-blue-600 hover:underline">
										<a href={doc} target="_blank" rel="noopener noreferrer">View Document(s)</a>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-gray-500">No documents available.</p>
						{/if}
					</div>
				</div>

				<!-- Modal Footer -->
				<div class="flex justify-end mt-8 pt-4 border-t">
					<button
						on:click={closeModal}
						class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md transition-colors duration-200"
					>
						Close
					</button>
					{#if ($loggedInUser?.roles?.includes(UserRoles.SuperAdmin))}
									
					<button 
						on:click={() => migrate(selectedClaim?.fileNumber)}
						class="ml-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors duration-200"
					>
						Migrate
					</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

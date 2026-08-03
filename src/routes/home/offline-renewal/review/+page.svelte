<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Toaster } from '$lib/components/ui/sonner';
	import { Button } from '$lib/components/ui/button/index';
	import Icon from '@iconify/svelte';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import { baseURL, ApplicationStatuses, FileTypes } from '$lib/helpers';
	import { loggedInUser } from '$lib/store';
	import { parseLoggedInUser } from '../../../dataview/datahelpers';

	interface OfflineRenewalItem {
		id: string;
		fileId: string;
		fileType: FileTypes;
		renewalYear: number;
		paymentDate: string;
		paymentId: string;
		submittedAt: string;
		submittedBy: string;
		status: ApplicationStatuses;
		attachments: { name: string; fileName: string; contentType: string; data?: string; url?: string }[];
		decision: string | null;
		reason: string | null;
	}

	let items: OfflineRenewalItem[] = [];
	let isLoading = true;
	let error: string | null = null;

	// Detail modal
	let selectedItem: OfflineRenewalItem | null = null;
	let showModal = false;
	let decision: 'Approved' | 'Refused' | '' = '';
	let reason = '';
	let isProcessing = false;

	onMount(async () => {
		if (!$loggedInUser) {
			const user = parseLoggedInUser(document.cookie);
			if (!user) {
				await goto('/auth');
				return;
			}
			loggedInUser.set(user);
		}
		await fetchItems();
	});

	async function fetchItems(): Promise<void> {
		isLoading = true;
		error = null;
		try {
			const res = await fetch(`${baseURL}/api/files/offline-renewal/requests`);
			if (!res.ok) throw new Error('Failed to fetch requests');
			items = await res.json();
		} catch (err) {
			error = 'Failed to load offline renewal requests. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	function openModal(item: OfflineRenewalItem): void {
		selectedItem = item;
		decision = '';
		reason = '';
		showModal = true;
	}

	function closeModal(): void {
		showModal = false;
		selectedItem = null;
		decision = '';
		reason = '';
		isProcessing = false;
	}

	async function processDecision(): Promise<void> {
		if (!selectedItem) return;
		if (!decision) {
			toast.error('Please select a decision.', { position: 'top-right' });
			return;
		}
		if (!reason.trim()) {
			toast.error('A reason is required.', { position: 'top-right' });
			return;
		}

		isProcessing = true;
		try {
			const res = await fetch(`${baseURL}/api/files/offline-renewal/decision`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					RequestId: selectedItem.id,
					Approve: decision === 'Approved',
					Reason: reason.trim(),
					UserId: $loggedInUser?.id
				})
			});

			if (!res.ok) {
				const err = await res.json();
				toast.error(err.message || 'Processing failed.', { position: 'top-right' });
				return;
			}

			toast.success(
				decision === 'Approved'
					? 'Renewal approved. Renewal history updated.'
					: 'Renewal refused. No history added.',
				{ position: 'top-right' }
			);
			closeModal();
			await fetchItems();
		} catch (err) {
			toast.error('An error occurred. Please try again.', { position: 'top-right' });
		} finally {
			isProcessing = false;
		}
	}

	function formatDate(dateStr: string): string {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	function getFileTypeName(ft: FileTypes): string {
		return FileTypes[ft] ?? '—';
	}

	$: receiptAttachments = selectedItem?.attachments.filter((a) => a.name === 'renewalReceipt') ?? [];
	$: certAttachments = selectedItem?.attachments.filter((a) => a.name === 'renewalCertificate') ?? [];
</script>

<Toaster />

<div class="min-h-screen bg-gray-50 p-6">
	<div class="max-w-7xl mx-auto">
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Offline Renewal Requests</h1>
				<p class="text-sm text-gray-500 mt-1">Review and process submitted offline renewal applications</p>
			</div>
			<Button variant="outline" on:click={fetchItems} class="flex items-center gap-2">
				<Icon icon="mdi:refresh" width="1rem" height="1rem" />
				Refresh
			</Button>
		</div>

		{#if isLoading}
			<div class="flex items-center justify-center p-16">
				<div class="flex flex-col items-center gap-2">
					<Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" />
					<span class="text-sm text-gray-500">Loading requests...</span>
				</div>
			</div>
		{:else if error}
			<div class="bg-red-50 text-red-600 p-4 rounded-md text-center">{error}</div>
		{:else if items.length === 0}
			<div class="flex flex-col items-center justify-center py-20">
				<Icon icon="mdi:tray-remove" width="3rem" height="3rem" class="text-gray-400 mb-4" />
				<h3 class="text-lg font-semibold text-gray-700">No pending requests</h3>
				<p class="text-sm text-gray-500 mt-1">All offline renewal requests have been processed.</p>
			</div>
		{:else}
			<div class="bg-white rounded-lg shadow overflow-hidden">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 border-b">
						<tr>
							<th class="px-4 py-3 text-left font-medium text-gray-600">S/N</th>
							<th class="px-4 py-3 text-left font-medium text-gray-600">File ID</th>
							<th class="px-4 py-3 text-left font-medium text-gray-600">Type</th>
							<th class="px-4 py-3 text-left font-medium text-gray-600">Renewal Year</th>
							<th class="px-4 py-3 text-left font-medium text-gray-600">Payment ID</th>
							<th class="px-4 py-3 text-left font-medium text-gray-600">Submitted</th>
							<th class="px-4 py-3 text-left font-medium text-gray-600">Status</th>
							<th class="px-4 py-3 text-left font-medium text-gray-600">Action</th>
						</tr>
					</thead>
					<tbody>
						{#each items as item, i}
							<tr class="border-b hover:bg-gray-50 transition-colors">
								<td class="px-4 py-3">{i + 1}</td>
								<td class="px-4 py-3 font-medium">{item.fileId}</td>
								<td class="px-4 py-3">{getFileTypeName(item.fileType)}</td>
								<td class="px-4 py-3">{item.renewalYear}</td>
								<td class="px-4 py-3 text-gray-600">{item.paymentId}</td>
								<td class="px-4 py-3 text-gray-500">{formatDate(item.submittedAt)}</td>
								<td class="px-4 py-3">
									<AppStatusTag value={item.status} />
								</td>
								<td class="px-4 py-3">
									<Button
										size="sm"
										variant="outline"
										on:click={() => openModal(item)}
										class="flex items-center gap-1"
									>
										<Icon icon="mdi:eye-outline" width="1rem" height="1rem" />
										Review
									</Button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- Detail / Decision Modal -->
{#if showModal && selectedItem}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
		role="presentation"
		on:click|self={closeModal}
		on:keydown={(e) => e.key === 'Escape' && closeModal()}
	>
		<div
			class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
			role="dialog"
			aria-modal="true"
		>
			<!-- Modal Header -->
			<div class="border-b px-6 py-4 flex items-center justify-between">
				<div>
					<h2 class="text-lg font-bold text-gray-900">Offline Renewal Review</h2>
					<p class="text-sm text-gray-500">File: <span class="font-medium">{selectedItem.fileId}</span></p>
				</div>
				<button
					class="text-gray-400 hover:text-gray-600"
					on:click={closeModal}
					type="button"
					aria-label="Close"
				>
					<Icon icon="mdi:close" width="1.4rem" height="1.4rem" />
				</button>
			</div>

			<div class="p-6 space-y-6">
				<!-- Submission Details -->
				<div>
					<h3 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
						Submission Details
					</h3>
					<div class="grid grid-cols-2 gap-3 text-sm">
						<div class="bg-gray-50 rounded p-3">
							<p class="text-gray-500 text-xs mb-1">File Type</p>
							<p class="font-medium">{getFileTypeName(selectedItem.fileType)}</p>
						</div>
						<div class="bg-gray-50 rounded p-3">
							<p class="text-gray-500 text-xs mb-1">Renewal Year</p>
							<p class="font-medium">{selectedItem.renewalYear}</p>
						</div>
						<div class="bg-gray-50 rounded p-3">
							<p class="text-gray-500 text-xs mb-1">Payment Date</p>
							<p class="font-medium">{formatDate(selectedItem.paymentDate)}</p>
						</div>
						<div class="bg-gray-50 rounded p-3">
							<p class="text-gray-500 text-xs mb-1">Payment ID / RRR</p>
							<p class="font-medium">{selectedItem.paymentId}</p>
						</div>
						<div class="bg-gray-50 rounded p-3">
							<p class="text-gray-500 text-xs mb-1">Submitted</p>
							<p class="font-medium">{formatDate(selectedItem.submittedAt)}</p>
						</div>
						<div class="bg-gray-50 rounded p-3">
							<p class="text-gray-500 text-xs mb-1">Status</p>
								<AppStatusTag value={selectedItem.status} />
						</div>
					</div>
				</div>

				<!-- Attachments -->
				{#if receiptAttachments.length > 0 || certAttachments.length > 0}
					<div>
						<h3 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
							Attachments
						</h3>

						{#if receiptAttachments.length > 0}
							<p class="text-xs text-gray-500 mb-1 font-medium">Renewal Receipt(s)</p>
							<ul class="mb-3 space-y-1">
								{#each receiptAttachments as att}
									<li class="flex items-center gap-2 bg-blue-50 rounded px-3 py-2 text-sm">
										<Icon icon="mdi:file-document-outline" width="1rem" class="text-blue-600" />
										{#if att.url}
											<a
												href={att.url}
												target="_blank"
												rel="noopener noreferrer"
												class="text-blue-700 hover:underline">{att.fileName}</a
											>
										{:else}
											<span>{att.fileName}</span>
										{/if}
									</li>
								{/each}
							</ul>
						{/if}

						{#if certAttachments.length > 0}
							<p class="text-xs text-gray-500 mb-1 font-medium">Certificate(s)</p>
							<ul class="space-y-1">
								{#each certAttachments as att}
									<li class="flex items-center gap-2 bg-green-50 rounded px-3 py-2 text-sm">
										<Icon icon="mdi:certificate-outline" width="1rem" class="text-green-600" />
										{#if att.url}
											<a
												href={att.url}
												target="_blank"
												rel="noopener noreferrer"
												class="text-green-700 hover:underline">{att.fileName}</a
											>
										{:else}
											<span>{att.fileName}</span>
										{/if}
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}

				<!-- Decision -->
				{#if selectedItem.status === ApplicationStatuses.AwaitingRenewalConfirmation}
					<div>
						<h3 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
							Decision
						</h3>

						<div class="flex gap-3 mb-4">
							<button
								type="button"
								class="flex-1 py-2 px-4 rounded-md border-2 text-sm font-medium transition-colors {decision === 'Approved'
									? 'border-green-500 bg-green-50 text-green-700'
									: 'border-gray-200 hover:border-gray-300 text-gray-600'}"
								on:click={() => (decision = 'Approved')}
							>
								<Icon icon="mdi:check-circle-outline" width="1rem" class="inline mr-1" />
								Approve
							</button>
							<button
								type="button"
								class="flex-1 py-2 px-4 rounded-md border-2 text-sm font-medium transition-colors {decision === 'Refused'
									? 'border-red-500 bg-red-50 text-red-700'
									: 'border-gray-200 hover:border-gray-300 text-gray-600'}"
								on:click={() => (decision = 'Refused')}
							>
								<Icon icon="mdi:close-circle-outline" width="1rem" class="inline mr-1" />
								Refuse
							</button>
						</div>

						<div>
							<label for="reason" class="block text-sm font-medium text-gray-700 mb-1">
								Reason <span class="text-red-500">*</span>
							</label>
							<textarea
								id="reason"
								bind:value={reason}
								rows="3"
								placeholder="Enter reason for your decision..."
								class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
							></textarea>
						</div>
					</div>
				{/if}
			</div>

			<!-- Modal Footer -->
			<div class="border-t px-6 py-4 flex justify-end gap-3">
				<Button variant="outline" on:click={closeModal} disabled={isProcessing}>Close</Button>
				{#if selectedItem.status === ApplicationStatuses.AwaitingRenewalConfirmation}
					<Button
						class="bg-black hover:bg-gray-800 text-white"
						on:click={processDecision}
						disabled={isProcessing}
					>
						{#if isProcessing}
							<Icon icon="line-md:loading-loop" width="1rem" height="1rem" class="mr-2" />
							Processing...
						{:else}
							<Icon icon="mdi:send" width="1rem" height="1rem" class="mr-2" />
							Submit Decision
						{/if}
					</Button>
				{/if}
			</div>
		</div>
	</div>
{/if}

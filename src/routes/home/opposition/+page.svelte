<script lang="ts">
import { baseURL, UserRoles, ApplicationStatuses } from '$lib/helpers';
import { mapDateToString } from '../components/dashboardutils';
import Icon from '@iconify/svelte';
import { onMount } from 'svelte';
import { Button } from '$lib/components/ui/button';
import OppositionTable from './OppositionTable.svelte';
import { loggedInUser, loggedInToken } from '$lib/store';
import { toast } from 'svelte-sonner';
import * as Sheet from '$lib/components/ui/sheet';
import * as Dialog from '$lib/components/ui/dialog';
import { Textarea } from '$lib/components/ui/textarea';
import { Label } from '$lib/components/ui/label';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { Toaster } from '$lib/components/ui/sonner';

// ── Main Tab
type MainView = 'applications' | 'withdrawal';
let mainView: MainView = 'applications';

const isOfficer = () =>
$loggedInUser?.userRoles?.some((r: number) =>
[UserRoles.TrademarkOpposition, UserRoles.Tech, UserRoles.SuperAdmin].includes(r)
);

// ── Opposition Applications
let data: any[] = [];
let awaitingCounter = 0;
let newOpposition = 0;
let awaitingOfficeProcess = 0;
let abandoned = 0;
let isLoading = false;
let oppositionType: number | undefined = undefined;
let count = 0;

onMount(async () => {
	await loadOppositionStats();
	await loadData(undefined, 10, 0);
	if ($page.url.searchParams.get('tab') === 'withdrawal') {
		await enterWithdrawalView();
	}
});

async function loadOppositionStats() {
const headers = { Authorization: `Bearer ${$loggedInToken}` };
const response = await fetch(`${baseURL}/api/opposition/stats`, { headers });
const stats = await response.json();
awaitingCounter = stats.awaitingCounter;
newOpposition = stats.newOpposition;
awaitingOfficeProcess = stats.awaitingOfficeProcess ?? 0;
abandoned = stats.abandoned ?? 0;
if (!stats.awaitingOfficeProcess) {
const res = await fetch(`${baseURL}/api/opposition/loadSummary?quantity=1&skip=0&type=36`, { headers });
if (res.ok) {
const result = await res.json();
awaitingOfficeProcess = result.count ?? 0;
}
}
}

async function loadData(type: number | undefined, quantity: number, skip: number) {
data = [];
isLoading = true;
let url = `${baseURL}/api/opposition/loadSummary?quantity=${quantity}&skip=${skip}`;
if (type !== undefined) {
url += `&type=${type}`;
oppositionType = type;
}
const response = await fetch(url, { headers: { Authorization: `Bearer ${$loggedInToken}` } });
const _data = await response.json();
const __data = _data.data;
count = _data.count;
for (let i = 0; i < __data.length; i++) {
let curr = __data[i];
data.push({
's/n': i + 1,
id: curr.id,
title: curr.title,
creatorId: curr.creatorId,
fileCreatorId: curr.fileCreatorId,
paymentId: curr.paymentId,
fileId: curr.fileId,
date: curr.date,
name: curr.name,
currentStatus: curr.status
});
}
isLoading = false;
}

// ── Opposition Withdrawal
type WithdrawalTab = 'awaiting-payment' | 'requested' | 'withdrawn';
let withdrawalTab: WithdrawalTab = 'requested';
let wLoading = false;
let wItems: any[] = [];
let wCounts = { awaitingPayment: 0, requested: 0, withdrawn: 0 };

let showDetail = false;
let selectedItem: any = null;
let detailLoading = false;
let oppositionDetail: any = null;

let showTreatModal = false;
let treatReason = '';
let treatAction: 'approve' | 'refuse' | null = null;

let showConfirm = false;
let isTreating = false;

const wTabStatusMap: Record<WithdrawalTab, number> = {
'awaiting-payment': ApplicationStatuses.AwaitingPayment,
requested: ApplicationStatuses.RequestWithdrawal,
withdrawn: ApplicationStatuses.Withdrawn
};

async function enterWithdrawalView() {
	try {
		mainView = 'withdrawal';
		await loadWCounts();
		await loadWItems('requested');
	} catch (e) {
		console.error('Failed to load withdrawal view:', e);
		toast.error('Could not load withdrawal data. Please try again.');
		mainView = 'applications';
	}
}

async function loadWCounts() {
	try {
		const headers = { Authorization: `Bearer ${$loggedInToken}` };
		const [r1, r2, r3] = await Promise.all([
			fetch(`${baseURL}/api/opposition/loadSummary?quantity=1&skip=0&type=${ApplicationStatuses.AwaitingPayment}`, { headers }),
			fetch(`${baseURL}/api/opposition/loadSummary?quantity=1&skip=0&type=${ApplicationStatuses.RequestWithdrawal}`, { headers }),
			fetch(`${baseURL}/api/opposition/loadSummary?quantity=1&skip=0&type=${ApplicationStatuses.Withdrawn}`, { headers })
		]);
		const safeJson = async (r: Response) => r.ok ? r.json().catch(() => ({})) : {};
		const [d1, d2, d3] = await Promise.all([safeJson(r1), safeJson(r2), safeJson(r3)]);
		wCounts.awaitingPayment = d1.count ?? 0;
		wCounts.requested = d2.count ?? 0;
		wCounts.withdrawn = d3.count ?? 0;
		wCounts = { ...wCounts };
	} catch (e) {
		console.error('loadWCounts error:', e);
	}
}

async function loadWItems(tab: WithdrawalTab) {
	withdrawalTab = tab;
	wLoading = true;
	wItems = [];
	try {
		const headers = { Authorization: `Bearer ${$loggedInToken}` };
		const res = await fetch(
			`${baseURL}/api/opposition/loadSummary?quantity=100&skip=0&type=${wTabStatusMap[tab]}`,
			{ headers }
		);
		if (res.ok) {
			const d = await res.json();
			wItems = d.data ?? [];
		}
	} catch (e) {
		console.error('loadWItems error:', e);
	} finally {
		wLoading = false;
	}
}

async function openDetail(item: any) {
selectedItem = item;
oppositionDetail = null;
detailLoading = true;
showDetail = true;
const headers = { Authorization: `Bearer ${$loggedInToken}` };
const res = await fetch(
`${baseURL}/api/opposition/getOppositionDetail?oppositionId=${item.id}`,
{ headers }
);
if (res.ok) {
const result = await res.json();
oppositionDetail = result.opposition ?? result.data ?? result;
}
detailLoading = false;
}

function openTreatModal() {
treatReason = '';
treatAction = null;
showTreatModal = true;
}

function submitTreat(action: 'approve' | 'refuse') {
if (!treatReason.trim()) {
toast.error('Please provide a reason.');
return;
}
treatAction = action;
showTreatModal = false;
showConfirm = true;
}

async function confirmTreat() {
	isTreating = true;
	const headers = { Authorization: `Bearer ${$loggedInToken}`, 'Content-Type': 'application/json' };
	try {
		const officerRole = $loggedInUser?.userRoles?.find((r: number) =>
			[UserRoles.TrademarkOpposition, UserRoles.Tech, UserRoles.SuperAdmin].includes(r)
		) ?? $loggedInUser?.userRoles?.[0];
		const res = await fetch(`${baseURL}/api/opposition/TreatWithdrawal`, {
			method: 'POST',
			headers,
			body: JSON.stringify({ oppositionId: selectedItem?.id, action: treatAction, reason: treatReason, role: officerRole })
		});
		const data = await res.json().catch(() => ({}));
		if (res.ok && data.success !== false) {
			const action = treatAction;
			treatReason = '';
			treatAction = null;
			showConfirm = false;
			showDetail = false;
			showTreatModal = false;
			if (action === 'approve') {
				toast.success('Withdrawal approved successfully', { position: 'top-right' });
			} else {
				toast.success('Withdrawal refused', { position: 'top-right' });
			}
			location.reload();
		} else {
			toast.error(data.message ?? 'Failed to process the withdrawal request.', { position: 'top-right' });
			showConfirm = false;
			showTreatModal = true;
		}
	} catch (e) {
		toast.error('Network error. Please try again.', { position: 'top-right' });
		showConfirm = false;
		showTreatModal = true;
	}
	isTreating = false;
}
</script>

<Toaster />
<div class="flex flex-col space-y-4">

<div class="flex items-center gap-2 border-b border-slate-200 pb-1">
<button
class="px-5 py-2 rounded-t-lg text-sm font-semibold transition-colors {mainView === 'applications' ? 'bg-primary text-white shadow' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}"
on:click={() => { mainView = 'applications'; }}
>
<span class="flex items-center gap-2">
<Icon icon="mdi:gavel" class="w-4 h-4" />
Opposition Applications
</span>
</button>

{#if isOfficer()}
<button
class="px-5 py-2 rounded-t-lg text-sm font-semibold transition-colors {mainView === 'withdrawal' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}"
on:click={enterWithdrawalView}
>
<span class="flex items-center gap-2">
<Icon icon="mdi:undo-variant" class="w-4 h-4" />
Opposition Withdrawal
</span>
</button>
{/if}
</div>

{#if mainView === 'applications'}
{#if isLoading}
<div class="items-center justify-center flex h-screen">
<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
</div>
{:else}
<div class="flex flex-col space-y-3">
<div class="flex gap-3 flex-wrap">
<Button
class="group relative overflow-hidden bg-gray-500 hover:bg-gray-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] px-6 py-3 rounded-xl"
on:click={() => loadData(29, 10, 0)}
>
<div class="flex items-center space-x-3">
<div class="relative z-10">Opposed</div>
<span class="relative z-10 font-semibold tracking-wide">{newOpposition}</span>
</div>
<div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
</Button>

<Button
class="group relative overflow-hidden bg-yellow-500 hover:bg-yellow-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] px-6 py-3 rounded-xl"
on:click={() => loadData(30, 10, 0)}
>
<div class="flex items-center space-x-3">
<div class="relative z-10">Awaiting Counter Statement</div>
<span class="relative z-10 font-semibold tracking-wide">{awaitingCounter}</span>
</div>
<div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
</Button>

{#if isOfficer()}
<Button
class="group relative overflow-hidden bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] px-6 py-3 rounded-xl"
on:click={() => loadData(36, 10, 0)}
>
<div class="flex items-center space-x-3">
<div class="relative z-10">Awaiting Office Process</div>
<span class="relative z-10 font-semibold tracking-wide">{awaitingOfficeProcess}</span>
</div>
<div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
</Button>

<Button
class="group relative overflow-hidden bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] px-6 py-3 rounded-xl"
on:click={() => loadData(37, 10, 0)}
>
<div class="flex items-center space-x-3">
<div class="relative z-10">Abandoned</div>
<span class="relative z-10 font-semibold tracking-wide">{abandoned}</span>
</div>
<div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
</Button>
{/if}
</div>

<OppositionTable dataList={data} {count} {oppositionType} />
</div>
{/if}
{/if}

{#if mainView === 'withdrawal'}
<div class="flex flex-col space-y-5">
<div class="flex flex-wrap gap-3">
<button
class="group relative overflow-hidden {withdrawalTab === 'awaiting-payment' ? 'bg-red-600' : 'bg-red-500 hover:bg-red-600'} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] px-6 py-3 rounded-xl"
on:click={() => loadWItems('awaiting-payment')}
>
<div class="flex items-center space-x-3">
<Icon icon="mdi:clock-outline" class="w-5 h-5" />
<span class="font-medium">Awaiting Payment</span>
<span class="font-bold text-lg">{wCounts.awaitingPayment}</span>
</div>
<div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
</button>

<button
class="group relative overflow-hidden {withdrawalTab === 'requested' ? 'bg-amber-600' : 'bg-amber-500 hover:bg-amber-600'} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] px-6 py-3 rounded-xl"
on:click={() => loadWItems('requested')}
>
<div class="flex items-center space-x-3">
<Icon icon="mdi:file-clock-outline" class="w-5 h-5" />
<span class="font-medium">Withdrawal Requested</span>
<span class="font-bold text-lg">{wCounts.requested}</span>
</div>
<div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
</button>

<button
class="group relative overflow-hidden {withdrawalTab === 'withdrawn' ? 'bg-green-700' : 'bg-green-600 hover:bg-green-700'} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] px-6 py-3 rounded-xl"
on:click={() => loadWItems('withdrawn')}
>
<div class="flex items-center space-x-3">
<Icon icon="mdi:check-circle-outline" class="w-5 h-5" />
<span class="font-medium">Opposition Withdrawn</span>
<span class="font-bold text-lg">{wCounts.withdrawn}</span>
</div>
<div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
</button>
</div>

<div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
{#if wLoading}
<div class="flex justify-center items-center py-16">
<Icon icon="line-md:loading-loop" class="w-8 h-8 text-green-600" />
</div>
{:else if wItems.length === 0}
<div class="flex flex-col items-center justify-center py-16 text-center">
<Icon icon="mdi:inbox-outline" class="w-12 h-12 text-slate-300 mb-2" />
<p class="text-slate-500 text-sm">No records found for this category.</p>
</div>
{:else}
<div class="overflow-x-auto">
<table class="min-w-full text-sm">
<thead class="bg-slate-50 text-slate-600">
<tr>
<th class="px-4 py-3 text-left font-semibold">S/N</th>
<th class="px-4 py-3 text-left font-semibold">Date</th>
<th class="px-4 py-3 text-left font-semibold">File ID</th>
<th class="px-4 py-3 text-left font-semibold">Title</th>
<th class="px-4 py-3 text-left font-semibold">Opposer Name</th>
<th class="px-4 py-3 text-left font-semibold">Payment ID</th>
<th class="px-4 py-3 text-left font-semibold">Action</th>
</tr>
</thead>
<tbody class="divide-y divide-slate-100">
{#each wItems as row, i}
<tr class="hover:bg-slate-50 transition-colors">
<td class="px-4 py-3 text-slate-700">{i + 1}</td>
<td class="px-4 py-3 text-slate-700 whitespace-nowrap">{row.date ? mapDateToString(row.date) : '-'}</td>
<td class="px-4 py-3 text-slate-700">{row.fileId ?? '-'}</td>
<td class="px-4 py-3 text-slate-700">{row.title ?? '-'}</td>
<td class="px-4 py-3 text-slate-700">{row.name ?? '-'}</td>
<td class="px-4 py-3 text-slate-700">{row.paymentId ?? '-'}</td>
<td class="px-4 py-3">
<Button
size="sm"
class="text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
on:click={() => openDetail(row)}
>
<Icon icon="lucide:eye" class="w-3 h-3 mr-1" />
View Opposition
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
{/if}
</div>

<Sheet.Root bind:open={showDetail}>
<Sheet.Content side="right" class="w-full sm:max-w-2xl overflow-y-auto">
{#if detailLoading}
<div class="flex justify-center items-center h-full">
<Icon icon="line-md:loading-loop" class="w-8 h-8 text-green-600" />
</div>
{:else if oppositionDetail}
<Sheet.Header class="pb-4 border-b border-slate-200">
<Sheet.Title class="flex items-center gap-2 text-lg font-bold text-slate-800">
<div class="bg-amber-100 p-1.5 rounded-lg">
<Icon icon="mdi:gavel" class="w-5 h-5 text-amber-600" />
</div>
Opposition Withdrawal Detail
</Sheet.Title>
</Sheet.Header>
<div class="p-6 space-y-6">
<div class="bg-slate-50 rounded-xl p-4 space-y-3">
<h3 class="font-semibold text-slate-700 text-sm uppercase tracking-wide">Application Info</h3>
<div class="grid grid-cols-2 gap-3 text-sm">
<div>
<p class="text-slate-500">File ID</p>
<p class="font-medium text-slate-800">{oppositionDetail.fileId ?? oppositionDetail.fileNumber ?? '-'}</p>
</div>
<div>
<p class="text-slate-500">Title</p>
<p class="font-medium text-slate-800">{oppositionDetail.fileTitle ?? oppositionDetail.title ?? '-'}</p>
</div>
<div>
<p class="text-slate-500">Opposer Name</p>
<p class="font-medium text-slate-800">{oppositionDetail.name ?? oppositionDetail.opposerName ?? '-'}</p>
</div>
<div>
<p class="text-slate-500">Opposer Email</p>
<p class="font-medium text-slate-800">{oppositionDetail.email ?? '-'}</p>
</div>
<div>
<p class="text-slate-500">Date Filed</p>
<p class="font-medium text-slate-800">{oppositionDetail.date ? mapDateToString(oppositionDetail.date) : '-'}</p>
</div>
<div>
<p class="text-slate-500">Payment ID</p>
<p class="font-medium text-slate-800">{oppositionDetail.paymentId ?? selectedItem?.paymentId ?? '-'}</p>
</div>
</div>
</div>

{#if oppositionDetail.withdrawalReason}
<div class="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
<h3 class="font-semibold text-amber-700 text-sm uppercase tracking-wide flex items-center gap-1">
<Icon icon="mdi:text-box-outline" class="w-4 h-4" />
Reason for Withdrawal
</h3>
<p class="text-sm text-slate-700">{oppositionDetail.withdrawalReason}</p>
</div>
{/if}

{#if oppositionDetail.withdrawalDocument || oppositionDetail.attachments?.length}
<div class="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
<h3 class="font-semibold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-1">
<Icon icon="mdi:paperclip" class="w-4 h-4" />
Supporting Documents
</h3>
{#if oppositionDetail.withdrawalDocument}
<a href={oppositionDetail.withdrawalDocument} target="_blank" rel="noopener noreferrer"
class="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline">
<Icon icon="mdi:file-pdf-box" class="w-4 h-4 text-red-500" />
View Withdrawal Document
</a>
{/if}
{#each (oppositionDetail.attachments ?? []) as att}
<a href={att.url ?? att.fileUrl} target="_blank" rel="noopener noreferrer"
class="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline">
<Icon icon="mdi:file-outline" class="w-4 h-4" />
{att.name ?? att.fileName ?? 'Attachment'}
</a>
{/each}
</div>
{/if}

{#if (oppositionDetail.history ?? oppositionDetail.applicationHistory ?? []).length}
<div class="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
<h3 class="font-semibold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-1">
<Icon icon="mdi:history" class="w-4 h-4" />
Opposition History
</h3>
<div class="space-y-2">
{#each (oppositionDetail.history ?? oppositionDetail.applicationHistory ?? []) as h}
<div class="flex items-start gap-3 text-sm border-l-2 border-slate-200 pl-3 py-1">
<div>
<p class="font-medium text-slate-700">{h.action ?? h.status ?? h.description ?? '-'}</p>
<p class="text-slate-400 text-xs">{h.date ? mapDateToString(h.date) : ''}</p>
</div>
</div>
{/each}
</div>
</div>
{/if}

{#if withdrawalTab === 'requested'}
<div class="pt-4 border-t border-slate-200">
<Button class="w-full bg-primary hover:bg-primary/90 text-white" on:click={openTreatModal}>
<Icon icon="mdi:gavel" class="w-4 h-4 mr-2" />
Treat Withdrawal Request
</Button>
</div>
{/if}
</div>
{:else}
<div class="flex flex-col items-center justify-center h-full text-slate-400">
<Icon icon="mdi:alert-circle-outline" class="w-10 h-10 mb-2" />
<p class="text-sm">Could not load opposition details.</p>
</div>
{/if}
</Sheet.Content>
</Sheet.Root>

<Dialog.Root bind:open={showTreatModal}>
<Dialog.Content class="sm:max-w-md">
<Dialog.Header>
<Dialog.Title class="flex items-center gap-2">
<div class="bg-primary/10 p-1.5 rounded-lg">
<Icon icon="mdi:gavel" class="w-4 h-4 text-primary" />
</div>
Treat Withdrawal Request
</Dialog.Title>
<Dialog.Description>
Provide a reason before approving or refusing this withdrawal request.
</Dialog.Description>
</Dialog.Header>
<div class="space-y-4 py-2">
<div class="space-y-1.5">
<Label class="text-sm font-medium text-slate-700">
Reason <span class="text-red-500">*</span>
</Label>
<Textarea placeholder="Enter your reason here..." bind:value={treatReason} class="min-h-28" />
</div>
</div>
<Dialog.Footer class="flex gap-2 pt-2">
<Button variant="outline" on:click={() => (showTreatModal = false)}>Cancel</Button>
<Button variant="destructive" on:click={() => submitTreat('refuse')}>
<Icon icon="mdi:close-circle-outline" class="w-4 h-4 mr-1" />
Refuse
</Button>
<Button class="bg-green-600 hover:bg-green-700 text-white" on:click={() => submitTreat('approve')}>
<Icon icon="mdi:check-circle-outline" class="w-4 h-4 mr-1" />
Approve
</Button>
</Dialog.Footer>
</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showConfirm}>
<Dialog.Content class="sm:max-w-sm">
<Dialog.Header>
<Dialog.Title class="flex items-center gap-2">
{#if treatAction === 'approve'}
<div class="bg-green-100 p-1.5 rounded-lg">
<Icon icon="mdi:check-circle-outline" class="w-4 h-4 text-green-600" />
</div>
Confirm Approval
{:else}
<div class="bg-red-100 p-1.5 rounded-lg">
<Icon icon="mdi:close-circle-outline" class="w-4 h-4 text-red-600" />
</div>
Confirm Refusal
{/if}
</Dialog.Title>
<Dialog.Description>
{#if treatAction === 'approve'}
Are you sure you want to approve this withdrawal? The opposition status will be set to Withdrawn and the file status will be updated to Awaiting Certification.
{:else}
Are you sure you want to refuse this withdrawal? No status changes will be made.
{/if}
</Dialog.Description>
</Dialog.Header>
<Dialog.Footer class="flex gap-2 pt-2">
<Button variant="outline" on:click={() => { showConfirm = false; showTreatModal = true; }} disabled={isTreating}>
Back
</Button>
<Button
class="{treatAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white"
on:click={confirmTreat}
disabled={isTreating}
>
{#if isTreating}
<Icon icon="line-md:loading-loop" class="w-4 h-4 mr-1" />
Processing...
{:else}
{treatAction === 'approve' ? 'Yes, Approve' : 'Yes, Refuse'}
{/if}
</Button>
</Dialog.Footer>
</Dialog.Content>
</Dialog.Root>

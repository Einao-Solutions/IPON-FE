﻿<script lang="ts">
import {
baseURL,
type TicketInfo,
TicketStates,
UserRoles,
TicketCategory
} from '$lib/helpers';
import { Textarea } from '$lib/components/ui/textarea';

import * as AlertDialog from '$lib/components/ui/alert-dialog';
import { Button } from '$lib/components/ui/button';
import { Input } from '$lib/components/ui/input';
import { mapDateToString } from '../components/dashboardutils';
import { toast } from 'svelte-sonner';
import { Toaster } from '$lib/components/ui/sonner';
import TicketTag from '$lib/components/ui/ticketTag/ticketTag.svelte';
import { loggedInUser } from '$lib/store';
import Icon from '@iconify/svelte';
import { mapCategoryToString, mapTicketStateToString } from './supportutils';

export let data: TicketInfo;
export let open: boolean = false;
export let onExit: () => void = () => {};

let newText: string = '';
let selectedFile: File | null = null;
let selectedFileName: string = '';
let isUploading: boolean = false;
let showEscalateDialog: boolean = false;
let selectedEscalationTarget: TicketCategory = TicketCategory.TechnicalSupport;
let isEscalating: boolean = false;

const name = ($loggedInUser?.firstName ?? '') + ' ' + ($loggedInUser?.lastName ?? '');

$: isTrademarkSupport = $loggedInUser?.userRoles?.includes(UserRoles.TrademarkSupport) ?? false;
$: isPatentDesignSupport = $loggedInUser?.userRoles?.includes(UserRoles.PatentDesignSupport) ?? false;
$: isTechSupport = $loggedInUser?.userRoles?.includes(UserRoles.Tech) ?? false;
$: isRegistrySupport = isTrademarkSupport || isPatentDesignSupport;

$: escalationTargets = isTechSupport
? [
{ value: TicketCategory.TrademarkRegistry, label: 'Trademark Registry Support' },
{ value: TicketCategory.PatentDesignRegistry, label: 'Patent & Design Registry Support' }
]
: isRegistrySupport
? [{ value: TicketCategory.TechnicalSupport, label: 'Technical Support' }]
: [];



let _lastEscalateDialogOpen = false;

$: if (escalationTargets.length > 0) {
	const availableValues = new Set(escalationTargets.map((t) => t.value));
	const dialogJustOpened = showEscalateDialog && !_lastEscalateDialogOpen;
	
	// Set default only when the dialog first opens (prevents selection from snapping back
	// while user is interacting).
	if (dialogJustOpened) {
		selectedEscalationTarget = escalationTargets[0].value;
	} else if (!availableValues.has(selectedEscalationTarget)) {
		selectedEscalationTarget = escalationTargets[0].value;
	}

	_lastEscalateDialogOpen = showEscalateDialog;
}



$: dataExt = data as any;
$: ticketCategory = dataExt?.category ?? null;
$: ticketIsEscalated = dataExt?.isEscalated ?? false;
$: ticketEscalatedFromCategory = dataExt?.escalatedFromCategory ?? null;

$: canEscalate =
(isRegistrySupport || isTechSupport) &&
data?.status !== TicketStates.closed &&
escalationTargets.length > 0 &&
// Tech is allowed to escalate again even if the ticket was escalated before,
// so long as the user has an escalation target available.
// For registry support roles, keep the original “only if not escalated” behavior.
(isTechSupport || !ticketIsEscalated);

$: userInitials = (() => {
const parts = (name ?? '').trim().split(' ').filter(Boolean);
if (parts.length === 0) return '?';
if (parts.length === 1) return parts[0][0].toUpperCase();
return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
})();

function getSenderInitials(senderName: string | undefined): string {
if (!senderName) return '?';
const parts = senderName.trim().split(' ').filter(Boolean);
if (parts.length === 1) return parts[0][0].toUpperCase();
return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function confirmAndEscalateTicket() {
// Confirm with user before performing escalation
if (!window.confirm(`Confirm escalation to: ${escalationTargets.find((t) => t.value === selectedEscalationTarget)?.label ?? 'the selected team'}?`)) {
	return;
}

isEscalating = true;
const target = escalationTargets.find((t) => t.value === selectedEscalationTarget);
const autoMessage = `This ticket has been escalated to ${target?.label ?? 'the appropriate team'} for further assistance.`;
const response = await fetch(`${baseURL}/api/tickets/Escalate`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
ticketId: data?.id,
escalateToCategory: selectedEscalationTarget,
escalatedById: $loggedInUser?.creatorId,
escalatedByName: name,
autoMessage
})
});
if (response.ok) {
toast.success('Ticket escalated successfully', { position: 'top-right' });
showEscalateDialog = false;
dataExt.isEscalated = true;
data = data;
} else {
toast.error('Failed to escalate ticket', { position: 'top-right' });
}
isEscalating = false;
}

async function addCorrespondence() {
if (!newText.trim() && !selectedFile) return;
isUploading = true;
let attachmenturl: any = null;
if (selectedFile) {
const result = await fetch(`${baseURL}/api/files/uploadAttachment`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify([{
fileName: selectedFile.name,
Name: '',
contentType: selectedFile.type,
data: arrayBufferToBase64(await toByteArray(selectedFile))
}])
});
attachmenturl = await result.json();
}
const response = await fetch(`${baseURL}/api/tickets/AddMessage`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
ticketId: data.id,
newStatus: $loggedInUser?.creatorId === data.creatorId ? TicketStates.awaitingStaff : TicketStates.awaitingUser,
correspondence: attachmenturl !== null
? { message: newText, attachment: attachmenturl[0], senderId: $loggedInUser?.creatorId, senderName: name }
: { message: newText, senderId: $loggedInUser?.creatorId, senderName: name }
})
});
if (response.ok) { data = await response.json(); }
isUploading = false;
newText = '';
selectedFile = null;
selectedFileName = '';
}

function fileChanged(event: Event) {
const input = event.target as HTMLInputElement;
if (!input.files || input.files.length === 0) return;
if (input.files[0].size > 5000000) {
toast.error('Maximum file size of 5MB exceeded', { position: 'top-right' });
return;
}
selectedFile = input.files[0];
selectedFileName = input.files[0].name;
}

function clearFile() { selectedFile = null; selectedFileName = ''; }

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
		let binary = '';
		const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
return window.btoa(binary);
}

function toByteArray(file: File): Promise<Uint8Array> {
return new Promise<ArrayBuffer>((resolve, reject) => {
const reader = new FileReader();
reader.onload = () => resolve(reader.result as ArrayBuffer);
reader.onerror = reject;
reader.readAsArrayBuffer(file);
}).then((ab) => new Uint8Array(ab));
}

function relativeTime(dateStr: string): string {
if (!dateStr) return '';
const d = new Date(dateStr);
const now = new Date();
const diffMs = now.getTime() - d.getTime();
const mins = Math.floor(diffMs / 60000);
if (mins < 1) return 'just now';
if (mins < 60) return `${mins}m ago`;
const hrs = Math.floor(mins / 60);
if (hrs < 24) return `${hrs}h ago`;
const days = Math.floor(hrs / 24);
if (days < 7) return `${days}d ago`;
return mapDateToString(dateStr);
}

function statusColor(s: number): string {
// Keep colors consistent with TicketTag
if (s === 0) return 'bg-yellow-400';
if (s === 1) return 'bg-blue-400';
return 'bg-green-400';
}
</script>

<Toaster />

<!-- Escalation dialog -->
<AlertDialog.Root bind:open={showEscalateDialog}>
<AlertDialog.Content>
<AlertDialog.Header>
<AlertDialog.Title>Escalate Ticket</AlertDialog.Title>
<AlertDialog.Description>
{#if escalationTargets.length > 1}
Select the team to escalate this ticket to:
{:else}
Escalate this ticket to <strong>{escalationTargets[0]?.label}</strong>?
{/if}
</AlertDialog.Description>
</AlertDialog.Header>
{#if escalationTargets.length > 1}
<div class="flex flex-col gap-2 py-2">
{#each escalationTargets as target}
<label class="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 border-2 transition-colors {selectedEscalationTarget === target.value ? 'border-green-600 bg-green-50' : 'border-slate-200'}">
<input
	type="radio"
	name="escalation-target"
	value={target.value}
	bind:group={selectedEscalationTarget}
	class="accent-green-700"
	aria-label={target.label}
/>
<span class="text-sm font-medium">{target.label}</span>
</label>
{/each}
</div>
{/if}
<AlertDialog.Footer>
<AlertDialog.Cancel on:click={() => (showEscalateDialog = false)}>Cancel</AlertDialog.Cancel>
<Button disabled={isEscalating} on:click={confirmAndEscalateTicket} class="bg-red-600 hover:bg-red-700 text-white">
{#if isEscalating}<Icon icon="eos-icons:loading" width="1rem" height="1rem" class="mr-2" />{/if}
Escalate
</Button>
</AlertDialog.Footer>
</AlertDialog.Content>
</AlertDialog.Root>

{#if open}
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm p-4"
	role="dialog"
	aria-modal="true"
>

	<div
		class="w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden bg-slate-50 flex flex-col"
	>


		<!-- ── Top bar ─────────────────────────────────────────────────── -->

<div class="flex items-center justify-between px-3 py-3 bg-white border-b flex-shrink-0">
<div class="flex items-center gap-3 min-w-0">
<button
	class="flex-shrink-0 rounded-md p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 transition-colors"
	aria-label="Close"
	on:click={onExit}
>
	<Icon icon="mdi:close" width="1rem" height="1rem" />
</button>

<div class="flex-shrink-0 w-2 h-2 rounded-full {statusColor(data?.status ?? 2)}"></div>
<p class="text-xs font-mono text-slate-500 flex-shrink-0">
{dataExt?.ticketNumber ?? '#—'}
</p>
<h2 class="font-semibold text-slate-800 text-sm truncate">{data?.title ?? '—'}</h2>
</div>
<div class="flex items-center gap-2 flex-shrink-0 ml-3">
{#if canEscalate}
<Button
	variant="outline"
	size="sm"
	class="border-red-500 text-red-600 hover:bg-red-50 h-8 text-xs"
	on:click={() => (showEscalateDialog = true)}
>
	<Icon icon="mdi:arrow-up-circle-outline" width="0.9rem" height="0.9rem" class="mr-1" />
	Escalate
</Button>
{/if}
<TicketTag state={data?.status ?? 2} />
</div>
</div>

<!-- ── Two-panel body ──────────────────────────────────────────── -->
<div class="flex flex-1 min-h-0 overflow-hidden">

<!-- LEFT: meta panel -->
<aside class="w-56 flex-shrink-0 border-r bg-white overflow-y-auto flex flex-col max-h-[80vh]">
<!-- Creator -->
<div class="px-4 pt-5 pb-4 border-b">
<div class="flex items-center gap-3">
<div class="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
{getSenderInitials(data?.creatorName)}
</div>
<div class="min-w-0">
<p class="text-xs font-semibold text-slate-800 truncate">{data?.creatorName ?? '—'}</p>
<p class="text-[10px] text-slate-400">Creator</p>
</div>
</div>
</div>

<!-- Ticket details -->
<div class="px-4 py-4 space-y-4 flex-1">
<div>
<p class="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Created</p>
<p class="text-xs text-slate-700 font-medium">{data?.created ? mapDateToString(data.created) : '—'}</p>
</div>

{#if ticketCategory !== null}
<div>
<p class="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Category</p>
<p class="text-xs text-slate-700 font-medium">{mapCategoryToString(ticketCategory)}</p>
</div>
{/if}

<div>
<p class="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Status</p>
<div class="flex items-center gap-1.5">
<div class="w-1.5 h-1.5 rounded-full {statusColor(data?.status ?? 2)}"></div>
<p class="text-xs text-slate-700 font-medium">{mapTicketStateToString(data?.status ?? 2)}</p>
</div>
</div>

{#if ticketIsEscalated}
<div>
<p class="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Escalation</p>
<div class="flex items-center gap-1.5">
<Icon icon="mdi:arrow-up-circle" width="0.9rem" height="0.9rem" class="text-red-500 flex-shrink-0" />
<p class="text-xs text-red-600 font-medium">
Escalated{ticketEscalatedFromCategory !== null ? ` from ${mapCategoryToString(ticketEscalatedFromCategory)}` : ''}
</p>
</div>
</div>
{/if}

{#if data?.affectedFiles && data.affectedFiles.length > 0}
<div>
<p class="text-[10px] uppercase tracking-wide text-slate-400 mb-2">Affected Files</p>
<div class="flex flex-col gap-1">
{#each data.affectedFiles as file}
<a href="/dataview?id={file.id}" class="text-xs text-blue-600 hover:underline truncate font-medium">
{file.fileNumber}
</a>
{/each}
</div>
</div>
{/if}
</div>

<!-- Timeline mini -->
<div class="px-4 py-4 border-t flex-shrink-0 overflow-y-auto max-h-52">
<p class="text-[10px] uppercase tracking-wide text-slate-400 mb-3">Timeline</p>
<div class="relative pl-4">
<div class="absolute left-1.5 top-0 bottom-0 w-px bg-slate-200"></div>

<div class="relative mb-3">
<div class="absolute -left-[13px] top-0.5 w-2 h-2 rounded-full bg-green-600 ring-2 ring-white"></div>
<p class="text-[10px] font-medium text-slate-600">Created</p>
<p class="text-[10px] text-slate-400">{data?.created ? relativeTime(data.created) : '—'}</p>
</div>

{#if data?.correspondences && data.correspondences.length > 1}
<div class="relative mb-3">
<div class="absolute -left-[13px] top-0.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white"></div>
<p class="text-[10px] font-medium text-slate-600">First Reply</p>
<p class="text-[10px] text-slate-400">{relativeTime(data.correspondences[1]?.dateAdded ?? '')}</p>
</div>
{/if}

{#if ticketIsEscalated}
<div class="relative mb-3">
<div class="absolute -left-[13px] top-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></div>
<p class="text-[10px] font-medium text-red-600">Escalated</p>
<p class="text-[10px] text-slate-400">{dataExt?.escalatedAt ? relativeTime(dataExt.escalatedAt) : ''}</p>
</div>
{/if}

{#if data?.status === TicketStates.closed}
<div class="relative">
<div class="absolute -left-[13px] top-0.5 w-2 h-2 rounded-full bg-slate-500 ring-2 ring-white"></div>
<p class="text-[10px] font-medium text-slate-600">Closed</p>
<p class="text-[10px] text-slate-400">{data?.resolution ? relativeTime(data.resolution.date) : ''}</p>
</div>
{/if}
</div>
</div>
</aside>

<!-- RIGHT: conversation + composer -->
<div class="flex flex-col flex-1 overflow-hidden">
<!-- Message thread -->
<div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
{#if data?.correspondences && data.correspondences.length > 0}
{#each data.correspondences as message, i}
{@const isCreator = message.senderId === data.creatorId}
{@const isSystem = message.senderId === 'system'}
{#if isSystem}
<!-- System / escalation message -->
<div class="flex items-center justify-center gap-2">
<div class="h-px flex-1 bg-slate-200"></div>
<div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 border border-red-200">
<Icon icon="mdi:arrow-up-circle" width="0.75rem" height="0.75rem" class="text-red-500" />
<span class="text-[10px] font-medium text-red-700">{message.message}</span>
</div>
<div class="h-px flex-1 bg-slate-200"></div>
</div>
{:else}
<div class="flex {isCreator ? 'flex-row-reverse' : 'flex-row'} items-end gap-2">
<!-- Avatar -->
<div class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold {isCreator ? 'bg-gradient-to-br from-green-500 to-green-800' : 'bg-gradient-to-br from-slate-500 to-slate-700'}">
{getSenderInitials(message.senderName)}
</div>
<!-- Bubble -->
<div class="max-w-[72%] flex flex-col {isCreator ? 'items-end' : 'items-start'}">
<div class="flex items-center gap-2 mb-1 px-1 text-[10px] text-slate-400">
<span class="font-medium text-slate-600">{isCreator ? 'You' : message.senderName}</span>
<span>·</span>
<span>{relativeTime(message.dateAdded)}</span>
</div>
<div class="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm
{isCreator ? 'bg-green-700 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}">
<div>{@html message.message}</div>
{#if message.attachment}
<a target="_blank" rel="noopener noreferrer" href={message.attachment}
class="mt-2 inline-flex items-center gap-1 text-xs font-medium {isCreator ? 'text-green-100 hover:text-white' : 'text-blue-600 hover:underline'}">
<Icon icon="mdi:paperclip" width="0.85rem" height="0.85rem" />
View attachment
</a>
{/if}
</div>
</div>
</div>
{/if}
{/each}
{:else}
<div class="flex items-center justify-center h-full text-sm text-muted-foreground">
No messages yet.
</div>
{/if}
</div>

<!-- Composer -->
<div class="border-t bg-white flex-shrink-0">
{#if data?.status !== TicketStates.closed}
<div class="p-3 space-y-2">
<Textarea class="min-h-16 max-h-40 resize-none text-sm" placeholder="Type your reply…" bind:value={newText} />

<div class="flex items-center gap-2">
<!-- Attachment pill / upload -->
{#if selectedFileName}
<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 border border-green-300 text-xs text-green-800 min-w-0 max-w-[180px]">
<Icon icon="mdi:paperclip" width="0.8rem" height="0.8rem" class="flex-shrink-0" />
<span class="truncate">{selectedFileName}</span>
<button type="button" on:click={clearFile} class="text-green-600 hover:text-red-500 flex-shrink-0" aria-label="Remove">
<Icon icon="mdi:close" width="0.75rem" height="0.75rem" />
</button>
</div>
{:else}
<label class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 text-xs text-slate-500 cursor-pointer hover:border-green-400 hover:text-green-700 transition-colors">
<Icon icon="mdi:paperclip" width="0.85rem" height="0.85rem" />
Attach
<input type="file" class="sr-only" accept=".pdf,.jpg,.png,.jpeg" on:change={fileChanged} />
</label>
{/if}

<div class="flex-1"></div>

<!-- Char hint -->
{#if newText.length > 0}
<span class="text-[10px] text-slate-400">{newText.length} chars</span>
{/if}

<Button size="sm" class="h-8 px-4" disabled={isUploading || (!newText.trim() && !selectedFile)} on:click={addCorrespondence}>
{#if isUploading}
<Icon icon="line-md:loading-loop" width="0.9rem" height="0.9rem" class="mr-1" />
Sending
{:else}
<Icon icon="lucide:send" width="0.9rem" height="0.9rem" class="mr-1" />
Send
{/if}
</Button>
</div>
</div>
{:else}
<div class="px-4 py-3 flex items-center gap-2 text-sm text-slate-500 bg-slate-50">
<Icon icon="mdi:lock-outline" width="1rem" height="1rem" class="flex-shrink-0" />
<span>
Ticket closed by <strong>{data.resolution?.staffName ?? '—'}</strong>
{#if data.resolution} · {mapDateToString(data.resolution.date)}{/if}
</span>
</div>
{/if}
</div>
</div>
</div>

	</div>
</div>
{/if}


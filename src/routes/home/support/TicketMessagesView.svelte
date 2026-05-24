<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { baseURL, type TicketInfo, TicketStates } from '$lib/helpers';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Sheet from '$lib/components/ui/sheet/index';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { mapDateToString } from '../components/dashboardutils';
	import { mapTicketStateToString } from './supportutils';
	import { toast } from 'svelte-sonner';
	import TicketTag from '$lib/components/ui/ticketTag/ticketTag.svelte';
	import { loggedInUser } from '$lib/store';
	import Icon from '@iconify/svelte';

	export let data: TicketInfo;
	export let open: boolean = false;
	let newText: string = '';
	let selectedFile: File | null = null;
	let isUploading = false;
	const name = $loggedInUser?.firstName + ' ' + $loggedInUser?.lastName;
	async function addCorrespondence() {
		isUploading = true;
		let attachmenturl: string | null = null;
		if (selectedFile) {
			const result = await fetch(`${baseURL}/api/files/uploadAttachment`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},

				body: JSON.stringify([
					{
						fileName: selectedFile.name,
						Name: '',
						contentType: selectedFile.type,
						data: arrayBufferToBase64(await toByteArray(selectedFile))
					}
				])
			});
			attachmenturl = await result.json();
		}

		let response = await fetch(`${baseURL}/api/tickets/AddMessage`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				ticketId: data.id,
				newStatus:
					$loggedInUser?.creatorId === data.creatorId
						? TicketStates.awaitingStaff
						: TicketStates.awaitingUser,
				correspondence:
					attachmenturl !== null
						? {
								message: newText,
								attachment: attachmenturl[0],
								senderId: $loggedInUser?.creatorId,
								senderName: name
							}
						: {
								message: newText,
								senderId: $loggedInUser?.creatorId,
								senderName: name
							}
			})
		});

		if (response.ok) {
			const result = await response.json();
			data = result;
		}
		isUploading = false;
		newText = '';
		selectedFile = null;
	}
	async function fileChanged(event: Event | null) {
		const input = event?.target as HTMLInputElement;
		if (input.files) {
			if (input.files.length > 1) {
				toast.error('maximum of 1 images', {
					position: 'top-right'
				});
				return;
			}
			for (let i = 0; i < input.files.length; i++) {
				if (input.files[i].size > 5000000) {
					toast.error('maximum file size of 5MB exceeded', {
						position: 'top-right'
					});
					return;
				}
			}

			for (let i = 0; i < input.files.length; i++) {
				selectedFile = input.files[0];
			}
		}
	}

	function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array) {
		let binary = '';
		const bytes = new Uint8Array(buffer);
		const len = bytes.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return window.btoa(binary);
	}

	function toByteArray(file: File) {
		return new Promise<ArrayBuffer>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as ArrayBuffer);
			reader.onerror = reject;
			reader.readAsArrayBuffer(file);
		}).then((arrayBuffer) => new Uint8Array(arrayBuffer));
	}

	function formatStaffName(fullName: string | undefined | null): string {
		if (!fullName) return '';
		const parts = fullName.trim().split(/\s+/);
		if (parts.length === 1) return parts[0];
		const first = parts[0];
		const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
		return `${first} ${lastInitial}.`;
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content class="overflow-y-auto w-full sm:max-w-xl p-0 flex flex-col bg-slate-50">
		<!-- Header -->
		<header class="px-5 pt-5 pb-4 border-b bg-white sticky top-0 z-10">
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0">
					<p class="text-xs uppercase tracking-wide text-muted-foreground">Ticket</p>
					<h2 class="text-lg font-semibold leading-snug line-clamp-2 mt-0.5">{data.title}</h2>
				</div>
				<TicketTag state={data.status} />
			</div>

			<dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
				<div class="flex flex-col">
					<dt class="text-xs text-muted-foreground">Created by</dt>
					<dd class="font-medium truncate">{data.creatorName}</dd>
				</div>
				<div class="flex flex-col">
					<dt class="text-xs text-muted-foreground">Date created</dt>
					<dd class="font-medium truncate">{mapDateToString(data.created)}</dd>
				</div>
			</dl>

			{#if data.affectedFiles && data.affectedFiles.length > 0}
				<div class="mt-4">
					<p class="text-xs text-muted-foreground mb-1.5">Affected files</p>
					<div class="flex flex-wrap gap-1.5">
						{#each data.affectedFiles as file}
							<a
								class="px-2 py-0.5 text-xs rounded-full border bg-slate-100 hover:bg-slate-200 transition-colors"
								href="/dataview?id={file.id}"
							>
								{file.fileNumber}
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</header>

		<!-- Conversation -->
		<div class="flex-1 px-4 py-4 space-y-3">
			{#each data.correspondences as message}
				{@const isCreator = message.senderId === data.creatorId}
				<div class="flex {isCreator ? 'justify-end' : 'justify-start'}">
					<div class="max-w-[85%] flex flex-col {isCreator ? 'items-end' : 'items-start'}">
						<div class="flex items-center gap-2 mb-1 px-1 text-xs text-muted-foreground">
							<span class="font-medium text-foreground/80">
								{isCreator ? message.senderName : formatStaffName(message.senderName)}
							</span>
							<span aria-hidden="true">·</span>
							<span>{mapDateToString(message.dateAdded)}</span>
						</div>
						<div
							class="px-3 py-2 rounded-2xl shadow-sm text-sm leading-relaxed break-words
								{isCreator
									? 'bg-emerald-100 text-emerald-950 rounded-br-sm'
									: 'bg-white border text-slate-800 rounded-bl-sm'}"
						>
							<div class="content prose prose-sm max-w-none">{@html message.message}</div>
							{#if message.attachment}
								<a
									target="_blank"
									rel="noopener"
									href={message.attachment}
									class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
								>
									<Icon icon="typcn:attachment-outline" width="1rem" height="1rem" />
									View attachment
								</a>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Composer / Footer -->
		<Sheet.Footer class="border-t bg-white p-4 sticky bottom-0">
			{#if data.status !== TicketStates.closed}
				<div class="w-full space-y-2">
					<Textarea
						class="min-h-20 resize-none"
						placeholder="Type your reply…"
						bind:value={newText}
					/>
					<div class="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
						<div class="flex items-center gap-2 min-w-0">
							<Label for="picture" class="text-xs text-muted-foreground whitespace-nowrap">
								Attachment (optional)
							</Label>
							<Input
								id="picture"
								type="file"
								class="h-9 text-xs"
								accept=".pdf, .jpg, .png, .jpeg"
								multiple={false}
								on:change={(event) => fileChanged(event)}
							/>
						</div>
						<Button
							class="sm:w-auto w-full"
							disabled={isUploading || (!newText && !selectedFile)}
							on:click={() => addCorrespondence()}
						>
							{#if isUploading}
								<Icon icon="line-md:loading-loop" width="1.1rem" height="1.1rem" class="mr-2" />
								Sending
							{:else}
								<Icon icon="lucide:send" width="1rem" height="1rem" class="mr-2" />
								Send
							{/if}
						</Button>
					</div>
				</div>
			{:else}
				<div class="w-full rounded-md border border-dashed bg-slate-50 p-4 text-center">
					<p class="text-sm font-medium text-slate-700">
						Ticket closed — comments can't be added
					</p>
					<p class="text-xs text-muted-foreground mt-1">
						Closed by {data.resolution?.staffName ?? ''}
						{#if data.resolution}
							· {mapDateToString(data.resolution.date)}
						{/if}
					</p>
				</div>
			{/if}
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>

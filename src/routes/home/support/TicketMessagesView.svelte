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
					$loggedInUser.id === data.creatorId
						? TicketStates.awaitingStaff
						: TicketStates.awaitingUser,
				correspondence:
					attachmenturl !== null
						? {
								message: newText,
								attachment: attachmenturl[0],
								senderId: $loggedInUser.id,
								senderName: $loggedInUser.name
							}
						: {
								message: newText,
								senderId: $loggedInUser.id,
								senderName: $loggedInUser.name
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

	function arrayBufferToBase64(buffer) {
		let binary = '';
		const bytes = new Uint8Array(buffer);
		const len = bytes.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return window.btoa(binary);
	}

	function toByteArray(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsArrayBuffer(file);
		}).then((arrayBuffer) => new Uint8Array(arrayBuffer));
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content class="overflow-y-auto">
		<div class="grid gap-4 sm:grid-cols-3 grid-cols-2 border rounded-md m-1 p-1">
			<div>
				<Label for="creator">Created by</Label>
				<div id="creator" class="border rounded-md flex">
					<p class="text-sm">{data.creatorName}</p>
				</div>
			</div>
			<div>
				<Label for="status">Status</Label>
				<TicketTag state={data.status} />
			</div>
			<div>
				<Label for="creationdate">Date Created</Label>
				<div id="creationdate" class="border rounded-md flex">
					<p class="text-sm">{mapDateToString(data.created)}</p>
				</div>
			</div>
		</div>
		<div>
			<Label for="title">Title</Label>
			<div id="title">
				<p class="p-2 border rounded-md">{data.title}</p>
			</div>
		</div>
		{#if data.affectedFiles}
			<Label>Affected Files</Label>
			<div class="grid grid-cols-2 text-sm">
				{#each data.affectedFiles as file}
					<a class="p-1 m-1 border rounded-md" href="/dataview?id={file.id}">{file.fileNumber}</a>
				{/each}
			</div>
		{/if}
		<!--		<ScrollArea class="p-1 h-1/2 border rounded-md w-full">-->
		{#each data.correspondences as message}
			<div
				class="p-2 m-2 rounded-md {message.senderId === data.creatorId
					? 'bg-green-300'
					: 'bg-gray-300'} {message.senderId === data.creatorId ? 'justify-end' : 'justify-start'}"
			>
				<div class="content"> {@html message.message}</div>
				<p class="mt-2 opacity-60 text-sm">{mapDateToString(message.dateAdded)}</p>
				<div class="flex justify-between">
					<p class="opacity-50 text-sm">{message.senderName}</p>
					{#if message.attachment}
						<a target="_blank" href={message.attachment}>
							<Icon icon="typcn:attachment-outline" width="1.2rem" height="1.2rem" />
						</a>
					{/if}
				</div>
			</div>
		{/each}
		<Sheet.Footer>
			{#if data.status !== TicketStates.closed}
				<div>
					<Textarea class="min-h-16 mt-2" placeholder="Enter text" bind:value={newText} />
					<div class="flex gap-2 mt-1 items-center">
						<p class="opacity-50 text-sm">attachment (optional)</p>
						<Input
							id="picture"
							type="file"
							class="mt-3"
							accept=".pdf, .jpg, .png, .jpeg"
							multiple={false}
							on:change={(event) => fileChanged(event)}
						/>
						<Button on:click={() => addCorrespondence()}>
							<Icon
								class={isUploading ? '' : 'hidden'}
								icon="line-md:loading-loop"
								width="1.2rem"
								height="1.2rem"
							/>
							<p>Send</p></Button
						>
					</div>
				</div>
			{:else}
				<div class="flex flex-col w-full">
					<div class="flex justify-center w-full items-center">
						<p>Ticket closed, comments can't be added</p>
					</div>
					<p class="mt-2">Closed by {data.resolution.staffName}</p>
					<p class="text-sm font-light">{mapDateToString(data.resolution.date)}</p>
				</div>
			{/if}
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>

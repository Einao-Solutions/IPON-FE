<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Command from '$lib/components/ui/command/index';
	import * as Popover from '$lib/components/ui/popover/index';
	import { type AffectedFiles, baseURL, UserRoles } from '$lib/helpers';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import { ChevronsUpDown } from 'lucide-svelte';
	import Check from 'lucide-svelte/icons/check';
	import { cn } from '$lib/utils';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { Toaster } from '$lib/components/ui/sonner';
	import { appattachmentsData, loggedInUser } from '$lib/store';
	import { onMount } from 'svelte';
	import { PatentAttachments } from '$lib/designutils';
	export let onExit: () => void;
	export let open: boolean;
	let openFiles: boolean = false;
	export let affectedFiles: AffectedFiles[] | null = null;
	export let allUserFiles: AffectedFiles[] = [];
	let currentView: number = 0;
	let statusMessage: string | null = null;
	let isSavingTicket: boolean = false;
	let selectedFile: File | null = null;
	let reason: string = null;
	let titleOfTicket: string = null;
	function removeSelected(selected: AffectedFiles) {
		let index = affectedFiles?.findIndex((x) => x.fileID === selected.fileID);
		if (index !== undefined) {
			affectedFiles?.splice(index, 1);
			affectedFiles = [...affectedFiles];
		}
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

	async function saveNewTicket() {
		isSavingTicket = true;
		let attachmenturl: null | string = null;
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
		const response = await fetch(`${baseURL}/api/tickets/Create`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				title: titleOfTicket,
				creatorId: $loggedInUser.id,
				creatorName: $loggedInUser.name,
				affectedFiles: affectedFiles!==null? affectedFiles.map(x=>({id:x.id, fileNumber:x.fileID})):null,
				status: 1,
				correspondences: [
					attachmenturl == null
						? {
								message: reason,
								senderId: $loggedInUser.id,
								senderName: $loggedInUser.name
							}
						: {
								attachment: attachmenturl[0],
								message: reason,
								senderId: $loggedInUser.id,
								senderName: $loggedInUser.name
							}
				]
			})
		});
		if (response.ok) {
			const latestTicket = await response.json();
			console.log(latestTicket);
			isSavingTicket = false;
			statusMessage = 'success';
			currentView = 2;
			if (statusMessage === 'success') {
				toast.success('saved successfully', { position: 'top-right' });
			} else {
				toast.error('Failed to save', { position: 'top-right' });
			}
		}
	}

	function exitView() {
		onExit();
		isSavingTicket = false;
		statusMessage = null;
		currentView = 0;
	}
</script>

<Toaster />
<div>
	<Sheet.Root
		bind:open
		onOpenChange={(val) => {
			if (!val) {
				onExit();
			}
		}}
	>
		<Sheet.Content side="right" class="overflow-y-auto sm:w-[620px] w-full">
			<Sheet.Header>
				<Sheet.Title>New Ticket</Sheet.Title>
				<Sheet.Description
					>Select affected files, Enter details and attachments(if any)
				</Sheet.Description>
			</Sheet.Header>
			{#if currentView === 0}
				<div>
					{#if affectedFiles !== null}
						<Popover.Root bind:open={openFiles}>
							<Popover.Trigger asChild let:builder>
								<Button
									builders={[builder]}
									variant="outline"
									role="combobox"
									aria-expanded={open}
									class="w-full h-fit justify-between"
								>
									<div class="grid sm:grid-cols-2 grid-cols-3 gap-1">
										{#if affectedFiles && affectedFiles.length > 0}
											{#each affectedFiles as affected}
												<div
													class="flex gap-1 items-center p-0.5 border w-fit rounded-md"
													style="font-size: 12px"
												>
													<p>{affected.fileID}</p>
													<div
														class="w-6 flex h-6 items-center justify-center border rounded-md"
														on:click={() => removeSelected(affected)}
													>
														<Icon
															class="w-5 h-5 p-0"
															icon="material-symbols-light:cancel-outline"
														/>
													</div>
												</div>
											{/each}
										{:else}
											<p>Select files</p>
										{/if}
									</div>
									<ChevronsUpDown
										class="ml-2 h-4 w-4 shrink-0 opacity-50 {affectedFiles?.length > 0
											? 'hidden'
											: ''} "
									/>
								</Button>
							</Popover.Trigger>
							<Popover.Content class="w-fit p-0">
								<Command.Root>
									<Command.Input placeholder="Search your file..." />
									<Command.Empty>No file found.</Command.Empty>
									<Command.Group>
										{#each allUserFiles as file}
											<Command.Item
												value={file.fileID}
												onSelect={() => {
													if (affectedFiles) {
														affectedFiles.push(file);
													} else {
														affectedFiles = [file];
													}
													affectedFiles = [...affectedFiles];
												}}
											>
												<Check
													class={cn(
														'mr-2 h-4 w-4',
														affectedFiles?.includes(file) && 'text-transparent'
													)}
												/>
												<div>
													<p>{file.fileID}</p>
													<p class="text-ellipsis line-clamp-1">{file.title}</p>
													<br />
												</div>
											</Command.Item>
										{/each}
									</Command.Group>
								</Command.Root>
							</Popover.Content>
						</Popover.Root>
					{/if}
					<Input placeholder="Briefly describe the title" bind:value={titleOfTicket} />
					<Textarea
						class="min-h-24 mt-3"
						placeholder="What's the issue you are facing?"
						bind:value={reason}
					/>
					<Input
						id="picture"
						type="file"
						class="mt-3"
						accept=".pdf, .jpg, .png, .jpeg"
						multiple={false}
						on:change={(event) => fileChanged(event)}
					/>
					<Label for="picture">Attachment not required (pdf, jpeg or png)</Label>
				</div>
				<div class="flex justify-end gap-4 mt-10">
					<Button on:click={() => exitView()} variant="outline">Cancel</Button>
					<Button on:click={() => (currentView = 1)}>Continue</Button>
				</div>
			{:else if currentView === 1}
				<div class="flex flex-col space-y-5 my-4">
					<p>Are you sure you want to create the ticket?</p>
					<div class="flex justify-end space-x-5">
						<Button variant="outline">Cancel</Button>
						<Button disabled={isSavingTicket} on:click={() => saveNewTicket()}>
							<Icon
								class={!isSavingTicket ? 'hidden' : ''}
								icon="eos-icons:loading"
								width="1.2rem"
								height="1.2rem"
							/>
							Continue</Button
						>
					</div>
				</div>
				<!--				confirmation-->
			{:else if currentView === 2}
				<!--				success failure-->
				{#if statusMessage === 'success'}
					<p>Saved new ticket successfully, you would be notified when there is a response</p>
				{:else}
					<p>Failed to create ticket, please try again later</p>
				{/if}
				<p>{statusMessage}</p>
				<Button on:click={() => exitView()}>Ok</Button>
			{/if}
		</Sheet.Content>
	</Sheet.Root>
</div>

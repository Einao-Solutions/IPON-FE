<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { writable } from 'svelte/store';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import {
		formsData,
		applicationScreen,
		savePageData,
		applicationMode,
		applicationData,
		pageSaveStatus,
		changesMade,
		validatePage,
		validatedPages,
		appattachmentsData
	} from '$lib/store.js';
	import { onMount } from 'svelte';
	import type { AttachmentType, BasicType, Priority } from '$lib/helpers';
	import {
		mapPatentAttInToString,
		mapPatentAttStrToInt, mapTradeAttInToString,
		TrademarkAttachments
	} from '$lib/designutils';
	import { toast } from 'svelte-sonner';
	import { objsHasDiff } from '../../apphelper';
	let attachments: AttachmentType[] = [];
	let showResetButton: boolean = false;
	let attachmentsList = TrademarkAttachments;
	let powLink: string | undefined = undefined;
	let repLink: string | undefined = undefined;
	let other1Link: string | undefined = undefined;
	let other2Link: string | undefined = undefined;
	type UploadStatus = {
		type: string;
		status: boolean | null;
		url: string | null;
		showError: boolean | null;
	};
	let attachmentLoadingStatus = writable<UploadStatus[]>([]);
	let showRequiredErrors = writable<string[]>([]);
	let showSizeError = writable<boolean>(false);
	let isLoading = true;
	let isUploaded = {};
	onMount(() => {
		isLoading = true;
		let data = $formsData?.find((x) => x.name === 'attachments');
		if ($applicationMode === 2) {
			// creation mode
			const allAttachments =
				($formsData?.filter((x) => x.name === 'attachments')[0]?.data as AttachmentType[]) ?? [];
			if (allAttachments && allAttachments.length > 0) {
				attachments = allAttachments;
				for (let i = 0; i < attachments.length; i++) {
					isUploaded[attachments[i].type] = true;
					if (attachments[i].type === 0) {
						powLink = attachments[i].data[0].url;
					}
					if (attachments[i].type === 1) {
						repLink = attachments[i].data[0].url;
					}
					if (attachments[i].type === 2) {
						other1Link = attachments[i].data[0].url;
					}
					if (attachments[i].type === 3) {
						other2Link = attachments[i].data[0].url;
					}
				}
				if ($validatedPages?.find((x) => x.name === 'attachments')) {
					validate();
				}
			}
		} else if ($applicationMode === 1) {
			// edit mode
			const clone = JSON.parse(JSON.stringify($applicationData?.attachments));
			const mapped = data ? (data.data as AttachmentType[]) : (clone as AttachmentType[]);
			if (data) {
				attachments = [...data.data];
			for (let i =0;i<attachments.length;i++) {
				if (attachments[i].type===0){powLink=attachments[i].data[0] }
				if (attachments[i].type===1){repLink=attachments[i].data[0] }
				if (attachments[i].type===2){other1Link=attachments[i].data[0] }
				if (attachments[i].type===3){other2Link=attachments[i].data[0] }

						isUploaded[attachments[i].type]=true;
			}
			} else {
				let datadd: AttachmentType[] = [];
				powLink = mapped.find((x) => x.name === 'form2')?.url[0] ?? undefined;
				repLink = mapped.find((x) => x.name === 'representation')?.url[0] ?? undefined;
				other1Link = mapped.find((x) => x.name === 'other1')?.url[0] ?? undefined;
				other2Link = mapped.find((x) => x.name === 'other2')?.url[0] ?? undefined;
				if (powLink) {
					isUploaded[0] = true;
					attachments.push({
						type: 0,
						data: [
							{
								url: powLink,
								fileName: 'power_of_attorney'
							}
						]
					});
				}
				if (repLink) {
					isUploaded[1] = true;
					attachments.push({
						type: 1,
						data: [
							{
								url: repLink,
								fileName: 'representation'
							}
						]
					});
				}
				if (other1Link) {
					isUploaded[2] = true;
					attachments.push({
						type: 2,
						data: [
							{
								url: other1Link,
								fileName: 'other_documents_1'
							}
						]
					});
				}
				if (other2Link) {
					isUploaded[3] = true;
					attachments.push({
						type: 3,
						data: [
							{
								url: other2Link,
								fileName: 'other_documents_2'
							}
						]
					});
				}
			}
		}
		isLoading = false;

		if ($validatedPages?.find((x) => x.name === 'attachments')) {
			const status = validate();
			if (!status) {
				isLoading = false;
			}
		}
	});
	savePageData.subscribe((pageToValidate) => {
		if (pageToValidate === 'attachments' && $applicationScreen === 3) {
			if ($formsData === null) {
				formsData.set([{ name: 'attachments', data: attachments }]);
			} else {
				formsData.update((forms) => {
					let index = forms!.findIndex((x) => x.name === 'attachments');
					if (index === -1) {
						forms!.push({ name: 'attachments', data: [...attachments] });
					} else {
						forms![index].data = [...attachments];
					}
					return [...forms!];
				});
			}
			pageSaveStatus.set(true);
		}
	});

	validatePage.subscribe((x) => {
		if (x === 'attachments') {
			const status = validate();
			if ($validatedPages === null) {
				validatedPages.set([{ name: 'attachments', status: status }]);
			} else {
				validatedPages.update((pages) => {
					pages = pages!;
					const index = pages.findIndex((x) => x.name === 'attachments');
					if (index === -1) {
						pages.push({ name: 'attachments', status: status });
					} else {
						pages[index].status = status;
					}
					return [...pages];
				});
			}
		}
	});

	let listofErrors: string[] = [];
	let showError = false;
	function validate(): boolean {
		listofErrors = [];
		let hasErrors = false;
		const attc =
			($formsData?.find((x) => x.name === 'attachments')?.data as AttachmentType[]) ?? [];
		if (attc.length == 0) {
			// show errors
			hasErrors = true;
			listofErrors.push('No attachments added');
		} else {
			if (!attc.find((x) => x.type === 1) &&
				($formsData?.find((x)=>x.name==="basic")?.data?.logo===0 ||
					$formsData?.find((x)=>x.name==="basic")?.data?.logo===2)) {
				listofErrors.push('trademark representation is required');
				hasErrors = true;
			}
			if (!attc.find((x) => x.type === 0)) {
				listofErrors.push('Power of attorney document is required');
				hasErrors = true;
			}
		}
		if (hasErrors) {
			showError = true;
			return false;
		} else {
			return true;
		}
	}

	async function fileChanged(type: number, event: Event | null) {
		const input = event?.target as HTMLInputElement;
		if (input.files) {
			if (input.files.length > 1) {
				removeAttachment(type);
				toast.error('maximum of 1 images', {
					position: 'top-right'
				});
				return;
			}
			for (let i = 0; i < input.files.length; i++) {
				if (input.files[i].size > 5000000) {
					removeAttachment(type);
					toast.error('maximum file size of 5MB exceeded', {
						position: 'top-right'
					});
					return;
				}
			}

			const file = input.files[0] as File;
			const fileType = file.type;
			if (['image/jpeg', 'image/png'].includes(fileType) && [1, 2, 3].includes(type) === false) {
				removeAttachment(type);
				toast.error('unsupported file type, only pdf supported', {
					position: 'top-right'
				});
				return;
			}
			let createdUrl = URL.createObjectURL(file);
			const attachmentName = Object.values(TrademarkAttachments).filter((x) => isNaN(x));
			if (attachments.find((x) => x.type === type)) {
				attachments[attachments.findIndex((x) => x.type === type)].data.push({
					url: createdUrl,
					fileName: file.name
				});
				appattachmentsData.update((data) => {
					const inde = data.findIndex((x) => x.name === attachmentName[type].toString());
					data[inde].data.push(file);
					return data;
				});
			} else {
				appattachmentsData.update((data) => {
					data.push({ name: attachmentName[type].toString(), data: [file] });
					return data;
				});
				attachments.push({
					type: type,
					data: [{ url: createdUrl, fileName: file.name }]
				});
			}

			if (type === 0) {
				powLink = createdUrl;
			}
			if (type === 1) {
				repLink = createdUrl;
			}
			if (type === 2) {
				other1Link = createdUrl;
			}
			if (type === 3) {
				other2Link = createdUrl;
			}
		}
	}
	$: getLoadingStatus = (type: string) => {
		let index = $attachmentLoadingStatus.findIndex((x) => x.type === type);
		if (index !== -1) {
			return $attachmentLoadingStatus[index].status;
		} else if (attachments.filter((x) => x.name === type)[0].fileName != null) {
			return false;
		} else return null;
	};

	function removeAttachment(type: number) {
		const attachmentName = Object.values(TrademarkAttachments).filter((x) => isNaN(x));
		//creation mode
		appattachmentsData.update((data) => {
			const ind = data.findIndex((x) => x.name === attachmentName[type].toString());
			if (ind !== -1) {
				data.splice(ind, 1);
			}
			return data;
		});
		const index = attachments.findIndex((x) => x.type === type);
		if (type === 0) {
			powLink = undefined;
		}
		if (type === 1) {
			repLink = undefined;
		}

		if (type === 2) {
			other1Link = undefined;
		}
		if (type === 3) {
			other2Link = undefined;
		}
		attachments.splice(index, 1);
		attachments = [...attachments];
	}
	let showPreview = false;
	let content: string | null = null;
	function viewAttachment(type: number) {
		if ($applicationMode == 1) {
			content = attachments.find((x) => x.type.toString() == type).data[0].url;
		} else {
			const attachmentName = Object.values(TrademarkAttachments).filter((x) => isNaN(x));
			const inde = $appattachmentsData.find((x) => x.name === attachmentName[type].toString());
			content = URL.createObjectURL(inde.data[0]);
			const link = document.createElement('a');
			link.href = content;
			document.body.appendChild(link);
		}
		return content;
	}
	$: {
		if ($applicationMode === 1 && isLoading===false) {
			const parsed: { name: string; url: string[] }[] = [];
			attachments.forEach((x) => {
				const { type, data } = x;
				parsed.push({ name: mapTradeAttInToString(type), url: [data[0].url] });
			});
			const sorted=parsed.sort((a,b)=>a.name>b.name?1:-1)
			const originalSorted=$applicationData?.attachments.sort((a,b)=>a.name>b.name?1:-1);
			console.log(sorted, originalSorted)
			if (objsHasDiff(sorted, originalSorted)) {
				showResetButton = true;
				changesMade.update((changes) => {
					changes = changes ?? [];
					let index = changes.findIndex((x) => x.name === 'attachments');
					if (index !== -1) {
						changes[index].hasChanges = true;
					} else {
						changes.push({ name: 'attachments', hasChanges: true });
					}
					return [...changes];
				});
			} else {
				showResetButton = false;
				changesMade.update((changes) => {
					changes = changes ?? [];
					let index = changes.findIndex((x) => x.name == 'attachments');
					if (index !== -1) {
						changes.splice(index, 1);
						return [...changes];
					}
					return [...changes];
				});
			}
		}
	}

	function resetAttachments() {
		const clone = JSON.parse(JSON.stringify($applicationData?.attachments));
		const mapped = clone as AttachmentType[];
		let datadd: AttachmentType[] = [];
		mapped.forEach((x) => {
			let urls: string[] = x.url;
			let attchdata = [];
			urls.forEach((y) => {
				attchdata.push({ fileName: y, url: y });
			});
			datadd.push({ type: mapPatentAttStrToInt(x.name), data: attchdata });
		});
		attachments = [...datadd];
		attachments.forEach((x) => (isUploaded[x.type] = true));
	}
	function getAttachmentName(current: PatentAttachments | string) {
		return attachments.find((x) => x.type === current).data[0]?.fileName ?? 'uploaded';
	}
</script>

<AlertDialog.Root bind:open={$showSizeError}>
	<AlertDialog.Content class="px-3">
		<AlertDialog.Header>
			<AlertDialog.Title>Size Error</AlertDialog.Title>
			<AlertDialog.Description>Maximum file size of 10MB</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Action>Ok</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<Dialog.Root bind:open={showPreview}>
	<Dialog.Content class="h-3/4">
		<iframe src={content} width="95%" height="100%" title="-"></iframe>
	</Dialog.Content>
</Dialog.Root>
<div class="sm:p-4 sm:m-3 sm:space-y-4">
	<div class="flex gap-6 items-center">
		<p>All Attachments</p>
		<Button
			variant="ghost"
			class="text-blue-500 {showResetButton ? 'inline' : 'hidden'}"
			on:click={() => resetAttachments()}
			>Reset
		</Button>
	</div>
	{#if showError}
		<div class="text-red-500 bg-red-200 space-y-2 border rounded-md p-2">
			{#each listofErrors as rror}
				<p>{rror}</p>
			{/each}
		</div>
	{/if}
	<div>
		<Label for="poa">Power of Attorney</Label>
		<div class="flex space-x-2">
			<Input
				id="poa"
				accept=".pdf"
				multiple={false}
				type="file"
				on:change={(event) => fileChanged(0, event)}
			/>
			{#if powLink}
				<a target="_blank" href={viewAttachment(0)} class="rounded-md border bg-blue-100 p-2">
					<Icon icon="ep:view" width="1.2rem" height="1.2rem" />
				</a>
				<Button on:click={() => removeAttachment(0)} size="icon" variant="destructive">
					<Icon icon="pajamas:remove" width="1.2rem" height="1.2rem" />
				</Button>
			{/if}
		</div>
	</div>
	<div>
		<Label for="rep">Proposed trademark representation</Label>
		<div class="flex space-x-2">
			<Input
				id="rep"
				accept=".png, .jpeg, .jpg"
				multiple={false}
				type="file"
				on:change={(event) => fileChanged(1, event)}
			/>
			{#if repLink}
				<a target="_blank" href={viewAttachment(1)} class="rounded-md border bg-blue-100 p-2">
					<Icon icon="ep:view" width="1.2rem" height="1.2rem" />
				</a>
				<Button on:click={() => removeAttachment(1)} size="icon" variant="destructive">
					<Icon icon="pajamas:remove" width="1.2rem" height="1.2rem" />
				</Button>
			{/if}
		</div>
	</div>

	<div>
		<Label for="rep">supporting document 1</Label>
		<div class="flex space-x-2">
			<Input
				id="rep"
				accept=".png, .jpeg, .jpg, .pdf"
				multiple={false}
				type="file"
				on:change={(event) => fileChanged(2, event)}
			/>
			{#if other1Link}
				<a target="_blank" href={viewAttachment(2)} class="rounded-md border bg-blue-100 p-2">
					<Icon icon="ep:view" width="1.2rem" height="1.2rem" />
				</a>
				<Button on:click={() => removeAttachment(2)} size="icon" variant="destructive">
					<Icon icon="pajamas:remove" width="1.2rem" height="1.2rem" />
				</Button>
			{/if}
		</div>
	</div>

	<div>
		<Label for="rep">supporting document 2</Label>
		<div class="flex space-x-2">
			<Input
				id="rep"
				accept=".png, .jpeg, .jpg, .pdf"
				multiple={false}
				type="file"
				on:change={(event) => fileChanged(3, event)}
			/>
			{#if other2Link}
				<a target="_blank" href={viewAttachment(3)} class="rounded-md border bg-blue-100 p-2">
					<Icon icon="ep:view" width="1.2rem" height="1.2rem" />
				</a>
				<Button on:click={() => removeAttachment(3)} size="icon" variant="destructive">
					<Icon icon="pajamas:remove" width="1.2rem" height="1.2rem" />
				</Button>
			{/if}
		</div>
	</div>
</div>

<script lang="ts">
	import {
		DesignAttachments,
		mapDesignAttIntToString,
		mapDesignAttStringToInt,
		mapDesignAttToString,
		mapPatentAttInToString,
		mapPatentAttStrToInt
	} from '$lib/designutils';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import { toast, Toaster } from 'svelte-sonner';
	import { Label } from '$lib/components/ui/label';
	import {
		formsData,
		savePageData,
		applicationScreen,
		applicationMode,
		validatedPages,
		validatePage,
		appattachmentsData,
		applicationData,
		changesMade
	} from '$lib/store';
	import type { AttachmentType } from '$lib/helpers';
	import { onMount } from 'svelte';
	import { objsHasDiff } from '../../apphelper';
	let isUploaded = {};
	let docsUploaded: AttachmentType[] = [];
	let showImagesError: boolean = false;
	let showAttorneyError: boolean = false;
	let showNovError: boolean = false;
	savePageData.subscribe((toSave) => {
		if (toSave === 'attachments' && $applicationScreen === 4) {
			if ($formsData === null) {
				formsData.set([
					{
						name: 'attachments',
						data: docsUploaded
					}
				]);
			} else {
				formsData.update((forms) => {
					let index = forms!.findIndex((x) => x.name === 'attachments');
					if (index !== -1) {
						forms![index].data = docsUploaded;
					} else {
						forms!.push({
							name: 'attachments',
							data: docsUploaded
						});
					}
					return [...forms!];
				});
			}
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
	onMount(() => {
		// if new application
		let data = $formsData?.find((x) => x.name === 'attachments');
		if ($applicationMode === 2) {
			// creation
			const allAttachments =
				($formsData?.filter((x) => x.name === 'attachments')[0]?.data as AttachmentType[]) ?? [];
			if (allAttachments && allAttachments.length > 0) {
				// set the data
				docsUploaded = allAttachments;
				for (let i = 0; i < docsUploaded.length; i++) {
					isUploaded[docsUploaded[i].type] = true;
				}
				if ($validatedPages?.find((x) => x.name === 'attachments')) {
					validate();
				}
			}
		}
		if ($applicationMode == 1) {
			// edit mode
			const clone = JSON.parse(JSON.stringify($applicationData?.attachments));
			const mapped = data ? (data.data as AttachmentType[]) : (clone as AttachmentType[]);
			if (data) {
				docsUploaded = [...data.data];
				docsUploaded.forEach((x) => (isUploaded[x.type] = true));
			} else {
				let datadd: AttachmentType[] = [];
				mapped.forEach((x) => {
					let urls: string[] = x.url;
					let attchdata = [];
					urls.forEach((y) => {
						attchdata.push({ fileName: y, url: y });
					});
					datadd.push({ type: mapDesignAttStringToInt(x.name), data: attchdata });
				});
				docsUploaded = [...datadd];
				docsUploaded.forEach((x) => (isUploaded[x.type] = true));
			}
		}
	});

	async function fileSelected(type: number, event: Event | null) {
		const input = event?.target as HTMLInputElement;
		if (input.files) {
			if (input.files.length > 4) {
				removeDoc(type);
				toast.error('maximum of 4 images', {
					position: 'top-right'
				});
				return;
			}
			for (let i = 0; i < input.files.length; i++) {
				if (input.files[i].size > 5000000) {
					removeDoc(type);
					toast.error('maximum file size of 5MB exceeded', {
						position: 'top-right'
					});
					return;
				}
			}
			for (let i = 0; i < input.files.length; i++) {
				const fileType = input.files[i].type;
				if (!['image/jpeg', 'image/png'].includes(fileType) && type === 2) {
					removeDoc(type);
					toast.error('unsupported file type, .png, .jpeg only are supported', {
						position: 'top-right'
					});
					return;
				}
				if (!['application/pdf'].includes(fileType) && type !== 2) {
					removeDoc(type);
					toast.error('unsupported file type, only pdf is supported', {
						position: 'top-right'
					});
					return;
				}
				let createdUrl = URL.createObjectURL(input.files[i] as File);
				const attachmentName = Object.values(DesignAttachments).filter((x) => isNaN(x));
				if (docsUploaded.find((x) => x.type === type)) {
					docsUploaded[docsUploaded.findIndex((x) => x.type === type)].data.push({
						url: createdUrl,
						fileName: input.files[i].name
					});
					appattachmentsData.update((data) => {
						const inde = data.findIndex((x) => x.name === attachmentName[type].toString());
						data[inde].data.push(input.files[i] as File);
						return data;
					});
				} else {
					appattachmentsData.update((data) => {
						data.push({ name: attachmentName[type].toString(), data: [input.files[i] as File] });
						return data;
					});
					docsUploaded.push({
						type: type,
						data: [{ url: createdUrl, fileName: input.files[i].name }]
					});
				}
			}
			isUploaded[type] = true;
		}
	}
	function removeDoc(type: number) {
		const attachmentName = Object.values(DesignAttachments).filter((x) => isNaN(x));
		appattachmentsData.update((data) => {
			const ind = data.findIndex((x) => x.name === attachmentName[type].toString());
			if (ind != -1) {
				data.splice(ind, 1);
			}
			return data;
		});
		isUploaded[type] = false;
		const index = docsUploaded.findIndex((x) => x.type === type);
		docsUploaded.splice(index, 1);
		docsUploaded = [...docsUploaded];
	}

	function validate() {
		const poa = docsUploaded.find((x) => x.type === 0);
		const nov = docsUploaded.find((x) => x.type === 1);
		const designs = docsUploaded.find((x) => x.type === 2);
		if (poa === undefined || nov === undefined || designs === undefined) {
			showAttorneyError = poa === undefined;
			showNovError = nov === undefined;
			showImagesError = designs === undefined;
			return false;
		}
		return true;
	}
	$: {
		if ($applicationMode === 1) {
			const parsed: { name: string; url: string[] }[] = [];
			docsUploaded.forEach((x) => {
				const { type, data } = x;
				parsed.push({ name: mapDesignAttIntToString(type), url: data.map((t) => t.url) ?? '' });
			});
			if (objsHasDiff(parsed, $applicationData?.attachments)) {
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
</script>

<Toaster />
<div>
	{#each Object.values(DesignAttachments).filter((x) => !isNaN(x)) as attachment}
		<div class="p-2 m-2 border rounded-md">
			<div class="flex space-x-3">
				<p>{mapDesignAttToString(attachment)}</p>
				{#if attachment === 2}
					<p>(Max of 4 images)</p>
				{/if}
			</div>
			<div class="space-y-3">
				{#if isUploaded[attachment]}
					{#each docsUploaded
						.find((x) => x.type === attachment)
						.data.map((t) => t.fileName) as filename}
						<div class="flex items-center space-x-3 border rounded-md p-2">
							<p>{filename}</p>
							<Button on:click={() => removeDoc(attachment)} size="icon">
								<Icon icon="pajamas:remove" width="1.2rem" height="1.2rem" />
							</Button>
						</div>
					{/each}
				{:else}
					<Input
						id={attachment.toString()}
						accept={attachment === 2 ? '.png, .jpeg, .jpg' : '.pdf'}
						multiple={attachment === 2}
						type="file"
						on:change={(event) => fileSelected(attachment, event)}
					/>
				{/if}
			</div>
			{#if attachment === 2 && showImagesError}
				<Label>Design Representation(s) is required</Label>
			{/if}
			{#if attachment === 0 && showAttorneyError}
				<Label>Power of Attorney is required</Label>
			{/if}
			{#if attachment === 1 && showNovError}
				<Label>Novelty statement is required</Label>
			{/if}
		</div>
	{/each}
</div>

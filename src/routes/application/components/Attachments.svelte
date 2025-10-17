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
		isPCT,
		hasPriority,
		changesMade,
		validatePage,
		validatedPages,
		appattachmentsData
	} from '$lib/store.js';
	import { onMount } from 'svelte';
	import type { AttachmentType, BasicType, Priority } from '$lib/helpers';
	import { objsHasDiff } from '../apphelper';
	import {
		mapPatentAttInToString,
		mapPatentAttStrToInt,
		mapPatentAttToString,
		PatentAttachments
	} from '$lib/designutils';
	import { toast } from 'svelte-sonner';
	let attachments: AttachmentType[] = [];
	let showResetButton: boolean = false;
	let attachmentsList = PatentAttachments;
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
	isPCT.subscribe((data) => {
		if ($applicationMode===1 && $applicationData.patentType===2 && data===null){
			isPCT.set(true)
		}
		if (data===true) {
			if (
				attachments.findIndex((x) => x.type === PatentAttachments.pct) === -1 &&
				attachments.length >= 4
			) {
				attachments.push({
					type: PatentAttachments.pct,
					data: [
						{
							fileName: '',
							url: ''
						}
					]
				});
			}
		} else {
			let index = attachments.findIndex((x) => x.type === PatentAttachments.pct);
			if (index !== -1) {
				attachments.splice(index, 1);
				attachments = [...attachments];
			}
				if ($appattachmentsData.find(x=>x.name==="pct"))
				{
					appattachmentsData.update((att)=>{
						const pctIndex = att.findIndex(x=>x.name==="pct");
						att.splice(pctIndex, 1);
						return att;
					})
						formsData.update((t)=>{
							const attac=t?.filter((x) => x.name === 'attachments')[0]?.data as AttachmentType[]??[];
							if (attac.length > 0) {
								const pctI=attac.findIndex(x=>x.type===PatentAttachments.pct)
								if (pctI!==-1){
									attac.splice(pctI, 1);
									const attInde=t.findIndex(x=>x.name==="attachments");
									t[attInde].data=attac;
								}
								return t;
							}
						})
				}
		}
	});

	hasPriority.subscribe((prio) => {
		if ($applicationMode===1 && $applicationData.priorityInfo.length>=1 && prio===false){
			hasPriority.set(true)
		}
		if (prio) {
			if (
				attachments.length >= 4 &&
				attachments.findIndex((x) => x.type === PatentAttachments.pdoc) === -1
			) {
				attachments.push({
					type: PatentAttachments.pdoc,
					data: [{ url: '', fileName: '' }]
				});
			}
		} else {
			if (
				attachments.length >= 4 &&
				attachments.findIndex((x) => x.type === PatentAttachments.pdoc) != -1
			) {
				attachments.splice(
					attachments.findIndex((x) => x.type === PatentAttachments.pdoc),
					1
				);
				attachments = [...attachments];

				if ($appattachmentsData.find(x => x.name === "pdoc")) {
					appattachmentsData.update((att) => {
						const pctIndex = att.findIndex(x => x.name === "pdoc");
						att.splice(pctIndex, 1);
						return att;
					})
				}

				formsData.update((t) => {
					const attac = t?.filter((x) => x.name === 'attachments')[0]?.data as AttachmentType[] ?? [];
					if (attac.length > 0) {
						const prioDoc = attac.findIndex(x => x.type === PatentAttachments.pdoc)
						if (prioDoc !== -1) {
							attac.splice(prioDoc, 1);
							const attInde = t.findIndex(x => x.name === "attachments");
							t[attInde].data = attac;
						}
						return t;
					}
				})
			}
		}
	});
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
				}
				if ($validatedPages?.find((x) => x.name === 'attachments')) {
					validate();
				}
			}
		} else if ($applicationMode === 1) {
			// edit mode
			const clone = JSON.parse(JSON.stringify($applicationData?.attachments));
			const mapped = data ? (data.data as AttachmentType[]) : (clone as AttachmentType[]);
			console.log(mapped)
			if (data){
				attachments=[...data.data];
				attachments.forEach(x => isUploaded[x.type] = true)
			}
			else {
				console.log("going with else")
			let datadd:AttachmentType[]=[];
				mapped.forEach(x => {
					let urls: string[] = x.url;
					let attchdata = []
					urls.forEach(y => {
						attchdata.push({ fileName: y, url: y })
					});
					datadd.push({ type: mapPatentAttStrToInt(x.name), data: attchdata });
				})
				attachments = [...datadd];
				attachments.forEach(x => isUploaded[x.type] = true)
				console.log(attachments)
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
		if (pageToValidate === 'attachments' && $applicationScreen === 5) {
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

	let listofErrors:string[]=[];
	let showError=false;
	function validate(): boolean {
		listofErrors=[]
		let hasErrors=false;
		const attc=($formsData?.find((x) => x.name === 'attachments')?.data as AttachmentType[]) ?? [];
		const basic=($formsData?.find((x) => x.name === 'basic')?.data as BasicType)??null;
		const priority=($formsData?.find((x) => x.name === 'priority')?.data as Priority[])??[];
		if (attc.length==0){
			// show errors
			hasErrors=true;
			listofErrors.push("No attachments added")
		}
		else {
			// if pct, verify pct, if priority, verify priority,
			if (basic.patentType===2){
				if (!attachments.find(x=>x.type===5)){
					// no pct, show pct error;
					listofErrors.push("PCT document is required")
					hasErrors=true;
				}
			}
			if (priority.length>=1){
				if (!attc.find(x=>x.type===3)){
					listofErrors.push("priority document is required because priority section was filled")
					hasErrors=true;
				}
			}
			// then verify patent drawing, cs, ignore any
			if (!attc.find(x=>x.type===1)){
				listofErrors.push("Claims and Specifications document is required")
				hasErrors=true;

			}
			if (!attc.find(x=>x.type===0)){
				listofErrors.push("Power of attorney document is required")
				hasErrors=true;

			}
			if (!attc.find(x=>x.type==2)){
				listofErrors.push("Patent drawing is required")
				hasErrors=true;
			}
		}
		if (hasErrors){
			showError=true;
			return false}
		else {return true;}
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

			for (let i = 0; i < input.files.length; i++) {
				const fileType = input.files[i].type;
				if (['image/jpeg', 'image/png'].includes(fileType)) {
					removeAttachment(type);
					toast.error('unsupported file type, only pdf supported', {
						position: 'top-right'
					});
					return;
				}
				let createdUrl = URL.createObjectURL(input.files[i]);
				const attachmentName = Object.values(PatentAttachments).filter((x) => isNaN(x))
				if (attachments.find((x) => x.type === type)) {
					attachments[attachments.findIndex((x) => x.type === type)].data.push({
						url: createdUrl,
						fileName: input.files[i].name
					});
					appattachmentsData.update((data) => {
						const inde = data.findIndex(x => x.name === attachmentName[type].toString());
						data[inde].data.push(input.files[i] as File);
						return data;
					})
				} else {
					appattachmentsData.update((data) => {
						data.push({ name: attachmentName[type].toString(), data: [(input.files[i] as File)] });
						return data;
					})
					attachments.push({
						type: type,
						data: [{ url: createdUrl, fileName: input.files[i].name }]
					});
				}

			}
			isUploaded[type] = true;
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
		const attachmentName = Object.values(PatentAttachments).filter((x)=>isNaN(x))
			//creation mode
		appattachmentsData.update((data)=>{
			const ind=data.findIndex(x=>x.name===attachmentName[type].toString());
			if (ind!==-1)
			{data.splice(ind, 1);}
			return data;
		})

		isUploaded[type] = false;
		const index = attachments.findIndex((x) => x.type === type);
		attachments.splice(index, 1);
		attachments=[...attachments];
	}
	let showPreview = false;
	let content: string | null = null;
	function viewAttachment(type: string) {
		if($applicationMode==1)
		{content=attachments.find(x=>x.type.toString()==type).data[0].url;}
		else {
			const attachmentName = Object.values(PatentAttachments).filter((x) => isNaN(x))
			const inde = $appattachmentsData.find(x => x.name === attachmentName[type].toString());
			content = URL.createObjectURL(inde.data[0]);
			const link = document.createElement('a');
			link.href = content;
			document.body.appendChild(link);
		}
		return content
	}
	$: {
		if ($applicationMode === 1) {
			const parsed: { name: string; url: string[] }[] = [];
			attachments.forEach((x) => {
				const { type, data } = x;
				parsed.push({ name: mapPatentAttInToString(type), url: data.map(t=>t.url) ?? '' });
			});
			if (objsHasDiff(parsed, $applicationData?.attachments)) {
				console.log('new', parsed);
				console.log('old', $applicationData?.attachments);
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
		const mapped = (clone as AttachmentType[]);
		let datadd:AttachmentType[]=[];
		mapped.forEach(x=>{
			let urls:string[]=x.url;
			let attchdata=[]
			urls.forEach(y=>{attchdata.push({fileName:y, url:y})});
			datadd.push({type: mapPatentAttStrToInt(x.name), data:attchdata });
		})
		attachments = [...datadd];
		attachments.forEach(x=>isUploaded[x.type]=true)
	}
	function getAttachmentName(current:PatentAttachments|string){
			return attachments.find(x=>x.type===current).data[0]?.fileName??'uploaded'
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
	{#each Object.values(PatentAttachments).filter((x) => !isNaN(x)) as curr_att}
		{#if curr_att === 3 && $hasPriority === false}
			<p></p>
		{:else if curr_att === 5 && $isPCT === false}
			<p></p>
		{:else}
			<div class="p-2 m-2 border rounded-md">
				<div class="flex space-x-3">
					{#if curr_att===4}
						<strong>Any other document (optional)</strong>
						{:else }
					<strong>{mapPatentAttToString(curr_att)}</strong>
						{/if}
				</div>
				<div class="flex items-center space-x-3">
					{#if isUploaded[curr_att]}
						<p>{getAttachmentName(curr_att)}</p>
						<a target="_blank" href="{viewAttachment(curr_att)}" class="rounded-md border bg-blue-100 p-2" >
							<Icon icon="ep:view" width="1.2rem" height="1.2rem" />
						</a>

						<Button on:click={() => removeAttachment(curr_att)} size="icon" variant="destructive">
							<Icon icon="pajamas:remove" width="1.2rem" height="1.2rem" />
						</Button>
						{:else }
						<Input
							id={curr_att.toString()}
							accept=".pdf"
							multiple={false}
							type="file"
							on:change={(event) => fileChanged(curr_att, event)}
						/>
					{/if}
				</div>
			</div>
		{/if}
	{/each}
</div>

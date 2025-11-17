<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import AppMenu from './AppMenu.svelte';
	import {
		adjustmentType,
		appattachmentsData,
		applicationData, applicationMode,
		applicationScreen,
		changesMade,
		formsData, loggedInUser,
		loggedInToken,
		newApplicationType, newDataApp,
		pageValidationStatus,
		savePageData,
		validatedPages,
		validatePage
	} from '$lib/store';
	import {
		type Applicant,
		ApplicationStatuses,
		type AttachmentType,
		baseURL,
		type BasicDesignType,
		type BasicPatentType,
		type CorrespondenceType,
		DesignSections,
		FilingType,
		FormApplicationTypes,
		type Priority,
		type Inventor,
		type PatentData,
		PatentSections, TrademarkSections
	} from '$lib/helpers';
	import { FindDeepDiff } from './apphelper';
	import { Toaster } from '$lib/components/ui/sonner';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Sheet from '$lib/components/ui/sheet';
	import { mapDesignAttIntToString, mapPatentAttInToString, mapTradeAttInToString } from '$lib/designutils';

	const sections = $newApplicationType == 0 ? PatentSections : $newApplicationType===1? DesignSections: TrademarkSections;
	let currentView = 0;
	let windowWidth = 0;
	let openMenu: boolean = false;
	let hasChanges: boolean = false;
	onMount(async() => {
		windowWidth = window.innerWidth;
		if (!$loggedInUser){
			await goto("/auth")
		}
	});
	$: previousMessage = () => {
		if (currentView === 0) {
			return 'cancel';
		}
		return windowWidth <= 640 ? sections[currentView - 1].name : 'Previous';
	};

	changesMade.subscribe((changes) => {
		hasChanges =
			changes != null &&
			changes.length >= 1 &&
			(changes?.every((x) => x.hasChanges === true) ?? false);
	});

	function GotoPrevButton() {
		if (currentView == 0) {
			goto('/home/dashboard');
			return;
		} else {
			currentView -= 1;
			applicationScreen.set(currentView);
			savePageData.set(null);
		}
	}
	$: GetNextButton = () => {
		if (currentView === sections.findIndex((x) => x.name == 'verification') && $applicationMode!==1 ) {
			// not in edit mode
			return 'proceed';
		}
		if (currentView === sections.findIndex((x) => x.name == 'verification') && $applicationMode==1){
			//edit mode
			return "-1"
		}
		return windowWidth <= 640 ? sections[currentView + 1].name : 'Next';
	};
	pageValidationStatus.subscribe((validateStatus) => {
		if (validateStatus === true) {
			currentView += 1;
			applicationScreen.set(currentView);
		}
	});
	$: verification = false;
	let isSavingApplication: boolean = false;
	async function validated() {
		if (sections[currentView].name === 'verification') {
			isSavingApplication = true;
			return await validateForms();
		} else {
			savePageData.set(sections[currentView].name);
			currentView += 1;
			applicationScreen.set(currentView);
			return false;
		}
	}

	applicationScreen.subscribe((scr) => (currentView = scr));
	function openChanged(state: boolean) {
		if (!state) openMenu = false;
	}
	let showNoEdits: boolean = false;
	let isUploadingAttachments:boolean=false;
	async function ViewChanges() {
		// save all sections
		savePageData.set(null);
		savePageData.set(sections[currentView].name);
		const diff = FindDeepDiff(false);
		if (diff === false) {
			showNoEdits = true;
		} else {
			if (diff?.includes('attachments')) {
				const attachm = $appattachmentsData.filter(x => x.name !== "");
				isUploadingAttachments = true;
				for (let i = 0; i < attachm.length; i++) {
					var attachmentsLists = [];
					let attach = attachm[i].data;
					let name = attachm[i].name;
					for (let fileIndex = 0; fileIndex < attach.length; fileIndex++) {
						if (attachm[i].name === 'designs') {
							attachmentsLists.push({
								fileName: (attach[fileIndex] as File).name,
								Name: 'design' + `${fileIndex + 1}`,
								contentType: (attach[fileIndex] as File).type,
								data: arrayBufferToBase64(await toByteArray(attach[fileIndex]))
							})
						} else {
							attachmentsLists.push({
								fileName: (attach[fileIndex] as File).name,
								Name: attachm[i].name,
								contentType: (attach[fileIndex] as File).type,
								data: arrayBufferToBase64(await toByteArray(attach[fileIndex]))
							})
						}
					}
					// push and get return;
					const result = await fetch(`${baseURL}/api/files/uploadAttachment`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'Authorization': `Bearer ${$loggedInToken}`
							},
							body: JSON.stringify(attachmentsLists)
						}
					);
					const res = await result.json();
					if (res) {
						// replace url
						newDataApp.update((data) => {
							const index = data.attachments.findIndex(x => x.name === name);
							data.attachments[index].url = res;
							return data;
						})
					}
				}
			}
			adjustmentType.set(1);
			localStorage.removeItem("revisions")
			await goto(`/updatesmade?id=${$applicationData.id}`);
		}
	}
	let failedPages: string[] = [];
	async function validateForms() {
		validatedPages.update((pages) => {
			const addedPages = pages.map((x) => x.name);
			const allSections = sections
				.filter((x) => ['verification', 'priority'].includes(x.name) === false)
				.map((x) => x.name);
			for (const section in allSections) {
				if (addedPages.includes(allSections[section]) === false) {
					pages.push({ name: allSections[section], status: false });
				}
			}
			return [...pages];
		});
		for (let i = 0; i < sections.length; i++) {
			validatePage.set(sections[i].name);
		}
		failedPages = $validatedPages?.filter((x) => x.status == false).map((x) => x.name);
		validatePage.set(null);
		if (failedPages.length > 0) {
			const all = failedPages.join('\n');
			toast.error(`Failed to validate the following sections: \n${all}`, { position: 'top-center' });
			isSavingApplication = false;
			return false;
		} else {
			await createFile();
			return true;
		}
	}

	async function createFile() {
		let data: PatentData;
		var cookieUser = document.cookie
			.split(';')
			.find((x) => x.startsWith('user=') || x.startsWith(' user='));
		
		// user = user.slice(5);
		const user = $loggedInUser;
		
		if ($newApplicationType === 1) {
			//design
			const basicData = $formsData?.filter((x) => x.name === 'basic')[0]?.data as BasicDesignType;
			const allApplicants =
				($formsData?.filter((x) => x.name === 'applicant')[0]?.data as Applicant[]) ?? [];
			const listOfCreators =
				($formsData?.filter((x) => x.name === 'inventors')[0]?.data as Inventor[]) ?? [];
			const correspondence = $formsData?.filter((x) => x.name === 'correspondence')[0]
				?.data as CorrespondenceType;
			const allAttachments =
				($formsData?.filter((x) => x.name === 'attachments')[0]?.data as AttachmentType[]) ?? [];
			const mappedAttachs = allAttachments.map((x) => ({
				name: mapDesignAttIntToString(x.type),
				url: x.data.map((y) => y.url)
			}));
			data = {
				type: FilingType.Design,
				fileStatus: ApplicationStatuses.AwaitingPayment,
				formApplicationType: FormApplicationTypes.NewApplication,
				designCreators: listOfCreators,
				designType: basicData.designType,
				statementOfNovelty: basicData.statementOfNovelty,
				titleOfDesign: basicData.title,
				correspondence: correspondence,
				applicants: allApplicants,
				attachments: [],
				creatorAccount: user.id
			};
		}
		if ($newApplicationType === 0) {
			// patent
			const basicData = $formsData?.filter((x) => x.name === 'basic')[0]?.data as BasicPatentType;
			const allApplicants =
				($formsData?.filter((x) => x.name === 'applicant')[0]?.data as Applicant[]) ?? [];
			const listOfInventors =
				($formsData?.filter((x) => x.name === 'inventors')[0]?.data as Inventor[]) ?? [];
			const correspondence = $formsData?.filter((x) => x.name === 'correspondence')[0]
				?.data as CorrespondenceType;
			const priority = ($formsData?.filter(x=>x.name==="priority")[0]?.data as Priority[])??[];
			const allAttachments =
				($formsData?.filter((x) => x.name === 'attachments')[0]?.data as AttachmentType[]) ?? [];
			const mappedAttachs = allAttachments.map((x) => ({
				name: mapPatentAttInToString(x.type),
				url: x.data.map((y) => y.url)
			}));
			for (const priorityKey in priority) {
				console.log(typeof priority[priorityKey].date)
				priority[priorityKey].date = priority[priorityKey].date.toString()
			}
			data = {
				type: FilingType.Patent,
				fileStatus: ApplicationStatuses.AwaitingPayment,
				formApplicationType: FormApplicationTypes.NewApplication,
				inventors: listOfInventors,
				patentType: basicData.patentType,
				priorityInfo: priority,
				patentApplicationType: basicData.patentApplicationType,
				patentAbstract: basicData.abstract,
				titleOfInvention: basicData.title,
				correspondence: correspondence,
				applicants: allApplicants,
				attachments: [],
				creatorAccount: user.id
			};
		}
		if ($newApplicationType === 2) {
			const basicData = $formsData?.filter((x) => x.name === 'basic')[0]?.data ;
			const allApplicants =
				($formsData?.filter((x) => x.name === 'applicant')[0]?.data as Applicant[]) ?? [];
			const correspondence = $formsData?.filter((x) => x.name === 'correspondence')[0]
				?.data as CorrespondenceType;
			const allAttachments =
				($formsData?.filter((x) => x.name === 'attachments')[0]?.data as AttachmentType[]) ?? [];
			const mappedAttachs = allAttachments.map((x) => ({
				name: mapTradeAttInToString(x.type),
				url: x.data.map((y) => y.url)
			}));
			data = {
				type: FilingType.Trademark,
				fileStatus: ApplicationStatuses.AwaitingPayment,
				formApplicationType: FormApplicationTypes.NewApplication,
				titleOfTradeMark: basicData.title,
				trademarkClass: basicData.class,
				trademarkClassDescription:basicData.description,
				trademarkLogo: basicData.logo,
				trademarkType: basicData.type,
				trademarkDisclaimer: basicData.disclaimer,
				correspondence: correspondence,
				applicants: allApplicants,
				attachments: [],
				creatorAccount: user.id
			};
		}

		var testing___ = { file: JSON.stringify({ ...data })};
		var attachmentsLists=[];
		for (let i = 0; i < $appattachmentsData.length; i++) {
			let attach = $appattachmentsData[i].data;
			for (let fileIndex = 0; fileIndex < attach.length; fileIndex++) {
				if (data.type === FilingType.Design && $appattachmentsData[i].name === 'designs') {
					attachmentsLists.push({
						fileName: (attach[fileIndex] as File).name,
						Name: 'design' + `${fileIndex + 1}`,
						contentType: (attach[fileIndex] as File).type,
						data : arrayBufferToBase64(await toByteArray(attach[fileIndex]))
					})
				} else {
					attachmentsLists.push({
						fileName: (attach[fileIndex] as File).name,
						Name: $appattachmentsData[i].name,
						contentType: (attach[fileIndex] as File).type,
						data : arrayBufferToBase64(await toByteArray(attach[fileIndex]))
					})
				}
			}
		}
		testing___['attachments']= attachmentsLists;
		const result=await fetch(`${baseURL}/api/files/createNew`, { 
			method:'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${$loggedInToken}`
			},
			body:JSON.stringify(testing___)}
		)
		const res = await result.json();
		if (res) {
			appattachmentsData.set([{ name: '', data: [] }]);
			applicationData.set(res);
			await goto('/payment?type=newapplication');
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

<Toaster />
<Dialog.Root bind:open={showNoEdits}>
	<Dialog.Content class="min-w-fit mx-1.5">
		<Dialog.Header>
			<Dialog.Title>Changes</Dialog.Title>
		</Dialog.Header>
		<br />
		<p>No Changes Made</p>
		<br />
		<Dialog.Footer class="sm:flex gap-3">
			<Button on:click={() => (showNoEdits = false)}>Ok</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Sheet.Root bind:open={openMenu} onOpenChange={openChanged}>
	<Sheet.Content side="left" class="w-1/2">
		<Sheet.Header>
			<Sheet.Title>Menu Options</Sheet.Title>
			<Sheet.Description>
				<AppMenu />
			</Sheet.Description>
		</Sheet.Header>
	</Sheet.Content>
</Sheet.Root>
<div class="px-4 py-5 h-screen">
	<div
		class="flex sm:hidden justify-between fixed top-3 left-0 right-0 z-10 px-4 border-b pb-3 h-10 items-center">
		<Button variant="outline" size="icon" on:click={() => goto('/home/dashboard')}>
			<Icon icon="ic:twotone-arrow-back-ios" width="1.5rem" height="1.5rem" />
		</Button>
		<p>{sections[currentView]}</p>
		<Button variant="outline" size="icon" on:click={() => (openMenu = true)}>
			<Icon icon="ic:twotone-menu" width="1.5rem" height="1.5rem" />
		</Button>
	</div>
	<div class="mt-8 sm:mt-1 h-full mb-8">
		<div class="flex h-full">
			<div class="hidden sm:block sm:basis-1/5 border-r h-full">
				<AppMenu />
			</div>
			<div class="sm:basis-4/5 h-full flex flex-col w-full ml-2">
				<div class="basis-11/12 overflow-y-auto">
					<slot />
				</div>
				<div class="flex justify-between basis-1/12 border-t pt-4 mb-4">
					<Button
						variant={currentView === 0 ? 'outline' : 'default'}
						on:click={() => GotoPrevButton()}
						class="flex justify-between"
					>
						<Icon icon="ic:twotone-arrow-back-ios" class="mr-1.5" />
						{previousMessage()}</Button
					>
					<Button class={hasChanges === true ? 'block' : 'hidden'} on:click={() => ViewChanges()}
						>View Changes</Button
					>
					<form method="post">
						<Button
							class="{GetNextButton()==='-1'?'hidden':''}"
							disabled={isSavingApplication }
							on:click={async () => {validated();}}>
							<Icon
								class={isSavingApplication ? '' : 'hidden'}
								icon="eos-icons:loading"
								width="1.2rem"
								height="1.2rem"
							/>
							{GetNextButton()}
							<Icon icon="ic:twotone-arrow-forward-ios" class="ml-1.5" />
						</Button>
					</form>
				</div>
			</div>
		</div>
	</div>
</div>

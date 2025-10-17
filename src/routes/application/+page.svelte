<script lang="ts">
	import { applicationData, applicationMode, applicationScreen, newApplicationType, pageSaveStatus } from '$lib/store';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import { ApplicationStatuses, FilingType, FormApplicationTypes } from '$lib/helpers';
	let loading: boolean = false;
	$: viewComponent = null;
	let basicPatentComponent = null,
		basicTrademarkComponent=null,
		inventorsComponent = null,
		basicDesignComponent = null,
		applicantsComponent = null,
		correspondenceComponent = null,
		priorityComponent = null,
		attachmentComponent = null,
		verificationComponent = null;
	$: screen = 0;
	applicationScreen.subscribe(async (value) => {
		viewComponent = null;
		screen = value;
		loading = true;
		await loadPage(screen);
		loading = false;
		pageSaveStatus.set(null);
	});
	onMount(()=>{
		loading=true;
		const appMode=$applicationMode;
		if (appMode)
		{
			if (appMode===1)
			{
			}
			else {
				// creating new data
				applicationData.set(
					{
						id: "asfasdf",
						titleOfInvention:"",
						patentAbstract:"",
						applicants: [],
						priorityInfo: [],
						inventors:[],
						correspondence:null,
						patentType: null,
						fileNumber: null,
						formApplicationType: FormApplicationTypes.NewApplication,
						status: ApplicationStatuses.AwaitingPayment,
						type: FilingType.Patent,
						attachments:[]
					}
				);
						}
			loading=false;
		}
	})

	async function loadPage(page: number) {
		if ($newApplicationType === 0) {
			goto('../patent');
			return;
			// switch (page) {
			// 	case 0:
			// 		if (!basicPatentComponent) {
			// 			basicPatentComponent = (await import('./components/BasicPatent.svelte')).default;
			// 		}
			// 		viewComponent = basicPatentComponent;
			// 		break;
			// 	case 1:
			// 		if (!inventorsComponent) {
			// 			inventorsComponent = (await import('./components/Inventors.svelte')).default;
			// 		}
			// 		viewComponent = inventorsComponent;
			// 		break;
			// 	case 2:
			// 		if (!applicantsComponent) {
			// 			applicantsComponent = (await import('./components/Applicants.svelte')).default;
			// 		}
			// 		viewComponent = applicantsComponent;
			// 		break;
			// 	case 3:
			// 		if (!correspondenceComponent) {
			// 			correspondenceComponent = (await import('./components/Correspondence.svelte')).default;
			// 		}
			// 		viewComponent = correspondenceComponent;
			// 		break;
			// 	case 4:
			// 		if (!priorityComponent) {
			// 			priorityComponent = (await import('./components/Priority.svelte')).default;
			// 		}
			// 		viewComponent = priorityComponent;
			// 		break;
			// 	case 5:
			// 		if (!attachmentComponent) {
			// 			attachmentComponent = (await import('./components/Attachments.svelte')).default;
			// 		}
			// 		viewComponent = attachmentComponent;
			// 		break;
			// 	case 6:
			// 		if (!verificationComponent) {
			// 			verificationComponent = (await import('./components/Verification.svelte')).default;
			// 		}
			// 		viewComponent = verificationComponent;
			// 		break;
			// 	default:
			// 		viewComponent = null;
			// 		break;
			// }
		}
		if ($newApplicationType === 1) {
			switch (page) {
				case 0:
					if (!basicDesignComponent) {
						basicDesignComponent = (await import('./components/design/BasicDesign.svelte')).default;
					}
					viewComponent = basicDesignComponent;
					break;
				case 1:
					if (!inventorsComponent) {
						inventorsComponent = (await import('./components/Inventors.svelte')).default;
					}
					viewComponent = inventorsComponent;
					break;
				case 2:
					if (!applicantsComponent) {
						applicantsComponent = (await import('./components/Applicants.svelte')).default;
					}
					viewComponent = applicantsComponent;
					break;
				case 3:
					if (!correspondenceComponent) {
						correspondenceComponent = (await import('./components/Correspondence.svelte')).default;
					}
					viewComponent = correspondenceComponent;
					break;
				case 4:
					if (!attachmentComponent) {
						attachmentComponent = (await import('./components/design/DesignAttachments.svelte')).default;
					}
					viewComponent = attachmentComponent;
					break;
				case 5:
					if (!verificationComponent) {
						verificationComponent = (await import('./components/Verification.svelte')).default;
					}
					viewComponent = verificationComponent;
					break;
				default:
					viewComponent = null;
					break;
			}
		}

		if ($newApplicationType===2){
			switch (page) {
				case 0:
					if (!basicTrademarkComponent){
						basicTrademarkComponent = (await import('./components/trademark/Basic.svelte')).default;
					}
					viewComponent= basicTrademarkComponent;
					break;
				case 1:
					if (!applicantsComponent){
						applicantsComponent = (await import('./components/Applicants.svelte')).default;
					}
					viewComponent = applicantsComponent;
					break;
				case 2:
					if (!correspondenceComponent){
						correspondenceComponent = (await import('./components/Correspondence.svelte')).default;
					}
				viewComponent = correspondenceComponent;
					break;
				case 3:
					if (!attachmentComponent){
						attachmentComponent = (await import('./components/trademark/TradeAttachments.svelte')).default;
					}
					viewComponent = attachmentComponent;
					break;
				case 4:
					if (!verificationComponent) {
						verificationComponent = (await import('./components/Verification.svelte')).default;
					}
					viewComponent = verificationComponent;
					break;
			}
		}
	}
	
</script>

{#if viewComponent !== null}
	<svelte:component this={viewComponent} />
{:else if loading}
	<div class="flex items-center justify-center h-full">
		<Icon icon="eos-icons:loading" width="1.6rem" height="1.6rem" />
	</div>
{/if}

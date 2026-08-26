<script lang="ts">
	import { applicationData, applicationMode, applicationScreen, newApplicationType, pageSaveStatus } from '$lib/store';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ApplicationStatuses, FilingType, FormApplicationTypes, type PatentData } from '$lib/helpers';
	import type { ComponentType, SvelteComponent } from 'svelte';
	let loading: boolean = false;
	$: viewComponent = null as ComponentType<SvelteComponent> | null;
	let basicTrademarkComponent: ComponentType<SvelteComponent> | null = null,
		applicantsComponent: ComponentType<SvelteComponent> | null = null,
		correspondenceComponent: ComponentType<SvelteComponent> | null = null,
		attachmentComponent: ComponentType<SvelteComponent> | null = null,
		verificationComponent: ComponentType<SvelteComponent> | null = null;
	applicationScreen.subscribe(async (value) => {
		viewComponent = null;
		loading = true;
		await loadPage(value);
		loading = false;
		pageSaveStatus.set(null);
	});
	onMount(() => {
		loading = true;
		if ($applicationMode !== 1) {
			applicationData.set(
				{
					id: 'asfasdf',
					titleOfInvention: '',
					patentAbstract: '',
					applicants: [],
					priorityInfo: [],
					inventors: [],
					correspondence: null,
					patentType: null,
					formApplicationType: FormApplicationTypes.NewApplication,
					fileStatus: ApplicationStatuses.AwaitingPayment,
					type: FilingType.Patent,
					attachments: []
				} as Partial<PatentData> as PatentData
			);
		}
		loading = false;
	});

	async function loadPage(page: number) {
		switch ($newApplicationType) {
			case 0:
				goto('../patent');
				return;
			case 1:
				goto('../design');
				return;
			case 2:
				switch (page) {
					case 0:
						if (!basicTrademarkComponent) {
							basicTrademarkComponent = (await import('./components/trademark/Basic.svelte')).default;
						}
						viewComponent = basicTrademarkComponent;
						break;
					case 1:
						if (!applicantsComponent) {
							applicantsComponent = (await import('./components/Applicants.svelte')).default;
						}
						viewComponent = applicantsComponent;
						break;
					case 2:
						if (!correspondenceComponent) {
							correspondenceComponent = (await import('./components/Correspondence.svelte')).default;
						}
						viewComponent = correspondenceComponent;
						break;
					case 3:
						if (!attachmentComponent) {
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
					default:
						viewComponent = null;
				}
				return;
			default:
				viewComponent = null;
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

<script lang="ts">
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { get } from 'svelte/store';
	import {
		adjustmentsMade,
		adjustmentType,
		applicationData,
		changesData,
		changesMade,
		formsData,
		loggedInUser,
		newDataApp,
		viewUpdatesMade
	} from '$lib/store';
	import { ApplicationStatuses, type RevisionsType, UserRoles } from '$lib/helpers';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let isLoading: boolean = true;
	let fileId :string|null=null;
	let requiredData = {};
	function loadData() {
		isLoading = true;
		const type = get(adjustmentType);
		if (type === 1 || type===null) {
			const rvs=localStorage.getItem("revisions")
			if (rvs===null) {
				// load user made adjustments
				const changes = get(adjustmentsMade);
				if (changes) {
					const revision: RevisionsType[] = [];
					const requiresPayment: { type: string; payment: boolean }[] = [];
					const latestData = get(newDataApp);
					const oldData = get(applicationData);
					changes!.forEach((change) => {
						let _requiresPayment: boolean = false;
						if ([ApplicationStatuses.AwaitingPayment, ApplicationStatuses.AwaitingSearch, ApplicationStatuses.FormalityFail, ApplicationStatuses.Re_conduct].includes(oldData?.fileStatus)==false) {
							if (oldData?.fieldStatus[change] == undefined || oldData?.fieldStatus[change] == 0) {
								_requiresPayment = true;
							}
						} else {
							_requiresPayment = false;
						}
						revision.push({
							id: crypto.randomUUID(),
							oldTitle: oldData[change],
							newTitle: latestData[change],
							status: _requiresPayment
								? ApplicationStatuses.AwaitingSave
								: ApplicationStatuses.AwaitingConfirmation,
							dateTime: Date.now(),
							field: change,
							statusHistory: []
						});
						requiresPayment.push({
							type: change,
							payment: _requiresPayment
						});
					});
					const changesMade = {
						fileData: oldData,
						data: revision,
						requiresPayment: requiresPayment,
						canPassFormality: false,
						canPassApproval: false,
						isStaffOrAdmin: false,
						isUserOrAdmin: true
					};
					localStorage.setItem("revisions", JSON.stringify(changesMade));
					// changesData.set(changesMade);
					isLoading = false;
					return;
				} else {
					changesData.set({
						fileData: null,
						data: null,
						requiresPayment: null,
						canPassFormality: false,
						canPassApproval: false
					});
				}
			}
			else {
				isLoading = false;
				return;
			}
		} else if (type === 3) {
			// view particular update
			const oldData = get(applicationData);
			let _requiresPayment: boolean = false;
			const updateMade = get(viewUpdatesMade);
			const user = get(loggedInUser);
			const isStaffOrAdmin: boolean = user?.userRoles.includes(UserRoles.Tech) || user?.userRoles.includes(UserRoles.SuperAdmin)
			if ([0, 11, 12].includes(oldData?.fileStatus)) {
				if (
					oldData?.fieldStatus[updateMade?.fieldToChange] == undefined ||
					oldData?.fieldStatus[updateMade?.fieldToChange] == 0
				) {
					_requiresPayment = true;
				}
			} else {
				_requiresPayment = false;
			}
			const revision: RevisionsType = {
				id: updateMade?.id,
				status: updateMade?.currentStatus,
				statusHistory: updateMade?.statusHistory,
				field: updateMade?.fieldToChange,
				newTitle: JSON.parse(updateMade?.newValue),
				oldTitle: JSON.parse(updateMade?.oldValue),
				dateTime: updateMade?.applicationDate
			};
			isLoading = false;
			const rev_data={
				fileData: oldData,
					data: [revision],
				requiresPayment: [_requiresPayment],
				canPassFormality: false,
				canPassApproval: false,
				isStaffOrAdmin: isStaffOrAdmin,
				isUserOrAdmin: [UserRoles.Tech, UserRoles.Agent].some(x=>$loggedInUser.userRoles.includes(x))
			}
			// changesData.set(rev_data);
			localStorage.setItem("revisions", JSON.stringify(rev_data))
		}
	}

	onMount(() => {
		loadData();
		fileId = $page.url.searchParams.get('id');
	});
</script>

<div class="flex items-center px-2 py-2 justify-between">
	<Button size="icon" variant="outline" on:click={async() =>{
		changesData.set({});
		changesMade.set(null);
		formsData.set([]);
		await goto(`/home/dashboard`)}}>
<!--		await goto(`/dataview?id=${fileId}`)}}>-->
		<Icon icon="openmoji:return" width="1.2rem" height="1.2rem" />
	</Button>
	<p>Revisions Made</p>
	<Button on:click={() => {
		changesData.set({});
		changesMade.set(null);
		formsData.set([]);
		goto('/home/dashboard')}}>Home</Button>
</div>
<div>
	{#if isLoading}
		<p>loading......</p>
	{:else}
		<slot />
	{/if}
</div>

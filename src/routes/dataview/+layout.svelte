<script lang="ts">
	import { Button } from '$lib/components/ui/button/index';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index';
	import type { LayoutServerData } from '../../../.svelte-kit/types/src/routes/$types';
	import { goto } from '$app/navigation';
	import {
		CanTreatApplication,
		CanUpdateApplication,
		getNewStatusColour,
		getStatuses,
		mapStatusOptionToString,
		parseLoggedInUser
	} from './datahelpers';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { writable } from 'svelte/store';
	import {
		type ApplicationHistoryType,
		ApplicationStatuses,
		baseURL,
		FilingType,
		type PatentData,
		UserRoles,
		UserTypes
	} from '$lib/helpers';
	import { page } from '$app/stores';
	import {
		appattachmentsData,
		applicationData,
		applicationMode,
		applicationScreen,
		formsData,
		listOfIds,
		loggedInUser,
		newApplicationType,
		queryBody,
		savePageData,
		validatedPages,
		validatePage
	} from '$lib/store';
	import { type DateValue, parseDate } from '@internationalized/date';
	import Icon from '@iconify/svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { toast } from 'svelte-sonner';
	import { mapTypeToString } from '../home/components/dashboardutils';
	import { redirect } from '@sveltejs/kit';
	import { onMount } from 'svelte';
	import dayjs from 'dayjs';
	import ApplicationsHistory from './ApplicationsHistory.svelte';
	let canUpdate: boolean = false;
	let canTreat: boolean = false;
	let fileData;
	let currentStatus: ApplicationStatuses;
	let treatApplicationDialog: boolean = false;
	let treatConfirmationDialog: boolean = false;
	let currentUrl = writable<URL>($page.url);
	let selectedStatus: ApplicationStatuses | null = null;
	let newStatusReason = writable<string | null>(null);
	let selectedApplication: ApplicationHistoryType | null = null;
	let isSaving: boolean = false;
	let isDataLoading: boolean = true;
	let isLoading = false;
	export let data: LayoutServerData;
	function resetForm() {
		selectedStatus = null;
		newStatusReason.set(null);
	}

	$: validateForm = (): boolean => {
		return $newStatusReason !== null && $newStatusReason != '' && selectedStatus != null;
	};

	function getDates() {
		return fileData?.applicationHistory
			?.filter((y) => y.applicationType == 0 || y.applicationType == 1)
			.map((x) => x.expiryDate);
	}
	async function saveNewStatus() {
		isSaving = true;
		const body = {
			beforeStatus: selectedApplication?.currentStatus,
			afterStatus: selectedStatus,
			message: $newStatusReason,
			user: $loggedInUser?.name,
			userId: $loggedInUser?.id.toString(),
			applicationType: selectedApplication?.applicationType,
			fileId: fileData?.id,
			applicationId: selectedApplication?.id,
			fieldToUpdate: selectedApplication?.fieldToChange,
			newValue: selectedApplication?.newValue,
			fileType: fileData?.type,
			dates: getDates()
		};
		const res = await fetch(`${baseURL}/api/files/UpdateApplicationStatus`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (res.ok) {
			const result = await res.json();
			console.log(result);
			applicationData.set(result as PatentData);
			isSaving = false;
			treatApplicationDialog = false;
			treatConfirmationDialog = false;
			toast.success('Successfully updated status', {
				position: 'top-right'
			});
			newStatusReason.set(null);
			selectedStatus = null;
			const loggeduser = $loggedInUser.id.toString();
			const userRoles = $loggedInUser.userRoles;
			const filingType = $applicationData.type;
			const appStatus = $applicationData.fileStatus;
			canUpdate = CanUpdateApplication(
				loggeduser,
				$applicationData.creatorAccount,
				userRoles,
				appStatus
			);
			canTreat = CanTreatApplication(
				userRoles,
				filingType,
				appStatus,
				fileData.applicationHistory.map((x) => x.currentStatus)
			);
		}
	}

	export function updateApplication() {
		newApplicationType.set(fileData.type);
		applicationMode.set(1);
		if (fileData.priorityInfo) {
			(fileData as PatentData)?.priorityInfo.forEach((x) => {
				console.log(x.date);
				if (x.date.includes('/')) {
					x.date = dayjs(x.date, 'M/D/YYYY').format('YYYY-MM-DD');
				} else {
					x.date = parseDate(x.date);
				}
			});
		}
		formsData.set([]);
		applicationScreen.set(0);
		appattachmentsData.set([{ name: '', data: [] }]);
		savePageData.set(null);
		validatedPages.set([]);
		validatePage.set(null);
		applicationData.set(fileData);
		goto(`/application?type=${fileData.type}`);
	}

	onMount(async () => {
		await loadData();
		getDates();
		console.log(
			fileData.applicationHistory.filter(
				(x) => [0, 1].includes(x.applicationType) && ![0, 1].includes(x.currentStatus)
			)
		);
	});

	async function loadData() {
		isDataLoading = true;
		const id = $currentUrl.searchParams.get('id');
		if (!$loggedInUser) {
			const user = parseLoggedInUser(document.cookie);
			if (!user) {
				console.log('the logged in user');
				await goto('/auth');
			} else {
				loggedInUser.set(user);
			}
		}
		const loggeduser = $loggedInUser.id.toString();
		const res = await fetch(`${baseURL}/api/files/${id}`);
		const file = await res.json();
		const userRoles = $loggedInUser.userRoles;
		const filingType = file.type;
		const appStatus = file.fileStatus;
		applicationData.set(file);
		fileData = file;
		canUpdate = CanUpdateApplication(loggeduser, file.creatorAccount, userRoles, appStatus);
		canTreat = CanTreatApplication(
			userRoles,
			filingType,
			appStatus,
			fileData.applicationHistory.map((x) => x.currentStatus)
		);
		currentStatus = appStatus;
		isDataLoading = false;
	}

	async function gotoPrevious() {
		const currentID = $currentUrl.searchParams.get('id');
		let currentIndex: number = $listOfIds.indexOf(currentID);
		if (currentIndex != 0) {
			currentIndex -= 1;
			const nextId = $listOfIds[currentIndex];
			if (!nextId || nextId === undefined) {
				toast.info('No more files of selected type available', { position: 'top-right' });
			} else {
				currentUrl.update((curr) => {
					curr.searchParams.set('id', nextId);
					return curr;
				});
				await loadData();
			}
		} else {
			toast.info('No more files of selected type available', { position: 'top-right' });
		}
	}

	async function gotoNext() {
		const currentID = $currentUrl.searchParams.get('id');
		let currentIndex: number = $listOfIds.indexOf(currentID);
		currentIndex += 1;
		// if we are close to the end of the list, at 9,load next 10,
		const lengthOfList = $listOfIds.length;
		if (currentIndex + 2 === lengthOfList) {
			// load next set of ids
			getNextIds();
		}
		const nextId = $listOfIds[currentIndex];
		if (!nextId || nextId === undefined) {
			toast.info('No more files of selected type available', { position: 'top-right' });
			// goto('home/dashboard');
		} else {
			currentUrl.update((curr) => {
				curr.searchParams.set('id', nextId);
				return curr;
			});
			await loadData();
		}
	}

	function treatApplication(data: ApplicationHistoryType) {
		if (
			data.applicationType == 1 &&
			[
				ApplicationStatuses.AwaitingSearch,
				ApplicationStatuses.AwaitingExaminer,
				ApplicationStatuses.Re_conduct,
				ApplicationStatuses.Rejected,
				ApplicationStatuses.KivExaminer,
				ApplicationStatuses.KivSearch
			].includes(fileData.applicationHistory[0].currentStatus)
		) {
			toast.error('A Renewal Application  cannot be treated until the new application is treated', {
				position: 'top-right'
			});
			return;
		}
		currentStatus = data.currentStatus;
		selectedApplication = data;
		treatApplicationDialog = true;
	}
	async function getNextIds() {
		const index = $listOfIds.length;
		const _queryBody = $queryBody;
		const response = await fetch(`${baseURL}/api/files/GetListOfIds?index=${index}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: _queryBody
		});
		const result = await response.json();
		if (response.ok) {
			listOfIds.update((ll) => {
				ll = [...ll, ...result];
				console.log('updated is', ll);
				return ll;
			});
		}
	}
	function searchAvailability() {
		// let classNo = string
		console.log('fileData', fileData);
		const searchParams = {
			query: fileData?.titleOfTradeMark?.split(' ')[0],
			classId: fileData?.trademarkClass,
			fileType: fileData?.type
		};
		sessionStorage.setItem('searchParams', JSON.stringify(searchParams));
		// console.log('searchParams', searchParams);

		window.open(`/availabilitysearch`, '_blank');
	}
</script>

<Toaster />
<Dialog.Root bind:open={treatApplicationDialog} onOpenChange={resetForm}>
	<Dialog.Content class="max-w-fit">
		<Dialog.Header>
			<Dialog.Title>Treat Application</Dialog.Title>
			<Dialog.Description>Select new status</Dialog.Description>
		</Dialog.Header>
		<br />
		<Button on:click={searchAvailability}
			>{#if isLoading}
				<span class="inline-block mr-2">
					<svg
						class="animate-spin h-4 w-4 text-white"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				</span>
				Searching...
			{:else}
				Availability Search
			{/if}</Button
		>
		<div class="gap-2 flex">
			{#each getStatuses(currentStatus, $applicationData.type) as status}
				<button
					on:click={() => (selectedStatus = status)}
					style="background-color: {selectedStatus === status
						? getNewStatusColour(status)
						: 'transparent'} "
					class="border rounded-md flex p-2 flex-grow items-center hover:bg-accent hover:cursor-pointer {selectedStatus ===
					status
						? ''
						: 'bg-none'}  "
				>
					<p>{mapStatusOptionToString(status)}</p>
				</button>
			{/each}
		</div>
		<br />
		<Textarea class="min-h-[120px]" placeholder="Enter reason" bind:value={$newStatusReason} />
		<Dialog.Footer class="sm:flex gap-3">
			<Button
				variant="outline"
				on:click={() => {
					treatApplicationDialog = false;
					resetForm();
				}}>Cancel</Button
			>
			<Button disabled={!validateForm()} on:click={() => (treatConfirmationDialog = true)}>
				Continue
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
<Dialog.Root bind:open={treatConfirmationDialog}>
	<Dialog.Content class="min-w-fit mx-1.5">
		<Dialog.Header>
			<Dialog.Title>Confirmation</Dialog.Title>
			<Dialog.Description>Select new status</Dialog.Description>
		</Dialog.Header>
		<br />
		<p>
			Are you sure you want to update the status to
			<span
				class="border w-fit p-1 rounded-md"
				style="background-color: {getNewStatusColour(selectedStatus)}"
			>
				{mapStatusOptionToString(selectedStatus)}
			</span> ?
		</p>
		<br />
		<Dialog.Footer class="sm:flex gap-3">
			<Button
				variant="outline"
				on:click={() => {
					treatConfirmationDialog = false;
				}}>Cancel</Button
			>
			<Button disabled={isSaving} on:click={() => saveNewStatus()}>
				<Icon
					class={isSaving ? '' : 'hidden'}
					icon="line-md:loading-twotone-loop"
					width="1.2rem"
					height="1.2rem"
				/>

				Continue
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
<div class="flex flex-col h-screen">
	{#if isDataLoading}
		<div class="w-full h-full flex">
			<Icon
				class="mx-auto my-auto"
				icon="line-md:loading-twotone-loop"
				width="1.2rem"
				height="1.2rem"
			/>
		</div>
	{:else}
		<div class="basis-11/12 overflow-y-auto">
			<slot />
		</div>
		<div class="flex justify-between p-4 basis-1/12">
			<Button on:click={() => gotoPrevious()}>Previous</Button>
			{#if $loggedInUser.userRoles?.some((x) => [UserRoles.BackOffice, UserRoles.Support].includes(x))}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button>Treat Applications</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						{#if canTreat}
							<DropdownMenu.Item on:click={() => treatApplication(fileData.applicationHistory[0])}
								>Treat New Application</DropdownMenu.Item
							>
						{/if}
						<!-- {#if  }
						<DropdownMenu.Item on:click={() => treatApplication(fileData.applicationHistory[0])}
								>Treat Rejected Application</DropdownMenu.Item
							>
						{/if} -->
						<!-- {#each fileData.applicationHistory.filter(x=>x.applicationType===1) as renewal, i}
							{#if CanTreatApplication($loggedInUser.userRoles, fileData.type, renewal.currentStatus, [])}
								<DropdownMenu.Item on:click={() => treatApplication(renewal)}
									>Treat Renewal Application {i+1}</DropdownMenu.Item
								>
							{/if}
						{/each} -->
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{/if}

			{#if $loggedInUser.userRoles?.includes(UserRoles.Support) && fileData.type === FilingType.Design}
				<Button class={canUpdate ? 'block' : 'hidden'} on:click={() => updateApplication()}>
					Update Record
				</Button>
			{/if}
			<Button on:click={() => gotoNext()}>Next</Button>
		</div>
	{/if}
</div>

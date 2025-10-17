<script lang="ts">
	import {
		ApplicationStatuses,
		baseURL, decodeUser,
		type PatentData,
		type Priority,
		type RevisionsType,
		UserRoles
	} from '$lib/helpers';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import {
		getNewStatusColour,
		getRevisionStatuses,
		mapStatusOptionToString,
		showTreatUpdateAppButton
	} from '../dataview/datahelpers';
	import { writable } from 'svelte/store';
	import { Textarea } from '$lib/components/ui/textarea';
	import ComparisonTable from './ComparisonTable.svelte';
	import AttachmentsComparison from './AttachmentsComparison.svelte';
	import CorrespondenceComparison from './CorrespondenceComparison.svelte';
	import OtherComparison from './OtherComparison.svelte';
	import HistorySheet from '../home/components/HistorySheet.svelte';
	import { toast } from 'svelte-sonner';
	import { faker } from '@faker-js/faker';
	import { Toaster } from '$lib/components/ui/sonner';
	import { applicationData, loggedInUser } from '$lib/store';
	import * as AlertDialog from "$lib/components/ui/alert-dialog"
	import * as Dialog from "$lib/components/ui/dialog"
	import * as Table from "$lib/components/ui/table"
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { mapFieldToString } from '../application/apphelper';

	let requiredData = {};
	let revisions = writable<RevisionsType[]>([]);
	let requiresPayment: { type: string; payment: boolean }[] = [];
	let showUpdateConfirmation: boolean = false;
	let canPassApproval: boolean = false;
	let showComparison: boolean = false;
	let showUpdateDialog: boolean = false;
	let canPassFormality: boolean = false;
	let showConfirmUserDateUpdate: boolean = false;
	let isUpdatingStatus: boolean = false;
	let isStaffOrAdmin: boolean = false;
	let isUserOrAdmin: boolean = false;
	let newStatusReason = writable<string | null>(null);
	let selectedStatus: ApplicationStatuses | null = null;
	let showStatusHistory: boolean = false;
	let historyData = {};
	let historyComponent: HistorySheet | null = null;
	$: {
		revisions.set(requiredData.data as RevisionsType[]);
		requiresPayment = requiredData.requiresPayment;
		canPassFormality = requiredData.canPassFormality;
		canPassApproval = requiredData.canPassApproval;
		isStaffOrAdmin = requiredData.isStaffOrAdmin;
		isUserOrAdmin = requiredData.isUserOrAdmin;
	}
	let isDataLoading: boolean = true;
	onMount(async () => {
		if ($loggedInUser===null) {
			await decodeUser()
		}
		isDataLoading = true;
		// requiredData = $changesData;
		var rvs = localStorage.getItem('revisions');
		if (rvs !== null) {
			requiredData = JSON.parse(rvs);
		}
		isDataLoading = false;
	});
	let selectedRevision: RevisionsType | null = null;

	function getActionButtonType(revision: RevisionsType) {
		return revision.status === ApplicationStatuses.AwaitingSave
			? 'Save'
			: revision.status === ApplicationStatuses.AwaitingPayment
				? 'Make Payment'
				: revision.status === ApplicationStatuses.AwaitingConfirmation
					? 'Confirm'
					: '-';
	}
	async function getRevisionAmount(field: string): Promise<string> {
		console.log('required data', requiredData);
		const result = await fetch(`${baseURL}/api/files/RevisionCost`, {
			headers: { 'Content-Type': 'application/json' },
			method: 'POST',
			body: JSON.stringify({
				fieldToChange: field,
				type: requiredData.fileData.type
			})
		});
		const cost = await result.json();
		return cost.cost;
	}
	function formalityUpdate(revision: RevisionsType) {
		selectedRevision = revision;
	}

	function examinerUpdate(revision: RevisionsType) {
		selectedRevision = revision;
	}

	function resetForm() {
		selectedStatus = null;
		newStatusReason.set(null);
	}
	async function saveNewStatus() {
		isUpdatingStatus = true;
		const body = {
			beforeStatus: selectedRevision?.status,
			afterStatus: selectedStatus,
			message: $newStatusReason,
			user: $loggedInUser.name,
			userId: $loggedInUser.id.toString(),
			applicationType: 2,
			fileId: $applicationData.id,
			fileNumber: $applicationData.fileId,
			applicationId: selectedRevision?.id,
			fieldToUpdate: selectedRevision?.field,
			newValue: JSON.stringify(selectedRevision?.newTitle)
		};
		const res = await fetch(`${baseURL}/api/files/UpdateApplicationStatus`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (res.ok) {
			const latestData = await res.json();
			const curr = (latestData.applicationHistory as []).find((x) => x.id === selectedRevision?.id);
			const latestStatus = curr.currentStatus;
			selectedRevision.status = latestStatus;
			selectedRevision.statusHistory = curr.statusHistory;
			revisions.update((rev) => {
				const ind = rev.findIndex((x) => x.id == selectedRevision?.id);
				rev[ind] = selectedRevision;
				rev = [...rev];
				return rev;
			});
			isUpdatingStatus = false;
			showUpdateConfirmation = false;
			showUpdateDialog = false;
			toast.success('Successfully updated status', {
				position: 'top-right'
			});
			newStatusReason.set(null);
			selectedStatus = null;
		}
	}
	function dataType(): string {
		if (
			['inventors', 'priorityinfo', 'applicants', 'designcreators'].includes(
				selectedRevision?.field.toLowerCase()
			)
		) {
			return 'table';
		}
		return selectedRevision?.field.toLowerCase() ?? '';
	}

	let isApplicationSaving: boolean = false;
	function showAutoSave(){
		return $loggedInUser.roles.includes(UserRoles.Support)
	}
	async function ProceedToNext() {
		if (selectedRevision?.status === ApplicationStatuses.AwaitingConfirmation) {
			// show confirmation
			showConfirmUserDateUpdate = true;
		} else if (selectedRevision?.status === ApplicationStatuses.AwaitingSave) {
			await saveApplication();
		} else if (selectedRevision?.status === ApplicationStatuses.AwaitingPayment) {
			// proceed to payment
			await goto(
				`/payment?type=update&patentChangeType=${selectedRevision?.field}&applicationId=${selectedRevision?.id}`
			);
			// simulate
			return;
			// const body = {
			// 	beforeStatus: ApplicationStatuses.AwaitingPayment,
			// 	afterStatus: ApplicationStatuses.AwaitingSearch,
			// 	message: 'Payment successful, awaiting search',
			// 	user: $loggedInUser.name,
			// 	userId: $loggedInUser.id.toString(),
			// 	applicationType: FormApplicationTypes.DataUpdate,
			// 	fileId: requiredData.fileData.id,
			// 	applicationId: selectedRevision?.id,
			// 	fieldToUpdate: selectedRevision?.field,
			// 	newValue: selectedRevision?.newTitle,
			// 	fileType: requiredData.fileData.type
			// };
			// isApplicationSaving = true;
			// const res = await fetch(`${baseURL}/api/files/UpdateApplicationStatus`, {
			// 	method: 'POST',
			// 	headers: { 'Content-Type': 'application/json' },
			// 	body: JSON.stringify(body)
			// });
			// if (res.ok) {
			// 	const result = await res.json();
			// 	console.log(result);
			// 	applicationData.set(result);
			// 	const curr = (result.applicationHistory as []).find((x) => x.id === selectedRevision?.id);
			// 	const latestStatus = curr.currentStatus;
			// 	selectedRevision?.status = latestStatus;
			// 	selectedRevision?.statusHistory = curr.statusHistory;
			// 	revisions.update((rev) => {
			// 		const ind = rev.findIndex((x) => x.id == selectedRevision?.id);
			// 		rev[ind] = selectedRevision;
			// 		rev = [...rev];
			// 		return rev;
			// 	});
			// 	toast.success('Payment successful, awaiting search', {
			// 		description: `${selectedRevision?.field} application updated`,
			// 		position: 'top-right'
			// 	});
			// 	isApplicationSaving = false;
			// }
		}
	}

	async function saveApplication() {
		const upperChar =
			selectedRevision?.field.charAt(0).toUpperCase() +
			(selectedRevision?.field.length > 1 ? selectedRevision?.field.slice(1) : '');
		if (upperChar==="PriorityInfo"){
			let p=selectedRevision.newTitle as Priority[]
			for (const pKey in p) {
				let month=p[pKey].date.month;
				if (month<10){
					month=`0${month}`;
				}
				let day=p[pKey].date.day
				if (day<10){
					day=`0${day}`;
				}
				p[pKey].date= `${p[pKey].date.year}-${month}-${day}`
			}
			selectedRevision.newTitle=p;
		}
		const body = {
			revisionId: selectedRevision?.id,
			fileId: requiredData.fileData.id,
			fileType: requiredData.fileData.type,
			phone: requiredData.fileData.correspondence.phone,
			applicantName: requiredData.fileData.applicants[0].name,
			email: requiredData.fileData.correspondence.email,
			designType: requiredData.fileData.designType,
			patentType: requiredData.fileData.patentType,
			oldValue: JSON.stringify(selectedRevision?.oldTitle),
			newValue: JSON.stringify(selectedRevision?.newTitle),
			fieldToChange: upperChar,
			user: $loggedInUser.name,
			userId: $loggedInUser.id.toString()
		};
		const result = await fetch(`${baseURL}/api/files/SaveDataUpdate`, {
			method: 'post',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...body })
		});
		if (result.ok) {
			const latestData = await result.json();
			applicationData.set(latestData);
			const curr = (latestData.applicationHistory as []).find((x) => x.id === selectedRevision?.id);
			const latestStatus = curr.currentStatus;
			selectedRevision.status = latestStatus;
			selectedRevision.statusHistory = curr.statusHistory;
			let rvsstring = localStorage.getItem('revisions');
			let rvs = JSON.parse(rvsstring);
			revisions.update((rev) => {
				const ind = rev.findIndex((x) => x.id == selectedRevision?.id);
				rvs.data[ind] = selectedRevision;
				localStorage.setItem('revisions', JSON.stringify(rvs));
				rev[ind] = selectedRevision;
				rev = [...rev];
				return rev;
			});
			toast.success('Successfully saved', {
				description: `${selectedRevision?.field} changed on ${faker.date.soon().toString().split('GMT')[0]}`,
				position: 'top-right'
			});
		}
	}
	async function updateField() {
		const fileData: PatentData = requiredData.fileData;
		const upperChar =
			selectedRevision?.field.charAt(0).toUpperCase() +
			(selectedRevision?.field.length > 1 ? selectedRevision?.field.slice(1) : '');
		if (upperChar==="PriorityInfo"){
			let p=selectedRevision.newTitle as Priority[]
			for (const pKey in p) {
				let month=p[pKey].date.month;
				if (month<10){
					month=`0${month}`;
				}
				let day=p[pKey].date.day
				if (day<10){
					day=`0${day}`;
				}
				p[pKey].date= `${p[pKey].date.year}-${month}-${day}`
			}
			selectedRevision.newTitle=p;
		}

		let updateInfo = {
			revisionId: selectedRevision?.id,
			fileId: fileData.id,
			fileType: fileData.type,
			fileNumber: fileData.fileId,
			designType: fileData.designType,
			patentType: fileData.patentType,
			patentChangeType: selectedRevision?.field,
			currentStatus: fileData.fileStatus,
			oldValue: JSON.stringify(selectedRevision?.oldTitle),
			newValue: JSON.stringify(selectedRevision?.newTitle),

			fieldToChange: upperChar,
			user: $loggedInUser.name,
			userId: $loggedInUser.id.toString()
		};
		const result = await fetch(`${baseURL}/api/files/freeupdates`, {
			method: 'POST',
			body: JSON.stringify(updateInfo),
			headers: { 'Content-Type': 'application/json' }
		});
		if (result.ok) {
			const latestData = await result.json();
			const curr = (latestData.applicationHistory as []).find((x) => x.id === selectedRevision?.id);
			const latestStatus = curr.currentStatus;
			selectedRevision.status = latestStatus;
			selectedRevision.statusHistory = curr.statusHistory;
			revisions.update((rev) => {
				const ind = rev.findIndex((x) => x.id == selectedRevision?.id);
				rev[ind] = selectedRevision;
				rev = [...rev];
				return rev;
			});
			toast.success('Field updated successfully', {
				description: `${selectedRevision?.field} changed on ${faker.date.soon().toString().split('GMT')[0]}`,
				position: 'top-right'
			});
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

	async  function autoUpdate(revision){
		showConfirmUserDateUpdate=true;
	}
</script>

{#if showStatusHistory === true}
	<svelte:component this={historyComponent} {...historyData} />
{/if}
<Toaster />
<div>
	<AlertDialog.Root bind:open={showConfirmUserDateUpdate}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>{selectedRevision?.field} Change confirmation</AlertDialog.Title>
				<AlertDialog.Description>
					<p>Are you sure you want to update the {selectedRevision?.field}</p>
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action on:click={() => updateField()}>Continue</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
	<Dialog.Root bind:open={showComparison}>
		<Dialog.Content class="min-w-full mx-1.5 my-2">
			<Dialog.Header>
				<Dialog.Title>
					{selectedRevision?.field} comparisons
				</Dialog.Title>
			</Dialog.Header>
			{#if dataType() === 'table'}
				<ComparisonTable
					oldData={selectedRevision?.oldTitle}
					newData={selectedRevision?.newTitle}
					type={selectedRevision?.field}
				/>
			{:else if dataType().toLowerCase() === 'attachments'}
				<AttachmentsComparison
					oldData={selectedRevision?.oldTitle}
					newData={selectedRevision?.newTitle}
				/>
			{:else if dataType() === 'correspondence'}
				<CorrespondenceComparison
					oldData={selectedRevision?.oldTitle}
					newData={selectedRevision?.newTitle}
				/>
			{:else}
				<OtherComparison
					oldData={selectedRevision?.oldTitle}
					newData={selectedRevision?.newTitle}
					field={selectedRevision?.field}
				/>
			{/if}
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root bind:open={showUpdateDialog} onOpenChange={resetForm}>
		<Dialog.Content class="max-w-fit">
			<Dialog.Header>
				<Dialog.Title>Treat Application</Dialog.Title>
				<Dialog.Description>Select new status</Dialog.Description>
			</Dialog.Header>
			<br />
			<div class="gap-2 flex">
				{#each getRevisionStatuses(selectedRevision?.status) as status}
					<a
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
					</a>
				{/each}
			</div>
			<br />
			<Textarea class="min-h-[120px]" placeholder="Enter reason" bind:value={$newStatusReason} />
			<Dialog.Footer class="sm:flex gap-3">
				<Button
					variant="outline"
					on:click={() => {
						showUpdateDialog = false;
						resetForm();
					}}>Cancel</Button
				>
				<Button on:click={() => (showUpdateConfirmation = true)}>Continue</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
	<AlertDialog.Root bind:open={showUpdateConfirmation}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Status Update Confirmation</AlertDialog.Title>
				<AlertDialog.Description>
					<p>
						Are you sure you want to update the status to
						<span
							class="border w-fit p-1 rounded-md"
							style="background-color: {getNewStatusColour(selectedStatus)}"
						>
							{mapStatusOptionToString(selectedStatus)}
						</span> ?
					</p>
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action on:click={() => saveNewStatus()}>
					<Icon
						class={isUpdatingStatus ? '' : 'hidden'}
						icon="line-md:loading-twotone-loop"
						width="1.2rem"
						height="1.2rem"
					/>
					Continue</AlertDialog.Action
				>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
	{#if !isDataLoading}
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-1">s/n</Table.Head>
					<Table.Head>field</Table.Head>
					<Table.Head>Compare Old and New</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head class={isUserOrAdmin ? '' : 'hidden'}>Amount</Table.Head>
					<Table.Head class={isUserOrAdmin ? '' : 'hidden'}>Action</Table.Head>
					<Table.Head class={isStaffOrAdmin ? '' : 'hidden'}>Action</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each $revisions as revision, i (i)}
					<Table.Row>
						<Table.Cell class="w-1">{i + 1}</Table.Cell>
						<Table.Cell>{mapFieldToString(revision.field)}</Table.Cell>
						<Table.Cell>
							<Button
								on:click={() => {
									selectedRevision = revision;
									showComparison = true;
								}}
							>
								<Icon icon="iconamoon:compare-bold" width="1.2rem" height="1.2rem" />
								<p>Compare</p>
							</Button>
						</Table.Cell>
						<Table.Cell><AppStatusTag value={revision.status} /></Table.Cell>
						<Table.Cell class={isUserOrAdmin ? '' : 'hidden'}>
							{#if [ApplicationStatuses.AwaitingConfirmation, ApplicationStatuses.AutoApproved].includes(revision.status) === false}
								{#await getRevisionAmount(revision.field)}
									<Icon icon="line-md:loading-twotone-loop" width="1.2rem" height="1.2rem" />
								{:then value}
									<p>{value}</p>
								{:catch error}
									<p>###</p>
								{/await}
							{:else}
								<p>-</p>
							{/if}
						</Table.Cell>
						<Table.Cell class={isUserOrAdmin ? '' : 'hidden'}>
							<Button
								disabled={revision.status === 3 || revision.status === 13 || isApplicationSaving}
								on:click={async () => {
									selectedRevision = revision;
									await ProceedToNext();
								}}
							>
								<Icon
									class={isApplicationSaving ? '' : 'hidden'}
									icon="line-md:loading-twotone-loop"
									width="1.2rem"
									height="1.2rem"
								/>
								{getActionButtonType(revision)}
							</Button>
						</Table.Cell>
						{#if $loggedInUser.roles.includes(UserRoles.Support)}
						<Table.Cell>
							<Button on:click={()=>{selectedRevision=revision;autoUpdate(revision)}} >Auto-update</Button>
						</Table.Cell>
							{/if}
						<Table.Cell class={isStaffOrAdmin ? '' : 'hidden'}>
							{#if showTreatUpdateAppButton(revision.status, $applicationData.type, $loggedInUser.roles)}
								<Button
									on:click={() => {
										selectedRevision = revision;
										showUpdateDialog = true;
									}}>Treat</Button
								>
							{:else}
								<p>-</p>
							{/if}
						</Table.Cell>
						<!--{#if showAutoSave() && [ApplicationStatuses.AwaitingPayment, ApplicationStatuses.AwaitingConfirmation, ApplicationStatuses.AwaitingSave].includes(revision.status) }-->
						<!--<Table.Cell> <Button on:click={()=>{selectedRevision=revision;autoUpdate(revision)}} >Auto-Update</Button> </Table.Cell>-->
						<!--{/if}-->
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	{:else}
		<p>loading....</p>
	{/if}
</div>

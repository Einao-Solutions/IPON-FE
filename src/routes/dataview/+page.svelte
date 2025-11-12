<script lang="ts">
	import PatentView from './PatentView.svelte';
	import {
		ApplicationStatuses,
		baseURL,
		hasValidCorrespondenceDetails,
		UserRoles
	} from '$lib/helpers';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import ApplicationsHistory from './ApplicationsHistory.svelte';
	import { getHistoryData } from './datahelpers';
	import HistorySheet from '../home/components/HistorySheet.svelte';
	import { fileTypeToString, mapDateToString } from '../home/components/dashboardutils';
	import { onMount } from 'svelte';
	import { applicationData, loggedInUser, metaDataInfo } from '$lib/store';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import DesignView from './DesignView.svelte';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import { toast } from 'svelte-sonner';
	import AssignmentApplication from './AssignmentApplication.svelte';
	import TradeMarkView from './TradeMarkView.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Toaster } from '$lib/components/ui/sonner';
	import DocumentModule from '../home/dashboard/components/DocumentModule.svelte';
	import { CanUpdateApplication } from './datahelpers';
	import OppositionHistory from './OppositionHistory.svelte';
	$: fileData = $applicationData;
	let historyComponent: HistorySheet | null = null;
	let historyData = {};
	let showStatusHistory = false;
	let isUser: boolean = false;
	let showAllDates: boolean = false;
	applicationData.subscribe((data) => {
		if (data !== null && data.id !== 'asfasdf') {
			fileData = data;
		}
	});
	async function ViewHistory() {
		if (historyComponent === null) {
			historyComponent = (await import('../home/components/HistorySheet.svelte')).default;
		}
		historyData = getHistoryData(null);
		const handleClose = () => {
			showStatusHistory = false;
			historyData = {};
		};
		historyData = { ...historyData, onclose: handleClose, isVisible: true };
		showStatusHistory = true;
	}
	onMount(() => {
		isUser = true;
		// isUser = $loggedInUser?.userRoles.includes(UserRoles.Agent)
	});
	let showAssignForm = false;
	let assignForm = undefined;
	let assignData = {};
	function showAssignmentButton() {
		// patent or trademark
		if (fileData.type === 0 || fileData.type === 2) {
			if (fileData?.currentStatus !== 2) {
				return true;
			}
			return false;
		}
		return false;
	}
	async function assignApplication() {
		// patents and trademarks
		if (!assignForm) {
			assignForm = (await import('../home/dashboard/components/AssignForm.svelte')).default;
			let closed = () => (showAssignForm = false);
			let applicantName =
				fileData?.applicants.length > 1
					? fileData.applicants[0].name + ' et al.'
					: fileData.applicants[0].name;
			let applicantEmail = fileData?.applicants[0].email;
			let applicantCountry = fileData?.applicants[0].country;
			let applicantNumber = fileData?.applicants[0].phone;
			let applicantAddress = fileData?.applicants[0].address;
			let fileTitle =
				fileData?.type == 0
					? fileData.titleOfInvention
					: fileData?.type == 1
						? fileData.titleOfDesign
						: fileData?.titleOfTradeMark;
			assignData = {
				closed: closed,
				requiredData: {
					fileId: fileData?.id,
					fileType: fileData?.type,
					applicant: applicantName,
					applicantEmail: applicantEmail,
					applicantCountry: applicantCountry,
					applicantAddress: applicantAddress,
					applicantNumber: applicantNumber,
					fileNumber: fileData?.fileId,
					fileTitle: fileTitle
				}
			};
		}
		showAssignForm = true;
	}

	let ownershipData = {};
	let showOwnership = false;
	let ownershipForm = undefined;
	async function showOwnershipForm() {
		if (!ownershipForm) {
			ownershipForm = (await import('../dataview/Components/OwnershipForm.svelte')).default;
		}
		let closed = () => (showOwnership = false);
		ownershipData = {
			closed: closed,
			requiredData: {
				fileId: fileData.id,
				oldCorrespondence: fileData.correspondence,
				oldId: fileData.creatorAccount
			}
		};
		showOwnership = true;
	}

	function getExpiryData() {
		if (fileData == null) {
			return 'pending';
		}
		var allDates: Date[] = fileData.applicationHistory
			?.filter((x) => x.applicationType === 1 || x.applicationType === 0)
			.map((e) => ({
				expiryDate: e.expiryDate,
				currentStatus: e.currentStatus,
				licenseType: e.licenseType
			}));
		const mappedDates = allDates.map((e) => ({
			currentStatus: e.currentStatus,
			licenseType: e.licenseType,
			start:
				e.expiryDate !== null
					? new Date(
							new Date(e.expiryDate).getFullYear() -
								(fileData.type == 0 ? 1 : fileData.type == 1 ? 5 : 7),
							new Date(e.expiryDate).getMonth(),
							new Date(e.expiryDate).getDate()
						).toLocaleString('default', { month: 'short', year: 'numeric', day: 'numeric' })
					: 'pending',
			end:
				e.expiryDate !== null
					? new Date(e.expiryDate).toLocaleString('default', {
							month: 'short',
							year: 'numeric',
							day: 'numeric'
						})
					: 'pending'
		}));
		console.log(mappedDates);
		return mappedDates;
	}

	// function getExpiryData() {
	// 	const values = fileData.applicationHistory
	// 		.filter((x) => [0, 1].includes(x.applicationType))
	// 		.map((x) => ({
	// 			expiryDate: x.expiryDate,
	// 			licenseType: x.licenseType,
	// 			status: x.currentStatus
	// 		}));
	// 	return values;
	// }

	let showCorrespondenceRequest = false;
	function renewApplication() {
		if (hasValidCorrespondenceDetails(fileData?.correspondence ?? {})) {
			const currentStatus = fileData?.fileStatus;
			if (currentStatus === ApplicationStatuses.AwaitingPayment) {
				toast.info('cannot renew an application currently under review', { position: 'top-right' });
			} else {
				goto('/payment?type=renewal');
			}
		} else {
			showCorrespondenceRequest = true;
		}
	}

	function newApplicationPayment() {
		goto('/payment?type=newapplication');
	}

	let missingInfoUpdate = false;
	async function updateForThis() {
		missingInfoUpdate = true;
		const response = await fetch(
			`${baseURL}/api/files/UpdateCorThis?id=${fileData.id}&userId=${$loggedInUser.id}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
		if (response.ok) {
			toast.success('successfully updated the correspondence information', {
				position: 'top-right'
			});
			const update = await response.json();
			applicationData.set(update);
		} else {
			toast.error('Failed to update the correspondence information', { position: 'top-right' });
		}
		showCorrespondenceRequest = false;
		missingInfoUpdate = false;
	}
	async function updateForAll() {
		missingInfoUpdate = true;
		const response = await fetch(
			`${baseURL}/api/files/UpdateCorAll?id=${fileData.id}&userId=${$loggedInUser.id}&creatorAccount=${fileData.creatorAccount}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
		if (response.ok) {
			toast.success('successfully updated the correspondence information', {
				position: 'top-right'
			});
			const update = await response.json();
			applicationData.set(update);
		} else {
			toast.error('failed to update the correspondence information', { position: 'top-right' });
		}
		showCorrespondenceRequest = false;
		missingInfoUpdate = false;
	}

	let showCertificate = false;
	async function ShowCertificatePayment() {
		showCertificate = true;
		if (fileData.applicationHistory[0].certificatePaymentId !== null) {
			let response = await fetch(`${baseURL}/api/files/CertificatePayment?id=${fileData?.fileId}`);
			if (response.ok) {
				let result = await response.json();
				sessionStorage.setItem('fileId', result.fileId);
				sessionStorage.setItem('name', result.name);
				sessionStorage.setItem('rrr', result.rrr);
				goto(
					`/payment?type=tradecertificate&amount=${result.total}&paymentId=${result.rrr}&fileId=${result.fileId}&name=${result.name}`
				);
			}
		} else {
			const rrr = fileData.applicationHistory[0].certificatePaymentId;
			let amount = 0;
			const response = await fetch(`${baseURL}/api/payments/check?id=${rrr}`);
			if (response.ok) {
				const result = await response.json();
				amount = result?.amount;
			}
			goto(
				`/payment?type=tradecertificate&amount=${amount}&paymentId=${rrr}&fileId=${fileData.id}&title=${fileData.titleOfTradeMark}`
			);
		}
	}

	function showNewPayment() {
		return fileData?.applicationHistory.find((x) => x.applicationType === 0).currentStatus === 2;
	}

	function viewMetadata() {
		metaDataInfo.set(fileData);
		goto(`/metadata?fileId=${fileData.id}&applicationId=NONE&type=file`);
	}
	let showGetDocumentsDialog = false;
	let getDocFileNumber = '';
	let getDocPaymentId = '';
	let getDocLoading = false;
	let getDocError: string | null = null;
	let getDocResult: any = null;
	let documents: any[] = [];
	let appId: string = '';

	function getLetterName(doc: any) {
		return doc.name || 'Unknown Document';
	}

	function generateLetter(fileId: string, letterType: string, applicationId: string) {
		window.open(
			`${baseURL}/api/letters/generate?fileId=${fileId}&letterType=${letterType}&applicationId=${applicationId}`
		);
	}

	async function getDocuments() {
		getDocError = null;
		getDocResult = null;
		getDocLoading = true;

		try {
			const res = await fetch(
				`${baseURL}/api/letters/GetDocuments?fileId=${getDocFileNumber}&paymentId=${getDocPaymentId}`
			);
			if (!res.ok) throw new Error('Failed to fetch documents');

			const json = await res.json();
			getDocResult = json;

			if (Array.isArray(json.documents)) {
				documents = json.documents;
				appId = json.applicationId;
			} else {
				documents = [];
			}
		} catch (err: any) {
			getDocError = err.message ?? 'An error occurred';
		} finally {
			getDocLoading = false;
		}
	}

	function resetGetDocumentsDialog() {
		showGetDocumentsDialog = false;
		getDocFileNumber = '';
		getDocPaymentId = '';
		getDocLoading = false;
		getDocError = null;
		getDocResult = null;
		documents = [];
	}
</script>

<Toaster />
{#if showStatusHistory}
	<svelte:component this={historyComponent} {...historyData} />
{/if}

{#if showAssignForm}
	<svelte:component this={assignForm} {...assignData} />
{/if}

{#if showOwnership}
	<svelte:component this={ownershipForm} {...ownershipData} />
{/if}

<Dialog.Root bind:open={showCorrespondenceRequest}>
	<Dialog.Content>
		<Dialog.Header>Missing Information</Dialog.Header>
		{#if $loggedInUser.defaultCorrespondence === undefined}
			<p>
				This application has some details missing in the correspondence section, Please update your
				default correspondence in the profile section.
			</p>
		{:else}
			<p>
				This application has some details missing in the correspondence section, this information is
				needed for payment generation and validation. Should your default correspondence be used for
				this application only, or for all your applications with missing or incomplete
				correspondence sections. The default correspondence section can be found in the profile
			</p>
			<div class="flex flex-col space-y-2">
				<Button
					disabled={missingInfoUpdate}
					variant="destructive"
					on:click={() => (showCorrespondenceRequest = false)}>Cancel</Button
				>
				<Button disabled={missingInfoUpdate} on:click={() => updateForThis()}>
					<Icon
						class={missingInfoUpdate ? '' : 'hidden'}
						icon="line-md:loading-loop"
						width="1.2rem"
						height="1.2rem"
					/>
					Update for this application only</Button
				>
				<Button disabled={missingInfoUpdate} on:click={() => updateForAll()}>
					<Icon
						class={missingInfoUpdate ? '' : 'hidden'}
						icon="line-md:loading-loop"
						width="1.2rem"
						height="1.2rem"
					/>
					Update for all applications with missing details</Button
				>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
<Dialog.Root bind:open={showCertificate}>
	<Dialog.Content class="h-3/4">
		<Dialog.Header>
			<Dialog.Title>Certificate payment</Dialog.Title>
			<Dialog.Description>Generating payment information</Dialog.Description>
		</Dialog.Header>
		<div class="items-center justify-center flex h-screen">
			<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
		</div>
	</Dialog.Content>
</Dialog.Root>
<Dialog.Root bind:open={showAllDates}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>All Renewal Dates</Dialog.Title>
			<Dialog.Description>Table of Application History</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-3">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Cell>s/n</Table.Cell>
						<Table.Cell>Type</Table.Cell>
						<Table.Cell>Status</Table.Cell>
						<Table.Cell>Period of activity</Table.Cell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each getExpiryData() as data, i}
						<Table.Row>
							<Table.Cell>{i + 1}</Table.Cell>
							<Table.Cell>{data.licenseType ?? 'Fresh'}</Table.Cell>
							<Table.Cell><AppStatusTag value={data.currentStatus} /></Table.Cell>
							<Table.Cell>{data.start} - {data.end}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	</Dialog.Content>
</Dialog.Root>
{#if fileData !== null}
	<div class="px-1.5 py-1.5 gap-4">
		<div class="flex space-x-5 mb-2">
			<Button variant="outline" on:click={() => window.history.back()}>
				<Icon icon="openmoji:return" width="1.2rem" height="1.2rem" />
				<p>back</p>
			</Button>
			<Button variant="outline" on:click={() => goto('/home/dashboard')}>
				<Icon icon="ic:sharp-home" width="1.2rem" height="1.2rem" />
				<p>Home</p></Button
			>
		</div>
		<Card.Root>
			<div class="flex justify-between p-4">
				<Card.Title class="col-span-1 col-start-1">Filing Information</Card.Title>
				<Card.Title class="col-end-1 col-span-1">{fileData.fileId}</Card.Title>
			</div>
			<Card.Content class="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div>
					<Label for="type" class="font-bold">File Type</Label>
					<p id="name">{fileTypeToString(fileData.type)}</p>
				</div>
				<div class="w-fit flex-col flex space-y-2">
					<Label for="type" class="font-bold">Renewal Date</Label>
					<Button on:click={() => (showAllDates = true)}>Show All Dates</Button>
				</div>
				<div>
					<Label for="type" class="font-bold">File Status</Label>
					<AppStatusTag value={fileData.fileStatus} />
				</div>
				<div>
					<Label for="type" class="font-bold">Filing Date</Label>
					<p id="name">{mapDateToString(fileData.filingDate ?? fileData.dateCreated)}</p>
				</div>
				<Button
					on:click={() => newApplicationPayment()}
					class="{showNewPayment() ? '' : 'hidden'} w-fit">Make Payment</Button
				>
				<div>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<Button>More Actions</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Group>
								<!-- {#if fileData.type === 0}
									<DropdownMenu.Item
										class={isUser ? '' : 'hidden'}
										on:click={async () => await renewApplication()}
										>Renew Application</DropdownMenu.Item
									>
								{/if} -->
								{#if fileData.fileStatus === ApplicationStatuses.AwaitingCertification}
									<DropdownMenu.Item on:click={async () => ShowCertificatePayment()}
										>Pay for certificate</DropdownMenu.Item
									>
								{/if}
							</DropdownMenu.Group>
							<!-- {#if showAssignmentButton()}
								<DropdownMenu.Item on:click={async ()=>await assignApplication()} >
									Assign Application
								</DropdownMenu.Item>
								{/if} -->
							{#if $loggedInUser?.userRoles.includes(UserRoles.Tech)}
								<DropdownMenu.Item on:click={async () => await showOwnershipForm()}>
									Change Ownership
								</DropdownMenu.Item>
							{/if}
							<!-- {#if $loggedInUser?.userRoles?.includes(UserRoles.Tech) }
								<DropdownMenu.Item on:click={()=>viewMetadata()} >Metadata</DropdownMenu.Item>
							{/if}
							{#if $loggedInUser?.userRoles?.includes(UserRoles.Tech) }
								<DropdownMenu.Item on:click={()=>ViewHistory()} >Update Record</DropdownMenu.Item>
							{/if} -->
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
				<div>
					<Button
						on:click={() => {
							getDocFileNumber = fileData?.fileId;
							showGetDocumentsDialog = true;
						}}>Print Documents</Button
					>
				</div>
			</Card.Content>
			<DocumentModule
				bind:showDialog={showGetDocumentsDialog}
				bind:getDocFileNumber
				bind:getDocPaymentId
				bind:getDocLoading
				bind:getDocError
				bind:getDocResult
				bind:documents
				bind:appId
				{getLetterName}
				{generateLetter}
				{getDocuments}
				onClose={resetGetDocumentsDialog}
			/>
		</Card.Root>
	</div>
	<Tabs.Root value="data" class="w-full">
		<Tabs.List class="grid w-full grid-cols-3">
			<Tabs.Trigger value="data">Data View</Tabs.Trigger>
			<Tabs.Trigger value="applications">Application History</Tabs.Trigger>
			<!-- <Tabs.Trigger value="oppositions">Oppositions</Tabs.Trigger> -->
			<!-- <Tabs.Trigger value="assignment">Assignment Applications</Tabs.Trigger> -->
		</Tabs.List>
		<Tabs.Content value="data">
			{#if fileData.type === 0}
				<PatentView />
			{:else if fileData.type === 1}
				<DesignView />
			{:else if fileData.type === 2}
				<TradeMarkView />
			{/if}
		</Tabs.Content>
		<Tabs.Content value="applications">
			<ApplicationsHistory
				allApplications={fileData.applicationHistory}
				{fileData}
				showMissingDetailsForm={() => (showCorrespondenceRequest = true)}
				isAdmin={$loggedInUser?.userRoles?.includes(UserRoles.Tech)}
			/>
		</Tabs.Content>
		<!-- <Tabs.Content value="oppositions">
			<OppositionHistory allOppositions={fileData.oppositions} {fileData} />
		</Tabs.Content> -->
		<!-- <Tabs.Content value="assignment">
			{#if fileData.applicationHistory.find(x=>x.applicationType===5)}
				<AssignmentApplication allApplications="{fileData.applicationHistory.filter(x=>x.applicationType===5)}" {fileData}
															 isAdmin={$loggedInUser?.userRoles?.includes(UserRoles.Tech)}
				/>
				{:else }
			<div class="h-full w-full items-center justify-between mt-20">
				<p class="justify-center flex">Assignment Applications</p>
			</div>
				{/if}
		</Tabs.Content> -->
	</Tabs.Root>
{:else}
	<p>loading....</p>
{/if}

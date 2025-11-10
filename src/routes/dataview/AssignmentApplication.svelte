<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	import { type ApplicationHistoryType, ApplicationStatuses, baseURL, UserRoles, UserTypes } from '$lib/helpers';
	import HistorySheet from '../home/components/HistorySheet.svelte';
	import { getHistoryData, getLetterName } from './datahelpers';
	import { toast } from 'svelte-sonner';
	import { Toaster } from '$lib/components/ui/sonner';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import Icon from '@iconify/svelte';
	import * as Dialog from "$lib/components/ui/dialog"
	import * as AlertDialog from "$lib/components/ui/alert-dialog"
	import * as Sheet from "$lib/components/ui/sheet"
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
	import * as Table from "$lib/components/ui/table"
	import { mapDateToString } from '../home/components/dashboardutils';
	import { goto } from '$app/navigation';
	import { applicationData, assignmentData, loggedInUser, metaDataInfo } from '$lib/store';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import { mapStatusStringToStatus } from '$lib/designutils';
	import dayjs from 'dayjs';

	export let allApplications:ApplicationHistoryType[];
	export let isAdmin:boolean=false;
	export let fileData;
	let selectedApplication:ApplicationHistoryType|null=null;
	let selectedAssignment
	let showStatusHistory:boolean=false;
	let historyComponent:HistorySheet|null=null;
	let isNewStatusLoading:boolean=false;
	let historyData={};
	let showDataComparison:boolean=false;
	let newStatus:ApplicationStatuses|null=null;
	let showAlertDialog:boolean=false;
	let newStatusContent:number|null=null;
	let showUpdateStatusForm:boolean=false;
	let newStatusReason:string|null=null;
	async function ViewHistory(application:ApplicationHistoryType)
	{
		selectedApplication = application;
		if (historyComponent===null) {
			historyComponent = (await import("../home/components/HistorySheet.svelte")).default;
		}
		historyData= {
			dataList:application.statusHistory
		}
		getHistoryData(null);
		const handleClose = () => {
			showStatusHistory = false;
			historyData={};
		};
		historyData= {...historyData, onclose: handleClose, isVisible:true};
		showStatusHistory=true;
	}

	async function copyRRR(id:string)
	{
		toast.success("Remita Payment ID", {description:"Remita Payment Id copied to clipboard", position:'top-right'})
	}


	function checkPayment(id:string|null)
	{
		if (id===null)
		{
			toast.error("Remita Payment ID", {description:"No Remita ID available", position:'top-right'})
		}

		else {
			showAlertDialog=true;
		}
	}

	function changeStatus(application:ApplicationHistoryType)
	{
		selectedApplication = application;
		showUpdateStatusForm=true;
	}
	function canTreatApplication(application){
		// search
		if ([3, 6, 7].includes(application.currentStatus)){
			if (fileData?.type===0) {
				// patent
				return $loggedInUser?.userRoles?.some(x=>[
					UserRoles.PatentSearch,
				].includes(x))
			}

			if (fileData.type===1){
				//design
				 return $loggedInUser?.userRoles?.some(x=>[
					UserRoles.DesignSearch,
				].includes(x))
			}
			return false;
		}

		if ([4,5].includes(application.currentStatus)){
			if (fileData.type===0) {
				// patent
				return $loggedInUser?.userRoles?.some(x=>[
					UserRoles.PatentExaminer,
				].includes(x))
			}

			if (fileData.type===1){
				//design
				return $loggedInUser?.userRoles?.some(x=>[
					UserRoles.DesignExaminer,
				].includes(x))
			}
			return false;
		}
		return false;
	}
	async function confirmChange() {
		// we need the application id, before status, afterstatus, application type
		isNewStatusLoading = true;
		let body = {
			newStatus: mapStatusStringToStatus(newStatus),
			currentStatus: currApp.currentStatus,
			reason: newStatusReason,
			userName: $loggedInUser.name,
			userId: $loggedInUser.id,
			fileId: fileData.id,
			applicationId: currApp.id
		}
		const result = await fetch(`${baseURL}/api/assignment/UpdateAssignment`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		})

		if (result.ok) {
			var latestData = await result.json();
			fileData = latestData
			applicationData.set(latestData)
			isNewStatusLoading = false;
			newStatusContent = 2;
		}
	}
	let isDataLoading=false;
	async function viewDataUpdateApplication(data) {
		if (isDataLoading){return;}
		isDataLoading=true;
		let amountJson = await (await fetch(`${baseURL}/api/assignment/ValidationRRR?data=${data.paymentId}`)).json()
		assignmentData.set({
			rrr: data.paymentId,
			applicationId: data.id,
			amount: amountJson.cost,
			fileId: fileData.id,
			type: fileData.type,
			applicant: fileData?.applicants.length > 1 ? fileData?.applicants[0].name + ' et al.' : fileData?.applicants[0].name,
			fileNumber: fileData.fileId,
			fileTitle: fileData.type === 0 ? fileData.titleOfInvention : fileData.titleOfTradeMark
		})
		isDataLoading=false;
		await goto("/payment?type=assignment")
	}
let options:ApplicationStatuses[] =[];
	let treatContent:number=0;
	let reason='';
	let isUpdating=false;
	let showTreat=false;
	let treatSelectedApplication
	let selectedOption:ApplicationStatuses|null=null;
	function showTreatDialog(application){
		treatSelectedApplication = application;
		selectedOption = null;
		isUpdating=false;
		reason='';
		if ([3, 6, 7].includes(application.currentStatus)) {
			// in search, search can fail, or pass.
			options=[ApplicationStatuses.FormalityFail, ApplicationStatuses.AwaitingExaminer]
		}
		if ([4,5].includes(application.currentStatus)) {
			options=[ApplicationStatuses.Approved, ApplicationStatuses.Rejected]
		}
		showTreat=true;
		treatContent=0;
	}
	let currApp;
	function viewData(application){
		currApp=application
		showDataComparison=true;
		selectedAssignment = application.assignment;
	}

	async function updateAssignment(){
		isUpdating=true;
		if (reason=="") {
			toast.error("no message added", {
				position: "top-right"
			});
			return;
		}
			if (selectedOption==null) {
				toast.error("New status not selected", {
					position: "top-right"
				});
				return;
			}
			if (!treatSelectedApplication){
				toast.error("Please view the data first before updating status", {
					position: "top-right"
				});
				return;
			}

			if (selectedOption===ApplicationStatuses.Approved){
				if (!$loggedInUser.signatureUrl){
					toast.error("Please upload Signature from profile", {
						position: "top-right"
					});
					return;
				}
			}
			let body={
				newStatus:selectedOption,
				currentStatus: treatSelectedApplication.currentStatus,
				reason,
				userName: $loggedInUser.name,
				userId: $loggedInUser.id,
				fileId: fileData.id,
				applicationId: treatSelectedApplication.id
			}
		if (selectedOption===ApplicationStatuses.Approved || selectedOption===ApplicationStatuses.Rejected) {
			body['signatureUrl']=$loggedInUser.signatureUrl
		}
			const result=await fetch(`${baseURL}/api/assignment/UpdateAssignment`, {
				method: 'POST',
				headers:{
					'Content-Type':'application/json'
				},
				body:JSON.stringify(body)
			})

		if (result.ok){
			const data=await result.json();
			applicationData.set(data)
			toast.success("successfully updated", {
				position:"top-right"
			})
			showTreat=false;
		}
	}

	function loadMetadata(application: ApplicationHistoryType){
		metaDataInfo.set(application);
		goto(`/metadata?fileId=${fileData?.id}&applicationId=${application.id}`)
	}
</script>
<Dialog.Root bind:open={showTreat} onOpenChange="{(val)=>{if (!val){ treatContent=0;reason='';selectedOption=null; isUpdating=false;}  }}">
	<Dialog.Content>
	<Dialog.Header>
		<Dialog.Title>Select new status</Dialog.Title>
		<Dialog.Description>Update the assignment application to the new status</Dialog.Description>
	</Dialog.Header>
		{#if treatContent===0}
		<div class="m-2 space-y-3">
			<div class="grid grid-cols-2">
				{#each options as option}
					<div class="{selectedOption===option?'bg-gray-500':''} p-2" on:click={()=>selectedOption=option}>
					<AppStatusTag value="{option}"/>
					</div>
					{/each}
			</div>
			<Textarea bind:value={reason} class="min-h-24" />
			<Button variant="destructive" on:click={()=>{showTreat=false; reason=""; treatContent=0; isUpdating=false; selectedOption=null}} >Cancel</Button>
			<Button on:click={()=>treatContent=1}>Continue</Button>
		</div>
			{:else if treatContent===1}
			<div class="space-y-4">
				<p>Are you sure you want to update the status to</p>
				<AppStatusTag value="{selectedOption}"/>
				<div class="flex space-x-5">
					<Button on:click={()=>{
						showTreat=false;
						reason="";
						treatContent=0;
						isUpdating=false;
						selectedOption=null;
					}} variant="destructive">No</Button>
					<Button on:click={()=>updateAssignment()}>
						<Icon class="{isUpdating?'':'hidden'}" icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
						<p>Yes</p>
					</Button>
				</div>
			</div>
			{/if}
	</Dialog.Content>
</Dialog.Root>
<Toaster />
<AlertDialog.Root bind:open ="{showAlertDialog}" >
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Payment confirmation</AlertDialog.Title>
			<AlertDialog.Description>
				Response From Remita
				<div>amount: 28500</div>
				<div>status: Successful</div>
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Ok</AlertDialog.Cancel>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<Dialog.Root bind:open ="{showDataComparison}" >
	<Dialog.Content class="overflow-y-auto h-3/4" >
		<Dialog.Header>
			<Dialog.Title>
				Assignor and Assignee details
			</Dialog.Title>
		</Dialog.Header>
		<br/>
		<div class="space-y-2">
			<p class="font-medium p-1">Date of Assignment</p>
			<p>{dayjs(selectedAssignment.dateOfAssignment).format('MMM D, YYYY')}</p>
			<p class="font-medium p-1">Assignor Details</p>
			<div class="border rounded-md p-2">
			<p class="font-medium">Assignor Name</p>
			<p>{selectedAssignment.assignorName}</p>
			</div>
			<div class="border rounded-md p-2">
			<p class="font-medium">Assignor Address</p>
			<p>{selectedAssignment.assignorAddress}</p>
		</div>
			<div class="border rounded-md p-2">
				<p class="font-medium">Assignor Country</p>
				<p>{selectedAssignment.assignorCountry}</p>
			</div>
			<p class="font-medium p-1">Assignee Details</p>
			<div class="border rounded-md p-2">
				<p class="font-medium">Assignee Name</p>
				<p>{selectedAssignment.assigneeName}</p>
			</div>
			<div class="border rounded-md p-2">
				<p class="font-medium">Assignee Address</p>
				<p>{selectedAssignment.assigneeAddress}</p>
			</div>
			<div class="border rounded-md p-2">
				<p class="font-medium">Assignee Country</p>
				<p>{selectedAssignment.assigneeCountry}</p>
			</div>
				<a class="flex border p-2 rounded-md" href="{selectedAssignment.authorizationLetterUrl}" target="_blank">Letter of authorization</a>
				<a class="flex border p-2 rounded-md" href="{selectedAssignment.deedOfAgreementUrl}" target="_blank">Deed of agreement</a>
		</div>
	</Dialog.Content>
</Dialog.Root>
{#if showStatusHistory}
	<svelte:component this="{historyComponent}" {...historyData}/>
{/if}
<Sheet.Root bind:open={showUpdateStatusForm} onOpenChange="{(isOpen)=>{if(!isOpen){newStatus=null;newStatusReason=null;} }}" >
	<Sheet.Content side="right" class="overflow-y-auto w-[600px]">
		<Sheet.Header>
			<Sheet.Title>
				Change Status for {selectedApplication.applicationType}
			</Sheet.Title>
			<Sheet.Description>
				Select new status and reason
			</Sheet.Description>
		</Sheet.Header>
		{#if newStatusContent===null || newStatusContent===0}
			<div class="flex flex-col gap-4">
				<Label>Select new Status</Label>
				<div class="grid grid-cols-2 gap-4">
					{#each Object.keys(ApplicationStatuses).filter(x=>isNaN(parseInt(x))) as status}
						<div class="border rounded-md w-fit {newStatus===status?'bg-amber-950':'bg-gray-500'} p-2 m-2"
								 on:click={()=>newStatus=status}>{status}</div>
					{/each}
				</div>
				<Textarea class="min-w-full min-h-48" placeholder="type reason for change..." bind:value={newStatusReason} />
			</div>
			<Sheet.Footer class="mt-4">
				<Button variant="outline" on:click={()=>{showUpdateStatusForm=false;
			newStatusReason=null;newStatus=null;
			}}>Cancel</Button>
				<Button variant="default" on:click={()=>{newStatusContent=1;}}>Ok</Button>
			</Sheet.Footer>
		{:else if newStatusContent===1}
			<div class="flex flex-col gap-4">
				<div>Are you sure you want to change the status to <p class="border rounded-md w-fit p-2 m-2">{newStatus}</p>?</div>
				<Button disabled="{isNewStatusLoading===true}" variant="outline" on:click={()=>newStatusContent=null}>Cancel</Button>
				<Button disabled="{isNewStatusLoading===true}" on:click={()=>confirmChange()} >
					<Icon class="{isNewStatusLoading===true?'':'hidden'}"  icon="eos-icons:bubble-loading" width="1.2rem" height="1.2rem" />
					Ok</Button>
			</div>
		{:else if newStatusContent===2}
			<div class="flex flex-col items-center justify-center">
				<p>Status Change successful</p>
				<Button on:click={()=>{showUpdateStatusForm=false; isNewStatusLoading=false;
					newStatusContent=null; newStatus=null;newStatusReason=null; }}>OK</Button>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
<div class="px-2 py-2 overflow-x-auto overflow-y-auto">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head class="w-1">s/n</Table.Head>
				<Table.Head class="w-32">Date</Table.Head>
				<Table.Head>Application</Table.Head>
				<Table.Head>Application Status</Table.Head>
				<!--			<Table.Head class="{isAdmin?'':'hidden'}" >Payment Status</Table.Head>-->
				<Table.Head>History</Table.Head>
				<Table.Head>Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each allApplications as application, i(i)}
				<Table.Row>
					<Table.Cell class="w-1">{i+1}</Table.Cell>
					<Table.Cell class="w-32" >{mapDateToString(application.applicationDate)}</Table.Cell>
					<Table.Cell>
						<Button variant="outline" on:click={()=>viewData(application)} >View data</Button></Table.Cell>
					<Table.Cell>
						<AppStatusTag value="{application.currentStatus}" /></Table.Cell>
					<!--			<Table.Cell class="{isAdmin?'':'hidden'}">-->
					<!--				<Button on:click={async()=>await checkPayment(application.paymentId)}>Check Payment</Button>-->
					<!--			</Table.Cell>-->
					<Table.Cell>
						<Button on:click={async()=> await ViewHistory(application)}>History</Button>
					</Table.Cell>
					<Table.Cell>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>More</DropdownMenu.Trigger>
							<DropdownMenu.Content>
								<DropdownMenu.Group>
									{#if application.currentStatus===2}
										<DropdownMenu.Item on:click="{async()=>await viewDataUpdateApplication(application)}" >
											<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" class="{isDataLoading?'':'hidden'}" />
											Make Payment
										</DropdownMenu.Item>
									{/if}
									<!--{#if application.paymentId}-->
									<!--	<DropdownMenu.Item on:click="{async()=>await copyRRR(application.paymentId)}" >Copy Payment Id</DropdownMenu.Item>-->
									<!--{/if}-->
									{#if isAdmin}
										<DropdownMenu.Item on:click={()=>{changeStatus(application)}} >Change Status</DropdownMenu.Item>
									{/if}

									{#if canTreatApplication(application)}
										<DropdownMenu.Item on:click={()=>{showTreatDialog(application)}}>Treat Application</DropdownMenu.Item>
									{/if}
										<DropdownMenu.Separator />
										<DropdownMenu.Label>Print</DropdownMenu.Label>
										<DropdownMenu.Separator />
									{#each application.applicationLetters as letter}
											<DropdownMenu.Item href="{baseURL}/api/letters/generate?fileId={fileData?.id}&letterType={letter}&applicationId={application.id}" target="_blank" >{getLetterName(letter)}</DropdownMenu.Item>
										{/each}
									{#if $loggedInUser?.userRoles?.includes(UserRoles.Tech) }
										<DropdownMenu.Item on:click={()=>loadMetadata(application)}>Metadata</DropdownMenu.Item>
									{/if}
								</DropdownMenu.Group>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
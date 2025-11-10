<script lang="ts">
	// select the thing you want to assign to, the search for it. The form comes up
	import { fileTypeToString, mapStatusToString } from '../../components/dashboardutils';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Toaster } from '$lib/components/ui/sonner';
	import Icon from '@iconify/svelte';
	import AssignForm from './AssignForm.svelte';
	import { baseURL, UserRoles, UserTypes } from '$lib/helpers';
	import { loggedInUser } from '$lib/store';
	import { toast } from 'svelte-sonner';
	import * as Dialog from "$lib/components/ui/dialog"

	let isSearching:boolean=false;
let currentView: number = 0;
let fileNumber: string | null = null;
let open: boolean = true;
let assignForm:AssignForm|undefined=undefined;
let showAssignForm:boolean=false;
let assignData={}
let searchResponse: unknown = null;
let fileId:string
let fileType:number
let applicant:string
let applicantCountry: string
let applicantAddress: string
let applicantNumber:string; let applicantEmail:string
let fileTitle:string
export let closed: () => void;
async function loadForm() {
	if (!assignForm) {
		assignForm = (await import("./AssignForm.svelte")).default
	}
	showAssignForm=true;
		let closed = () => (showAssignForm = false);
		assignData = { closed: closed,
			requiredData: {
				fileId: fileId,
				fileType: fileType,
				applicant: applicant,
				applicantCountry,
				applicantAddress,
				applicantNumber,
				applicantEmail,
				fileNumber: fileNumber,
				fileTitle: fileTitle
			}
		};
}
async function fetchResult() {
	isSearching=true;
	let body={
		fileNumber:fileNumber,
	}
	// if($loggedInUser?.userRoles?.includes(UserRoles.Tech)==false){
	// 	body['userId']=$loggedInUser.id;
	// }
	// if ($loggedInUser?.userRoles.includes(UserRoles.BackOffice) ===false){
	// }
	const result=await fetch(`${baseURL}/api/assignment/SearchForFile`, {
		method: "POST",
		headers: {
			"Content-Type":"application/json"
		},
		body:JSON.stringify(body)
	})

	if (result.ok){
			const data = await result.json()
		fileId=data.fileId
		fileType=data.fileType
		applicant=data.applicant
		applicantNumber=data.applicantNumber
		applicantEmail=data.applicantEmail
		applicantCountry= data.applicantCountry
		applicantAddress= data.applicantAddress
		fileNumber=data.fileNumber
		fileTitle=data.fileTitle
		await loadForm()
	}
	else {
		toast.error("Unable to find the file with the specified number", { position: "top-right" })
	}
	isSearching=false;

}

</script>
<Toaster />

{#if showAssignForm && assignForm}
	<svelte:component this={assignForm} {...assignData} />
{/if}

<Dialog.Root
	bind:open
	onOpenChange={(val) => {
		if (!val) {
			closed();
		}
	}}>
	<Dialog.Content class="line-clamp-2">
		<Dialog.Title>Enter file number</Dialog.Title>

		<div class="flex flex-col space-y-3 p-2 m-2">
			{#if currentView === 0}
				<Input placeholder="File number, eg: NG/PT/PCT/2024/1" bind:value={fileNumber} />
				<Button disabled={isSearching} on:click={async () => await fetchResult()}>
					<Icon
						class={isSearching ? '' : 'hidden'}
						icon="line-md:loading-twotone-loop"
						width="1.2rem"
						height="1.2rem"
					/>
					Search</Button
				>
			{:else if currentView === 1}
				<div class="space-y-3 m-2 p-2">
					<div>
						<Label for="title">Title</Label>
						<p class="line-clamp-2">{searchResponse.title}</p>
					</div>
					<div>
						<Label for="applicants">Applicants</Label>
						<p>{searchResponse.applicants}</p>
					</div>
					<div>
						<Label for="status">Status</Label>
						<p class="p-1.5 border-2 rounded-md w-fit">{mapStatusToString(searchResponse.fileStatus)}</p>
					</div>
					<div>
						<Label for="amount">Renewal Amount</Label>
						<p>{searchResponse.amount}</p>
					</div>
					<br />
					<div class="flex space-x-4">
						<Button variant="outline" on:click={()=>{
							currentView=0;isSearching=false;
							fileNumber = null;
						}} >Clear</Button>
						<Button on:click={()=>renewFile()}>Renew</Button>
					</div>
				</div>
			{:else if currentView === 2}
				<p>{fileTypeToString(searchResponse.fileType)} cannot be renewed yet due to it's current status</p>
				<p class="p-1.5 border-2 rounded-md w-fit">{mapStatusToString(searchResponse.fileStatus)}</p>
				<p>{fileTypeToString(searchResponse.fileType)} can only be renewed if the file has been approved or renewal is due</p>
				<br />
				<Button on:click={()=>{
					isSearching=false;currentView=0;fileNumber=null;
				}}>back</Button>
			{:else}
				<p>Unknown Error</p>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>

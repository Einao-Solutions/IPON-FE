<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import { ApplicationStatuses, baseURL, UserRoles } from '$lib/helpers';
	import { toast } from 'svelte-sonner';
	import { fileTypeToString, mapStatusToString } from '../../components/dashboardutils';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import { loggedInUser } from '$lib/store';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from "$lib/components/ui/dialog"
	import { goto } from '$app/navigation';
	let open: boolean = true;
	let fileNumber: string | null = null;
	export let closed: () => void;
	let isSearching: boolean = false;
	let currentView: number = 0;
	let searchResponse: unknown = null;

	async function fetchResult() {
		if (!fileNumber) {
			toast.error('enter file number', {
				position: 'top-right'
			});
			return;
		}
		isSearching = true;
		const searchId =  $loggedInUser?.userRoles?.includes(UserRoles.Tech)? '': $loggedInUser?.id;
		const response = await fetch(`${baseURL}/api/files/searchForRenewal?fileNumber=${fileNumber}&userId=${searchId}`);
			const _searchResponse = await response.json();
		if (response.ok) {

			if (_searchResponse.fileStatus!==null) {
				searchResponse=_searchResponse
				if (
					[
						ApplicationStatuses.AwaitingPayment,
						ApplicationStatuses.Rejected,
						ApplicationStatuses.RejectedByExaminer
					].includes(searchResponse.fileStatus)==false
				) {
					currentView = 1;
				} else {
					currentView = 2;
					isSearching = false;
					return;
				}
			} else {
				toast.error('could not find your file with the specified file Number', {
					position: 'top-right'
				});
				isSearching = false;
			}
		} else {
			toast.error('could not find your file with the specified file Number', {
				position: 'top-right'
			});
			isSearching = false;
		}
	}
	async function renewFile()
	{
		const response=await fetch(`${baseURL}/api/files/DashboardRenewal?fileId=${searchResponse?.id}&userId=${$loggedInUser?.id}&userName=${$loggedInUser?.name}`);
		if (response.ok) {
			const paymentInfo = await response.json();
			const amount = searchResponse.amount;
			goto(`/payment?type=dashrenewal&paymentId=${paymentInfo.rrr}&fileId=${searchResponse.id}&amount=${amount}&title=${paymentInfo.title}&applicant=${paymentInfo.applicant}&fileNumber=${fileNumber}`);
		}
	}
</script>

<Toaster />
<Dialog.Root
	bind:open
	onOpenChange={(val) => {
		if (!val) {
			closed();
		}
	}}
>
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
				<p>If this is a support, please contact support to assist you.</p>
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

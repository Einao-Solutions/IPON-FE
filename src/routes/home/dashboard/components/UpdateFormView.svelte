<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index"
	import { Toaster } from '$lib/components/ui/sonner';
	import { ApplicationStatuses, baseURL, UserRoles } from '$lib/helpers';
	import { toast } from 'svelte-sonner';
	import { mapStatusToString } from '../../components/dashboardutils';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import { loggedInUser } from '$lib/store';
	import { goto } from '$app/navigation';
let open:boolean = true
	let fileNumber:string|null=null;
	export let closed:()=>void;
let isSearching:boolean=false;

async function fetchResult()
{
	if (!fileNumber)
	{
		toast.error("enter file number", {
			position: "top-right",
		});
		return;
	}
	isSearching=true;
	// const searchId = '4474';
	const searchId =  $loggedInUser?.userRoles?.includes(UserRoles.Tech)? '': $loggedInUser?.id;
	const response=await fetch(`${baseURL}/api/files/search?fileNumber=${fileNumber}&userId=${searchId}`);
	if (response.ok)
	{
		const {id, fileStatus } =await response.json();
		if (id!==null && fileStatus!==null) {
			if ([ApplicationStatuses.Expired, ApplicationStatuses.RejectedByExaminer, ApplicationStatuses.Re_conduct].includes(fileStatus)===false) {
				await goto(`/dataview?id=${id}`);
				// F/PT/PCT/O/2024/3406
			} else {
				toast.info("Application cannot be updated at this moment due to the current status, " +
					"please try again when the status has been updated or contact support", {
					description: "current Status is " + mapStatusToString(fileStatus),
					position: "top-right",
					duration:4000
				})
				isSearching=false;
			}
		}
		else {
			toast.error("could not find your file with the specified fileNumber", {
				position: "top-right",
			})
			isSearching=false;
		}
	}
	else {
		toast.error("could not find your file with the specified fileNumber", {
			position: "top-right",
		})
		isSearching=false;
	}
}
</script>

<Toaster />
<Dialog.Root bind:open onOpenChange="{(val)=>{if (!val){closed();}}}">
	<Dialog.Content>
		<Dialog.Title>Enter file number</Dialog.Title>

		<div class="flex flex-col space-y-3 p-2 m-2">
			<Input placeholder="File number, eg: NG/PT/PCT/2024/1" bind:value={fileNumber}	 />
			<Button disabled="{isSearching}" on:click={async()=>await fetchResult()}>
				<Icon class="{isSearching?'':'hidden'}" icon="line-md:loading-twotone-loop" width="1.2rem" height="1.2rem" />
				Search</Button>
		</div>
		</Dialog.Content>
</Dialog.Root>


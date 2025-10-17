<script lang="ts">

	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { applicationData, loggedInUser, metaDataInfo } from '$lib/store';
	import { goto } from '$app/navigation';
	import {Button} from "$lib/components/ui/button/index"
	import {  type ApplicationHistoryType, baseURL } from '$lib/helpers';
	import Icon from '@iconify/svelte';
	import RecursiveItem from './RecursiveItem.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { toast } from 'svelte-sonner';
	let fileId:string|null="";
	let applicationId:string|null="";
	let requestType:string|null=""
	let data:ApplicationHistoryType|null=null;
	let isLoading=true;
	onMount(async()=>{
		isLoading=true;
		if ($loggedInUser===null) {
			const cookieUser = document.cookie
				.split(';')
				.find((x) => x.startsWith(' user=') || x.startsWith('user='));
			if (!cookieUser) {
				await goto('/auth/');
			} else {
				let user = cookieUser.trimStart();
				user = user.slice(5);
				loggedInUser.set(JSON.parse(decodeURIComponent(user)));
			}
		}
			if ($page.url.searchParams.has("fileId") == false || $page.url.searchParams.has("applicationId") == false) {
				window.history.back()
				return;
			} else {
				fileId = $page.url.searchParams.get("fileId")
				applicationId = $page.url.searchParams.get("applicationId")
				requestType = $page.url.searchParams.get("type")
			}
		if ($metaDataInfo===null){
			// fetch
			const response=await fetch(`${baseURL}/api/files/getApplicationData?fileId=${fileId}&applicationId=${applicationId}&requestType=${requestType}`);
			if (response.ok){
				data=await response.json()
			}
		}
		else {
			data = $metaDataInfo
		}
		isLoading=false;
	})


</script>


<div class="p-2 m-2">
	<div class="flex space-y-2 items-center justify-between">
		<Button on:click={()=>window.history.back()}>Back</Button>
		<p>Application data</p>
		<p></p>
	</div>

	{#if isLoading}
		<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
	{:else }
		<RecursiveItem data="{{json:data} }" {fileId} {applicationId} {requestType} />
	{/if}
</div>


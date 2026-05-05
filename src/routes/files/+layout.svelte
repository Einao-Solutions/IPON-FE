<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { fileTypeToString, mapTypeToString } from '../home/components/dashboardutils';
	import { writable } from 'svelte/store';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	let previousPage: string = base;
	let currentPage=writable<URL|undefined>(undefined);
	let title:string|undefined=undefined;
	let titleType:string|undefined=undefined;
	let appStatus:number|undefined=undefined;
	let appType:number|undefined=undefined;
	let showCustomTitle:boolean=false;
	let fileType:string|undefined=undefined;
	afterNavigate(({ from, to }) => {
		console.log(to.url)
		currentPage.set(to.url);
		console.log($currentPage);
	});
	$:{
		if($currentPage) {
			titleType = $currentPage.searchParams.get('titleType') ?? undefined;
			console.log(titleType)
			if (titleType == 'specific')
			{
				const val=$currentPage.searchParams.get('fileType')
				const num= parseInt(val)
				title =  'All '+fileTypeToString(num)+'s';
			}
			if(titleType=='search')
			{
				title =  'results for: '+($currentPage.searchParams.get('title') ?? undefined);
			}
			if(titleType=='custom')
			{
				fileType=$currentPage.searchParams.get('fileType') ?? undefined;
				if(fileType){fileType=fileTypeToString(parseInt(fileType));}
				const applicationType= $currentPage.searchParams.get('appType');
				appType=parseInt(applicationType)
				const status= $currentPage.searchParams.get('status')
				appStatus=parseInt(status);
				showCustomTitle=true;
			}
			if (titleType=='renew')
			{
				title="Due for renewal"
			}
		}
	}
</script>

<div class="h-screen flex flex-col">
	<div class="flex m-2 p-2 items-center justify-between">
		<Button variant="outline" on:click={() =>window.history.back()}>
			<Icon icon="openmoji:return" width="1.2rem" height="1.2rem" />
			<p>back</p>
		</Button>
		{#if title}
			<p>{title}</p>
			{/if}
		{#if showCustomTitle}
			<div class="flex items-center">
				{#if fileType}
				<p>{fileType}</p>
					{/if}
				<div class="m-1 p-1 border rounded-md">{mapTypeToString(appType)}</div>
				<AppStatusTag value="{appStatus}" />
			</div>
			{/if}
		<div></div>
	</div>
	<div class="flex-grow">
		<slot />
	</div>
</div>


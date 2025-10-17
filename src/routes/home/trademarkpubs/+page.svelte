<script lang="ts">
	import {Input} from "$lib/components/ui/input"
	import {Button} from "$lib/components/ui/button"
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import TradePubsTable from './TradePubsTable.svelte';
	import { baseURL } from '$lib/helpers';
	let searchTitle:string|undefined=undefined;
	let isLoading:boolean=false;
	let dataList=[];
	let count=0;
	async function carryOutSearch() {
		isLoading = true;
		let url = ""
		if (searchTitle !== undefined && searchTitle !== "") {
			url = `${baseURL}/api/files/GetTrademarkPublication?text=${searchTitle}&index=0&quantity=10`
		} else {
			url = `${baseURL}/api/files/GetTrademarkPublication?&index=0&quantity=10`
		}
		const response = await fetch(url, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});
		const result = await response.json()
		count = result.count;
			for (let i = 0; i < result.result.length; i++) {
			const dataListKey = result.result[i];
			dataList.push({
				's/n': i + 1,
				date: Intl.DateTimeFormat('en-NG', {
					year: '2-digit',
					month: 'short',
					day: 'numeric',
					weekday: 'short',
					hour: 'numeric',
					minute: 'numeric'
				}).format(new Date(dataListKey.date)),
				fileId: dataListKey.fileId,
					title: dataListKey.title,
				tradeClass:dataListKey.tradeClass,
					id: dataListKey.id,
					image: dataListKey.image,
					applicant:dataListKey.applicant
			})
		}
		console.log(dataList)
		isLoading = false;
	}
	onMount(async ()=>{
		await carryOutSearch();
	})

</script>

<div>
	<div class="flex space-x-2">
	<Input placeholder="search by any title, file number or applicant name" bind:value={searchTitle} />
	<Button on:click={()=>carryOutSearch()}>Search</Button>
	</div>
	{#if isLoading}
		<div class="items-center justify-center flex h-screen">
			<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
		</div>
		{:else }
			<TradePubsTable
				{dataList}
				{count}
				{searchTitle}
			/>
		{/if}
</div>
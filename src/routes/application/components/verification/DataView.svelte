<script lang="ts">
	import PatentDataView from './PatentVerifyView.svelte';
	import DesignDataView from './DesignVerifyView.svelte';
	import TrademarkView from './TrademarkView.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	export let type:number;
onMount(async()=>{
	var cookieUser=document.cookie.split(';').find(x=>x.startsWith(" user=")||x.startsWith("user="))
	if(!cookieUser)
	{
		await goto("/auth")
	}
	else {
	}
	console.log(type)
})
</script>

{#if type===0}
	<PatentDataView />
{:else if type===1}
	<DesignDataView />
	{:else if type===2}
	<TrademarkView />
{/if}
<script lang="ts">
	import { Input } from '$lib/components/ui/input/index';
	import { Button } from '$lib/components/ui/button/index';
	import { onMount } from 'svelte';
	let imageUploaded = false;
	let showImageResult = false;
	let showRegularResult = false;
	let numbersRange:number[]=[];
	function BeginSearch()
	{
		if (imageUploaded)
		{
			showImageResult=true;
		}
		else {
			showRegularResult = true;
		}
	}
	onMount(()=>{
			for (let i = 0; i < 6; i++) {
		numbersRange.push(i);
		}
	})
</script>

<div class="flex gap-x-2">
	<Input placeholder="Enter search term or upload image" />
	<Input id="picture" type="file" on:change={()=>imageUploaded=true} />
	<Button on:click={()=>BeginSearch()}>
		Begin Search
	</Button>
</div>

<div class="flex flex-col gap-x-2">
	{#if showImageResult}
		<div class="flex gap-x-2 flex-col">
			{#each numbersRange as num}
				<div class="border rounded-md">

				</div>
				{/each}
		</div>
		{/if}
</div>
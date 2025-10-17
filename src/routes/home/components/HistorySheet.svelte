<script lang="ts">
	import * as Sheet from "$lib/components/ui/sheet/index"
	import type { DataHistory } from '$lib/helpers';
	import { getNewStatusColour } from '../../dataview/datahelpers';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import { mapDateToString, mapStatusToString } from './dashboardutils';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	export let title:string;
	export let description:string;
	export let dataList:DataHistory[];
	export let isVisible:boolean = false;
	export let onclose:()=>void;
</script>

<div>
<Sheet.Root bind:open={isVisible} onOpenChange={(state)=> {if(state===false){onclose()}}} >
	<Sheet.Content side="right" class="overflow-y-auto w-[600px]">
		<div class="flex">
		<div class="gap-10 grid grid-cols-1 px-2 py-2">
			{#each dataList as data}
				<div class="flex justify-between gap-4">
					<div class="border-dotted border w-0 h-full absolute left-4"></div>
					<div class="bg-gray-500 w-3 h-3 rounded-full absolute left-2.5 mt-3"></div>
				<div>
					<div class="flex justify-between items-center">
				<p class="font-light text-gray-400" style="font-size: 13px">{mapDateToString(data.date)}</p>
						<Button variant="outline" class="gap-1">
							<Icon icon="radix-icons:avatar" width="1.2rem" height="1.2rem" />
							{data.user}
						</Button>
					</div>
				{#if data.beforeStatus!==null || data.afterStatus!==null}
					<div class="flex items-center py-1 gap-7">
						<AppStatusTag value="{data.beforeStatus}" />
<!--						<p class="p-1 rounded-md"-->
<!--									style="background-color: {getNewStatusColour(data.beforeStatus)}; font-size:13px">-->
<!--							{mapStatusToString(data.beforeStatus)} </p>-->
						<Icon icon="icomoon-free:arrow-right" width="1.2rem" height="1.2rem" />
<!--						<span class="p-1 rounded-md"-->
<!--									style="background-color: {getNewStatusColour(data.afterStatus)}; font-size:13px">-->
<!--			{mapStatusToString(data.afterStatus)} </span>-->
						<AppStatusTag value="{data.afterStatus}" />

						</div>
					{/if}
				<p>{data.message}</p>
				</div>
				</div>
				{/each}
		</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
</div>
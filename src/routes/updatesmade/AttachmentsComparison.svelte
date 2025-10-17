<script lang="ts">
	import { attachmentDiffs } from '../application/apphelper';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import {  loggedInUser } from '$lib/store';
	import { mapAttchToString } from '../dataview/datahelpers';
	import { onMount } from 'svelte';
	export let oldData: { url: string; name: string }[] | string;
	export let newData: { url: string; name: string }[]|string;
	let parsedOldData:[] |undefined=undefined
	let parsedNewData:[] |undefined=undefined
	let uploadDiffs: string[] = [];
	$: {
		if (typeof oldData === 'string') {
			parsedOldData = JSON.parse(oldData);
		}
		else {
			parsedOldData = oldData
		}
		if (typeof newData === 'string') {
			parsedNewData = JSON.parse(newData);
		}
		else {
			parsedNewData = newData
		}
		uploadDiffs = attachmentDiffs(parsedOldData, parsedNewData);
	}
	let documentUrl: string[] = [];
	let isImage: boolean = false;
	let showPreview: boolean = false;
	async function viewAttachment(name: string, type: string) {
		documentUrl=[];
		if (name === 'designs') {
			isImage = true;
		}
		if (type == 'old') {
			documentUrl = parsedOldData.find((x) => x.name === name).url;
			var splits = documentUrl[0].split('.');
			var dataType = splits[splits.length - 1];
			if (['png', 'jpg', 'jpeg'].includes(dataType)) {
				isImage = true;
				window.open(documentUrl[0], "_blank");
			}
		} else {
			documentUrl = parsedNewData.find((x) => x.name === name).url;
			 splits = documentUrl[0].split('.');
			dataType = splits[splits.length - 1];
			if (['png', 'jpg', 'jpeg'].includes(dataType)) {
				isImage = true;
			}
			window.open(documentUrl[0], "_blank");
		}
	}
</script>

<div class="md:flex gap-2">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head class="w-1">s/n</Table.Head>
				<Table.Head>Name</Table.Head>
				<Table.Head>old data</Table.Head>
				<Table.Head>new data</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each uploadDiffs as dif, i (i)}
				<Table.Row>
					<Table.Cell class="w-1">{i + 1}</Table.Cell>
					<Table.Cell>{mapAttchToString(dif)}</Table.Cell>
					{#if parsedOldData.find((x) => x.name === dif).url[i]}
					<Table.Cell>
						<a target="_blank" href="{parsedOldData.find((x) => x.name === dif).url[i]}">View Old file</a>
					</Table.Cell>
						{:else }
						<p>-</p>
						{/if}
					<Table.Cell>
						<Button
							on:click={() => {
								viewAttachment(dif, 'new');
							}}
							variant="outline">View New file</Button
						>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

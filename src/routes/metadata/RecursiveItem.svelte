
<script lang="ts">
	import {JSONEditor} from 'svelte-jsoneditor';
	import {Button} from "$lib/components/ui/button/index"
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { baseURL } from '$lib/helpers.js';
	import { applicationData } from '$lib/store.js';
	import { toast } from 'svelte-sonner';
	import * as Dialog from "$lib/components/ui/dialog";
	export let fileId;
	export let applicationId;
	export let requestType
	export let data;
	let modifiedData=undefined;
	let showConfirmation = false;

	function isObject(value) {
		return value !== null && typeof value === 'object';
	}
	function handleChange(updatedContent, previousContent, { contentErrors, patchResult }) {
		modifiedData= updatedContent.json;
	}
	async function updateData(){
		if(modifiedData===undefined){
			return;
		}
		const response=await fetch(`${baseURL}/api/files/updateJsonData?applicationId=${applicationId}&fileId=${fileId}&requestType=${requestType}`,{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(modifiedData)
		})
		if (response.ok){
			applicationData.set(await response.json())
			toast.success("successfully updated the information", {position:"top-right"})
		} else {
			toast.error("failed updated the information, please contact support", {position:"top-right"})
		}
		showConfirmation=false;
	}
</script>
<Toaster />
<Dialog.Root bind:open={showConfirmation}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Confirmation</Dialog.Title>
			<Dialog.Content>
				<p>Are you sure you want to update the data? This process is irreversible</p>
				<Dialog.Footer>
					<Button variant="destructive" on:click={()=>showConfirmation=false}>Cancel</Button>
					<Button on:click={()=>updateData()}>Continue</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Header>

	</Dialog.Content>
</Dialog.Root>
<div class="space-y-2">
	<JSONEditor bind:content={data} onChange="{handleChange}" />
	<Button on:click={()=>showConfirmation=true}>save</Button>
</div>

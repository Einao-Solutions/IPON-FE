<script lang="ts">
	import { Checkbox } from "$lib/components/ui/checkbox";
	import type { Writable } from "svelte/store";
	import { selectedFilesForAction } from '$lib/store';

	export let checked: Writable<boolean>;
	export let id: string;
	function onCheck(v: boolean | 'indeterminate'){
		if (v){
			onSelected(id)
		}
		else {
			deSelect(id)
		}
	}

	function onSelected(fileId:string){
		if($selectedFilesForAction===undefined)
		{
			selectedFilesForAction.set([fileId])
		}
		else {
			selectedFilesForAction.update((data)=>{
				if (!data) data = [];
				data.push(fileId)
				return [...data]
			})
		}
	}

	function deSelect(fileId:string) {
		if ($selectedFilesForAction === undefined) {
			return;
		} else {
			selectedFilesForAction.update((data) => {
				if (!data) return [];
				const inde = data.indexOf(fileId)
				if (inde !== -1) {
					data.splice(inde, 1);
				}
				return [...data]
			})
		}
	}
</script>

<Checkbox bind:checked={$checked} onCheckedChange={(c)=>onCheck(c)} />
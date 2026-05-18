<script lang="ts">
	import { mapStatusToString } from '$lib/designutils';
	import { getStatusColour } from '$lib/helpers';

	export let showIcon:boolean=false;
	export let value:number=0;

	function getTagStyle(): string {
		const bgHex = getStatusColour(value);
		if (!bgHex) return '';
		return `background-color: ${bgHex}; color: black;`;
	}
</script>
<div class="px-1.5 py-1 rounded-md w-fit text-xs font-medium" style={getTagStyle()}>
	{mapStatusToString(value)}
</div>
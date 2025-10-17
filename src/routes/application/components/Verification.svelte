<script lang="ts">
	import DataView from './verification/DataView.svelte';
	const urlParams=new URLSearchParams(window.location.search);
	let selectedType:number=parseInt(urlParams.get("type")??"0")
</script>

<div>
	<DataView type="{selectedType}" />
</div>
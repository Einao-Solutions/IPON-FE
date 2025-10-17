<script lang="ts">
	import {Label} from '$lib/components/ui/label';

	export let oldData:string
	export let newData:string
	export let field:string
	function getData(data:string|number){
		console.log(field)
		if (field.toLowerCase()==="patentApplicationType".toLowerCase())
		{
			if (data===0){return "Patent"}
			if (data===1){return "Business Method"}
			if (data===2){return "Utility Model"}
		}if (field.toLowerCase()==="designType".toLowerCase())
		{
			if (data===0){return "Textile"}
			if (data===1){return "Non Textile"}
		}

		if (field==="patentType"){
			if (data===0){return "Conventional"}
			if (data===1){return "Non-Conventional"}
			if (data===2){return "PCT"}
		}
		else {return data}
	}
</script>

<div class="grid gap-4 md:flex overflow-y-auto overflow-x-auto">
	<div class="mx-1.5 my-1.5 border rounded-md grid px-2 gap-1.5 py-2 overflow-y-auto overflow-x-auto">
		<Label for="old_field">old {field}</Label>
		<br />
		<p>{getData(oldData)}</p>
	</div>
	<div class="mx-1.5 my-1.5 border rounded-md gap-1.5 px-2 grid py-2 overflow-y-auto overflow-x-auto">
		<Label for="old_field">New {field}</Label>
		<br />
		<p>{getData(newData)}</p>
	</div>
</div>
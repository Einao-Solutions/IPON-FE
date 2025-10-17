<script lang="ts">
	import * as Table from "$lib/components/ui/table"
	import { type Applicant, type Inventor, type Priority } from '$lib/helpers';
	import type { CalendarDate, DateValue } from '@internationalized/date';
	export let oldData : Inventor[] | Priority[] | Applicant[] ;
	export let newData: Inventor[] | Priority[] | Applicant[];
	export let type:string
function getKeys()
{
	console.log(type)
	if (type==="priorityInfo" || type==="PriorityInfo") {
		return ['s/n', 'number','country', 'date'];
	}
	if (["inventors", "applicants"].includes(type)){
		return ['s/n', 'name', 'country', "number", "email", 'address']
	}
	try {
	let keys= Object.keys(oldData[0]);
	keys=keys.filter(x=>x!=="id" && x!=="address" &&x!=='number'&& x!=='email')
	return keys;
	}
	catch (e) {
	let keys= Object.keys(newData[0]);
	keys=keys.filter(x=>x!=="id" && x!=="address" &&x!=='number'&& x!=='email')
	return keys;

	}
}
function getOldValues(index:number)
{
	let val= Object.values(oldData[index]);
	val=val.filter(x=>x!==null)
	if (type==="priorityInfo")
	{
		if (val.length>0)
		{

			const date=val[3] as DateValue;

			val[3]=`${date.day}-${date.month.toString()}-${date.year}`;
		}
	}
	val.splice(0,1);
	return val;
}

function getNewValues(index:number)
{
	let val= Object.values(newData[index]);
	if (type==="priorityInfo")
	{
		if (val.length>0)
		{
			const date=val[3] as DateValue
			console.log(date.toString())
			val[3]=`${date.day}-${date.month.toString()}-${date.year}`;
		}
	}
	val=val.filter(x=>x!=null)
	val.splice(0,1);
	return val;
}
</script>
<div class="md:flex w-full overflow-x-auto overflow-y-auto text-sm ">
<div class="flex-grow w-full h-full ">
			<p class="w-full text-center font-semibold">Old {type}</p>
	<Table.Root class="text-sm">
		<Table.Header>
			<Table.Row class="text-sm">
				{#each getKeys() as key}
				<Table.Head class="text-sm min-w-fit">{key}</Table.Head>
					{/each}
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each oldData as old, i (i)}
				<Table.Row>
					<Table.Cell class="w-1 text-sm">{i+1}</Table.Cell>
					{#each getOldValues(i) as curr, ind (ind)}
					<Table.Cell class="min-w-36 text-sm">{curr}</Table.Cell>
						{/each}
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
	<hr class="hidden md:inline border-2 w-1.5 h-full"/>
<div class="flex-grow w-full">
			<p class="w-full text-center font-semibold">New {type}</p>
	<Table.Root >
		<Table.Header>
			<Table.Row>
				<Table.Head class="md:hidden w-1">s/n</Table.Head>
				{#each getKeys() as key}
					<Table.Head>{key}</Table.Head>
				{/each}
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each newData as newd, i (i)}
				<Table.Row>
					<Table.Cell class="w-1">{i+1}</Table.Cell>
					{#each getNewValues(i) as curr}
						<Table.Cell class="min-w-36">{curr}</Table.Cell>
					{/each}
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>

</div>
</div>
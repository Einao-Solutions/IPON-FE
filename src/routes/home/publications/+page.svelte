<script lang="ts">
	import { Button } from "$lib/components/ui/button"
	import * as Dialog from "$lib/components/ui/dialog"
	import * as Select from "$lib/components/ui/select/index.js";
	import dayjs from 'dayjs';
	import quarterOfYear from 'dayjs/plugin/quarterOfYear';

	import Icon from '@iconify/svelte';
	import { baseURL, FileTypes } from '$lib/helpers';
	dayjs.extend(quarterOfYear);
	let showRangePicker:boolean=false
	let currentYear:number= dayjs().year()
	let isFetching:boolean=false;
	let data
	let selectedType:undefined|string
	let selectedYear:number, selectedQuarter:number
	let allYears: number[] = Array(currentYear+1 - 2020).fill(0).map((_, i) => 2020 + i);
	let quarters= [1, 2, 3, 4]

	async function fetchData(){
		if (!selectedQuarter || !selectedQuarter || !selectedType){return}
		let startDate =dayjs(selectedYear.toString()).set('date', 1).quarter(selectedQuarter).format().split("T")[0]
		let endDate =dayjs(selectedYear.toString()).set('date', 1).quarter(selectedQuarter+1).subtract(1, 'day').format().split("T")[0]
		let fileType= selectedType=="Patent"?0:selectedType=="Design"?1:selectedType=="Trademark"?2:undefined;
		if (fileType==2){return;}
		isFetching =true;
		const queryResult=await fetch(`${baseURL}/api/files/GetPublication?start=${startDate}&end=${endDate}&type=${fileType}`)
		if (queryResult.ok) {
			const data=await queryResult.blob()
			var link = document.createElement('a');
			link.href = URL.createObjectURL(data);
			link.download = 'journal.pdf';
			link.click();
			isFetching =false;
		}
	}
</script>
<div class="flex flex-col space-y-5 mt-20 items-center justify-between">
<strong>Publications</strong>
<div>select the quarter for which you want to download the data</div>
	<Button on:click={()=>showRangePicker=true}>Select</Button>
</div>

<Dialog.Root bind:open={showRangePicker}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Select year and Quarter</Dialog.Title>
		</Dialog.Header>
		<div class="flex flex-col justify-between space-y-5 items-center">
			<Select.Root portal={null}  onSelectedChange="{(selectin)=>{
				selectedYear = parseInt(selectin.value);
			}}">
				<Select.Trigger class="w-[180px]">
					<Select.Value placeholder="Select the year" />
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						<Select.Label>Years</Select.Label>
						{#each allYears as year}
							<Select.Item value={year} label={year.toString()}
							>{year}</Select.Item
							>
						{/each}
					</Select.Group>
				</Select.Content>
				<Select.Input name="selectedYear" bind:value={selectedYear} />
			</Select.Root>
			<Select.Root portal={null} onSelectedChange="{(selectin)=>{
				selectedQuarter = parseInt(selectin.value);
			}}" >
				<Select.Trigger class="w-[180px]">
					<Select.Value placeholder="Select the Quarter" />
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						<Select.Label>Quarters</Select.Label>
						{#each quarters as quarter}
							<Select.Item  value={quarter} label={`Q${quarter}`}>{`Q${quarter}`}</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
				<Select.Input name="selectedQuarter" bind:value={selectedQuarter} />
			</Select.Root>

			<Select.Root portal={null} onSelectedChange="{(selectin)=>{
				selectedType = selectin.value;
			}}" >
				<Select.Trigger class="w-[180px]">
					<Select.Value placeholder="Select the Type" />
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						<Select.Label>Type</Select.Label>
						{#each Object.keys(FileTypes).filter(s=>isNaN(s)) as type}
							<Select.Item  value={type} label={type}>{type}</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
				<Select.Input name="selectedType" bind:value={selectedType} />
			</Select.Root>
			<Button on:click={()=>fetchData()} class="w-[180px]">
				<Icon class="{isFetching?'':'hidden'}" icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
				Fetch</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>



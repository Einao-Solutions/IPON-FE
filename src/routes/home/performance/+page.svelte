<script lang="ts">

	import Icon from '@iconify/svelte';
	import { writable } from 'svelte/store';
	import { mapDateToString, mapTypeToString } from '../components/dashboardutils';
	import dayjs from 'dayjs';
	import { Button } from '$lib/components/ui/button';
	import { baseURL, type PerformanceData } from '$lib/helpers';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
	import * as Dialog from "$lib/components/ui/dialog"
	import * as Sheet from "$lib/components/ui/sheet"
	let selectedRange = writable<string>('Month');
	let performanceLoading=false;
	let performanceData=writable<PerformanceData|null>(null);
	let description = writable<string>('');
	let showRangePicker: boolean = false;
	let startDate = '';
	let endDate = '';
	let _showMoreInfo=false;
async function fetchData(startTime: string | null, endTime: string | null) {
	performanceLoading = true;
	if ($selectedRange==="custom")
	{
		startTime=dayjs(startTime).startOf('day').format();
		endTime=dayjs(endTime).endOf('day').format();
	}
	let body = {
		startDate: startTime,
		endDate: endTime
	};
	if (startTime === null || endTime === null) {
		body = {};
	}
	var response = await fetch(`${baseURL}/api/users/Performances`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (response.ok) {
		let data = await response.json();
		performanceData.set(data);
		console.log($performanceData);
	}
		performanceLoading = false;
}

function getFileStats(file:number){
	var data= $performanceData?.applicationsCount.filter(x => x.fileType === file);
	return data;
}
let actualData={}
function getTreated(file:number){
	var data=$performanceData?.treatedCount.filter(x=>[12, 7].includes(x.before)===false && [3,2].includes(x.after)===false && x.fileType===file);
	actualData[file]=data
	if (data!==undefined && data.length>=1) {
		const groupedData = data.reduce((acc, current) => {
			const key = `${current.before}-${current.after}`;
			if (!acc[key]) {
				acc[key] = { before: current.before, after: current.after, amount: 0 };
			}
			acc[key].amount += current.amount;
			return acc;
		}, {});

		const result = Object.values(groupedData);
		console.log(result)
		return result;
	}
	return data
}
$: {
	description.set(`Showing Performance between ${mapDateToString(startDate).split(',')[1]} and ${mapDateToString(endDate).split(',')[1]}`);
	fetchData(startDate, endDate);
}
selectedRange.subscribe((range) => {
	switch (range) {
		case 'Quarter':
			startDate = dayjs().startOf('quarter').format();
			endDate = dayjs().endOf('quarter').format();
			break;
		case 'Today':
			startDate = dayjs().startOf('day').format();
			endDate = dayjs().endOf('day').format();
			break;
		case 'Month':
			startDate = dayjs().startOf('month').format();
			endDate = dayjs().endOf('month').format();
			break;
		case 'Year':
			startDate = dayjs().startOf('year').format();
			endDate = dayjs().endOf('year').format();
			break;
		case 'All':
			startDate = dayjs(`2012-01-01`).format();
			endDate = dayjs().endOf('day').format();
			break;
		case 'custom':
			showRangePicker = true;
			break;
	}
	description.set(
		`Showing performance between ${mapDateToString(startDate).split(',')[1]} and ${mapDateToString(endDate).split(',')[1]}. Please note that expected balance and actual balance will differ due to remmittance`
	);
});
let moreInfoData=undefined
function showMoreInfo(data, file){
	const dt=actualData[file]
	moreInfoData= dt.filter(x=>x.before ===data.before && x.after ==data.after)
	_showMoreInfo=true;
}
</script>


<Dialog.Root bind:open={showRangePicker}>
	<Dialog.Content>
		<div class="flex justify-between items-center p-4 m-4">
			<div>
				<p>Start date</p>
				<input type="date" bind:value={startDate} placeholder="Start date" />
			</div>
			<div>
				<p>End date</p>
				<input type="date" bind:value={endDate} placeholder="End date" />
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="destructive" on:click={() => (showRangePicker = false)}>Cancel</Button>
			<Button
				on:click={() => {
					showRangePicker = false;
			fetchData(startDate, endDate);
				}}
			>Update
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Sheet.Root bind:open={_showMoreInfo}>
	<Sheet.Content class="overflow-y-auto">
		<Sheet.Header>
			<Sheet.Title>More Information</Sheet.Title>
		</Sheet.Header>
		<div>
			{#each moreInfoData as data}
			<div class="p-2 m-2 border rounded-md flex justify-between">
					<p>{data.user}</p>
					<p>{data.amount}</p>
			</div>
				{/each}
		</div>
	</Sheet.Content>
</Sheet.Root>

{#if performanceLoading}
	<div class="items-center justify-center flex h-screen">
		<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
	</div>
{:else}
	<div>
		<div class="border rounded-md flex m-2 p-2 justify-between items-center">
			<p>Performance over specified period of time</p>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>Select Period</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-fit p-1">
					<DropdownMenu.Item on:click={() => selectedRange.set('Today')}>
						<span>Today</span>
					</DropdownMenu.Item>
					<DropdownMenu.Item on:click={() => selectedRange.set('Month')}>
						<span>Month</span>
					</DropdownMenu.Item>
					<DropdownMenu.Item on:click={() => selectedRange.set('Quarter')}>
						<span>Quarter</span>
					</DropdownMenu.Item>
					<DropdownMenu.Item on:click={() => selectedRange.set('Year')}>
						<span>Year</span>
					</DropdownMenu.Item>
					<DropdownMenu.Item on:click={() => selectedRange.set('All')}>
						<span>All-time</span>
					</DropdownMenu.Item>
					<DropdownMenu.Item on:click={() => {selectedRange.set('custom'); showRangePicker=true;}}>
						<span>Custom</span>
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
		<div class="m-2 p-2 border rounded-md">{$description}</div>
		<div class="p-2 m-2 border rounded-md flex justify-evenly">
			<div class="space-y-3" >
				<strong>Patent Application Summary</strong>
				<div class="space-y-2">
				{#each getFileStats(0) as application}
					<div class="space-x-3 p-1 border rounded-md flex items-center justify-between">
						<p>{mapTypeToString(application.applicationType)}</p>
						<p class="font-semibold">{application.amount}</p>
					</div>
					{/each}
				</div>
			</div>
			<div class="space-y-3" >
				<strong>Design Application Summary</strong>
				<div class="space-y-2">
					{#each getFileStats(1) as application}
						<div class="space-x-3 p-1 border rounded-md flex items-center justify-between">
							<p>{mapTypeToString(application.applicationType)}</p>
							<p class="font-semibold">{application.amount}</p>
						</div>
					{/each}
				</div>
			</div>
			<div class="space-y-3" >
				<strong>Trademark Application Summary</strong>
				<div class="space-y-2">
					{#each getFileStats(2) as application}
						<div class="space-x-3 p-1 border rounded-md flex items-center justify-between">
							<p>{mapTypeToString(application.applicationType)}</p>
							<p class="font-semibold">{application.amount}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
		<div class="space-y-2 border rounded-md p-2 m-2">
			<strong>Treated Patent Applications</strong>
			<div class="grid grid-cols-1 gap-2">
				{#each getTreated(0) as treated}
					<Button on:click={()=>showMoreInfo(treated, 0)} variant="ghost" class="w-fit space-x-2 border">
						<div class="flex space-x-3 items-center">
							<AppStatusTag value="{treated.before}" />
							<Icon icon="fluent:arrow-right-12-regular" width="12" height="12" />
							<AppStatusTag value="{treated.after}" />
						</div>
						<p>{treated.amount}</p>
					</Button>
					{/each}
			</div>
		</div>
		<div class="space-y-2 border rounded-md p-2 m-2">
			<strong>Treated Design Applications</strong>
			<div class="grid grid-cols-1 gap-2">
				{#each getTreated(1) as treated}
					<Button on:click={()=>showMoreInfo(treated, 1)} variant="ghost" class="w-fit space-x-2">
						<div class="flex space-x-3 items-center">
							<AppStatusTag value="{treated.before}" />
							<Icon icon="fluent:arrow-right-12-regular" width="12" height="12" />
							<AppStatusTag value="{treated.after}" />
						</div>
						<p>{treated.amount}</p>
					</Button>
				{/each}
			</div>
		</div>
		<div class="space-y-2 border rounded-md p-2 m-2">
			<strong>Treated Trademark Applications</strong>
			<div class="grid grid-cols-1 gap-2">
				{#each getTreated(2) as treated}
					<Button on:click={()=>showMoreInfo(treated, 2)} variant="ghost" class="w-fit space-x-2">
						<div class="flex space-x-3 items-center">
							<AppStatusTag value="{treated.before}" />
							<Icon icon="fluent:arrow-right-12-regular" width="12" height="12" />
							<AppStatusTag value="{treated.after}" />
						</div>
						<p>{treated.amount}</p>
					</Button>
				{/each}
			</div>
		</div>
<!--		<div class="space-y-2 border rounded-md p-2 m-2">-->
<!--		<strong>Average patent response time</strong>-->
<!--			<div class="flex items-center space-x-3 border rounded-md w-fit p-2">-->
<!--			<p>Average time spent at Search</p>-->
<!--			<p class="font-semibold">2 days</p>-->
<!--			</div>-->
<!--			<div class="flex items-center space-x-3 border rounded-md w-fit p-2">-->
<!--			<p>Average time spent at Examiner</p>-->
<!--				<p class="font-semibold">2 days</p>-->
<!--			</div>-->
<!--		</div>-->
<!--		<div class="space-y-2 border rounded-md p-2 m-2">-->
<!--			<strong>Average design response time</strong>-->
<!--			<div class="flex items-center space-x-3 border rounded-md w-fit p-2 ">-->
<!--				<p>Average time spent at Search</p>-->
<!--				<p class="font-semibold">2 days</p>-->
<!--			</div>-->
<!--			<div class="flex items-center space-x-3 border rounded-md w-fit p-2">-->
<!--				<p>Average time spent at Examiner</p>-->
<!--				<p class="font-semibold" >2 days</p>-->
<!--			</div>-->
<!--		</div>-->
<!--		<div class="m-2 p-2 border rounded-md space-y-2">-->
<!--			<strong>Tickets Summary</strong>-->
<!--			<div class="flex space-x-2 p-2 border rounded-md w-fit">-->
<!--				<p>Tickets created</p>-->
<!--				<p class="font-semibold">30</p>-->
<!--			</div>-->
<!--			<Button variant="ghost" on:click={()=>showMoreInfo()} class="flex space-x-2 p-2 border rounded-md w-fit items-center">-->
<!--				<p>Tickets closed</p>-->
<!--				<p class="font-semibold">30</p>-->
<!--			</Button>-->
<!--			<Button variant="ghost" on:click={()=>showMoreInfo()} class="flex space-x-2 p-2 border rounded-md w-fit items-center">-->
<!--				<p>Tickets with new messages</p>-->
<!--				<p class="font-semibold">30</p>-->
<!--			</Button>-->
<!--		</div>-->
		</div>
	{/if}


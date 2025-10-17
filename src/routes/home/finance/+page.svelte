<script lang="ts">
	// total amount made between specific time frame, options include, day, month, quarter, year, specific
	// sources: renewal, new, etc
	// top sources: people (?)
	import { writable } from 'svelte/store';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { baseURL, type FinanceData } from '$lib/helpers';
	import * as d3 from 'd3';
	import * as Sheet from "$lib/components/ui/sheet"
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { faker } from '@faker-js/faker';
	import { onMount } from 'svelte';
	import * as Card from "$lib/components/ui/card"
	import { Label } from "$lib/components/ui/label"
	import dayjs from 'dayjs';
	import quarterOfYear from 'dayjs/plugin/quarterOfYear';
	import { mapDateToStringNoDate } from '../components/dashboardutils';
	import { Button } from '$lib/components/ui/button';
	import { countriesMap } from '$lib/constants';
	import Icon from '@iconify/svelte';
	dayjs.extend(quarterOfYear);
	let financeData = writable<FinanceData[] | []>([]);
	let financeLoading: boolean = false;
	let showRangePicker: boolean = false;
	let selectedRange = writable<string>('Month');
	let description = writable<string>('');
	let startDate = '';
	let endDate = '';
	async function fetchData(startTime: string | null, endTime: string | null) {
		if ($selectedRange==='custom')
		{
			startTime=dayjs(startTime).startOf('day').format();
			endTime=dayjs(endTime).endOf('day').format();
		}
		financeLoading = true;
		let body = {
			startDate: startTime,
			endDate: endTime
		};
		if (startTime === null || endTime === null) {
			body = {};
		}
		const response = await fetch(`${baseURL}/api/finance/GetFinanceSummary`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (response.ok) {
			let data = await response.json();
			financeData.set(data);
			financeLoading = false;
		}
	}
	let svg = undefined;
	let loading=true;
	let xAxis;
	let yAxis;
	onMount(()=>{
	 loading=true;
	})
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
				startDate = dayjs(`2012-01-01`).startOf('day').format();
				endDate = dayjs().endOf('day').format();
				fetchData(startDate, endDate)
				break;
			case 'custom':
				showRangePicker = true;
				break;
		}
		if (range !== "custom")
		{
			fetchData(startDate, endDate)
		}
	});

	function GetCountryImageLink(country: string) {
		let key = Object.entries(countriesMap).find(entry => entry[1]===country);
		if (key!==undefined){
			key=key[0]
		}
		return `https://flagcdn.com/20x15/${key}.png`;
	}

	function formatCurrency(data: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'NGN',
			minimumFractionDigits: 2
		}).format(data);
	}
let showAll:boolean=false;
	let allContent=[]
	let allTitle:string|undefined=undefined
	async function viewAllData(type:string){
		showAll=true;
		allTitle=type==='country'?"All revenue by country":'All revenue by agents';
		if (type==='country'){
			allContent=$financeData.topByCountry
		}
		if (type==="agent"){
			allContent = $financeData.topByUsers
		}
	}

	let width = 450;
	let height = 200;
	let showSplit=false;
	function formatMobile(tick: number | string) {
		return `'${tick.toString().slice(-2)}`;
	}
$:groupByType=$financeData?.reduce((acc,current)=>{
			const type = current.type || 'Unknown';
			if (!acc[type]) {
				acc[type] = { type, total: 0 };
			}
			acc[type].total += current.total;
			return acc;
		}, {})
	$:sortedResult=Object.values(groupByType).sort((a,b)=>b?.total-a?.total);
	$:sortedResultCountry=Object.values($financeData?.reduce((acc,current)=>{
		const country = current.country.toLowerCase() || 'Unknown';
		if (!acc[country]) {
			acc[country] = { type:country, total: 0 };
		}
		acc[country].total += current.total;
		return acc;
	}, {})).sort((a,b)=>b?.total-a?.total);

	let showAllResultBy:boolean=false;
	let type:string="";
	function viewAllBy(data:string)
	{
		type=data
		showAllResultBy=true;
	}

	function getsortedResult()
	{
		return type==="source"? sortedResult:sortedResultCountry
	}
</script>


<AlertDialog.Root bind:open={showSplit}>
<AlertDialog.Content>
	<AlertDialog.Title>Revenue Split</AlertDialog.Title>
	<div class="p-2 m-2 items-center flex flex-col space-y-4">
		<div class="rounded-md border p-2 m-2 flex justify-between items-center w-full">
		<Label>1. Federal Ministry of Industry, Trade and Investment </Label>
			<Label>{$financeData?.map(e=>e.ministryFee)?.reduce((a,b)=>a+b,0).toLocaleString('en-NG', {
				style: 'currency',
				currency: 'NGN',
			})}</Label>
		</div>
		<div class="rounded-md border p-2 m-2 flex justify-between items-center w-full">
			<Label>2. Einao Solutions </Label>
			<Label>{$financeData?.map(e=>e.techFee)?.reduce((a,b)=>a+b,0).toLocaleString('en-NG', {
				style: 'currency',
				currency: 'NGN',
			})}</Label>
		</div>
	</div>
</AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={showAllResultBy}>
<AlertDialog.Content>
	<AlertDialog.Title>Exhaustive List</AlertDialog.Title>
	<div class="p-2 m-2 items-center flex flex-col space-y-4 overflow-y-auto h-[300px]">
		{#each getsortedResult() as data, i}
				<div class="rounded-md border p-2 m-2 flex justify-between items-center w-full">
				<Label>{i+1} {data.type} </Label>
					<Label>{data?.total.toLocaleString('en-NG', {
						style: 'currency',
						currency: 'NGN',
					})}</Label>
				</div>
			{/each}
	</div>
</AlertDialog.Content>
</AlertDialog.Root>
<Sheet.Root bind:open={showAll}>
	<Sheet.Content class="overflow-y-auto">
		<Sheet.Header>
			<Sheet.Title>{allTitle}</Sheet.Title>
		</Sheet.Header>
	<div>
		{#each allContent as  content}
			<div class=" p-1 m-1 flex justify-between items-center border rounded-md">
				<p>{content.name}</p>
				<p>{content.amount}</p>
			</div>
		{/each}
	</div>
	</Sheet.Content>
</Sheet.Root>
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
			<Button variant="destructive" on:click={() => {showRangePicker = false;   }}>Cancel</Button>
			<Button
				on:click={() => {
					showRangePicker = false;
					fetchData(startDate, endDate)
				}}
				>Update
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
<div>
	<div class="flex justify-between items-center border-b pb-2">
		<Label>Overview</Label>
			<p>Financial performance for the selected period between {mapDateToStringNoDate(startDate)} and {mapDateToStringNoDate(endDate)}</p>
		<div>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<div class="flex items-center">
				<Icon icon="solar:settings-broken" width="1.2em" height="1.2em" class="mr-1" />
					<p>Select Period</p>
				</div>
				</DropdownMenu.Trigger>
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
					<DropdownMenu.Item on:click={() => {selectedRange.set('custom');showRangePicker=true; }}>
						<span>Custom</span>
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>

	{#if financeLoading}
		<div class="items-center justify-center flex h-screen">
			<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
		</div>
	{:else}
			<div class="grid grid-cols-3 space-x-5 ">
					<Card.Root class="flex flex-col p-2 pl-4 pt-2.5 w-[250px]">
						<div class="items-center flex justify-between">
						<Label class="text-gray-500 pb-3">Total Revenue</Label>
							<Button variant="outline" class="p-1" on:click={()=>showSplit=true}>
								<Icon icon="material-symbols-light:split-scene-outline" width="2em" height="2em" />
							</Button>
						</div>
						<Label class="font-bold text-xl pb-1">{$financeData?.map(d=>d.total)?.reduce((a,b)=>a+b, 0)?.toLocaleString('en-NG', {
							style: 'currency',
							currency: 'NGN',
						})}</Label>
					</Card.Root>
<!--	<Card.Root class="flex flex-col w-[250px] p-2 pl-4 pt-2.5">-->
<!--		<Label class="text-gray-500 pb-3">Average daily Revenue</Label>-->
<!--		<Label class="font-bold text-xl pb-1">$50,000</Label>-->
<!--		<div class="flex items-center space-x-1">-->
<!--			<div class="border-green-800 border bg-green-50 rounded-md items-center text-green-950 flex p-[0.1rem]">-->
<!--				<Icon icon="solar:arrow-up-bold" width=".6em" height=".6em" />-->
<!--				<Label class="font-medium text-[0.7rem]">0.32%</Label>-->
<!--			</div>-->
<!--			<Label class="text-gray-400 text-sm font-medium">Compared to last month</Label>-->
<!--		</div>-->
<!--	</Card.Root>-->
<!--	<Button variant="outline" class="mr-2 w-[250px] h-full flex flex-col justify-center items-start">-->
<!--		<Icon icon="solar:graph-linear" width="24" height="24" />-->
<!--		<p>Change Graph</p>-->
<!--		<Label class="text-gray-400 text-sm font-medium">Select to display multiple items</Label>-->
<!--	</Button>-->
	</div>
{/if}
</div>

{#if financeLoading}
	<div class="items-center justify-center flex h-screen">
		<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
	</div>
{:else}
<div class="grid grid-cols-3 space-x-3">
	<Card.Root class="p-2 h-[250px]">
		<div class="flex items-center justify-between mb-4">
		<Label>Revenue by source</Label>
			<Button variant="outline" on:click={()=>viewAllBy("source")}>
				<Icon icon="nimbus:list" width="16" height="16" />
			</Button>
		</div>
		{#each sortedResult.slice(0,3) as type, index }
		<div class="flex flex-col">
			<div class="flex items-center justify-between mb-4 border rounded-md p-2">
				<Label>{index+1} {type?.type}</Label>
				<p class="text-sm">{type?.total.toLocaleString('en-NG', {
					style: 'currency',
					currency: 'NGN',
				})}</p>
			</div>
		</div>
			{/each}
	</Card.Root>
	<Card.Root class="p-2 h-[250px]">
		<div class="flex items-center justify-between mb-4">
			<Label>Revenue by Country</Label>
			<Button variant="outline" on:click={()=>viewAllBy('country')}>
				<Icon icon="nimbus:list" width="16" height="16" />
			</Button>
		</div>
		{#each sortedResultCountry.slice(0,3) as type, index }
			<div class="flex flex-col">
				<div class="flex items-center justify-between mb-4 border rounded-md p-2">
					<Label>{index+1} {type?.type}</Label>
					<p class="text-sm">{type?.total.toLocaleString('en-NG', {
						style: 'currency',
						currency: 'NGN',
					})}</p>
				</div>
			</div>
		{/each}
	</Card.Root>
<!--	<Card.Root class="p-2 h-[250px]">-->
<!--		<div class="flex items-center justify-between mb-4">-->
<!--			<Label>Revenue by Users</Label>-->
<!--			<Button variant="outline">-->
<!--				<Icon icon="nimbus:list" width="16" height="16" />-->
<!--			</Button>-->
<!--		</div>-->
<!--		<div class="flex flex-col">-->
<!--			<div class="flex items-center justify-between mb-4 border rounded-md p-2">-->
<!--				<Label>1. Inns Law</Label>-->
<!--				<p class="text-sm">40,000,000</p>-->
<!--			</div>-->
<!--		</div>-->
<!--	</Card.Root>-->
</div>
{/if}
<!--<div class="chart w-full h-[350px]" bind:clientWidth={width} bind:clientHeight={height}>-->
<!--	<svg {width}  {height} viewBox="0,0,{width-40}, {height}">-->
<!--		<g bind:this={xAxis} transform="translate(0,{height-20})" />-->
<!--		<g bind:this={yAxis} transform="translate(0,0)" />-->
<!--		<path fill="none" stroke="currentColor" stroke-width="1.5" d={line(lineData)} />-->
<!--	</svg>-->
<!--</div>-->
<!--{#if financeLoading}-->
<!--	<div class="items-center justify-center flex h-screen">-->
<!--		<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />-->
<!--	</div>-->
<!--{:else}-->
<!--	<div>-->
<!--		<div class="border rounded-md flex m-2 p-2 justify-between items-center">-->
<!--			<p>Financial Performance over specified period of time</p>-->

<!--		</div>-->
<!--		<div class="m-2 p-2 border rounded-md">{$description}</div>-->
<!--		<div class="p-2 m-2 border rounded-md">-->
<!--			<div class="border-b">-->
<!--				<strong>Total Revenue Generated</strong>-->
<!--				<p class="text-green-800 text-lg font-bold">-->
<!--					{formatCurrency(parseFloat($financeData.total.total))}-->
<!--				</p>-->
<!--			</div>-->
<!--			<div class="flex justify-between">-->
<!--				<div class="border-r">-->
<!--					<strong>Federal Ministry of Industry, Trade and Investment</strong>-->
<!--					<p class="text-green-800 text-lg font-bold">-->
<!--						{formatCurrency(parseFloat($financeData.total.source1))}-->
<!--					</p>-->
<!--				</div>-->
<!--				<div>-->
<!--					<strong>Einao Solutions ltd</strong>-->
<!--					<p class="text-green-800 text-lg font-bold">-->
<!--						{formatCurrency(parseFloat($financeData.total.source2))}-->
<!--					</p>-->
<!--				</div>-->
<!--			</div>-->
<!--		</div>-->
<!--		<div class="p-2 m-2 border rounded-md">-->
<!--			<strong>Revenue sources</strong>-->
<!--			{#each $financeData.breakDown as source}-->
<!--				<div class="border rounded-md p-2 m-2 flex justify-between items-center">-->
<!--					<p>{source.name}</p>-->
<!--					<p class="text-green-800 text-lg font-bold">-->
<!--						{formatCurrency(parseFloat(source.amount))}-->
<!--					</p>-->
<!--				</div>-->
<!--			{/each}-->
<!--		</div>-->
<!--		<div class="p-2 m-2 border rounded-md">-->
<!--			<div class="flex justify-between items-center">-->
<!--			<strong>Top 5 sources by country</strong>-->
<!--			<Button on:click={()=>viewAllData('country')}>View all</Button>-->
<!--			</div>-->
<!--			{#each $financeData?.topByCountry.slice(0,5) as source}-->
<!--				<div class="border rounded-md p-2 m-2 flex justify-between items-center">-->
<!--					<div class="flex space-x-4">-->
<!--						<img-->
<!--							src={GetCountryImageLink(source.name)}-->
<!--							width="20"-->
<!--							height="15"-->
<!--							alt="@flag"-->
<!--						/>-->
<!--						{source.name}-->
<!--					</div>-->
<!--					<p class="text-green-800 text-lg font-bold">-->
<!--						{formatCurrency(parseFloat(source.amount))}-->
<!--					</p>-->
<!--				</div>-->
<!--			{/each}-->
<!--		</div>-->
<!--	</div>-->
<!--{/if}-->

<!--// revenue by source-->
<!--// revenue by user-->
<!--// revenue by country-->
<!--// graph-->
<!--// disclaimer & info-->
<!--// selector-->
<!--// period up or down.-->
<!--// hide/show-->
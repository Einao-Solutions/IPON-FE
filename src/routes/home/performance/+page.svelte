<script lang="ts">
	import Icon from '@iconify/svelte';
	import { writable } from 'svelte/store';
	import { mapDateToString, mapTypeToString } from '../components/dashboardutils';
	import dayjs from 'dayjs';
	import { Button } from '$lib/components/ui/button';
	import { baseURL, type PerformanceData } from '$lib/helpers';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import * as Dialog from "$lib/components/ui/dialog";
	import * as Sheet from "$lib/components/ui/sheet";
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let selectedRange = writable<string>('Month');
	let performanceLoading = false;
	let performanceData = writable<PerformanceData | null>(null);
	let description = writable<string>('');
	let showRangePicker: boolean = false;
	let startDate = '';
	let endDate = '';
	let _showMoreInfo = false;
	let initialLoadDone = false;

	async function fetchData(startTime: string | null, endTime: string | null) {
		// Only fetch if in browser
		if (!browser) return;

		performanceLoading = true;
		
		try {
			if ($selectedRange === "custom") {
				startTime = dayjs(startTime).startOf('day').format();
				endTime = dayjs(endTime).endOf('day').format();
			}
			
			let body: any = {
				startDate: startTime,
				endDate: endTime
			};
			
			if (startTime === null || endTime === null) {
				body = {};
			}
			
			const response = await fetch(`${baseURL}/api/users/Performances`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			
			if (response.ok) {
				let data = await response.json();
				performanceData.set(data);
				console.log($performanceData);
			}
		} catch (error) {
			console.error('Error fetching performance data:', error);
		} finally {
			performanceLoading = false;
		}
	}

	function getFileStats(file: number) {
		const data = $performanceData?.applicationsCount.filter(x => x.fileType === file);
		return data || [];
	}

	let actualData: Record<number, any[]> = {};

	function getTreated(file: number) {
		const data = $performanceData?.treatedCount.filter(
			x => [12, 7].includes(x.before) === false && 
			     [3, 2].includes(x.after) === false && 
			     x.fileType === file
		);
		
		actualData[file] = data || [];
		
		if (data !== undefined && data.length >= 1) {
			const groupedData = data.reduce((acc: any, current: any) => {
				const key = `${current.before}-${current.after}`;
				if (!acc[key]) {
					acc[key] = { before: current.before, after: current.after, amount: 0 };
				}
				acc[key].amount += current.amount;
				return acc;
			}, {});

			const result = Object.values(groupedData);
			console.log(result);
			return result;
		}
		return data || [];
	}

	// Initialize dates on mount
	onMount(() => {
		// Set initial date range
		startDate = dayjs().startOf('month').format();
		endDate = dayjs().endOf('month').format();
		
		// Update description
		description.set(
			`Showing performance between ${mapDateToString(startDate).split(',')[1]} and ${mapDateToString(endDate).split(',')[1]}. Please note that expected balance and actual balance will differ due to remittance`
		);
		
		// Fetch initial data
		fetchData(startDate, endDate);
		initialLoadDone = true;
	});

	// Reactive statement for description and data fetching
	$: if (browser && initialLoadDone && startDate && endDate) {
		description.set(
			`Showing performance between ${mapDateToString(startDate).split(',')[1]} and ${mapDateToString(endDate).split(',')[1]}. Please note that expected balance and actual balance will differ due to remittance`
		);
	}

	selectedRange.subscribe((range) => {
		if (!browser || !initialLoadDone) return;

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
				startDate = dayjs('2012-01-01').format();
				endDate = dayjs().endOf('day').format();
				break;
			case 'custom':
				showRangePicker = true;
				return; // Don't fetch yet, wait for user input
		}
		
		description.set(
			`Showing performance between ${mapDateToString(startDate).split(',')[1]} and ${mapDateToString(endDate).split(',')[1]}. Please note that expected balance and actual balance will differ due to remittance`
		);
		
		fetchData(startDate, endDate);
	});

	let moreInfoData: any[] | undefined = undefined;

	function showMoreInfo(data: any, file: number) {
		const dt = actualData[file];
		moreInfoData = dt?.filter(x => x.before === data.before && x.after === data.after);
		_showMoreInfo = true;
	}
</script>

<Dialog.Root bind:open={showRangePicker}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Select Custom Date Range</Dialog.Title>
			<Dialog.Description>
				Choose the start and end dates for your custom performance report
			</Dialog.Description>
		</Dialog.Header>
		
		<div class="grid gap-4 py-4">
			<div class="space-y-2">
				<label for="start-date" class="text-sm font-medium">Start Date</label>
				<input 
					id="start-date"
					type="date" 
					bind:value={startDate} 
					class="w-full px-3 py-2 border rounded-md"
				/>
			</div>
			<div class="space-y-2">
				<label for="end-date" class="text-sm font-medium">End Date</label>
				<input 
					id="end-date"
					type="date" 
					bind:value={endDate} 
					class="w-full px-3 py-2 border rounded-md"
				/>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" on:click={() => (showRangePicker = false)}>Cancel</Button>
			<Button
				on:click={() => {
					showRangePicker = false;
					fetchData(startDate, endDate);
				}}
			>
				Apply Range
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Sheet.Root bind:open={_showMoreInfo}>
	<Sheet.Content class="overflow-y-auto">
		<Sheet.Header>
			<Sheet.Title>Detailed Breakdown</Sheet.Title>
			<Sheet.Description>
				Individual user contributions to this status transition
			</Sheet.Description>
		</Sheet.Header>
		
		<div class="mt-6 space-y-2">
			{#if moreInfoData && moreInfoData.length > 0}
				{#each moreInfoData as data}
					<div class="p-3 border rounded-md flex justify-between items-center hover:bg-muted/50 transition-colors">
						<p class="font-medium">{data.user}</p>
						<p class="text-lg font-semibold">{data.amount}</p>
					</div>
				{/each}
			{:else}
				<p class="text-sm text-muted-foreground text-center py-8">No detailed data available</p>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>

{#if performanceLoading}
	<div class="flex items-center justify-center h-screen">
		<div class="text-center space-y-4">
			<Icon icon="line-md:loading-loop" width="3rem" height="3rem" class="mx-auto" />
			<p class="text-muted-foreground">Loading performance data...</p>
		</div>
	</div>
{:else}
	<div class="space-y-4 p-4">
		<!-- Header with Period Selector -->
		<div class="border rounded-lg p-4 flex justify-between items-center bg-card">
			<div>
				<h1 class="text-2xl font-semibold">Performance Dashboard</h1>
				<p class="text-sm text-muted-foreground mt-1">Track application statistics over time</p>
			</div>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild let:builder>
					<Button builders={[builder]} variant="outline" class="gap-2">
						<Icon icon="ph:calendar" width="1.2rem" height="1.2rem" />
						{$selectedRange}
						<Icon icon="ph:caret-down" width="1rem" height="1rem" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-48">
					<DropdownMenu.Item on:click={() => selectedRange.set('Today')}>
						<Icon icon="ph:calendar-dot" class="mr-2" width="1rem" height="1rem" />
						<span>Today</span>
					</DropdownMenu.Item>
					<DropdownMenu.Item on:click={() => selectedRange.set('Month')}>
						<Icon icon="ph:calendar" class="mr-2" width="1rem" height="1rem" />
						<span>This Month</span>
					</DropdownMenu.Item>
					<DropdownMenu.Item on:click={() => selectedRange.set('Quarter')}>
						<Icon icon="ph:calendar-blank" class="mr-2" width="1rem" height="1rem" />
						<span>This Quarter</span>
					</DropdownMenu.Item>
					<DropdownMenu.Item on:click={() => selectedRange.set('Year')}>
						<Icon icon="ph:calendar-check" class="mr-2" width="1rem" height="1rem" />
						<span>This Year</span>
					</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Item on:click={() => selectedRange.set('All')}>
						<Icon icon="ph:infinity" class="mr-2" width="1rem" height="1rem" />
						<span>All Time</span>
					</DropdownMenu.Item>
					<DropdownMenu.Item on:click={() => {selectedRange.set('custom'); showRangePicker=true;}}>
						<Icon icon="ph:calendar-plus" class="mr-2" width="1rem" height="1rem" />
						<span>Custom Range</span>
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>

		<!-- Description -->
		<div class="border rounded-lg p-4 bg-muted/50">
			<p class="text-sm">{$description}</p>
		</div>

		<!-- Application Summaries -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- Patent Applications -->
			<div class="border rounded-lg p-4 space-y-3 bg-card">
				<h3 class="font-semibold text-lg flex items-center gap-2">
					<Icon icon="ph:file-text" width="1.2rem" height="1.2rem" />
					Patent Applications
				</h3>
				<div class="space-y-2">
					{#each getFileStats(0) as application}
						<div class="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors">
							<span class="text-sm">{mapTypeToString(application.applicationType)}</span>
							<span class="font-semibold">{application.amount}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Design Applications -->
			<div class="border rounded-lg p-4 space-y-3 bg-card">
				<h3 class="font-semibold text-lg flex items-center gap-2">
					<Icon icon="ph:palette" width="1.2rem" height="1.2rem" />
					Design Applications
				</h3>
				<div class="space-y-2">
					{#each getFileStats(1) as application}
						<div class="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors">
							<span class="text-sm">{mapTypeToString(application.applicationType)}</span>
							<span class="font-semibold">{application.amount}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Trademark Applications -->
			<div class="border rounded-lg p-4 space-y-3 bg-card">
				<h3 class="font-semibold text-lg flex items-center gap-2">
					<Icon icon="ph:trademark" width="1.2rem" height="1.2rem" />
					Trademark Applications
				</h3>
				<div class="space-y-2">
					{#each getFileStats(2) as application}
						<div class="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors">
							<span class="text-sm">{mapTypeToString(application.applicationType)}</span>
							<span class="font-semibold">{application.amount}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Treated Applications -->
		<div class="space-y-4">
			<!-- Patent Transitions -->
			<div class="border rounded-lg p-4 space-y-3 bg-card">
				<h3 class="font-semibold text-lg">Treated Patent Applications</h3>
				<div class="flex flex-wrap gap-2">
					{#each getTreated(0) as treated}
						<Button 
							on:click={() => showMoreInfo(treated, 0)} 
							variant="outline" 
							class="gap-2"
						>
							<div class="flex items-center gap-2">
								<AppStatusTag value={treated.before} />
								<Icon icon="ph:arrow-right" width="1rem" height="1rem" />
								<AppStatusTag value={treated.after} />
							</div>
							<span class="font-semibold">{treated.amount}</span>
						</Button>
					{/each}
				</div>
			</div>

			<!-- Design Transitions -->
			<div class="border rounded-lg p-4 space-y-3 bg-card">
				<h3 class="font-semibold text-lg">Treated Design Applications</h3>
				<div class="flex flex-wrap gap-2">
					{#each getTreated(1) as treated}
						<Button 
							on:click={() => showMoreInfo(treated, 1)} 
							variant="outline" 
							class="gap-2"
						>
							<div class="flex items-center gap-2">
								<AppStatusTag value={treated.before} />
								<Icon icon="ph:arrow-right" width="1rem" height="1rem" />
								<AppStatusTag value={treated.after} />
							</div>
							<span class="font-semibold">{treated.amount}</span>
						</Button>
					{/each}
				</div>
			</div>

			<!-- Trademark Transitions -->
			<div class="border rounded-lg p-4 space-y-3 bg-card">
				<h3 class="font-semibold text-lg">Treated Trademark Applications</h3>
				<div class="flex flex-wrap gap-2">
					{#each getTreated(2) as treated}
						<Button 
							on:click={() => showMoreInfo(treated, 2)} 
							variant="outline" 
							class="gap-2"
						>
							<div class="flex items-center gap-2">
								<AppStatusTag value={treated.before} />
								<Icon icon="ph:arrow-right" width="1rem" height="1rem" />
								<AppStatusTag value={treated.after} />
							</div>
							<span class="font-semibold">{treated.amount}</span>
						</Button>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
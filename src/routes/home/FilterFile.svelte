<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Input } from '$lib/components/ui/input';
	import MultiselectDropdown from '$lib/components/ui/multiselect-dropdown/MultiselectDropdown.svelte';
	import { ApplicationStatuses, FilingType, FormApplicationTypes } from '$lib/helpers';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import CalendarIcon from 'lucide-svelte/icons/calendar';
	import { DateFormatter, getLocalTimeZone } from '@internationalized/date';
	import { Calendar } from '$lib/components/ui/calendar';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	export let open: boolean = false;
	export let onclose: () => void;
	export let data;
	export let onSearchPressed:()=>{ [key: string]: any};
	let title: string | null = '';
	let selectedFiles: FilingType[] = [];
	let selectedStatuses: ApplicationStatuses[] = [];
	let selectedAppTypes: FormApplicationTypes[] = [];
	let priorityNumber: string | null = '';
	let startDate=""
	let endDate=""
	function appStatuses() {
		let mapped = [];
		for (let i = 0; i < Object.values(ApplicationStatuses).length; i++) {
			mapped.push({
				key: i,
				value: Object.values(ApplicationStatuses)[i]
			});
		}
		return mapped;
	}
	function appTypes() {
		return [
			{ key: 0, value: 'New Application' },
			{ key: 1, value: 'Renewal' },
			{ key: 2, value: 'Data Update' },
			{ key: 3, value: 'Data Capture' }
		];
	}
	const df = new DateFormatter('en-GB', {
		dateStyle: 'long'
	});
	let isSearching: boolean = false;
	async function searchFiles() {
		isSearching = true;
		let otherData={}
		if (title){
			otherData.title=title
		}
		if (priorityNumber){
			otherData.PriorityNumber = priorityNumber
		}
		if (startDate !== "") {
			otherData.startDate=startDate
		}

		if (endDate !== "") {
			otherData.endDate=endDate
		}
		onSearchPressed(otherData)
		isSearching = false;
		onclose()
		return;
	}
</script>

<Sheet.Root bind:open onOpenChange={() => onclose()}>
	<Sheet.Content>
		<Sheet.Header>
			<Sheet.Title>Search files</Sheet.Title>
		</Sheet.Header>
		<div class="space-y-4 flex flex-col">
			<Input placeholder="Enter title or file number or applicant name" bind:value={title} />
			<Input placeholder="Enter priority number" bind:value={priorityNumber} />
			<div >
				<p>Application Start date</p>
				<input type="date" bind:value={startDate} placeholder="Start date" />
			</div>
			<div>
				<p>Application End date</p>
				<input type="date" bind:value={endDate} placeholder="End date" />
			</div>
			<Button on:click={() => searchFiles()} class="space-x-4" disabled={isSearching}>
				<Icon
					class={isSearching ? '' : 'hidden'}
					icon="line-md:loading-twotone-loop"
					width="1.2rem"
					height="1.2rem"
				/>
				<p>Search</p>
			</Button>
		</div>
	</Sheet.Content>
</Sheet.Root>

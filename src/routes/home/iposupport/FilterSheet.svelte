<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import CalendarIcon from 'lucide-svelte/icons/calendar';
	import {
		DateFormatter,
		type DateValue,
		getLocalTimeZone,
		today
	} from '@internationalized/date';
	import type { DateRange } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { TicketCategory, ApplicationType } from '$lib/helpers';
	import Icon from '@iconify/svelte';

	export let open: boolean = false;
	export let onFilter: (params: Record<string, any>) => void = () => {};

	// ── Filter state ──────────────────────────────────────────────────────────────
	let ticketNumber: string = '';
	let fileNumber: string = '';
	let selectedCategories: TicketCategory[] = [];
	let selectedApplicationTypes: ApplicationType[] = [];
	let selectedStatuses: number[] = [];
	let dateRange: DateRange | undefined = undefined;
	let startValue: DateValue | undefined = undefined;

	const df = new DateFormatter('en-GB', { dateStyle: 'medium' });

	// ── Option lists ──────────────────────────────────────────────────────────────
	const categoryOptions = [
		{ value: TicketCategory.TrademarkRegistry, label: 'Trademark Registry' },
		{ value: TicketCategory.PatentDesignRegistry, label: 'Patent & Design Registry' },
		{ value: TicketCategory.TechnicalSupport, label: 'Technical Support' }
	];

	const applicationTypeOptions = [
		{ value: ApplicationType.NewRegistration, label: 'New Registration' },
		{ value: ApplicationType.ClericalUpdate, label: 'Clerical Update' },
		{ value: ApplicationType.Opposition, label: 'Opposition' },
		{ value: ApplicationType.Certificate, label: 'Certificate' },
		{ value: ApplicationType.Recordals, label: 'Recordals' },
		{ value: ApplicationType.Withdrawal, label: 'Withdrawal' },
		{ value: ApplicationType.Appeal, label: 'Appeal' }
	];

	const statusOptions = [
		{ value: 0, label: 'Awaiting User' },
		{ value: 1, label: 'Awaiting Staff' },
		{ value: 2, label: 'Closed' }
	];

	// ── Toggle helpers ────────────────────────────────────────────────────────────
	function toggleCategory(val: TicketCategory) {
		selectedCategories = selectedCategories.includes(val)
			? selectedCategories.filter((v) => v !== val)
			: [...selectedCategories, val];
	}

	function toggleApplicationType(val: ApplicationType) {
		selectedApplicationTypes = selectedApplicationTypes.includes(val)
			? selectedApplicationTypes.filter((v) => v !== val)
			: [...selectedApplicationTypes, val];
	}

	function toggleStatus(val: number) {
		selectedStatuses = selectedStatuses.includes(val)
			? selectedStatuses.filter((v) => v !== val)
			: [...selectedStatuses, val];
	}

	// ── Apply / Clear ─────────────────────────────────────────────────────────────
function onSubmitted() {
		const params: Record<string, any> = {};

		// Fast-path: if user entered a ticket number, only send that.
		// This avoids extra filters/pagination interactions and makes the backend return quickly.
		const tn = ticketNumber.trim();
		if (tn) {
			params.ticketNumber = tn;
			onFilter(params);
			open = false;
			return;
		}

		if (fileNumber.trim()) params.fileNumber = fileNumber.trim();
		if (selectedCategories.length === 1) params.category = selectedCategories[0];
		if (selectedApplicationTypes.length === 1) params.applicationType = selectedApplicationTypes[0];
		if (selectedStatuses.length === 1) params.status = selectedStatuses[0];

		if (dateRange?.start && dateRange?.end) {
			params.startDate = dateRange.start.toDate(getLocalTimeZone()).toISOString();
			params.endDate = dateRange.end.toDate(getLocalTimeZone()).toISOString();
		}

		onFilter(params);
		open = false;
	}

	function clearFilters() {
		ticketNumber = '';
		fileNumber = '';
		selectedCategories = [];
		selectedApplicationTypes = [];
		selectedStatuses = [];
		dateRange = undefined;
		startValue = undefined;
	}

	const pillBase =
		'px-3 py-1 rounded-full border text-xs font-medium cursor-pointer transition-colors select-none';
	const pillActive = 'bg-green-700 border-green-700 text-white';
	const pillInactive = 'bg-white border-slate-300 text-slate-600 hover:border-green-500 hover:text-green-700';
</script>

<Sheet.Root bind:open>
	<Sheet.Content class="overflow-y-auto flex flex-col gap-6 sm:max-w-sm">
		<Sheet.Header>
			<Sheet.Title>Filter Tickets</Sheet.Title>
			<Sheet.Description>Narrow down the ticket list by applying filters below.</Sheet.Description>
		</Sheet.Header>

		<!-- Ticket Number -->
		<div class="space-y-1.5">
			<Label>Ticket Number</Label>
			<Input placeholder="e.g. TKT-0001" bind:value={ticketNumber} />
		</div>

		<!-- File Number -->
		<div class="space-y-1.5">
			<Label>File / Reference Number</Label>
			<Input placeholder="e.g. TM-2024-00001" bind:value={fileNumber} />
		</div>

		<!-- Category -->
		<div class="space-y-2">
			<Label>Category</Label>
			<div class="flex flex-wrap gap-2">
				{#each categoryOptions as opt}
					<button
						type="button"
						class="{pillBase} {selectedCategories.includes(opt.value) ? pillActive : pillInactive}"
						on:click={() => toggleCategory(opt.value)}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Application Type -->
		<div class="space-y-2">
			<Label>Application Type</Label>
			<div class="flex flex-wrap gap-2">
				{#each applicationTypeOptions as opt}
					<button
						type="button"
						class="{pillBase} {selectedApplicationTypes.includes(opt.value) ? pillActive : pillInactive}"
						on:click={() => toggleApplicationType(opt.value)}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Status -->
		<div class="space-y-2">
			<Label>Status</Label>
			<div class="flex flex-wrap gap-2">
				{#each statusOptions as opt}
					<button
						type="button"
						class="{pillBase} {selectedStatuses.includes(opt.value) ? pillActive : pillInactive}"
						on:click={() => toggleStatus(opt.value)}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Date Range -->
		<div class="space-y-1.5">
			<Label>Date Range</Label>
			<Popover.Root openFocus>
				<Popover.Trigger asChild let:builder>
					<Button
						variant="outline"
						class={cn(
							'w-full justify-start text-left font-normal',
							!dateRange && 'text-muted-foreground'
						)}
						builders={[builder]}
					>
						<CalendarIcon class="mr-2 h-4 w-4" />
						{#if dateRange?.start}
							{#if dateRange.end}
								{df.format(dateRange.start.toDate(getLocalTimeZone()))} –
								{df.format(dateRange.end.toDate(getLocalTimeZone()))}
							{:else}
								{df.format(dateRange.start.toDate(getLocalTimeZone()))}
							{/if}
						{:else}
							Pick a date range
						{/if}
					</Button>
				</Popover.Trigger>
				<Popover.Content class="w-auto p-0" align="start">
					<RangeCalendar
						bind:value={dateRange}
						bind:startValue
						initialFocus
						numberOfMonths={1}
						placeholder={dateRange?.start}
					/>
				</Popover.Content>
			</Popover.Root>
		</div>

		<!-- Actions -->
		<div class="flex gap-3 mt-auto pt-4 border-t">
			<Button variant="outline" class="flex-1" on:click={clearFilters}>
				<Icon icon="mdi:filter-off-outline" width="1rem" height="1rem" class="mr-1" />
				Clear
			</Button>
			<Button class="flex-1" on:click={onSubmitted}>Apply Filters</Button>
		</div>
	</Sheet.Content>
</Sheet.Root>

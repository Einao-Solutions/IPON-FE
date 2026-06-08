<script lang="ts">
	import {
		baseURL,
		decodeUser,
		type TicketInfo,
		TicketStates,
		type TicketSummary,
		UserRoles,
		TicketCategory
	} from '$lib/helpers';
	import { createRender, createTable, Render, Subscribe } from 'svelte-headless-table';
	import { writable, type Writable } from 'svelte/store';
	import {
		addHiddenColumns,
		addPagination,
		addSelectedRows,
		addTableFilter
	} from 'svelte-headless-table/plugins';
	import DataTableCheckbox from './data-table-checkbox.svelte';
	import TicketTag from '$lib/components/ui/ticketTag/ticketTag.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ChevronsUpDown } from 'lucide-svelte';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { loggedInUser, ipoTicketsSummary, ipoTicketStats } from '$lib/store';
	import Icon from '@iconify/svelte';
	import { mapDateToString } from '../components/dashboardutils';
	import { mapCategoryToString } from './supportutils';
	import { toast } from 'svelte-sonner';
	import { Toaster } from '$lib/components/ui/sonner';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Table from '$lib/components/ui/table';
	import * as Pagination from '$lib/components/ui/pagination';

	// ── Role helpers ──────────────────────────────────────────────────────────────
	const SUPPORT_STAFF_ROLES = [
		UserRoles.Tech,
		UserRoles.TrademarkSupport,
		UserRoles.PatentDesignSupport
	];

	function hasRole(role: UserRoles): boolean {
		return !!$loggedInUser?.userRoles?.includes(role);
	}
	function hasSupportStaffRole(): boolean {
		return SUPPORT_STAFF_ROLES.some((r) => hasRole(r));
	}
	function isTrademarkSupport(): boolean {
		return hasRole(UserRoles.TrademarkSupport);
	}
	function isPatentDesignSupport(): boolean {
		return hasRole(UserRoles.PatentDesignSupport);
	}
	function isTechSupport(): boolean {
		return hasRole(UserRoles.Tech);
	}
	// ── Tab system ────────────────────────────────────────────────────────────────
	type TabDef = {
		id: string;
		label: string;
		category: TicketCategory | null;
		isEscalation: boolean;
		raisedByRegistryStaff?: boolean;
	};

	function getTabsForRole(): TabDef[] {
		if (isTechSupport()) {
			return [{ id: 'all', label: 'All Tickets', category: null, isEscalation: false }];
		}
		if (isTrademarkSupport()) {
			return [{ id: 'tm', label: 'Trademark Registry', category: TicketCategory.TrademarkRegistry, isEscalation: false }];
		}
		if (isPatentDesignSupport()) {
			return [{ id: 'pd', label: 'Patent & Design Registry', category: TicketCategory.PatentDesignRegistry, isEscalation: false }];
		}
		return [];
	}

	// ── State ─────────────────────────────────────────────────────────────────────
	let tabs: TabDef[] = [];
	let activeTabId: string = '';
	let isAdmin: boolean = false;
	let activeStatusFilter: number | null = null;
	let activeCategoryPillFilter: TicketCategory | null = null;
	let showCloseConfirm: boolean = false;
	let ticketLoading: boolean = false;
	let selectedResultList: number = 10;
	let showResultLengthList: boolean = false;
	const resultLength = [10, 15, 20, 25, 30, 35, 40, 45, 50, 75, 100];
	const STATUS_SORT_ORDER: Record<number, number> = { 1: 0, 0: 1, 2: 2 };

	const userName = ($loggedInUser?.firstName ?? '') + ' ' + ($loggedInUser?.lastName ?? '');

	// ── Table state ───────────────────────────────────────────────────────────────
	let tableHeaderRows: any,
		tablePageRows: any,
		_tableAttrs: any,
		_tableBodyAttrs: any;
	let _hasNextPage: any, _hasPreviousPage: any, _pageIndex: any;
	let _flatColumns: any;
	let _selectedDataIds: Writable<Record<string, boolean>>;
	let _hiddenColumnIds: Writable<string[]>;
	let hidableCols: string[] = ['lastInteraction', 'title', 'creator', 'status', 'category', 'ticketType'];
	let hideForId: Record<string, boolean> = {};
	let _filterValue: any;

	// ── Lazy-loaded sub-components ────────────────────────────────────────────────
	let ticketViewComp: any = null;
	let createTicketComp: any = null;
	let filterSheetComp: any = null;

	let showTicketMessages: boolean = false;
	let showTicketCreation: boolean = false;
	let showFilter: boolean = false;
	let ticketInfo: any = {};
	let ticketData: any = {};
	let filterData: any = {};

	// ── Reactive hidden columns ───────────────────────────────────────────────────
	$: {
		if (_hiddenColumnIds) {
			$_hiddenColumnIds = Object.entries(hideForId)
				.filter(([, hide]) => !hide)
				.map(([id]) => id);
		}
	}

	// ── Table rebuild when data changes ──────────────────────────────────────────
	$: {
		const tickets = $ipoTicketsSummary;
		const sortedTickets = Array.isArray(tickets) ? tickets : [];

		const table = createTable(writable<any[]>(sortedTickets), {
			page: addPagination({ initialPageSize: selectedResultList }),
			filter: addTableFilter({
				fn: ({ filterValue, value }) =>
					value.toLowerCase().includes(filterValue.toLowerCase())
			}),
			hide: addHiddenColumns(),
			select: addSelectedRows()
		});

		const columns = table.createColumns([
			table.column({
				accessor: '_id',
				header: (_, { pluginStates }) => {
					const { allPageRowsSelected } = pluginStates.select;
					return createRender(DataTableCheckbox, { checked: allPageRowsSelected });
				},
				cell: ({ row }, { pluginStates }) => {
					const { getRowState } = pluginStates.select;
					const { isSelected } = getRowState(row);
					return createRender(DataTableCheckbox, { checked: isSelected });
				},
				plugins: { filter: { exclude: true } }
			}),
			table.column({ accessor: 'lastInteraction', header: 'Last Activity' }),
			table.column({ accessor: 'creator', header: 'Creator' }),
			table.column({ accessor: 'title', header: 'Title' }),
			table.column({
				accessor: 'category',
				header: 'Category',
				plugins: { filter: { exclude: true } }
			}),
			table.column({
				accessor: 'ticketType',
				header: 'Ticket Type',
				plugins: { filter: { exclude: true } }
			}),
			table.column({ accessor: 'status', header: 'Status' }),
			table.column({
				accessor: 'id',
				header: '',
				plugins: { filter: { exclude: true } }
			})
		]);

		const { headerRows, pageRows, tableAttrs, flatColumns, tableBodyAttrs, pluginStates } =
			table.createViewModel(columns);

		tableHeaderRows = headerRows;
		_tableBodyAttrs = tableBodyAttrs;
		tablePageRows = pageRows;
		_tableAttrs = tableAttrs;

		const { hasNextPage, hasPreviousPage, pageIndex } = pluginStates.page;
		_hasNextPage = hasNextPage;
		_hasPreviousPage = hasPreviousPage;
		_pageIndex = pageIndex;

		const { filterValue } = pluginStates.filter;
		_filterValue = filterValue;

		const { hiddenColumnIds } = pluginStates.hide;
		const { selectedDataIds } = pluginStates.select;
		_selectedDataIds = selectedDataIds;
		_hiddenColumnIds = hiddenColumnIds;

		_flatColumns = flatColumns;
		const ids: string[] = (_flatColumns as any[]).map((col: any) => col.id);
		hideForId = Object.fromEntries(ids.map((id: string) => [id, true]));

		if (!isAdmin) {
			hideForId['creator'] = false;
			hideForId['category'] = false;
		}
	}

	// ── Helpers ───────────────────────────────────────────────────────────────────
	function spreadAttrs(value: unknown): Record<string, unknown> {
		return (value ?? {}) as Record<string, unknown>;
	}

	function creatorNameFor(rowId: string): string {
		return ($ipoTicketsSummary as any)?.[rowId]?.creator?.name ?? '';
	}

	function categoryFor(rowId: string): string {
		const cat = ($ipoTicketsSummary as any)?.[rowId]?.category;
		if (cat === undefined || cat === null) return '—';
		return mapCategoryToString(cat as TicketCategory);
	}

	// ── Fetch ─────────────────────────────────────────────────────────────────────
	let techCategoryStats: Record<string, number> = {};
	let tmCategoryStats: Record<string, number> = {};
	let pdCategoryStats: Record<string, number> = {};

	async function getStats() {
		const userId = ($loggedInUser as any)?.creatorId;
		let url: string;
		if (isTechSupport()) {
			url = `${baseURL}/api/tickets/GetStats`;
		} else if (isTrademarkSupport()) {
			url = `${baseURL}/api/tickets/GetStats?category=${TicketCategory.TrademarkRegistry}`;
		} else if (isPatentDesignSupport()) {
			url = `${baseURL}/api/tickets/GetStats?category=${TicketCategory.PatentDesignRegistry}`;
		} else {
			url = `${baseURL}/api/tickets/GetStats?userId=${userId}`;
		}
		const response = await fetch(url, { method: 'GET' });
		if (response.ok) {
			ipoTicketStats.set(await response.json());
		}

		// For Tech: also fetch per-category breakdowns for the extra pills
		if (isTechSupport()) {
			const [tmRes, pdRes] = await Promise.all([
				fetch(`${baseURL}/api/tickets/GetStats?category=${TicketCategory.TrademarkRegistry}`),
				fetch(`${baseURL}/api/tickets/GetStats?category=${TicketCategory.PatentDesignRegistry}`)
			]);
			if (tmRes.ok) tmCategoryStats = await tmRes.json();
			if (pdRes.ok) pdCategoryStats = await pdRes.json();
		}
	}

	async function fetchTabTickets(tabId: string) {
		const cookieUser = document.cookie
			.split(';')
			.find((x) => x.startsWith(' user=') || x.startsWith('user='));
		if (!cookieUser) {
			await goto('/auth/');
			return;
		}
		const user = cookieUser.trimStart().slice(5);
		loggedInUser.set(JSON.parse(decodeURIComponent(user)));
		isAdmin = hasSupportStaffRole();

		if ($loggedInUser === null) return;

		const userId = ($loggedInUser as any).creatorId;
		let body: Record<string, any> = {};

		if (isTechSupport()) {
			body.creatorId = 'null';
			if (activeCategoryPillFilter !== null) body.category = activeCategoryPillFilter;
			if (activeStatusFilter !== null) body.status = activeStatusFilter;
		} else if (isTrademarkSupport()) {
			body.creatorId = 'null';
			body.category = TicketCategory.TrademarkRegistry;
			if (activeStatusFilter !== null) body.status = activeStatusFilter;
		} else if (isPatentDesignSupport()) {
			body.creatorId = 'null';
			body.category = TicketCategory.PatentDesignRegistry;
			if (activeStatusFilter !== null) body.status = activeStatusFilter;
		} else {
			body.creatorId = userId;
			if (activeStatusFilter !== null) body.status = activeStatusFilter;
		}

		const response = await fetch(`${baseURL}/api/tickets/TicketSummaries`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (response.ok) {
			const raw = await response.json();
			const sorted = Array.isArray(raw)
				? [...raw].sort((a: any, b: any) => {
						const statusA = STATUS_SORT_ORDER[a?.status] ?? 99;
						const statusB = STATUS_SORT_ORDER[b?.status] ?? 99;
						if (statusA !== statusB) return statusA - statusB;
						const dateA = a?.lastInteraction ? new Date(a.lastInteraction).getTime() : 0;
						const dateB = b?.lastInteraction ? new Date(b.lastInteraction).getTime() : 0;
						return dateA - dateB;
					})
				: raw;
			ipoTicketsSummary.set(sorted);
		}
	}

	async function onTabChange(tabId: string) {
		activeTabId = tabId;
		ipoTicketsSummary.set(null);
		ticketLoading = true;
		await fetchTabTickets(tabId);
		ticketLoading = false;
	}

	async function getSpecific(status: number | null, categoryOverride?: TicketCategory | null) {
		activeStatusFilter = status;
		activeCategoryPillFilter = categoryOverride !== undefined ? (categoryOverride ?? null) : null;
		ticketLoading = true;
		await fetchTabTickets(activeTabId);
		ticketLoading = false;
	}

	// ── Ticket view ───────────────────────────────────────────────────────────────
	async function loadTicket(id: string) {
		const response = await fetch(`${baseURL}/api/tickets/${id}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		if (response.ok) return await response.json();
		return null;
	}

	async function showTicket(rowId: string) {
		const ticketId = ($ipoTicketsSummary as any)?.[rowId]?.ticketId ?? ($ipoTicketsSummary as any)?.[rowId]?.id;
		const messages: TicketInfo = await loadTicket(ticketId);
		if (ticketViewComp === null) {
			ticketViewComp = (await import('./TicketView.svelte')).default;
		}
		showTicketMessages = false;
		await new Promise((r) => setTimeout(r, 0));
		ticketInfo = {
			data: messages,
			isAdmin,
			onExit: () => { showTicketMessages = false; },
			open: true
		};
		showTicketMessages = true;
	}

	// ── Create ticket ─────────────────────────────────────────────────────────────
	async function createNewTicket() {
		if (createTicketComp === null) {
			createTicketComp = (await import('./CreateTicket.svelte')).default;
		}
		ticketData = {
			onExit: () => { showTicketCreation = false; },
			open: true
		};
		showTicketCreation = true;
	}

	// ── Filter ────────────────────────────────────────────────────────────────────
	async function showFilterSheet() {
		if (filterSheetComp === null) {
			filterSheetComp = (await import('./FilterSheet.svelte')).default;
		}
		filterData = {
			open: true,
			onFilter: async (params: Record<string, any>) => {
				ticketLoading = true;
				ipoTicketsSummary.set(null);
const response = await fetch(`${baseURL}/api/tickets/TicketSummaries`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							...params,
							amount: selectedResultList,
							startIndex: 0
						})
					});
				if (response.ok) {
					ipoTicketsSummary.set(await response.json());
				}
				ticketLoading = false;
			}
		};
		showFilter = true;
	}

	// ── Close tickets ─────────────────────────────────────────────────────────────
	function closeTickets() {
		showCloseConfirm = true;
	}

	async function confirmCloseTickets() {
		showCloseConfirm = false;
		const selected = $_selectedDataIds;
		const closeIds: string[] = [];
		for (const key in selected) {
			const id =
				($ipoTicketsSummary as any)?.[key]?.ticketId ??
				($ipoTicketsSummary as any)?.[key]?.id;
			if (id) closeIds.push(id);
		}
		const response = await fetch(`${baseURL}/api/tickets/CloseTicket`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				ticketId: closeIds,
				resolution: { staffId: $loggedInUser?.id, staffName: userName }
			})
		});
		if (response.ok) {
			const result = await response.json();
			if (result) {
				for (const key in selected) {
					ipoTicketsSummary.update((data) => {
						if (data !== null) {
							(data as any)[key].status = 2;
							return [...data];
						}
						return data;
					});
				}
				toast.success('Ticket(s) closed successfully', { position: 'top-right' });
			}
		}
	}

	// ── Pill counts (computed from loaded data) ───────────────────────────────────
	$: trademarkPillCount = tmCategoryStats?.total ?? 0;
	$: patentPillCount = pdCategoryStats?.total ?? 0;
	$: _isTechUser = $loggedInUser?.userRoles?.includes(UserRoles.Tech) ?? false;

	function ticketTypeFor(rowId: string): string {
		const type = ($ipoTicketsSummary as any)?.[rowId]?.ticketType;
		if (type === undefined || type === null) return '—';
		const labels: Record<number, string> = {
			0: 'Process Inquiry', 1: 'App Status', 2: 'Follow Up',
			3: 'Account Access', 4: 'Payment Issue', 5: 'Others'
		};
		return labels[type] ?? '—';
	}

	// ── Mount ─────────────────────────────────────────────────────────────────────
	onMount(async () => {
		await decodeUser();
		isAdmin = hasSupportStaffRole();
		tabs = getTabsForRole();
		activeTabId = tabs.length > 0 ? tabs[0].id : '';
		if (isAdmin) activeStatusFilter = 1;
		ticketLoading = true;
		await getStats();
		await fetchTabTickets(activeTabId);
		ticketLoading = false;
	});
</script>

<Toaster />

<!-- Close confirmation dialog -->
<AlertDialog.Root bind:open={showCloseConfirm}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Close Ticket(s)?</AlertDialog.Title>
			<AlertDialog.Description>
				You are about to close {Object.values($_selectedDataIds ?? {}).filter(Boolean).length} ticket(s). This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel on:click={() => (showCloseConfirm = false)}>Cancel</AlertDialog.Cancel>
			<Button on:click={confirmCloseTickets} class="bg-red-600 hover:bg-red-700 text-white">Confirm Close</Button>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<div class="p-4">
	<!-- Header -->
	<div class="mb-4 flex items-center justify-end">
		<div class="flex gap-2">
			<!-- Filter button temporarily removed -->
			<!--
			<Button variant="outline" on:click={showFilterSheet}>
				<Icon icon="mdi:filter-outline" width="1rem" height="1rem" class="mr-1" />
				Filter
			</Button>
			-->
			<Button on:click={createNewTicket}>+ Create new Ticket</Button>
		</div>
	</div>

	<!-- Lazy-loaded panels -->
	{#if showTicketMessages && ticketViewComp}
		<svelte:component this={ticketViewComp} {...ticketInfo} />
	{/if}
	{#if showTicketCreation && createTicketComp}
		<svelte:component this={createTicketComp} {...ticketData} />
	{/if}
	{#if showFilter && filterSheetComp}
		<svelte:component this={filterSheetComp} {...filterData} />
	{/if}

	<!-- Tabs (staff only) -->
	{#if tabs.length > 0}
		<nav class="flex gap-1 border-b mb-4">
			{#each tabs as tab}
				<button
					type="button"
					class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
						{activeTabId === tab.id
							? 'border-green-700 text-green-700'
							: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
					on:click={() => onTabChange(tab.id)}
				>
					{tab.label}
				</button>
			{/each}
		</nav>
	{/if}

	<!-- Status filter pills -->
	<div class="flex flex-wrap gap-2 mb-4">
		<!-- Total -->
		<button type="button" on:click={() => getSpecific(null)}
			class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
				{activeStatusFilter === null && activeCategoryPillFilter === null ? 'bg-gray-600 text-white' : 'bg-gray-200 text-slate-700 hover:bg-gray-300'}">
			Total
			<span class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-black/20 text-[10px] font-semibold">
				{$ipoTicketStats.total ?? 0}
			</span>
		</button>
		<!-- Awaiting Staff -->
		{#if _isTechUser}
		<button type="button" on:click={() => getSpecific(1, TicketCategory.TechnicalSupport)}
					class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
						{activeStatusFilter === 1 && activeCategoryPillFilter === TicketCategory.TechnicalSupport ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}">
					Awaiting Staff
					<span class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-blue-950/30 text-[10px] font-semibold">
						{$ipoTicketStats.staff ?? 0}
					</span>
				</button>
		{:else}
		<button type="button" on:click={() => getSpecific(1)}
			class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
				{activeStatusFilter === 1 && activeCategoryPillFilter === null ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}">
			Awaiting Staff
			<span class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-blue-950/30 text-[10px] font-semibold">
				{$ipoTicketStats.staff ?? 0}
			</span>
		</button>
		{/if}
		<!-- Awaiting User -->
		<button type="button" on:click={() => getSpecific(0)}
			class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
				{activeStatusFilter === 0 && activeCategoryPillFilter === null ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}">
			Awaiting User
			<span class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-yellow-950/30 text-[10px] font-semibold">
				{$ipoTicketStats.user ?? 0}
			</span>
		</button>
		<!-- Closed -->
		<button type="button" on:click={() => getSpecific(2)}
			class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
				{activeStatusFilter === 2 && activeCategoryPillFilter === null ? 'bg-green-700 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'}">
			Closed
			<span class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-green-950/30 text-[10px] font-semibold">
				{$ipoTicketStats.closed ?? 0}
			</span>
		</button>
		<!-- Tech-only category pills -->
		{#if _isTechUser}
		<div class="w-px bg-slate-200 mx-1 self-stretch"></div>
		<button type="button" on:click={() => getSpecific(null, TicketCategory.TrademarkRegistry)}
class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
						{activeCategoryPillFilter === TicketCategory.TrademarkRegistry && activeStatusFilter === null ? 'bg-green-700 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'}">
			Trademark Tickets
<span class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-green-950/30 text-[10px] font-semibold">
				{trademarkPillCount}
			</span>
		</button>
		<button type="button" on:click={() => getSpecific(null, TicketCategory.PatentDesignRegistry)}
class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
						{activeCategoryPillFilter === TicketCategory.PatentDesignRegistry && activeStatusFilter === null ? 'bg-green-700 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'}">
			Patent & Design Tickets
			<span class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-orange-950/30 text-[10px] font-semibold">
				{patentPillCount}
			</span>
		</button>
		{/if}
	</div>

	{#if ticketLoading}
		<div class="flex items-center justify-center h-64">
			<Icon icon="line-md:loading-loop" width="2.5rem" height="2.5rem" />
		</div>
	{:else}
		<!-- Table controls -->
		<div class="flex items-center gap-2 py-2 flex-wrap">
			{#if $_selectedDataIds && Object.keys($_selectedDataIds).length > 0}
				<span class="text-sm text-muted-foreground">
					{Object.keys($_selectedDataIds).length} of {$ipoTicketsSummary?.length ?? 0} row(s) selected.
				</span>
			{/if}

			<div class="ml-auto flex gap-2 items-center">
				<!-- Rows per page -->
				<DropdownMenu.Root bind:open={showResultLengthList}>
					<DropdownMenu.Trigger asChild let:builder>
						<Button builders={[builder]} variant="outline" size="sm">
							Rows ({selectedResultList})
							<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-fit p-1">
						{#each resultLength as rl}
							<DropdownMenu.Item on:click={() => (selectedResultList = rl)}>{rl}</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<!-- Actions (rows selected) -->
				{#if $_selectedDataIds && Object.values($_selectedDataIds).some(Boolean)}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger asChild let:builder>
							<Button builders={[builder]} size="sm">
								Actions <ChevronDown class="ml-2 h-4 w-4" />
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Item on:click={closeTickets}>Close ticket(s)</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{/if}

				<!-- Column visibility -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild let:builder>
						<Button variant="outline" size="sm" builders={[builder]}>
							Columns <ChevronDown class="ml-2 h-4 w-4" />
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						{#if _flatColumns}
							{#each _flatColumns as col}
								{#if hidableCols.includes(col.id)}
									<DropdownMenu.CheckboxItem
										bind:checked={hideForId[col.id]}
										onCheckedChange={(v) => { hideForId[col.id] = v === true; }}
									>
										{col.header}
									</DropdownMenu.CheckboxItem>
								{/if}
							{/each}
						{/if}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>

		<!-- Table -->
		<div class="rounded-md border">
			<Table.Root {...spreadAttrs($_tableAttrs)}>
				<Table.Header>
					{#if tableHeaderRows}
						{#each $tableHeaderRows as headerRow}
							<Subscribe rowAttrs={headerRow.attrs()}>
								<Table.Row>
									{#each headerRow.cells as cell (cell.id)}
										<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()}>
											<Table.Head {...spreadAttrs(attrs)} class="[&:has([role=checkbox])]:pl-3">
												<Render of={cell.render()} />
											</Table.Head>
										</Subscribe>
									{/each}
								</Table.Row>
							</Subscribe>
						{/each}
					{/if}
				</Table.Header>
				<Table.Body {...spreadAttrs($_tableBodyAttrs)}>
					{#if !$ipoTicketsSummary || $ipoTicketsSummary.length === 0}
						<Table.Row>
							<Table.Cell colspan={7} class="text-center py-12 text-muted-foreground text-sm">
								No tickets found.
							</Table.Cell>
						</Table.Row>
					{:else if tablePageRows}
						{#each $tablePageRows as row (row.id)}
							<Subscribe rowAttrs={row.attrs()} let:rowAttrs>
								<Table.Row
									{...spreadAttrs(rowAttrs)}
									data-state={$_selectedDataIds?.[row.id] && 'selected'}
								>
									{#each row.cells as cell (cell.id)}
										<Subscribe attrs={cell.attrs()} let:attrs>
											<Table.Cell {...spreadAttrs(attrs)}>
												{#if cell.id === 'status'}
													<TicketTag state={parseInt(cell.render())} />
												{:else if cell.id === 'creator'}
													<span class="line-clamp-2 text-sm">{creatorNameFor(row.id)}</span>
												{:else if cell.id === 'category'}
													<span class="text-xs text-muted-foreground">{categoryFor(row.id)}</span>
												{:else if cell.id === 'ticketType'}
													<span class="text-xs text-muted-foreground">{ticketTypeFor(row.id)}</span>
												{:else if cell.id === 'lastInteraction'}
													<Render of={mapDateToString(cell.render())} />
												{:else if cell.id === 'title'}
													<div class="text-ellipsis line-clamp-2">
														<Render of={cell.render()} />
													</div>
												{:else if cell.id === 'id'}
													<Button size="sm" on:click={() => showTicket(row.id)}>View</Button>
												{:else}
													<Render of={cell.render()} />
												{/if}
											</Table.Cell>
										</Subscribe>
									{/each}
								</Table.Row>
							</Subscribe>
						{/each}
					{/if}
				</Table.Body>
			</Table.Root>
		</div>

		<!-- Pagination -->
		<div class="flex items-center justify-end space-x-4 py-4">
			<Pagination.Root
				count={$ipoTicketsSummary?.length ?? 0}
				perPage={selectedResultList}
				let:pages
				let:currentPage
			>
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.PrevButton on:click={() => ($_pageIndex = $_pageIndex - 1)} />
					</Pagination.Item>
					{#each pages as page (page.key)}
						{#if page.type === 'ellipsis'}
							<Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
						{:else}
							<Pagination.Item>
								<Pagination.Link
									{page}
									isActive={currentPage == page.value}
									on:click={() => ($_pageIndex = page.value - 1)}
								>
									{page.value}
								</Pagination.Link>
							</Pagination.Item>
						{/if}
					{/each}
					<Pagination.Item>
						<Pagination.NextButton on:click={() => ($_pageIndex = $_pageIndex + 1)} />
					</Pagination.Item>
				</Pagination.Content>
			</Pagination.Root>
		</div>
	{/if}
</div>

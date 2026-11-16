<script lang="ts">
	import {
		baseURL,
		decodeUser,
		type TicketInfo,
		TicketStates,
		type TicketSummary,
		type TicketReadResponse,
		UserRoles,
		TicketCategory,

        ApplicationType

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
	import { Input } from '$lib/components/ui/input';
	import { ChevronsUpDown } from 'lucide-svelte';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { loggedInUser, ipoTicketsSummary, ipoTicketStats } from '$lib/store';
	import Icon from '@iconify/svelte';
	import { mapDateToString } from '../components/dashboardutils';
	import { mapCategoryToString, ticketStatsQuery, applyTicketReadResponse, isNormalTicketUser, ticketHasUnreadActivity } from './supportutils';
	import { toast } from 'svelte-sonner';
	import { Toaster } from '$lib/components/ui/sonner';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Table from '$lib/components/ui/table';
	import * as Pagination from '$lib/components/ui/pagination';
	import { authFetch } from '$lib/utils/authFetch';

  // ── Role helpers ──────────────────────────────────────────────────────────────
  const SUPPORT_STAFF_ROLES = [
    UserRoles.Tech,
    UserRoles.SuperAdmin,
    UserRoles.TrademarkSupport,
    UserRoles.PatentDesignSupport,
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
    return hasRole(UserRoles.Tech) || hasRole(UserRoles.SuperAdmin);
  }
  function hasAnyRole(roles: UserRoles[]): boolean {
    return roles.some((role) => hasRole(role));
  }
  const UNIT_OFFICER_ROLES = [
    UserRoles.TrademarkSearch,
    UserRoles.TrademarkExaminer,
    UserRoles.TrademarkOpposition,
    UserRoles.TrademarkAcceptance,
    UserRoles.TrademarkCertification,
    UserRoles.TrademarkPublication,
    UserRoles.TrademarkRegistrar,
    UserRoles.ActingTrademarkRegistrar,
    UserRoles.PatentDesignRegistrar,
    UserRoles.ActingPatentDesignRegistrar,
    UserRoles.PatentSearch,
    UserRoles.PatentExaminer,
    UserRoles.PatentCertification,
    UserRoles.AppealExaminer,
    UserRoles.DesignSearch,
    UserRoles.DesignExaminer,
    UserRoles.DesignCertification,
    UserRoles.TrademarkStaff,
    UserRoles.PatentStaff,
    UserRoles.DesignStaff,
  ];
  function isStrictSupportOfficer(): boolean {
    return isTrademarkSupport() || isPatentDesignSupport();
  }
  function isUnitOfficer(): boolean {
    return hasAnyRole(UNIT_OFFICER_ROLES);
  }
  function shouldCreateTechnicalTicketOnly(): boolean {
    return isStrictSupportOfficer() || isUnitOfficer();
  }
  function canAccessIpoSupport(): boolean {
    return (
      hasRole(UserRoles.User) ||
      hasRole(UserRoles.PermSec) ||
      isTechSupport() ||
      isStrictSupportOfficer() ||
      isUnitOfficer()
    );
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
      return [
        {
          id: "tech",
          label: "Technical Support",
          category: TicketCategory.TechnicalSupport,
          isEscalation: false,
        },
        {
          id: "tm",
          label: "Trademark Registry",
          category: TicketCategory.TrademarkRegistry,
          isEscalation: false,
        },
        {
          id: "pd",
          label: "Patent & Design Registry",
          category: TicketCategory.PatentDesignRegistry,
          isEscalation: false,
        },
      ];
    }
    if (isTrademarkSupport()) {
      return [
        {
          id: "tm",
          label: "Trademark Registry",
          category: TicketCategory.TrademarkRegistry,
          isEscalation: false,
        },
      ];
    }
    if (isPatentDesignSupport()) {
      return [
        {
          id: "pd",
          label: "Patent & Design Registry",
          category: TicketCategory.PatentDesignRegistry,
          isEscalation: false,
        },
      ];
    }
    return [];
  }

	// ── State ─────────────────────────────────────────────────────────────────────
	let tabs: TabDef[] = [];
	let activeTabId: string = '';
	let isAdmin: boolean = false;
	let activeStatusFilter: number | null = null;
	let activeCategoryPillFilter: TicketCategory | null = null;
	let activeQueueMode: 'normal' | 'trademarkTechnical' | 'patentDesignTechnical' = 'normal';
	let specialQueueStats: Record<string, number> = {};
	let showCloseConfirm: boolean = false;
	let isResolving = false;
	let ticketLoading: boolean = false;
	let unreadTicketCount = 0;
	let listRequestVersion = 0;
	let statsRequestVersion = 0;
	let ticketOpenVersion = 0;
	let disposed = false;
	let backgroundRefreshing = false;
	let refreshPending = false;
	let refreshError = '';
	let loadingVersion = 0;
	let selectedResultList: number = 10;
	let showResultLengthList: boolean = false;
	const resultLength = [10, 15, 20, 25, 30, 35, 40, 45, 50, 75, 100];
	const STATUS_SORT_ORDER: Record<number, number> = { 1: 0, 3: 1, 0: 2, 4: 3, 2: 4 };
	const FULL_SUMMARY_FETCH_LIMIT = 100000;

  const userName =
    ($loggedInUser?.firstName ?? "") + " " + ($loggedInUser?.lastName ?? "");

  // ── Table state ───────────────────────────────────────────────────────────────
  let hidableCols: string[] = [
    "lastInteraction",
    "title",
    "creator",
    "status",
    "category",
    "ticketType",
  ];
  let hideForId: Record<string, boolean> = {};
  let currentPageNumber: number = 1;

  // The table is created once and fed through this store, so refreshing the data
  // (e.g. after viewing or replying to a ticket) keeps the current page.
  const tableData = writable<any[]>([]);

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
  let searchQuery: string = "";
  let activeSearchTerm: string = "";

	$: showTechSpecialQueues = isTechSupport() && activeTabId === 'tech';
	$: showInProgressFilter = isNormalTicketUser($loggedInUser?.userRoles ?? []) || activeQueueMode !== 'normal' || tabs.some((tab) => tab.id === activeTabId && tab.category === TicketCategory.TechnicalSupport);

	// ── Reactive hidden columns ───────────────────────────────────────────────────
	$: {
		if (_hiddenColumnIds) {
			$_hiddenColumnIds = Object.entries(hideForId)
				.filter(([, hide]) => !hide)
				.map(([id]) => id);
		}
	}

	// ── Table rebuild when data changes ──────────────────────────────────────────
	const tableTickets = writable<any[]>([]);
	$: tableTickets.set(Array.isArray($ipoTicketsSummary) ? $ipoTicketsSummary : []);
		const table = createTable(tableTickets, {
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
      accessor: "_id",
      header: (_, { pluginStates }) => {
        const { allPageRowsSelected } = pluginStates.select;
        return createRender(DataTableCheckbox, {
          checked: allPageRowsSelected,
        });
      },
      cell: ({ row }, { pluginStates }) => {
        const { getRowState } = pluginStates.select;
        const { isSelected } = getRowState(row);
        return createRender(DataTableCheckbox, { checked: isSelected });
      },
      plugins: { filter: { exclude: true } },
    }),
    table.column({ accessor: "lastInteraction", header: "Last Activity" }),
    table.column({ accessor: "creator", header: "Creator" }),
    table.column({ accessor: "title", header: "Title" }),
    table.column({
      accessor: "category",
      header: "Category",
      plugins: { filter: { exclude: true } },
    }),
    table.column({
      accessor: "ticketType",
      header: "Ticket Type",
      plugins: { filter: { exclude: true } },
    }),
    table.column({ accessor: "status", header: "Status" }),
    table.column({
      accessor: "id",
      header: "",
      plugins: { filter: { exclude: true } },
    }),
  ]);

  const {
    headerRows: tableHeaderRows,
    pageRows: tablePageRows,
    tableAttrs: _tableAttrs,
    tableBodyAttrs: _tableBodyAttrs,
    flatColumns: _flatColumns,
    pluginStates,
  } = table.createViewModel(columns);

  const { pageIndex: _pageIndex, pageSize: _pageSize } = pluginStates.page;
  const { hiddenColumnIds: _hiddenColumnIds } = pluginStates.hide;
  const { selectedDataIds: _selectedDataIds } = pluginStates.select;

  hideForId = Object.fromEntries(
    (_flatColumns as any[]).map((col: any) => [col.id, true]),
  );

  $: tableData.set(
    Array.isArray($ipoTicketsSummary) ? ($ipoTicketsSummary as any[]) : [],
  );
  $: $_pageSize = selectedResultList;
  $: $_pageIndex = currentPageNumber - 1;
  $: hideForId["creator"] = isAdmin;
  $: $_hiddenColumnIds = Object.entries(hideForId)
    .filter(([, hide]) => !hide)
    .map(([id]) => id);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function spreadAttrs(value: unknown): Record<string, unknown> {
    return (value ?? {}) as Record<string, unknown>;
  }

  function creatorNameFor(rowId: string): string {
    return ($ipoTicketsSummary as any)?.[rowId]?.creator?.name ?? "";
  }

	function categoryFor(rowId: string): string {
		const cat = ($ipoTicketsSummary as any)?.[rowId]?.category;
		if (cat === undefined || cat === null) return '—';
		return mapCategoryToString(cat as TicketCategory);
	}

	function ticketFor(rowId: string): TicketSummary | undefined {
		return $ipoTicketsSummary?.[Number(rowId)];
	}

	function currentViewKey(): string {
		return JSON.stringify([activeTabId, activeQueueMode, activeStatusFilter, activeCategoryPillFilter, activeSearchTerm, $loggedInUser?.creatorId]);
	}

	function currentQueueBody(status: number | null = activeStatusFilter): Record<string, any> {
		const body = getTicketSummaryBody(status);
		if (activeCategoryPillFilter !== null) body.category = activeCategoryPillFilter;
		return body;
	}

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  function getActiveTabCategory(): TicketCategory | null {
    return tabs.find((tab) => tab.id === activeTabId)?.category ?? null;
  }

  function getSpecialRegistryCategory(): TicketCategory | null {
    if (activeQueueMode === "trademarkTechnical")
      return TicketCategory.TrademarkRegistry;
    if (activeQueueMode === "patentDesignTechnical")
      return TicketCategory.PatentDesignRegistry;
    return null;
  }

  function withFullSummaryPage(body: Record<string, any>): Record<string, any> {
    return { ...body, amount: FULL_SUMMARY_FETCH_LIMIT, startIndex: 0 };
  }

	function getTicketSummaryBody(status: number | null = activeStatusFilter): Record<string, any> {
		const specialRegistryCategory = getSpecialRegistryCategory();
		const activeTabCategory = getActiveTabCategory();
		if (specialRegistryCategory !== null) {
			const body: Record<string, any> = {
				creatorId: 'null',
				category: TicketCategory.TechnicalSupport,
				registryCategory: specialRegistryCategory,
				raisedByRegistryStaff: true
			};
			if (status !== null) body.status = status;
			return withFullSummaryPage(body);
		}

    if (isTechSupport()) {
      const body: Record<string, any> = {
        creatorId: "null",
        category: activeTabCategory ?? TicketCategory.TechnicalSupport,
      };
      if (
        (activeTabCategory ?? TicketCategory.TechnicalSupport) ===
        TicketCategory.TechnicalSupport
      ) {
        body.raisedByRegistryStaff = false;
      }
      if (status !== null) body.status = status;
      return withFullSummaryPage(body);
    }
    if (isTrademarkSupport()) {
      const body: Record<string, any> = {
        creatorId: "null",
        category: TicketCategory.TrademarkRegistry,
      };
      if (status !== null) body.status = status;
      return withFullSummaryPage(body);
    }
    if (isPatentDesignSupport()) {
      const body: Record<string, any> = {
        creatorId: "null",
        category: TicketCategory.PatentDesignRegistry,
      };
      if (status !== null) body.status = status;
      return withFullSummaryPage(body);
    }

		// Normal users only see their own tickets; scope by the same creatorId used on creation
		const body: Record<string, any> = { creatorId: $loggedInUser?.creatorId };
		if (status !== null) body.status = status;
		return withFullSummaryPage(body);
	}

  function sortTicketSummaries(raw: any): any {
    return Array.isArray(raw)
      ? [...raw].sort((a: any, b: any) => {
          const statusA = STATUS_SORT_ORDER[a?.status] ?? 99;
          const statusB = STATUS_SORT_ORDER[b?.status] ?? 99;
          if (statusA !== statusB) return statusA - statusB;
          const dateA = a?.lastInteraction
            ? new Date(a.lastInteraction).getTime()
            : 0;
          const dateB = b?.lastInteraction
            ? new Date(b.lastInteraction).getTime()
            : 0;
          return dateA - dateB;
        })
      : raw;
  }

  async function fetchTicketSummaries(
    body: Record<string, any>,
  ): Promise<any[]> {
    const response = await authFetch(`${baseURL}/api/tickets/TicketSummaries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

	function summarizeTickets(tickets: any[]) {
		return {
			total: tickets.length,
			staff: tickets.filter((ticket) => ticket?.status === TicketStates.awaitingStaff).length,
			user: tickets.filter((ticket) => ticket?.status === TicketStates.awaitingUser).length,
			closed: tickets.filter((ticket) => ticket?.status === TicketStates.closed).length,
			inProgress: tickets.filter((ticket) => ticket?.status === TicketStates.inProgress).length,
			resolved: tickets.filter((ticket) => ticket?.status === TicketStates.resolved).length,
			unreadTickets: tickets.filter(ticketHasUnreadActivity).length
		};
	}

  function getSearchField(term: string): Record<string, string> {
    return /^TKT[-\w]*/i.test(term)
      ? { ticketNumber: term }
      : { fileNumber: term };
  }

	function getSearchRequest(): Record<string, any> | null {
		const term = activeSearchTerm.trim();
		if (!term) return null;
		return getSearchField(term);
	}

	async function fetchSearchTickets(status: number | null = activeStatusFilter): Promise<any[]> {
		const body = getSearchRequest();
		if (body === null) return [];
		const response = await authFetch(`${baseURL}/api/tickets/Search`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (!response.ok) throw new Error('Unable to search tickets.');
		const data = await response.json();
		const tickets = Array.isArray(data) ? data : [];
		return status === null ? tickets : tickets.filter((ticket) => ticket?.status === status);
	}

	async function refreshSearchResults(status: number | null = activeStatusFilter) {
		const requestVersion = ++listRequestVersion;
		const viewKey = currentViewKey();
		const allMatches = await fetchSearchTickets(null);
		if (disposed || requestVersion !== listRequestVersion || viewKey !== currentViewKey()) return;
		const matches = status === null ? allMatches : allMatches.filter((ticket) => ticket.status === status);
		ipoTicketStats.set(summarizeTickets(allMatches));
		unreadTicketCount = allMatches.filter(ticketHasUnreadActivity).length;
		ipoTicketsSummary.set(sortTicketSummaries(matches));
	}

	async function fetchQueueStats(body: Record<string, any>): Promise<Record<string, number>> {
		const params = ticketStatsQuery(body);
		const response = await authFetch(`${baseURL}/api/tickets/GetStats?${params}`);
		if (!response.ok) throw new Error('Unable to load ticket counts.');
		return await response.json();
	}

	async function getStats() {
		const requestVersion = ++statsRequestVersion;
		const viewKey = currentViewKey();
		try {
			const body = currentQueueBody(null);
			const [stats, inProgressStats] = await Promise.all([
				fetchQueueStats(body),
				fetchQueueStats(currentQueueBody(TicketStates.inProgress))
			]);
			if (disposed || requestVersion !== statsRequestVersion || viewKey !== currentViewKey()) return;
			ipoTicketStats.set(stats);
			unreadTicketCount = inProgressStats.unreadTickets ?? 0;
			refreshError = '';
		} catch {
			if (!disposed && requestVersion === statsRequestVersion) refreshError = 'Unable to load ticket counts. Retrying automatically.';
		}
	}

  async function getSpecialQueueCount(
    registryCategory: TicketCategory,
  ): Promise<number> {
    try {
      return (
        await fetchQueueStats({
          creatorId: "null",
          category: TicketCategory.TechnicalSupport,
          registryCategory,
          raisedByRegistryStaff: true,
        })
      ).total;
    } catch {
      toast.error("Unable to load technical queue counts.", {
        position: "top-right",
      });
      return 0;
    }
  }

  async function getSpecialQueueStats() {
    if (isTechSupport()) {
      const [trademark, patentDesign] = await Promise.all([
        getSpecialQueueCount(TicketCategory.TrademarkRegistry),
        getSpecialQueueCount(TicketCategory.PatentDesignRegistry),
      ]);
      specialQueueStats = { trademark, patentDesign };
      return;
    }
    if (isTrademarkSupport()) {
      specialQueueStats = {
        technical: await getSpecialQueueCount(TicketCategory.TrademarkRegistry),
      };
      return;
    }
    if (isPatentDesignSupport()) {
      specialQueueStats = {
        technical: await getSpecialQueueCount(
          TicketCategory.PatentDesignRegistry,
        ),
      };
      return;
    }
    specialQueueStats = {};
  }

	async function fetchTabTickets(tabId: string) {
		const requestVersion = ++listRequestVersion;
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


		const body = currentQueueBody();
		const viewKey = currentViewKey();

		const response = await authFetch(`${baseURL}/api/tickets/TicketSummaries`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (response.ok) {
			const raw = await response.json();
			if (disposed || requestVersion !== listRequestVersion || viewKey !== currentViewKey()) return;
			ipoTicketsSummary.set(sortTicketSummaries(raw));
		} else throw new Error('Unable to refresh tickets.');
	}

	async function refreshActivity() {
		listRequestVersion += 1;
		statsRequestVersion += 1;
		if (disposed) return;
		if (backgroundRefreshing) {
			refreshPending = true;
			return;
		}
		backgroundRefreshing = true;
		refreshError = '';
		try {
			do {
				refreshPending = false;
				if (activeSearchTerm.trim()) await refreshSearchResults();
				else await Promise.all([getStats(), fetchTabTickets(activeTabId)]);
			} while (refreshPending && !disposed);
		} catch {
			if (!disposed) refreshError = 'Unable to refresh ticket activity. Retrying automatically.';
		} finally {
			backgroundRefreshing = false;
		}
	}

	function applyReadResponse(result: TicketReadResponse) {
		listRequestVersion += 1;
		statsRequestVersion += 1;
		ipoTicketsSummary.update((tickets) => tickets?.map((ticket) => {
			if ((ticket.ticketId ?? ticket.id) !== result.ticketId) return ticket;
			return applyTicketReadResponse(ticket, result);
		}) ?? tickets);
	}

	async function onTabChange(tabId: string) {
		activeTabId = tabId;
		activeQueueMode = 'normal';
		activeSearchTerm = '';
		searchQuery = '';
		activeStatusFilter = isTechSupport() || isAdmin ? 1 : null;
		activeCategoryPillFilter = null;
		ipoTicketsSummary.set(null);
		await getSpecific(activeStatusFilter);
	}

	async function setQueueMode(mode: 'normal' | 'trademarkTechnical' | 'patentDesignTechnical') {
		activeQueueMode = mode;
		activeSearchTerm = '';
		searchQuery = '';
		activeStatusFilter = null;
		activeCategoryPillFilter = null;
		ipoTicketsSummary.set(null);
		await getSpecific(activeStatusFilter);
	}

	async function getSpecific(status: number | null, categoryOverride?: TicketCategory | null) {
		const requestVersion = ++loadingVersion;
		activeStatusFilter = status;
		activeCategoryPillFilter = categoryOverride !== undefined ? (categoryOverride ?? null) : null;
		ticketLoading = true;
		refreshError = '';
		$_pageIndex = 0;
		$_selectedDataIds = {};
		try {
		if (activeSearchTerm.trim()) {
			await refreshSearchResults(status);
		} else {
			await getSpecialQueueStats();
			await getStats();
			await fetchTabTickets(activeTabId);
		}
		} catch {
			if (!disposed && requestVersion === loadingVersion) {
				refreshError = 'Unable to refresh tickets. Retrying automatically.';
				toast.error('Unable to refresh tickets.', { position: 'top-right' });
			}
		} finally {
			if (!disposed && requestVersion === loadingVersion) ticketLoading = false;
		}
	}

	async function searchTickets() {
		const term = searchQuery.trim();
		if (!term) {
			toast.error('Enter a ticket number or file number.', { position: 'top-right' });
			return;
		}
		activeSearchTerm = term;
		activeStatusFilter = null;
		activeCategoryPillFilter = null;
		ipoTicketsSummary.set(null);
		await getSpecific(null);
	}

	async function clearSearch() {
		activeSearchTerm = '';
		searchQuery = '';
		ipoTicketsSummary.set(null);
		await getSpecific(activeStatusFilter);
	}

	// ── Ticket view ───────────────────────────────────────────────────────────────
	async function loadTicket(id: string) {
		try {
		const response = await authFetch(`${baseURL}/api/tickets/${id}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		if (response.ok) return await response.json();
		return null;
		} catch {
			return null;
		}
	}

	async function showTicket(rowId: string) {
		const requestVersion = ++ticketOpenVersion;
		const ticketId = ($ipoTicketsSummary as any)?.[rowId]?.ticketId ?? ($ipoTicketsSummary as any)?.[rowId]?.id;
		const messages: TicketInfo = await loadTicket(ticketId);
		if (disposed || requestVersion !== ticketOpenVersion) return;
		if (!messages) {
			toast.error('Ticket unavailable or access denied.', { position: 'top-right' });
			return;
		}
		if (ticketViewComp === null) {
			ticketViewComp = (await import('./TicketView.svelte')).default;
		}
		showTicketMessages = false;
		await new Promise((r) => setTimeout(r, 0));
		if (disposed || requestVersion !== ticketOpenVersion) return;
		ticketInfo = {
			data: messages,
			isAdmin,
			onRead: applyReadResponse,
			onChanged: () => { void refreshActivity(); },
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
			onCreated: () => {
				if (!hasSupportStaffRole()) {
					activeSearchTerm = '';
					searchQuery = '';
					activeCategoryPillFilter = null;
					void getSpecific(TicketStates.awaitingStaff);
				} else {
					void refreshActivity();
				}
				window.dispatchEvent(new Event('ipo-support-activity'));
			},
			open: true,
			technicalOnly: shouldCreateTechnicalTicketOnly(),
			requireFileNumber: shouldCreateTechnicalTicketOnly()
		};
		showTicketCreation = true;
	}

  // ── Filter ────────────────────────────────────────────────────────────────────
  async function showFilterSheet() {
    if (filterSheetComp === null) {
      filterSheetComp = (await import("./FilterSheet.svelte")).default;
    }
    filterData = {
      open: true,
      onFilter: async (params: Record<string, any>) => {
        ticketLoading = true;
        currentPageNumber = 1;
        ipoTicketsSummary.set(null);
        const response = await authFetch(
          `${baseURL}/api/tickets/TicketSummaries`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...params,
              amount: selectedResultList,
              startIndex: 0,
            }),
          },
        );
        if (response.ok) {
          ipoTicketsSummary.set(await response.json());
        }
        ticketLoading = false;
      },
    };
    showFilter = true;
  }

  // ── Close tickets ─────────────────────────────────────────────────────────────
  function closeTickets() {
    if (isResolving) return;
    showCloseConfirm = true;
  }

  async function confirmCloseTickets() {
    if (isResolving) return;
    showCloseConfirm = false;
    const selected = $_selectedDataIds;
    const closeIds: string[] = [];
    for (const key in selected) {
      if (!selected[key]) continue;
      const ticket = ($ipoTicketsSummary as any)?.[key];
      if (
        !ticket ||
        ticket.status === TicketStates.resolved ||
        ticket.status === TicketStates.closed
      )
        continue;
      const id = ticket.ticketId ?? ticket.id;
      if (id) closeIds.push(id);
    }
    if (!closeIds.length) {
      toast.error("Select an active ticket to resolve.", {
        position: "top-right",
      });
      return;
    }
    isResolving = true;
    try {
      const response = await authFetch(`${baseURL}/api/tickets/CloseTicket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: closeIds,
          resolution: { staffId: $loggedInUser?.id, staffName: userName },
        }),
      });
      if (!response.ok)
        throw new Error(
          (await response.text()) || "Unable to resolve tickets.",
        );
      if (!(await response.json()))
        throw new Error("Unable to resolve tickets.");
      $_selectedDataIds = {};
      await getSpecific(activeStatusFilter, activeCategoryPillFilter, false);
      toast.success("Ticket(s) resolved successfully", {
        position: "top-right",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to resolve tickets.",
        { position: "top-right" },
      );
    } finally {
      isResolving = false;
    }
  }

  // ── Pill counts (computed from loaded data) ───────────────────────────────────
  function ticketTypeFor(rowId: string): string {
    const type = ($ipoTicketsSummary as any)?.[rowId]?.ticketType;
    const applicationType = ($ipoTicketsSummary as any)?.[rowId]
      ?.applicationType;
    if (type === undefined || type === null) return "—";
    if (applicationType === ApplicationType.Certificate) return "Certificate";
    const labels: Record<number, string> = {
      0: "Process Inquiry",
      1: "App Status",
      2: "Follow Up",
      3: "Account Access",
      4: "Payment Issue",
      5: "Others",
    };
    return labels[type] ?? "—";
  }

	// ── Mount ─────────────────────────────────────────────────────────────────────
	onMount(async () => {
		await decodeUser();
		if (!$loggedInUser) return;
		if (!canAccessIpoSupport()) {
			await goto('/home/dashboard');
			return;
		}
		isAdmin = hasSupportStaffRole();
		tabs = getTabsForRole();
		activeTabId = tabs.length > 0 ? tabs[0].id : '';
		if (isAdmin) activeStatusFilter = 1;
		await getSpecific(activeStatusFilter);
	});

	onMount(() => {
		const poll = () => {
			if (document.visibilityState === 'visible' && $loggedInUser && !ticketLoading && !isResolving && !Object.values($_selectedDataIds ?? {}).some(Boolean)) void refreshActivity();
		};
		const timer = window.setInterval(poll, 15000);
		document.addEventListener('visibilitychange', poll);
		window.addEventListener('focus', poll);
		return () => {
			disposed = true;
			window.clearInterval(timer);
			document.removeEventListener('visibilitychange', poll);
			window.removeEventListener('focus', poll);
		};
	});
</script>

<Toaster />

<!-- Close confirmation dialog -->
<AlertDialog.Root bind:open={showCloseConfirm}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Resolve Ticket(s)?</AlertDialog.Title>
      <AlertDialog.Description>
        Selected active tickets will be marked Resolved. They close
        automatically after 24 hours unless the ticket creator replies.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel on:click={() => (showCloseConfirm = false)}
        >Cancel</AlertDialog.Cancel
      >
      <Button
        disabled={isResolving}
        on:click={confirmCloseTickets}
        class="bg-green-700 hover:bg-green-800 text-white"
        >Confirm Resolve</Button
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<div class="p-4">
	<div class="mb-3 flex flex-wrap items-center gap-2" aria-live="polite">
		<span
			class="inline-flex min-h-7 items-center gap-2 rounded px-2 py-1 text-xs font-medium {unreadTicketCount > 0 ? 'bg-red-50 text-red-800' : 'text-slate-500'}"
			title={activeSearchTerm.trim() ? 'Unread replies on In Progress tickets in these search results' : 'Unread replies on In Progress tickets in this queue'}
		>
			<Icon icon="mdi:email-outline" width="1rem" height="1rem" aria-hidden="true" />
			{#if unreadTicketCount > 0}
				In Progress &middot; Unread replies
				<span class="inline-flex h-5 min-w-5 items-center justify-center rounded bg-red-100 px-1.5 text-[10px] font-semibold tabular-nums">{unreadTicketCount}</span>
			{:else}
				No unread In Progress replies
			{/if}
		</span>
		{#if refreshError}<span class="text-xs text-red-700" role="status">{refreshError}</span>{/if}
	</div>
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
    <button
      type="button"
      on:click={() => getSpecific(null)}
      class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
				{activeStatusFilter === null && activeCategoryPillFilter === null
        ? 'bg-gray-600 text-white'
        : 'bg-gray-200 text-slate-700 hover:bg-gray-300'}"
    >
      Total
      <span
        class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-black/20 text-[10px] font-semibold"
      >
        {$ipoTicketStats.total ?? 0}
      </span>
    </button>
    <!-- Awaiting Staff -->
    <button
      type="button"
      on:click={() => getSpecific(1)}
      class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
				{activeStatusFilter === 1 && activeCategoryPillFilter === null
        ? 'bg-blue-600 text-white'
        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}"
    >
      Awaiting Staff
      <span
        class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-blue-950/30 text-[10px] font-semibold"
      >
        {$ipoTicketStats.staff ?? 0}
      </span>
    </button>
    <!-- Awaiting User -->
    <button
      type="button"
      on:click={() => getSpecific(0)}
      class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
				{activeStatusFilter === 0 && activeCategoryPillFilter === null
        ? 'bg-yellow-600 text-white'
        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}"
    >
      Awaiting User
      <span
        class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-yellow-950/30 text-[10px] font-semibold"
      >
        {$ipoTicketStats.user ?? 0}
      </span>
    </button>
    {#if showInProgressFilter}
      <button
        type="button"
        on:click={() => getSpecific(TicketStates.inProgress)}
        class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
				{activeStatusFilter === TicketStates.inProgress
          ? 'bg-cyan-700 text-white'
          : 'bg-cyan-100 text-cyan-900 hover:bg-cyan-200'}"
      >
        In Progress
        <span
          class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-black/20 text-[10px] font-semibold"
          >{$ipoTicketStats.inProgress ?? 0}</span
        >
      </button>
    {/if}
    <button
      type="button"
      on:click={() => getSpecific(TicketStates.resolved)}
      class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
				{activeStatusFilter === TicketStates.resolved
        ? 'bg-emerald-700 text-white'
        : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'}"
    >
      Resolved
      <span
        class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-black/20 text-[10px] font-semibold"
        >{$ipoTicketStats.resolved ?? 0}</span
      >
    </button>
    <!-- Closed -->
    <button
      type="button"
      on:click={() => getSpecific(2)}
      class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
				{activeStatusFilter === 2 && activeCategoryPillFilter === null
        ? 'bg-green-700 text-white'
        : 'bg-green-100 text-green-800 hover:bg-green-200'}"
    >
      Closed
      <span
        class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-green-950/30 text-[10px] font-semibold"
      >
        {$ipoTicketStats.closed ?? 0}
      </span>
    </button>

    {#if activeSearchTerm.trim()}
      <span class="self-center text-xs text-slate-500"
        >Counts reflect up to 100 search matches.</span
      >
    {/if}
    {#if showTechSpecialQueues}
      <span class="h-6 border-l border-slate-300 mx-1"></span>
      <button
        type="button"
        on:click={() =>
          setQueueMode(
            activeQueueMode === "trademarkTechnical"
              ? "normal"
              : "trademarkTechnical",
          )}
        class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
					{activeQueueMode === 'trademarkTechnical'
          ? 'bg-emerald-700 text-white'
          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}"
      >
        Trademark
        <span
          class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-emerald-950/30 text-[10px] font-semibold"
        >
          {specialQueueStats.trademark ?? 0}
        </span>
      </button>
      <button
        type="button"
        on:click={() =>
          setQueueMode(
            activeQueueMode === "patentDesignTechnical"
              ? "normal"
              : "patentDesignTechnical",
          )}
        class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
					{activeQueueMode === 'patentDesignTechnical'
          ? 'bg-emerald-700 text-white'
          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}"
      >
        Patent & Design
        <span
          class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-emerald-950/30 text-[10px] font-semibold"
        >
          {specialQueueStats.patentDesign ?? 0}
        </span>
      </button>
    {:else if isTrademarkSupport() || isPatentDesignSupport()}
      <span class="h-6 border-l border-slate-300 mx-1"></span>
      <button
        type="button"
        on:click={() =>
          setQueueMode(
            activeQueueMode === "normal"
              ? isTrademarkSupport()
                ? "trademarkTechnical"
                : "patentDesignTechnical"
              : "normal",
          )}
        class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
					{activeQueueMode !== 'normal'
          ? 'bg-emerald-700 text-white'
          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}"
      >
        Technical
        <span
          class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-emerald-950/30 text-[10px] font-semibold"
        >
          {specialQueueStats.technical ?? 0}
        </span>
      </button>
    {/if}
  </div>

  {#if ticketLoading}
    <div class="flex items-center justify-center h-64">
      <Icon icon="line-md:loading-loop" width="2.5rem" height="2.5rem" />
    </div>
  {:else}
    <form
      class="flex flex-col gap-2 py-2 sm:flex-row sm:items-center"
      on:submit|preventDefault={searchTickets}
    >
      <div class="relative w-full sm:max-w-md">
        <Icon
          icon="mdi:magnify"
          width="1rem"
          height="1rem"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <Input
          class="pl-9"
          placeholder="Search ticket number or file number"
          bind:value={searchQuery}
        />
      </div>
      <div class="flex gap-2">
        <Button type="submit" size="sm">Search</Button>
        {#if activeSearchTerm}
          <Button
            type="button"
            variant="outline"
            size="sm"
            on:click={clearSearch}>Clear</Button
          >
        {/if}
      </div>
      {#if activeSearchTerm}
        <p class="text-xs text-slate-500 sm:ml-2">
          Showing search results for <span class="font-semibold text-slate-700"
            >{activeSearchTerm}</span
          >
        </p>
      {/if}
    </form>

    <!-- Table controls -->
    <div class="flex items-center gap-2 py-2 flex-wrap">
      {#if $_selectedDataIds && Object.keys($_selectedDataIds).length > 0}
        <span class="text-sm text-muted-foreground">
          {Object.keys($_selectedDataIds).length} of {$ipoTicketsSummary?.length ??
            0} row(s) selected.
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
              <DropdownMenu.Item on:click={() => (selectedResultList = rl)}
                >{rl}</DropdownMenu.Item
              >
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
              <DropdownMenu.Item disabled={isResolving} on:click={closeTickets}
                >Resolve ticket(s)</DropdownMenu.Item
              >
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
                    onCheckedChange={(v) => {
                      hideForId[col.id] = v === true;
                    }}
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
                    <Subscribe
                      attrs={cell.attrs()}
                      let:attrs
                      props={cell.props()}
                    >
                      <Table.Head
                        {...spreadAttrs(attrs)}
                        class="[&:has([role=checkbox])]:pl-3"
                      >
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
              <Table.Cell
                colspan={7}
                class="text-center py-12 text-muted-foreground text-sm"
              >
                No tickets found.
              </Table.Cell>
            </Table.Row>
          {:else if tablePageRows}
            {#each $tablePageRows as row (row.id)}
              <Subscribe rowAttrs={row.attrs()} let:rowAttrs>
                <Table.Row
                  {...spreadAttrs(rowAttrs)}
                  data-state={$_selectedDataIds?.[row.id] && "selected"}
                >
                  {#each row.cells as cell (cell.id)}
                    <Subscribe attrs={cell.attrs()} let:attrs>
                      <Table.Cell {...spreadAttrs(attrs)}>
                        {#if cell.id === "status"}
                          <TicketTag state={parseInt(cell.render())} />
													{#if ticketHasUnreadActivity(ticketFor(row.id))}
														<span class="mt-1 inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-800">
															<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" aria-hidden="true"></span>
															New reply{ticketFor(row.id)?.unreadCount ? ` (${ticketFor(row.id)?.unreadCount})` : ''}
														</span>
													{/if}
                        {:else if cell.id === "creator"}
                          <span class="line-clamp-2 text-sm"
                            >{creatorNameFor(row.id)}</span
                          >
                        {:else if cell.id === "category"}
                          <span class="text-xs text-muted-foreground"
                            >{categoryFor(row.id)}</span
                          >
                        {:else if cell.id === "ticketType"}
                          <span class="text-xs text-muted-foreground"
                            >{ticketTypeFor(row.id)}</span
                          >
                        {:else if cell.id === "lastInteraction"}
                          <Render of={mapDateToString(cell.render())} />
                        {:else if cell.id === "title"}
                          <div class="text-ellipsis line-clamp-2">
                            <Render of={cell.render()} />
                          </div>
                        {:else if cell.id === "id"}
                          <Button size="sm" on:click={() => showTicket(row.id)}
                            >View</Button
                          >
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
        bind:page={currentPageNumber}
        let:pages
        let:currentPage
      >
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.PrevButton />
          </Pagination.Item>
          {#each pages as page (page.key)}
            {#if page.type === "ellipsis"}
              <Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
            {:else}
              <Pagination.Item>
                <Pagination.Link {page} isActive={currentPage == page.value}>
                  {page.value}
                </Pagination.Link>
              </Pagination.Item>
            {/if}
          {/each}
          <Pagination.Item>
            <Pagination.NextButton />
          </Pagination.Item>
        </Pagination.Content>
      </Pagination.Root>
    </div>
  {/if}
</div>

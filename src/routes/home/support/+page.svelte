<script lang="ts">
	import type { PageServerData } from '../../../../.svelte-kit/types/src/routes/$types';
	import {
		baseURL,
		decodeUser,
		type TicketInfo,
		TicketStates,
		type TicketSummary,
		UserRoles,
		UserTypes
	} from '$lib/helpers';
	import { createRender, createTable, Render, Subscribe } from 'svelte-headless-table';
	import { type Writable, writable } from 'svelte/store';
	import { addHiddenColumns, addPagination, addSelectedRows, addTableFilter } from 'svelte-headless-table/plugins';
	import DataTableCheckbox from './data-table-checkbox.svelte';
	import TicketMessagesView from './TicketMessagesView.svelte';
	import TicketTag from '$lib/components/ui/ticketTag/ticketTag.svelte';
	import { Button } from '$lib/components/ui/button';
	import { faker } from '@faker-js/faker';
	import { ChevronsUpDown, User } from 'lucide-svelte';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import CreateTicket from '../components/CreateTicket.svelte';
	import SupportFilter from './SupportFilter.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { loggedInUser, ticketsSummary, ticketStats } from '$lib/store';
	import Icon from '@iconify/svelte';
	import { page } from '$app/stores';
	import { mapDateToString } from '../components/dashboardutils';
	import { toast } from 'svelte-sonner';
	import { Toaster } from '$lib/components/ui/sonner';
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
	import * as Table from "$lib/components/ui/table"
	import * as Pagination from "$lib/components/ui/pagination"
	let tableHeaderRows: any, tablePageRows: any, _tableAttrs: any, _tableBodyAttrs: any;
	let _hasNextPage: any, _hasPreviousPage: any, _pageIndex: any;
	let ticketMessages: any = null;
	let createTicket: any = null;
	let ticketFilter: any = null;
	let _flatColumns: any;
	let _selectedDataIds: Writable<Record<string, boolean>>;
	let _hiddenColumnIds: Writable<string[]>;
	let hidableCols: string[] = ['date', 'title', 'creator', 'status'];
	let hideForId: Record<string, boolean> = {};
	let ticketLoading: boolean = false;
	let _filterValue: any;
	$: {
		$_hiddenColumnIds = Object.entries(hideForId)
			.filter(([, hide]) => !hide)
			.map(([id]) => id);
	}
	export const data: PageServerData | undefined = undefined;
	let isAdmin: boolean = false;
	let groupedData: Record<string, number> = {};
	const userName = $loggedInUser?.firstName + ' ' + $loggedInUser?.lastName;
	const SUPPORT_STAFF_ROLES = [UserRoles.Tech, UserRoles.SuperAdmin, UserRoles.TrademarkSupport, UserRoles.PatentDesignSupport];
	function hasSupportStaffRole(): boolean {
		const roles = $loggedInUser?.userRoles;
		return !!roles && SUPPORT_STAFF_ROLES.some((r) => roles.includes(r));
	}
	onMount(async () => {
		await decodeUser()
		isAdmin = hasSupportStaffRole();
		ticketLoading = true;
		await getTickets()
		ticketLoading = false;
	})

	async function getStats() {
		const userId = $loggedInUser?.id;
		const url = hasSupportStaffRole()
			? `${baseURL}/api/tickets/GetStats`
			: `${baseURL}/api/tickets/GetStats?userId=${userId}`;
		let response = await fetch(url, {
			method: 'GET'
		})
		if (response.ok) {
			groupedData = await response.json()
			ticketStats.set(groupedData)
		}
	}
	async function getTickets() {
		// get user id if user is agent or staff
		var cookieUser = document.cookie
			.split(';')
			.find((x) => x.startsWith(' user=') || x.startsWith('user='));
		if (!cookieUser) {
			await goto('/auth/');
		}
		else {
			var user = cookieUser.trimStart();
			user = user.slice(5);
			loggedInUser.set(JSON.parse(decodeURIComponent(user)));
			isAdmin = hasSupportStaffRole();
		}
		if ($loggedInUser === null) {
			return;
		}
		else {
			if ($ticketsSummary === null) {
				getStats()
				const userId = ($loggedInUser as any).creatorId;
				let body: Record<string, any> = {
					creatorId: userId
				}
				if (hasSupportStaffRole()) {
					body = {
						creatorId: 'null'
					}
				}
				let response = await fetch(`${baseURL}/api/tickets/TicketSummaries`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(body)
				})
				if (response.ok) {
					const ticketSummaries = await response.json()
					ticketsSummary.set(ticketSummaries);
				}
			}
		}
	}
	const resultLength = [10, 15, 20, 25, 30, 35, 40, 45, 50, 75, 100];
	const STATUS_SORT_ORDER: Record<number, number> = { 1: 0, 0: 1, 2: 2 };
	$: {
		let tickets = $ticketsSummary
		const sortedTickets = Array.isArray(tickets)
			? [...tickets].sort((a: any, b: any) => {
				const statusA = STATUS_SORT_ORDER[a?.status] ?? 99;
				const statusB = STATUS_SORT_ORDER[b?.status] ?? 99;
				if (statusA !== statusB) return statusA - statusB;
				const dateA = a?.lastInteraction ? new Date(a.lastInteraction).getTime() : 0;
				const dateB = b?.lastInteraction ? new Date(b.lastInteraction).getTime() : 0;
				return dateA - dateB;
			})
			: tickets;
		const table = createTable(writable<any[]>((sortedTickets as any) ?? []), {
			page: addPagination({ initialPageSize: selectedResultList }),
			filter: addTableFilter({
				fn: ({ filterValue, value }) => value.toLowerCase().includes(filterValue.toLowerCase())
			}),
			hide: addHiddenColumns(),
			select: addSelectedRows()
		});
		const columns = table.createColumns([
			table.column({
				accessor: '_id',
				header: (_, { pluginStates }) => {
					const { allPageRowsSelected } = pluginStates.select;
					return createRender(DataTableCheckbox, {
						checked: allPageRowsSelected
					});
				},
				cell: ({ row }, { pluginStates }) => {
					const { getRowState } = pluginStates.select;
					const { isSelected } = getRowState(row);

					return createRender(DataTableCheckbox, {
						checked: isSelected
					});
				},
				plugins: {
					filter: {
						exclude: true
					}
				}
			}),
			// table.column({
			// 	accessor: 's/n',
			// 	header: 'S/N',
			// 	plugins: { filter: { exclude: true } }
			// }),
			table.column({
				accessor: 'lastInteraction',
				header: 'Last Activity'
			}),
			table.column({
				accessor: 'creator',
				header: 'Creator'
			}),
			table.column({
				accessor: 'title',
				header: 'Title'
			}),
			table.column({
				accessor: 'status',
				header: 'Status'
			}),

			table.column({
				accessor: 'id',
				header: '',
				plugins: {
					filter: { exclude: true }
				}
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
		if (isAdmin===false){
			const creatorIndex=hidableCols.findIndex(x=>x==='creator')
			if(creatorIndex!==-1){
				hidableCols.splice(creatorIndex,1);
			}
		hideForId['creator']=false;
		}
	}
	function spreadAttrs(value: unknown): Record<string, unknown> {
		return (value ?? {}) as Record<string, unknown>;
	}
	function creatorNameFor(id: string): string {
		return ($ticketsSummary as any)?.[id]?.creator?.name ?? '';
	}
	function getTicketStatus(ticket: TicketSummary) {
		return ticket.status == TicketStates.closed
			? `Closed by ${ticket.resolution?.StaffName ?? ''}`
			: ticket.status.toString();
	}
	let showResultLengthList: boolean = false;
	let selectedResultList: number = 10;
	let showTicketMessages: boolean = false;
	let ticketInfo = {};
	let showTicketCreation:boolean=false;
	let ticketData={};
	async function loadTicket(id:string)
	{
		const response= await fetch(`${baseURL}/api/tickets/${id}`,{
			method:"GET",
			headers:{"Content-Type":"application/json"}
		});
		if (response.ok){
			const dat= await response.json()
			console.log(dat)
			return dat;
		}
	}

	async function showTicket(id:string) {

		id=($ticketsSummary as any)?.[id]?.ticketId
		let messages: TicketInfo =await loadTicket(id);
		if (ticketMessages === null) {
			ticketMessages = (await import('./TicketMessagesView.svelte')).default;
		}
		const handleClose = () => {
			showTicketMessages = false;
		};
		ticketInfo = {
			data: messages,
			isAdmin: isAdmin,
			onExit: handleClose,
			open: true
		};
		showTicketMessages = true;
	}

	async function createNewTicket()
	{
		if (createTicket === null) {
			createTicket = (await import('../components/CreateTicket.svelte')).default;
		}
		const handleClose = () => {
			showTicketCreation = false;
		};
		ticketData = {
			affectedFiles: null,
			allUserFiles: [],
			onExit: handleClose,
			open: true
		};
		showTicketCreation = true;
	}
	let showFilter:boolean=false
	let filterData={}
	async function showFilterSheet()
	{
		if (ticketFilter===null)
		{
			ticketFilter=(await import ('./SupportFilter.svelte')).default;
		}
		filterData = {open:true}
		showFilter=true;
	}
	async function getSpecific(type:number|null){
		ticketLoading=true;
		const userId = ($loggedInUser as any)?.creatorId;
		let body: Record<string, any> = {
			creatorId: hasSupportStaffRole() ? 'null' : userId,
		}
		if (type!=null){
			body['status']=type
		}
		console.log(body)
		let response = await fetch(`${baseURL}/api/tickets/TicketSummaries`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		})
		if (response.ok) {
			const ticketSummaries = await response.json()
			ticketsSummary.set(ticketSummaries);
		}
		ticketLoading=false;
	}
	async function closeTickets(){
		const selected=$_selectedDataIds;
		let closeIdds:string[]=[]
		for (const selectedKey in selected) {
			const id=($ticketsSummary as any)?.[selectedKey]?.ticketId
			closeIdds.push(id)
		}
		const response=await fetch(`${baseURL}/api/tickets/CloseTicket`, {
			method:"POST",
			headers:{"Content-Type":"application/json"},
			body:JSON.stringify({
				ticketId: closeIdds,
				resolution: {
					staffId: $loggedInUser?.id,
					staffName: userName
				}
			})
		});
		if (response.ok){
			var result=await response.json();
			if(result){
				for (const selectedKey in selected) {
					ticketsSummary.update((data)=>{
						if (data!==null) {
							(data as any)[selectedKey].status = 2
							return [...data]
						}
						return data
					})
				}
				toast.success("Ticket(s) closed successfully",{
					position:"top-right",
				});
			}
		}
	}
</script>

<Toaster />
<div class="p-4">
<div class="mt-4">
	<div class="sm:flex gap-4 justify-end">
		<Button on:click={()=>createNewTicket()}>+ Create new Ticket</Button>
<!--		<Button on:click={()=>showFilterSheet()} >Filter result</Button>-->
	</div>
</div>
{#if showTicketMessages}
	<svelte:component this={ticketMessages} {...ticketInfo} />
{/if}
{#if showTicketCreation}
	<svelte:component this={createTicket} {...ticketData} />
{/if}
{#if showFilter}
	<svelte:component this={ticketFilter} {...filterData} />
{/if}
{#if ticketLoading}
	<div class="items-center justify-center flex h-screen">
		<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
	</div>
	{:else}
	<div class="flex flex-wrap gap-2 m-2">
		<button
			type="button"
			on:click={() => getSpecific(null)}
			class="inline-flex items-center gap-1.5 px-1.5 py-1 rounded-md w-fit text-xs font-medium bg-gray-400 text-black"
		>
			Total Tickets
			<span class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-black/80 text-white text-[10px] font-semibold leading-none">
				{$ticketStats.total ?? 0}
			</span>
		</button>
		<button
			type="button"
			on:click={() => getSpecific(1)}
			class="inline-flex items-center gap-1.5 px-1.5 py-1 rounded-md w-fit text-xs font-medium bg-blue-400 text-black"
		>
			Awaiting Staff
			<span class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-blue-950 text-white text-[10px] font-semibold leading-none">
				{$ticketStats.staff ?? 0}
			</span>
		</button>
		<button
			type="button"
			on:click={() => getSpecific(0)}
			class="inline-flex items-center gap-1.5 px-1.5 py-1 rounded-md w-fit text-xs font-medium bg-yellow-400 text-black"
		>
			Awaiting User
			<span class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-yellow-950 text-white text-[10px] font-semibold leading-none">
				{$ticketStats.user ?? 0}
			</span>
		</button>
		<button
			type="button"
			on:click={() => getSpecific(2)}
			class="inline-flex items-center gap-1.5 px-1.5 py-1 rounded-md w-fit text-xs font-medium bg-green-400 text-black"
		>
			Closed
			<span class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-green-950 text-white text-[10px] font-semibold leading-none">
				{$ticketStats.closed ?? 0}
			</span>
		</button>
	</div>
	{/if}
<div>
	<div class="flex items-center py-4">
		<div
			class="ml-auto {Object.keys($_selectedDataIds).length > 0
				? ''
				: 'hidden'} text-muted-foreground flex-1 text-sm"
		>
			{Object.keys($_selectedDataIds).length} of{' '}
			{$ticketsSummary?.length ?? 0} row(s) selected.
		</div>
		<div class="ml-auto mr-20">
			<DropdownMenu.Root bind:open={showResultLengthList}>
				<DropdownMenu.Trigger asChild let:builder>
					<Button builders={[builder]} variant="outline">
						Results per Page ({selectedResultList})
						<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-fit p-1">
					{#each resultLength as rl}
						<DropdownMenu.Item on:click={() => (selectedResultList = rl)}>
							<span>{rl}</span>
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
		<div class="ml-auto mr-10 {Object.values($_selectedDataIds).length >= 1 ? '' : 'hidden'}">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild let:builder>
					<Button builders={[builder]}>
						Actions <ChevronDown class="ml-2 h-4 w-4" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Item on:click={()=>closeTickets()} >Close ticket(s)</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button variant="outline" class="ml-auto" builders={[builder]}>
					Columns <ChevronDown class="ml-2 h-4 w-4" />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				{#each _flatColumns as col}
					{#if hidableCols.includes(col.id)}
						<DropdownMenu.CheckboxItem
							bind:checked={hideForId[col.id]}
							onCheckedChange={(newv) => {
								hideForId[col.id] = newv === true;
							}}
						>
							{col.header}
						</DropdownMenu.CheckboxItem>
					{/if}
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
	{#if ticketLoading}
		<div class="items-center justify-center flex h-screen">
			<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
		</div>
		{:else}
	<div class="rounded-md border">
		<Table.Root {...spreadAttrs($_tableAttrs)}>
			<Table.Header>
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
			</Table.Header>
			<Table.Body {...spreadAttrs($_tableBodyAttrs)}>
				{#each $tablePageRows as row (row.id)}
					<Subscribe rowAttrs={row.attrs()} let:rowAttrs>
						<Table.Row {...spreadAttrs(rowAttrs)} data-state={$_selectedDataIds[row.id] && 'selected'}>
							{#each row.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs>
									<Table.Cell {...spreadAttrs(attrs)}>
										{#if cell.id === 'status'}
												<TicketTag state="{parseInt(cell.render())}" />
<!--												<Render of={mapTicketStateToString(cell.render())} />-->
											{:else if cell.id==='creator'}
											<a class="line-clamp-2" href="{faker.internet.url()}">
											<Render of="{creatorNameFor(row.id)}" />
											</a>
											{:else if cell.id==="lastInteraction"}
												<Render of={mapDateToString(cell.render())} />

										{:else if cell.id === 'title'}
											<div class="text-ellipsis line-clamp-2">
												<Render of={cell.render()} />
											</div>
										{:else if cell.id === 'id'}
											<Button on:click={() =>showTicket(row.id)}>View</Button>
										{:else}
											<Render of={cell.render()} />
										{/if}
									</Table.Cell>
								</Subscribe>
							{/each}
						</Table.Row>
					</Subscribe>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
	<div class="flex items-center justify-end space-x-4 py-4">
		<Pagination.Root
			count={$ticketsSummary?.length ?? 0}
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
						<Pagination.Item>
							<Pagination.Ellipsis />
						</Pagination.Item>
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
</div>

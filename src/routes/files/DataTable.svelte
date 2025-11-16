<script lang="ts">
	import { createRender, createTable, Render, Subscribe } from 'svelte-headless-table';
	import { type Writable, writable } from 'svelte/store';
	import * as Dialog from "$lib/components/ui/dialog"
	import { Textarea } from '$lib/components/ui/textarea';
	import { mapStatusToString } from '../home/components/dashboardutils';
	import {
		type AffectedFiles, ApplicationStatuses,
		baseURL,
		FormApplicationTypes,
		getStatusColour,
		UserRoles,
		UserTypes
	} from '$lib/helpers';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { addHiddenColumns, addPagination, addSelectedRows, addTableFilter } from 'svelte-headless-table/plugins';
	import { page } from '$app/stores';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import { ChevronsUpDown } from 'lucide-svelte';
	import DataTableCheckbox from './data-table-checkbox.svelte';
	import CreateTicket from '../home/components/CreateTicket.svelte';
	import type { RecordSetStore } from 'svelte-headless-table/dist/utils/store';
	import FilterFile from '../home/FilterFile.svelte';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import { listOfIds, loggedInUser, queryBody, selectedFilesForAction } from '$lib/store';
	import { fileTypeToString, mapTypeToString } from '../home/components/dashboardutils';
	import Icon from '@iconify/svelte';
	import * as Table from "$lib/components/ui/table"
	import * as Pagination from "$lib/components/ui/pagination"
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
	import { Toaster } from '$lib/components/ui/sonner';
	export let dataList: [] | null = [];
	let tableHeaderRows, tablePageRows, _tableAttrs, _tableBodyAttrs;
	let _hasNextPage, _hasPreviousPage, _pageIndex;
	let createTicket: CreateTicket | null = null;
	let filterFiles:FilterFile|null=null;
	let _flatColumns;
	export let count:number=0;
	export let showAppStatus:boolean=true;
	export let showType:boolean=true;
	export let currentDataPage:number=0;
	export let showRenew:boolean=false;
	let _selectedDataIds: RecordSetStore<string>;
	let _hiddenColumnIds: Writable<string[]>;
	let hidableCols: string[] = ['date', 'title', 'fileId', 'fileStatus', 'fileType', 'status'];
	let hideForId: [] = [];
	let isLoading=false;
	let _filterValue;
	$: {
		$_hiddenColumnIds = Object.entries(hideForId)
			.filter(([, hide]) => !hide)
			.map(([id]) => id);
	}
	$:{
		 $_pageIndex=currentDataPage
		console.log($_pageIndex)
	}
	const resultLength = [10, 15, 20, 25, 30, 35, 40, 45, 50, 75, 100];
	$: {
		const table = createTable(writable(dataList ?? []), {
			page: addPagination({ initialPageSize: $selectedResultList, serverItemCount:writable(count), serverSide:true}),
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
						checked: allPageRowsSelected,
						id:"s"
					});
				},
				cell: ({ row }, { pluginStates }) => {
					const { getRowState } = pluginStates.select;
					const { isSelected } = getRowState(row);
					let  status=writable<boolean>($selectedFilesForAction?.includes(row.cells[7].value.toString())??false);
					return createRender(DataTableCheckbox, {
						checked: status,
						id:row.cells[7].value
					});
				},
				plugins: {
					filter: {
						exclude: true
					}
				}
			}),
			table.column({
				accessor: 's/n',
				header: 'S/N',
				plugins: { filter: { exclude: true } }
			}),
			table.column({
				accessor: 'date',
				header: 'Date'
			}),
			table.column({
				accessor: 'fileId',
				header: 'File ID'
			}),
			table.column({
				accessor: 'fileStatus',
				header: 'File Status'
			}),
			table.column({
				accessor: 'title',
				header: 'Title'
			}),
			table.column({
				accessor: 'fileType',
				header: 'Type'
			}),
			// table.column({
			// 	accessor: 'status',
			// 	header: 'Application Status'
			// }),
			// table.column({
			// 		accessor:"applicationType",
			// 		header:"sd"
			// 	}),

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
		const ids = _flatColumns.map((col) => col.id);
		hideForId = Object.fromEntries(ids.map((id) => [id, true]));
		if(showAppStatus==false)
		{
			hidableCols= [...hidableCols.filter(x=>x!=='status')];
			hideForId['status'] = false;
		}

		if (showType===false)
		{
			hidableCols= [...hidableCols.filter(x=>x!=='fileType')];
			hideForId['fileType'] = false;
		}
	}
	let currentUrl = writable<URL>($page.url);
	let currentSearchData=undefined
	async function loadPage(counter:number, startIndex:number, otherdata=undefined){
		isLoading=true;
		const url = $currentUrl;
		const type = url.searchParams.get('fileType');
		const typeconverted = type ? (type.split(',').map(Number) as number[]) : null;
		const PriorityNumber = url.searchParams.get('PriorityNumber');
		const priConverted = PriorityNumber ? PriorityNumber : null;
		const status = url.searchParams.get('status');
		const statusConverted = status ? (status?.split(',').map(Number) as number[]) : null;
		const applicationType = url.searchParams.get('appType');
		const appTypeConverted = applicationType
			? (applicationType?.split(',').map(Number) as number[])
			: null;

		$currentUrl.searchParams.set('quantity', counter.toString());
		$currentUrl.searchParams.set('index', startIndex.toString());
		const indexString = url.searchParams.get('index');
		const quantityString = url.searchParams.get('quantity');
		const title = url.searchParams.get('title');
		const userId = $loggedInUser?.creatorId.toString();
		const index = indexString ? parseInt(indexString) : 0;
		const quantity = quantityString ? parseInt(quantityString) : 10;
		const fileUrl = `${baseURL}/api/files/summary?index=${index}&quantity=${quantity}`;
		let body = {
			// userType: $loggedInUser.userRoles.includes(UserRoles.StaffMenu)  ? 1:0,
			userType: $loggedInUser?.userRoles.includes(UserRoles.Tech) ? 1 : 0,
			userId,
			types: typeconverted,
			status: statusConverted,
			applicationTypes: appTypeConverted,
			Title: title ?? null,
			PriorityNumber: priConverted
		};
		if (otherdata){
			currentSearchData ={}
			if (otherdata.title){
				currentSearchData.Title = otherdata.title
			}
			if (otherdata.PriorityNumber){
				currentSearchData.PriorityNumber = otherdata.PriorityNumber
			}
			if (otherdata.startDate){
				currentSearchData.startDate=otherdata.startDate
				$currentUrl.searchParams.set("startDate", otherdata.startDate);

			}
			if (otherdata.endDate){
				currentSearchData.endDate=otherdata.endDate
				$currentUrl.searchParams.set("endDate", otherdata.endDate);
			}
		}

			if (currentSearchData!==undefined){
				body= {...body, ...currentSearchData};
		}
		// return;
		queryBody.set(JSON.stringify(body));
		const result = await fetch(fileUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});
		const resp = await result.json();
		const values: any[] = resp.result;
		const filescount: number = resp.count;
		let _dataList = [];
		for (let i = 0; i < values.length; i++) {
			const curr = values[i];
			const allPending = (curr.summaries as []);
			_dataList.push({
				's/n': index+ i + 1,
				date: Intl.DateTimeFormat('en-NG', {
					year: '2-digit',
					month: 'short',
					day: 'numeric',
					weekday: 'short',
					hour: 'numeric',
					minute: 'numeric'
				}).format(new Date(curr.summaries[0].applicationDate)),
				fileId: curr.fileId,
				fileStatus: curr.fileStatus,
				title: curr.title,
				fileType: fileTypeToString(curr.type),
				id: curr.id,
				status:
					allPending.length > 1 ? 'Multiple' : allPending[0].applicationStatus,
				appType: allPending.length > 1 ? 'Multiple' : mapTypeToString(allPending[0].applicationType)
			});
		}
		dataList = [..._dataList];
		const _listOfIds = _dataList.map((x) => x.id);
		listOfIds.set(_listOfIds);
		count = filescount;
		isLoading=false;
	}

	function getAppStatus(cell: number) {
		let applicationType: FormApplicationTypes | null = dataList[cell]?.appType;
		return applicationType !== null && applicationType !== FormApplicationTypes.None;
	}

	async function batchRenew(){
		localStorage.removeItem("next10Batch")
		localStorage.removeItem("currentRenewalIndex")
		await goto('/payment?type=batchrenewal');
	}

	function changeStatus(){
		newStatusSelector=true
	}

	let newStatusSelector=false
	let showResultLengthList: boolean = false;
	let selectedResultList= writable<number>(10);
	let showTicketCreation: boolean = false;
	let ticketData = {};
	let showFilterSheet:boolean=false;
	async function showSelections() {
		let affectedFiles: AffectedFiles[] = [];
		for (const key in $_selectedDataIds) {
			affectedFiles.push({
				fileID: dataList[key].fileId,
				applicant: null,
				title: dataList[key].title,
				id: dataList[key].id
			});
		}
		if (createTicket === null) {
			createTicket = (await import('../home/components/CreateTicket.svelte')).default;
		}
		const handleClose = () => {
			showTicketCreation = false;
		};
		ticketData = {
			affectedFiles: affectedFiles,
			allUserFiles: [...affectedFiles],
			onExit: handleClose,
			open: true
		};
		showTicketCreation = true;
	}
let filterData={};
	async function showFilter()
	{
		if (filterFiles === null) {
			filterFiles = (await import('../home/FilterFile.svelte')).default;
			const handleClose = () => {
				showFilterSheet = false;
			};
			filterData={
				open:true,
				onclose:handleClose,
				onSearchPressed:(data)=>loadPage($selectedResultList, 0, data)
			}
		}
		showFilterSheet=true;
	}
	let newStatusReason="";
	let newStatus;
	let isStatusUpdating=false;
	const userName = $loggedInUser?.firstName + ' ' + $loggedInUser?.lastName;
	async function changeStatusForAll(){
		if (isStatusUpdating)return;
		if (newStatus===undefined)return;
		if (newStatusReason==="")return;
		else {
			isStatusUpdating = true;
			const  response=await fetch(`${baseURL}/api/files/updatemanystatus`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					reasons: newStatusReason,
					newStatus: newStatus,
					userId:$loggedInUser?.creatorId,
					userName:userName,
					files:$selectedFilesForAction
				})
			})
			if (response.ok){
				toast.success("Successfully updated the status", {
					position:"top-right"
				})
			}
			else {
				toast.error("Failed to update the status", {
					position:"top-right"
				})
			}
		}
	}
</script>


<Toaster />
<Dialog.Root bind:open={newStatusSelector} class="overflow-y-auto">
	<Dialog.Content class="overflow-y-auto">
	<Dialog.Header>
		<Dialog.Title>Select New Status</Dialog.Title>
	</Dialog.Header>
		<div class="overflow-y-auto h-[480px]">
			{#each Object.keys(ApplicationStatuses).filter((x) => isNaN(parseInt(x))===false) as status}
				<div
					class="border rounded-md w-fit {newStatus === status
								? 'bg-green-300'
								: ''} p-2 m-2"
					on:click={() => (newStatus = status)}
				>
					{mapStatusToString(parseInt(status))}
				</div>
			{/each}
		<Textarea
			class="min-w-full min-h-48"
			placeholder="type reason for change..."
			bind:value={newStatusReason}
		/>
		</div>
		<Dialog.Footer>
			<Button on:click={()=>changeStatusForAll()}>
				<Icon
					class="mx-auto my-auto {isStatusUpdating?'':'hidden'}"
					icon="line-md:loading-twotone-loop"
					width="1.2rem"
					height="1.2rem"
				/>
				Confirm</Button>
			<Button on:click={()=>newStatusSelector=false}>Cancel</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
{#if showTicketCreation}
	<svelte:component this={createTicket} {...ticketData} />
{/if}


{#if showFilterSheet}
	<svelte:component this={filterFiles} {...filterData} />
{/if}
<div>
	<div class="flex items-center py-4">
		<div
			class="ml-auto {Object.keys($_selectedDataIds).length > 0
				? ''
				: 'hidden'} text-muted-foreground flex-1 text-sm"
		>
			{Object.keys($_selectedDataIds).length} file(s) selected.
		</div>
		<div class="ml-auto mr-20">
			<DropdownMenu.Root bind:open={showResultLengthList} let:ids>
				<DropdownMenu.Trigger asChild let:builder>
					<Button builders={[builder]} variant="outline">
						Results per Page ({$selectedResultList})
						<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-fit p-1">
					{#each resultLength as rl}
						<DropdownMenu.Item on:click={() => {
							selectedResultList.set(rl)
							loadPage(rl, 0)
						}}>
							<span>{rl}</span>
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
		<div class="ml-auto mr-10 {$selectedFilesForAction?.length??0 >= 1 ? '' : 'hidden'}">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild let:builder>
					<Button builders={[builder]}>
						Actions <ChevronDown class="ml-2 h-4 w-4" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Item on:click={() => showSelections()}>Create ticket</DropdownMenu.Item>
<!--					<DropdownMenu.Item on:click={() => changeStatus()}>Change Status</DropdownMenu.Item>-->
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
		<Button variant="outline" on:click={()=>showFilter()}>
			Advanced Search
		</Button>
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
								hideForId[col.id] = newv;
							}}
						>
							{col.header}
						</DropdownMenu.CheckboxItem>
					{/if}
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		{#if showRenew}
	<Button class="mx-2 bg-green-600" on:click={()=>batchRenew()}>Renew all</Button>
			{/if}
	</div>
	{#if isLoading}
		<div class=" w-full h-full flex">
			<Icon
				class="mx-auto my-auto"
				icon="line-md:loading-twotone-loop"
				width="1.2rem"
				height="1.2rem"
			/>
		</div>
		{:else}
	<div class="rounded-md border">
		<Table.Root {...$_tableAttrs}>
			<Table.Header>
				{#each $tableHeaderRows as headerRow}
					<Subscribe rowAttrs={headerRow.attrs()}>
						<Table.Row>
							{#each headerRow.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()}>
									<Table.Head {...attrs} class="[&:has([role=checkbox])]:pl-3">
										{#if cell.id==='title'}
											<div class="w-[20px]">
										<Render of={cell.render()} />
											</div>
											{:else }
										<Render of={cell.render()} />
											{/if}
									</Table.Head>
								</Subscribe>
							{/each}
						</Table.Row>
					</Subscribe>
				{/each}
			</Table.Header>
			<Table.Body {...$_tableBodyAttrs}>
				{#each $tablePageRows as row (row.id)}
					<Subscribe rowAttrs={row.attrs()}  let:rowAttrs>
						<Table.Row {...rowAttrs} data-state={$_selectedDataIds[row.id] && 'selected'}>
							{#each row.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs>
									<Table.Cell {...attrs}>
										{#if cell.id === 'fileStatus'}
											<AppStatusTag value="{parseInt(cell.render())}"  />
										{:else if cell.id === 'status'}
											{#if getAppStatus(row.id)}
												<div class="grid grid-cols-1">
													<div class="border rounded bg-gray-500 p-0.5">
														<AppStatusTag value="{dataList[row.id]?.appType}" />
													</div>
													<div
														class="border rounded-md p-0.5 w-fit"
														style="background-color:{getStatusColour(cell.render())}"
													>
														<Render of={cell.render()} />
													</div>
												</div>
											{:else}
												<div>-</div>
												<!--										show nothing-->
											{/if}
										{:else if cell.id === 'title'}
											<div class="text-ellipsis line-clamp-2 w-56 ">
												<a href={`/dataview?id=${dataList[row.id]?.id}`}>
												<Render of={cell.render()} />
												</a>
											</div>
										{:else if cell.id === 'id'}
											<Button on:click={() => goto(`/dataview?id=${cell.render()}`)}>View</Button>
											{:else if cell.id==="fileId"}
											<a href={`/dataview?id=${dataList[row.id]?.id}`}>{cell.render()}</a>
											{:else if cell.id==='date'}
											<div class="w-24"><Render of={cell.render()} /></div>
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
	{/if}
	<div class="flex items-center justify-end space-x-4 py-4">
		<Pagination.Root
			count={count}
			perPage={$selectedResultList}
			let:pages
			let:currentPage
		>
			<Pagination.Content>
				<Pagination.Item>
					<Pagination.PrevButton on:click={() => {
						$_pageIndex = $_pageIndex - 1
						loadPage($selectedResultList,$selectedResultList * $_pageIndex )
						currentDataPage = $_pageIndex
					}} />
				</Pagination.Item>
				{#each pages as page (page.key)}
					{#if page.type === 'ellipsis'}
						<Pagination.Item>
							<Pagination.Ellipsis />
						</Pagination.Item>
					{:else}
						<Pagination.Item isVisible={currentPage === page.value}>
							<Pagination.Link
								{page}
								isActive={$_pageIndex+1 === page.value}
								on:click={() => {
									($_pageIndex = page.value - 1)
							loadPage($selectedResultList,$selectedResultList * $_pageIndex )
							currentDataPage = $_pageIndex
									}
								}
							>
								{page.value}
							</Pagination.Link>
						</Pagination.Item>
					{/if}
				{/each}
				<Pagination.Item>
					<Pagination.NextButton
						on:click="{() => {
						($_pageIndex += 1)
							loadPage($selectedResultList,$selectedResultList * $_pageIndex )
							currentDataPage = $_pageIndex
					}}" />
				</Pagination.Item>
			</Pagination.Content>
		</Pagination.Root>
	</div>
</div>

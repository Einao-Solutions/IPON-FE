<script lang="ts">
	import { createTable, Render, Subscribe } from 'svelte-headless-table';
	import { type Writable, writable } from 'svelte/store';
	import { Input } from '$lib/components/ui/input';
	import { arrayBufferToBase64, baseURL, toByteArray, UserRoles, UserTypes } from '$lib/helpers';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import {
		addHiddenColumns,
		addPagination,
		addSelectedRows,
		addTableFilter
	} from 'svelte-headless-table/plugins';
	import { page } from '$app/stores';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import { ChevronsUpDown } from 'lucide-svelte';
	import type { RecordSetStore } from 'svelte-headless-table/dist/utils/store';
	import { listOfIds, loggedInUser, queryBody } from '$lib/store';
	import Icon from '@iconify/svelte';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Card from '$lib/components/ui/card';
	import * as Pagination from '$lib/components/ui/pagination';
	import * as Table from '$lib/components/ui/table';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	export let dataList: [] | null = [];
	let tableHeaderRows, tablePageRows, _tableAttrs, _tableBodyAttrs;
	let _hasNextPage, _hasPreviousPage, _pageIndex;
	let _flatColumns;
	export let count: number = 0;
	export let currentDataPage: number = 0;
	export let showRenew: boolean = false;
	let _selectedDataIds: RecordSetStore<string>;
	let _hiddenColumnIds: Writable<string[]>;
	let hidableCols: string[] = ['date', 'title', 'fileId', 'image', 'applicant'];
	let hideForId: [] = [];
	let isLoading = false;
	let _filterValue;
	$: {
		$_hiddenColumnIds = Object.entries(hideForId)
			.filter(([, hide]) => !hide)
			.map(([id]) => id);
	}
	$: {
		$_pageIndex = currentDataPage;
	}

	const resultLength = [10, 15, 20, 25, 30, 35, 40, 45, 50, 75, 100];
	$: {
		const table = createTable(writable(dataList ?? []), {
			page: addPagination({
				initialPageSize: $selectedResultList,
				serverItemCount: writable(count),
				serverSide: true
			}),
			filter: addTableFilter({
				fn: ({ filterValue, value }) => value.toLowerCase().includes(filterValue.toLowerCase())
			}),
			hide: addHiddenColumns(),
			select: addSelectedRows()
		});
		const columns = table.createColumns([
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
				accessor: 'image',
				header: 'image'
			}),
			table.column({
				accessor: 'title',
				header: 'Title'
			}),
			table.column({
				accessor: 'tradeClass',
				header: 'Class'
			}),
			table.column({
				accessor: 'applicant',
				header: 'Applicant'
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
		const ids = _flatColumns.map((col) => col.id);
		hideForId = Object.fromEntries(ids.map((id) => [id, true]));
	}
	let currentUrl = writable<URL>($page.url);
	export let searchTitle = '';
	let showRaiseOpposition = false;
	async function loadPage(count: number, startIndex: number) {
		isLoading = true;
		let url = '';
		if (searchTitle !== undefined && searchTitle !== '') {
			url = `${baseURL}/api/files/GetTrademarkPublication?text=${searchTitle}&index=${startIndex}&quantity=${count}`;
		} else {
			url = `${baseURL}/api/files/GetTrademarkPublication?&index=${startIndex}&quantity=${count}`;
		}
		const response = await fetch(url, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const result = await response.json();
		count = result.count;
		let _dataList = [];
		for (let i = 0; i < result.result.length; i++) {
			const dataListKey = result.result[i];
			_dataList.push({
				's/n': i + 1,
				date: Intl.DateTimeFormat('en-NG', {
					year: '2-digit',
					month: 'short',
					day: 'numeric',
					weekday: 'short',
					hour: 'numeric',
					minute: 'numeric'
				}).format(new Date(dataListKey.date)),
				fileId: dataListKey.fileId,
				title: dataListKey.title,
				tradeClass: dataListKey.tradeClass,
				id: dataListKey.id,
				image: dataListKey.image,
				applicant: dataListKey.applicant
			});
		}

		dataList = _dataList;
		console.log(dataList);
		isLoading = false;
	}

	async function generateRRR() {
		currentView = -1;
		// save uploaded file
		let attachmentsLists = [];
		let uploadedUrl = '';
		attachmentsLists.push({
			fileName: requiredFile.name,
			Name: '',
			contentType: requiredFile.type,
			data: arrayBufferToBase64(await toByteArray(requiredFile))
		});
		// push and get return;
		const result = await fetch(`${baseURL}/api/files/uploadAttachment`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(attachmentsLists)
		});
		if (result.ok) {
			const res = await result.json();
			uploadedUrl = res[0];
		}
		const description = 'Trademark opposition against- ' + selectedTitle + '-';
		const response = await fetch(`${baseURL}/api/opposition/create`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				description: description,
				name: name,
				email: email,
				number: number,
				address: address,
				title: selectedTitle,
				fileID: selectedID,
				fileUrl: uploadedUrl,
				userName: $loggedInUser.name,
				userId: $loggedInUser.id
			})
		});
		const oppositionResult = await response.json();
		rrr = oppositionResult.rrr;
		amount = oppositionResult.amount;
		oppositionId = oppositionResult.id;
		if (rrr != undefined) {
			currentView = 1;
		}
	}

	let showResultLengthList: boolean = false;
	let selectedResultList = writable<number>(10);
	let name, number, address, email, rrr, amount, oppositionId;
	let currentView = 0;
	let selectedTitle: string = '',
		selectedID: string = '';

	async function raiseOppositionView(row: []) {
		selectedTitle = row.find((x) => x.id === 'title').value;
		selectedID = row.find((x) => x.id === 'id').value;
		showRaiseOpposition = true;
	}

	async function fileChanged(event: Event | null) {
		const input = event?.target as HTMLInputElement;
		if (input.files) {
			if (input.files.length > 1) {
				removeAttachment();
				toast.error('maximum of 1 file', {
					position: 'top-right'
				});
				return;
			}
			for (let i = 0; i < input.files.length; i++) {
				if (input.files[i].size > 5000000) {
					removeAttachment();
					toast.error('maximum file size of 5MB exceeded', {
						position: 'top-right'
					});
					return;
				}
			}
			for (let i = 0; i < input.files.length; i++) {
				const fileType = input.files[i].type;
				console.log(fileType);
				if (fileType !== 'application/pdf') {
					removeAttachment();
					toast.error('unsupported file type, only pdf supported', {
						position: 'top-right'
					});
					return;
				}
				requiredFile = input.files[i] as File;
				requiredFileUrl = URL.createObjectURL(input.files[i]);
			}
		}
	}
	let requiredFile: File | null = null;
	let requiredFileUrl: string | undefined = undefined;
	function removeAttachment() {
		requiredFile = null;
		requiredFileUrl = undefined;
	}
	async function oppose(fileId: string) {
		await goto(`/opposition/?fileId=${fileId}`);
	}
</script>

<Sheet.Root bind:open={showRaiseOpposition}>
	<Sheet.Content>
		<Sheet.Header>
			<Sheet.Title>Opposition form</Sheet.Title>
			<Sheet.Description>Enter your details</Sheet.Description>
		</Sheet.Header>

		{#if currentView == 0}
			<div class="p-2">
				<div>
					<Label for="name">Name</Label>
					<Input id="name" placeholder="name" bind:value={name} />
				</div>
				<div>
					<Label for="address">address</Label>
					<Input id="address" placeholder="address" bind:value={address} />
				</div>
				<div>
					<Label for="number">phone number</Label>
					<Input id="number" placeholder="phone number" bind:value={number} />
				</div>
				<div>
					<Label for="email">Email</Label>
					<Input id="email" placeholder="Email" bind:value={email} />
				</div>
				<div>
					<Label for="attachment">Attachment</Label>
					<Input
						id="attachment"
						type="file"
						accept=".pdf"
						on:change={(event) => fileChanged(event)}
					/>
				</div>
			</div>
			<Sheet.Footer>
				<Button
					variant="destructive"
					on:click={() => {
						showRaiseOpposition = false;
					}}>Cancel</Button
				>
				<Button
					on:click={async () => {
						await generateRRR();
					}}>Ok</Button
				>
			</Sheet.Footer>
		{:else if currentView === -1}
			<div class="items-center justify-center flex h-screen">
				<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
			</div>
		{:else if currentView === 1}
			<div class="flex flex-col space-y-3">
				<div>
					<Label for="amount">Amount</Label>
					<p id="amount">{amount}</p>
				</div>
				<div>
					<Label for="RRR">payment ID</Label>
					<p id="RRR">{rrr}</p>
				</div>
				<Sheet.Footer>
					<Button
						variant="destructive"
						on:click={() => {
							showRaiseOpposition = false;
						}}>Cancel</Button
					>
					<Button
						on:click={() => {
							goto(
								`/payment?type=opposition&oppositionId=${oppositionId}` +
									`&name=${name}&address=${address}&number=${number}&email=${email}` +
									`&fileId=${selectedID}&title=${selectedTitle}&rrr=${rrr}&cost=${amount}`
							);
						}}>Ok</Button
					>
				</Sheet.Footer>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
<div>
	<div class="flex items-center py-4">
		<div
			class="ml-auto {Object.keys($_selectedDataIds).length > 0
				? ''
				: 'hidden'} text-muted-foreground flex-1 text-sm"
		>
			{Object.keys($_selectedDataIds).length} of{' '}
			{dataList?.length ?? 0} row(s) selected.
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
						<DropdownMenu.Item
							on:click={() => {
								selectedResultList.set(rl);
								loadPage(rl, 0);
							}}
						>
							<span>{rl}</span>
						</DropdownMenu.Item>
					{/each}
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
								hideForId[col.id] = newv;
							}}
						>
							{col.header}
						</DropdownMenu.CheckboxItem>
					{/if}
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
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
											{#if cell.id === 'title'}
												<div class="w-[20px]">
													<Render of={cell.render()} />
												</div>
											{:else}
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
						<Subscribe rowAttrs={row.attrs()} let:rowAttrs>
							<Table.Row {...rowAttrs} data-state={$_selectedDataIds[row.id] && 'selected'}>
								{#each row.cells as cell (cell.id)}
									<Subscribe attrs={cell.attrs()} let:attrs>
										<Table.Cell {...attrs}>
											{#if cell.id === 'title'}
												<div class="text-ellipsis line-clamp-2 w-56">
													<Render of={cell.render()} />
												</div>
											{:else if cell.id === 'id'}
												<Button
													on:click={() => {
														const fileId = row.cells.find((c) => c.id === 'fileId')?.value;
														oppose(fileId);
													}}>Raise Opposition</Button
												>
											{:else if cell.id === 'image'}
												<a href={cell.render()} target="_blank">view</a>
											{:else if cell.id === 'date'}
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
		<Pagination.Root {count} perPage={$selectedResultList} let:pages let:currentPage>
			<Pagination.Content>
				<Pagination.Item>
					<Pagination.PrevButton
						on:click={() => {
							$_pageIndex = $_pageIndex - 1;
							loadPage($selectedResultList, $selectedResultList * $_pageIndex);
							currentDataPage = $_pageIndex;
						}}
					/>
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
								isActive={$_pageIndex + 1 === page.value}
								on:click={() => {
									$_pageIndex = page.value - 1;
									loadPage($selectedResultList, $selectedResultList * $_pageIndex);
									currentDataPage = $_pageIndex;
								}}
							>
								{page.value}
							</Pagination.Link>
						</Pagination.Item>
					{/if}
				{/each}
				<Pagination.Item>
					<Pagination.NextButton
						on:click={() => {
							$_pageIndex += 1;
							loadPage($selectedResultList, $selectedResultList * $_pageIndex);
							currentDataPage = $_pageIndex;
						}}
					/>
				</Pagination.Item>
			</Pagination.Content>
		</Pagination.Root>
	</div>
</div>

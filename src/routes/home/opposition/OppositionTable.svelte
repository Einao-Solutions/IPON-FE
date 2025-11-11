<script lang="ts">
	import { createTable, Subscribe, Render, createRender } from 'svelte-headless-table';
	import { type Writable, writable } from 'svelte/store';
	import * as Table from '$lib/components/ui/table';
	import { Input } from '$lib/components/ui/input';
	import {
		type AffectedFiles,
		arrayBufferToBase64,
		baseURL,
		toByteArray,
		UserRoles,
		UserTypes
	} from '$lib/helpers';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import { goto } from '$app/navigation';
	import * as Pagination from '$lib/components/ui/pagination';
	import * as Sheet from '$lib/components/ui/sheet';
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
	import { appattachmentsData, listOfIds, loggedInUser, queryBody } from '$lib/store';
	import Icon from '@iconify/svelte';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { TrademarkAttachments } from '$lib/designutils';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import { mapDateToString } from '../components/dashboardutils';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Toaster } from '$lib/components/ui/sonner';
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
				accessor: 'title',
				header: 'Title'
			}),
			table.column({
				accessor: 'name',
				header: 'Opposer Name'
			}),
			table.column({
				accessor: 'currentStatus',
				header: 'Status'
			}),
			table.column({
				accessor: 'paymentId',
				header: 'Payment ID'
			}),
			table.column({
				accessor: 'fileId',
				header: 'View File'
			}),
			table.column({
				accessor: 'id',
				header: 'View opposition',
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
	export let oppositionType: number | undefined = undefined;
	let showRaiseOpposition = false;
	async function loadPage(counter: number, startIndex: number) {
		let data = [];
		isLoading = true;
		let url = `${baseURL}/api/opposition/loadSummary?quantity=${counter}&skip=${startIndex}`;
		if (oppositionType !== undefined) {
			url = url + `&type=${oppositionType}`;
		}
		if (
			$loggedInUser?.userRoles.some((role) =>
				[
					UserRoles.TrademarkCertification,
					UserRoles.TrademarkSearch,
					UserRoles.TrademarkOpposition,
					UserRoles.TrademarkExaminer,
					UserRoles.Tech
				].includes(role)
			) == false
		) {
			url = url + `?userId=${$loggedInUser.id}`;
		}
		const response = await fetch(url);
		const __data = await response.json();
		const _data = __data.data;
		for (let i = 0; i < _data.length; i++) {
			let curr = _data[i];
			data.push({
				's/n': _data.indexOf(curr) + 1,
				id: curr.fileNumber,
				title: curr.fileTitle,
				creatorId: curr.creatorId,
				fileCreatorId: curr.fileCreatorId,
				fileId: curr.fileNumber,
				date: curr.oppositionDate,
				name: curr.name,
				currentStatus: curr.status
			});
		}
		dataList = data;
		count = __data.count;
		isLoading = false;
	}
	let fileURL = '';
	let paymentType = '';
	async function generateRRR(type: string) {
		paymentType = type;
		currentView = -1;
		// save uploaded file
		let attachmentsLists = [];
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
			fileURL = res[0];
		}
		let description = 'Counter against regarding - ' + selectedTitle + '-';
		if (type === 'resolution') {
			description = 'Resolution statement regarding -' + selectedTitle + '-';
		}

		const response = await fetch(`${baseURL}/api/opposition/generate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				description: description,
				type: type,
				oppositionID: selectedID,
				name: name,
				email: email,
				number: number
			})
		});
		const oppositionResult = await response.json();
		rrr = oppositionResult.rrr;
		amount = oppositionResult.amount;
		if (rrr != undefined) {
			currentView = 1;
		}
	}

	let showResultLengthList: boolean = false;
	let selectedResultList = writable<number>(10);
	let name, number, address, email, rrr, amount, oppositionId;
	let currentView = 0;
	let selectedTitle: string = '';
	let selectedID: string = '';
	let opposition, oppositionHistory;
	async function raiseOppositionView(row: []) {
		currentView = -1;
		const oppositionID = row.find((x) => x.id === 'id').value;
		showRaiseOpposition = true;
		opposition = await (await fetch(`${baseURL}/api/opposition/get?id=${oppositionID}`)).json();
		console.log(opposition);
		currentView = 11;
	}

	async function UploadState(type: string, row: []) {
		selectedID = row.find((x) => x.id === 'id').value;
		selectedTitle = row.find((x) => x.id === 'title').value;
		if (type === 'resolution') {
			currentView = 13;
		}
		if (type === 'response') {
			currentView = 10;
		}
		showRaiseOpposition = true;
	}
	async function viewOppositionHistory(row: []) {
		currentView = -1;
		const oppositionID = row.find((x) => x.id === 'id').value;
		showRaiseOpposition = true;
		oppositionHistory = await (
			await fetch(`${baseURL}/api/opposition/getHistory?id=${oppositionID}`)
		).json();
		currentView = 12;
	}

	async function notifyApplicant(oppositionId: string) {
		isLoading = true;
		var res = await fetch(`${baseURL}/api/opposition/notify?oppId=${oppositionId}`, {
			method: 'POST'
		});

		if (res.ok) {
			let result = await res.json();
			toast.success('Notification sent successfully', { position: 'top-right' });
			isLoading = false;
		}
	}
	async function viewResolve(row: []) {
		selectedID = row.find((x) => x.id === 'id').value;
		selectedTitle = row.find((x) => x.id === 'title').value;
		currentView = 19;
		showRaiseOpposition = true;
	}

	let resolvedText: string = '';
	let isResolving = false;
	async function resolveOpposition() {
		isResolving = true;
		var res = await fetch(`${baseURL}/api/opposition/resolve`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				applicationId: selectedID,
				statement: resolvedText,
				newStatus: 19,
				currentStatus: 17,
				reason: 'opposition resolved',
				userName: $loggedInUser.name,
				userId: $loggedInUser.id
			})
		});

		if (res.ok) {
			let result = await res.json();
			toast.success('resolved successfully', { position: 'top-right' });
			isResolving = false;
		}
	}

	function canResolve(row: []) {
		return (
			($loggedInUser.userRoles.includes(UserRoles.Tech) ||
				$loggedInUser.userRoles.includes(UserRoles.TrademarkOpposition)) &&
			parseInt(row.find((x) => x.id === 'currentStatus').value) === 17
		);
	}
	function canUploadResponse(row: []) {
		const status = parseInt(row.find((x) => x.id === 'currentStatus').value);
		const canResond =
			$loggedInUser.id ===
				dataList.find((x) => x.id === row.find((x) => x.id === 'id').value).fileCreatorId ||
			$loggedInUser.userRoles.includes(UserRoles.Tech);
		return status == 16 && canResond;
	}
	function yetToNotify(row: []) {
		const status = parseInt(row.find((x) => x.id === 'currentStatus').value);
		return status == 29;
	}
	function canUploadResolution(row: []) {
		const status = parseInt(row.find((x) => x.id === 'currentStatus').value);
		const isCreator =
			$loggedInUser.id ===
				dataList.find((x) => x.id === row.find((x) => x.id === 'id').value).creatorId ||
			$loggedInUser.userRoles.includes(UserRoles.Tech);
		return status == 18 && isCreator;
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
</script>

<Toaster />
<Dialog.Root bind:open={showRaiseOpposition}>
	<Dialog.Content class="overflow-y-auto max-h-[80vh]">
		{#if currentView === 10}
			<!--load and show the response form-->
			<Dialog.Header>
				<Dialog.Title>Response Form</Dialog.Title>
			</Dialog.Header>
			<div class="p-2 space-y-4">
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
					<Label for="attachmentResponse">Attachment</Label>
					<Input
						id="attachmentResponse"
						type="file"
						accept=".pdf"
						on:change={(event) => fileChanged(event)}
					/>
				</div>
			</div>
			<Dialog.Footer>
				<Button
					variant="destructive"
					on:click={() => {
						showRaiseOpposition = false;
					}}>Cancel</Button
				>
				<Button
					on:click={async () => {
						await generateRRR('response');
					}}>Ok</Button
				>
			</Dialog.Footer>
		{:else if currentView === -1}
			<div class="items-center justify-center flex h-64">
				<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
			</div>
		{:else if currentView === 11}
			<Dialog.Header>
				<Dialog.Title>Opposition Details</Dialog.Title>
			</Dialog.Header>
			<div class="p-6 space-y-6">
				<!-- Header Section -->
				<div
					class="flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
				>
					<div class="flex items-center space-x-4">
						<div class="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
							<Icon icon="lucide:calendar" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<p class="text-sm font-medium text-slate-600 dark:text-slate-300">Date Created</p>
							<p class="text-lg font-semibold text-slate-900 dark:text-slate-100">
								{mapDateToString(opposition.oppositionDate)}
							</p>
						</div>
					</div>
					<AppStatusTag value={opposition.status} />
				</div>

				<!-- Opposer Information Card -->
				<div
					class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
				>
					<div class="flex items-center space-x-3 mb-4">
						<div class="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
							<Icon icon="lucide:user" class="w-5 h-5 text-purple-600 dark:text-purple-400" />
						</div>
						<h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
							Opposer Details
						</h3>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="space-y-1">
							<Label class="text-sm font-medium text-slate-500 dark:text-slate-400">Full Name</Label
							>
							<p class="text-slate-900 dark:text-slate-100 font-medium">{opposition.name}</p>
						</div>
						<div class="space-y-1">
							<Label class="text-sm font-medium text-slate-500 dark:text-slate-400"
								>Email Address</Label
							>
							<p class="text-slate-900 dark:text-slate-100 font-medium truncate">
								{opposition.email}
							</p>
						</div>
						<div class="space-y-1">
							<Label class="text-sm font-medium text-slate-500 dark:text-slate-400"
								>Phone Number</Label
							>
							<p class="text-slate-900 dark:text-slate-100 font-medium">{opposition.phone}</p>
						</div>
						<div class="space-y-1 md:col-span-2">
							<Label class="text-sm font-medium text-slate-500 dark:text-slate-400">Address</Label>
							<p class="text-slate-900 dark:text-slate-100 font-medium">{opposition.address}</p>
						</div>
					</div>
				</div>

				<!-- Attachments Section -->
				<div
					class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
				>
					<div class="flex items-center space-x-3 mb-4">
						<div class="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
							<Icon icon="lucide:paperclip" class="w-5 h-5 text-green-600 dark:text-green-400" />
						</div>
						<h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Attachments</h3>
					</div>
					<div class="space-y-3">
						{#if opposition.supportingDocs}
							{#each opposition.supportingDocs as doc}
								<a
									href={doc}
									target="_blank"
									class="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200 group"
								>
									<div class="flex items-center space-x-3">
										<div class="bg-red-100 dark:bg-red-900/30 p-2 rounded-md">
											<Icon
												icon="lucide:file-text"
												class="w-4 h-4 text-red-600 dark:text-red-400"
											/>
										</div>
										<span class="font-medium text-slate-900 dark:text-slate-100"
											>Opposition Document</span
										>
									</div>
									<Icon
										icon="lucide:external-link"
										class="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"
									/>
								</a>
							{/each}
						{/if}
					</div>
				</div>
				{#if parseInt(opposition.status) === 30}
					<button
						type="submit"
						disabled={isLoading}
						on:click={() => notifyApplicant(opposition.id)}
						class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{#if isLoading}
							<div class="flex items-center justify-center">
								<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
								Notify...
							</div>
						{:else}
							Notify Applicant
						{/if}
					</button>
				{/if}
			</div>
		{:else if currentView === 12}
			<Dialog.Header>
				<Dialog.Title>Opposition History</Dialog.Title>
			</Dialog.Header>
			<div class="flex p-2">
				<div class="gap-10 grid grid-cols-1 px-2 py-2 w-full">
					{#each oppositionHistory as data}
						<div class="flex justify-between gap-4 relative">
							<div class="border-dotted border w-0 h-full absolute left-4"></div>
							<div class="bg-gray-500 w-3 h-3 rounded-full absolute left-2.5 mt-3"></div>
							<div class="ml-8 flex-1">
								<div class="flex justify-between items-center">
									<p class="font-light text-gray-400" style="font-size: 13px">
										{mapDateToString(data.oppositionDate)}
									</p>
									<Button variant="outline" class="gap-1">
										<Icon icon="radix-icons:avatar" width="1.2rem" height="1.2rem" />
										{data.user}
									</Button>
								</div>
								{#if data.status !== null}
									<div class="flex items-center py-1 gap-7">
										<AppStatusTag value={data.status} />
									</div>
								{/if}
								<p>{data.message}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else if currentView === 13}
			<Dialog.Header>
				<Dialog.Title>Resolution Attachment</Dialog.Title>
			</Dialog.Header>
			<div class="p-2">
				<div>
					<Label for="attachmentResolution">Attachment</Label>
					<Input
						id="attachmentResolution"
						type="file"
						accept=".pdf"
						on:change={(event) => fileChanged(event)}
					/>
				</div>
			</div>
			<Dialog.Footer>
				<Button
					variant="destructive"
					on:click={() => {
						showRaiseOpposition = false;
					}}>Cancel</Button
				>
				<Button
					on:click={async () => {
						await generateRRR('resolution');
					}}>Ok</Button
				>
			</Dialog.Footer>
		{:else if currentView === 1}
			<Dialog.Header>
				<Dialog.Title>Payment Details</Dialog.Title>
			</Dialog.Header>
			<div class="flex flex-col space-y-3 p-2">
				<div>
					<Label for="amount">Amount</Label>
					<p id="amount">{amount}</p>
				</div>
				<div>
					<Label for="RRR">payment ID</Label>
					<p id="RRR">{rrr}</p>
				</div>
			</div>
			<Dialog.Footer>
				<Button
					variant="destructive"
					on:click={() => {
						showRaiseOpposition = false;
					}}>Cancel</Button
				>
				<Button
					on:click={() => {
						let go_url = '';
						if (paymentType === 'resolution') {
							go_url =
								`/payment?type=oppositionResolution&oppositionId=${selectedID}&title=Resolution statement on opposition regarding -${selectedTitle}-` +
								`&fileUrl=${fileURL}&rrr=${rrr}&cost=${amount}`;
						}
						if (paymentType === 'response') {
							go_url =
								`/payment?type=oppositionCounter&oppositionId=${selectedID}&title=Counter statement on opposition regarding -${selectedTitle}-` +
								`&name=${name}&address=${address}&number=${number}&email=${email}` +
								`&fileUrl=${fileURL}&rrr=${rrr}&cost=${amount}`;
						}
						goto(go_url);
					}}>Ok</Button
				>
			</Dialog.Footer>
		{:else if currentView === 19}
			<Dialog.Header>
				<Dialog.Title>Resolve Opposition</Dialog.Title>
			</Dialog.Header>
			<div class="p-2 space-y-4">
				<Textarea placeholder="enter text" bind:value={resolvedText} class="min-h-24" />
				<Button on:click={() => resolveOpposition()} class="w-full">
					<div class="items-center justify-center flex {isResolving ? '' : 'hidden'}">
						<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
					</div>
					{isResolving ? 'Processing...' : 'Ok'}
				</Button>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
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
												<DropdownMenu.Root>
													<DropdownMenu.Trigger asChild let:builder>
														<Button builders={[builder]}>
															Actions <ChevronDown class="ml-2 h-4 w-4" />
														</Button>
													</DropdownMenu.Trigger>
													<DropdownMenu.Content>
														<DropdownMenu.Item on:click={() => raiseOppositionView(row.cells)}
															>View opposition</DropdownMenu.Item
														>
														{#if yetToNotify(row.cells)}
															<DropdownMenu.Item>Notify Applicant</DropdownMenu.Item>
														{/if}
														<!-- {#if canUploadResponse(row.cells)}
															<DropdownMenu.Item on:click={() => UploadState('response', row.cells)}
																>Upload Counter statement</DropdownMenu.Item
															>
														{/if}
														{#if canUploadResolution(row.cells)}
															<DropdownMenu.Item
																on:click={() => UploadState('resolution', row.cells)}
																>Upload resolution</DropdownMenu.Item
															>
														{/if} -->
														{#if canResolve(row.cells)}
															<DropdownMenu.Item on:click={() => viewResolve(row.cells)}>
																Mark as resolved
															</DropdownMenu.Item>
														{/if}
														<DropdownMenu.Item on:click={() => viewOppositionHistory(row.cells)}>
															View history
														</DropdownMenu.Item>
													</DropdownMenu.Content>
												</DropdownMenu.Root>
											{:else if cell.id === 'fileId'}
												<Button on:click={() => goto(`/dataview?id=${cell.render()}`)}>
													View trademark
												</Button>
											{:else if cell.id === 'date'}
												<div class="w-24"><Render of={mapDateToString(cell.render())} /></div>
											{:else if cell.id === 'currentStatus'}
												<div class="w-24"><AppStatusTag value={parseInt(cell.render())} /></div>
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

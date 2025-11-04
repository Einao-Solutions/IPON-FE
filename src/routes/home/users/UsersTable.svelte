<script lang="ts">
	import { createTable, Subscribe, Render, createRender } from 'svelte-headless-table';
	import { type Writable, writable } from 'svelte/store';
	import * as Table from '$lib/components/ui/table';
	import { baseURL, mapRoleToString, UserRoles, type UsersType, UserTypes } from '$lib/helpers';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import * as Pagination from '$lib/components/ui/pagination';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Sheet from "$lib/components/ui/sheet"
	import { addPagination } from 'svelte-headless-table/plugins';
	import { ChevronsUpDown } from 'lucide-svelte';
	import type { RecordSetStore } from 'svelte-headless-table/dist/utils/store';
	import { Input } from '$lib/components/ui/input';
	import Icon from '@iconify/svelte';
	import { Label } from '$lib/components/ui/label';
	import { Toaster } from '$lib/components/ui/sonner';
	import { toast } from 'svelte-sonner';
	export let usersList: UsersType[] | null = [];
	let tableHeaderRows, tablePageRows, _tableAttrs, _tableBodyAttrs;
	let _hasNextPage, _hasPreviousPage, _pageIndex;
	let _flatColumns;
	let updatedRoles= writable<UserRoles[]>([]);
	export let currentDataPage:number=0;

	$:{
		_pageIndex=currentDataPage
		console.log(_pageIndex)
	}
	let selectedUser:UsersType|null = null;
	let viewUserDetails=false;
	let userLoading=false;
	async function viewUser(id:string){
		userLoading=true;
		const result= await fetch(`${baseURL}/api/users/GetUserById?userId=${id}`)
		selectedUser=await result.json()
		updatedRoles.set(selecteduser?.userRoles??[])
		userLoading=false;
		viewUserDetails=true;
	}
	let isUpdatingUser=false;
	async function saveRoles(){
		isUpdatingUser=true;
		selectedUser.userRoles=$updatedRoles
		await fetch(`${baseURL}/api/users/UpdateUser`, {
			method: 'POST',
			headers:{"Content-Type":"application/json"},
			body:JSON.stringify(selectedUser)
		})
		isUpdatingUser=false;
		toast.info("successfully updated user", {
			position:"top-right"
		})
	}

	let _selectedDataIds: RecordSetStore<string>;
	const resultLength = [10, 15, 20, 25, 30, 35, 40, 45, 50, 75, 100];
	$: {
		const table = createTable(writable(usersList ?? []), {
			page: addPagination({ initialPageSize: $selectedResultList })
		});
		const columns = table.createColumns([
			table.column({
				accessor: 'sn',
				header: 'S/N'
			}),

			table.column({
				accessor: 'name',
				header: 'Name'
			}),
			table.column({
				accessor: 'email',
				header: 'Email'
			}),
			table.column({
				accessor: 'id',
				header: 'View'
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
		_flatColumns = flatColumns;
		const ids = _flatColumns.map((col) => col.id);
	}

	let showResultLengthList: boolean = false;
	let selectedResultList= writable<number>(10);
	let isLoading: boolean = false;
	async function loadPage(counter: number, startIndex: number) {
		isLoading = true;
		const namesUrl = `${baseURL}/api/users/LoadUsers`;
		let body = {
			skip: startIndex,
			take: $selectedResultList
		};
		if (searchName !== undefined) {
			body.name = searchName;
		}
		const result = await fetch(namesUrl, {
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
			_dataList.push({
				'sn': startIndex + i + 1,
				name: curr.name,
				email: curr.email,
				id: curr.id
			});
		}
		usersList = [..._dataList];
		count = filescount;
		isLoading = false;
	}
	export let count: number = 0;
	let searchName: string | undefined = undefined;

	async function searchUsers() {
		loadPage(0, 0);
	}
</script>

<Toaster />
<Sheet.Root bind:open={viewUserDetails}>
	<Sheet.Content class="overflow-y-auto">
		<Sheet.Header>
			<Sheet.Title>{selectedUser?.name}</Sheet.Title>
			<Sheet.Description>UserID {selectedUser?.id}</Sheet.Description>
		</Sheet.Header>
	<div>
		<div>
			<Label>Display Name</Label>
			<p>{selectedUser?.name}</p>
		</div>
		<div>
			<Label>Email</Label>
			<p>{selectedUser?.email}</p>
		</div>
		<div>
			<Label>User Roles</Label>
			{#each selecteduser?.userRoles as userole}
					<div class="border border-blue-950 p-2 m-2">{mapRoleToString(userole)}</div>
				{/each}
		</div>
		<Label>Update roles</Label>
		<p>Select all that applies</p>
		<br />
		<!--{#each $updatedRoles as userole}-->
		<!--	<div class="border border-green-950 p-2 m-2">{mapRoleToString(userole)}</div>-->
		<!--{/each}-->
		<div class="grid grid-cols-2 gap-4 ">
			{#each Object.values(UserRoles).filter((x) => isNaN(parseInt(x))===false) as role }
				<Button variant="ghost"  class="border border-green-400 m-1 p-1 {$updatedRoles.includes(role)?'bg-gray-500':'' } " on:click={()=>{
					if ($updatedRoles.includes(role)){
						updatedRoles.update(x=>{
							x.splice(x.indexOf(role), 1);
							return x;
						})
					}
					else {
						updatedRoles.update(t=>{
							t.push(role);
							return [...t]
						});
					}
				}}>
					{mapRoleToString(role)}
				</Button>
			{/each}
			<br />
			<Button on:click={()=>saveRoles()}>
				update User
				{#if isUpdatingUser}
					<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
				{/if}
			</Button>
		</div>
	</div>
	</Sheet.Content>
</Sheet.Root>
{#if isLoading === true}
	<div class="items-center justify-center flex h-screen">
		<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
	</div>
{:else}
	<div>
		<div class="flex space-x-2">
			<Input placeholder="search for any user" bind:value={searchName} />
			<Button on:click={() => searchUsers()}>Search</Button>
		</div>
		<div class="ml-auto mr-20">
			<DropdownMenu.Root bind:open={showResultLengthList}>
				<DropdownMenu.Trigger asChild let:builder>
					<Button builders={[builder]} variant="outline">
						Results per Page ({$selectedResultList})
						<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-fit p-1">
					{#each resultLength as rl}
						<DropdownMenu.Item on:click={() => ($selectedResultList = rl)}>
							<span>{rl}</span>
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
		<div class="rounded-md border">
			<Table.Root {...$_tableAttrs}>
				<Table.Header>
					{#each $tableHeaderRows as headerRow}
						<Subscribe rowAttrs={headerRow.attrs()}>
							<Table.Row>
								{#each headerRow.cells as cell (cell.id)}
									<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()}>
										<Table.Head {...attrs} class="[&:has([role=checkbox])]:pl-3">
											{#if cell.id === 'id'}
												<Render of={'view'} />
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
							<Table.Row {...rowAttrs}>
								{#each row.cells as cell (cell.id)}
									<Subscribe attrs={cell.attrs()} let:attrs>
										<Table.Cell {...attrs}>
											{#if cell.id === 'id'}
												<Button on:click={()=>viewUser(cell.render())} >View
													{#if userLoading}
														<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
														{/if}
												</Button>
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
			<Pagination.Root {count} perPage={$selectedResultList} let:pages let:currentPage>
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.PrevButton
							on:click={() => {
								_pageIndex = _pageIndex - 1;
								loadPage($selectedResultList, $selectedResultList * _pageIndex);
								currentDataPage = _pageIndex;
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
									isActive={_pageIndex + 1 === page.value}
									on:click={() => {
										_pageIndex = page.value - 1;
										loadPage($selectedResultList, $selectedResultList * _pageIndex);
										currentDataPage = _pageIndex;
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
								_pageIndex += 1;
								loadPage($selectedResultList, $selectedResultList * _pageIndex);
								currentDataPage = _pageIndex;
							}}
						/>
					</Pagination.Item>
				</Pagination.Content>
			</Pagination.Root>
		</div>
	</div>
{/if}

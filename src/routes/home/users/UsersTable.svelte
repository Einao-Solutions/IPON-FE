<script lang="ts">
  import { createTable, Subscribe, Render } from "svelte-headless-table";
  import { writable } from "svelte/store";
  import * as Table from "$lib/components/ui/table";
  import {
    baseURL,
    mapRoleToString,
    UserRoles,
    type UsersType,
  } from "$lib/helpers";
  import { Button } from "$lib/components/ui/button";
  import * as Pagination from "$lib/components/ui/pagination";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as Sheet from "$lib/components/ui/sheet";
  import { addPagination } from "svelte-headless-table/plugins";
  import { ChevronsUpDown, Search } from "lucide-svelte";
  import { Input } from "$lib/components/ui/input";
  import Icon from "@iconify/svelte";
  import { Label } from "$lib/components/ui/label";
  import { Toaster } from "$lib/components/ui/sonner";
  import { toast } from "svelte-sonner";
  import { loggedInUser } from "$lib/store";

  interface UserTableRow {
    sn: number;
    name: string;
    email: string;
    id: string;
  }

  export let usersList: UserTableRow[] | null = [];
  let tableHeaderRows: any,
    tablePageRows: any,
    _tableAttrs: any,
    _tableBodyAttrs: any;
  let _hasNextPage: any,
    _hasPreviousPage: any,
    _pageIndex: any = 0;
  let _flatColumns: any;
  let updatedRoles = writable<UserRoles[]>([]);
  export let currentDataPage: number = 0;

  $: {
    _pageIndex = currentDataPage;
  }

  let selectedUser: UsersType | null = null;
  let viewUserDetails = false;
  let loadingUserId: string | null = null;

  async function viewUser(id: string) {
    loadingUserId = id;
    const result = await fetch(`${baseURL}/api/users/GetUserById?id=${id}`);
    selectedUser = await result.json();
    updatedRoles.set([...(selectedUser?.userRoles ?? [])]);
    loadingUserId = null;
    viewUserDetails = true;
  }

  let isUpdatingUser = false;
  async function saveRoles() {
    if (!selectedUser) return;
    isUpdatingUser = true;
    const originalRoles = selectedUser.userRoles ?? [];
    const newRoles = $updatedRoles;
    const addRoles = newRoles.filter((r) => !originalRoles.includes(r));
    const removeRoles = originalRoles.filter((r) => !newRoles.includes(r));
    if (addRoles.length === 0 && removeRoles.length === 0) {
      isUpdatingUser = false;
      toast.info("No role changes to save", { position: "top-right" });
      return;
    }
    const response = await fetch(`${baseURL}/api/users/UpdateUserRoles`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedUser.id,
        addRoles: addRoles.length > 0 ? addRoles : null,
        removeRoles: removeRoles.length > 0 ? removeRoles : null,
      }),
    });
    selectedUser = { ...selectedUser, userRoles: [...newRoles] };
    isUpdatingUser = false;
    if (response.ok)
      toast.info("Successfully updated user", {
        position: "top-right",
      });
    else
      toast.error("Failed to update user", {
        position: "top-right",
      });
  }

  const resultLength = [10, 15, 20, 25, 30, 35, 40, 45, 50, 75, 100];
  $: {
    const table = createTable(writable(usersList ?? []), {
      page: addPagination({ initialPageSize: $selectedResultList }),
    });
    const columns = table.createColumns([
      table.column({
        accessor: "sn",
        header: "S/N",
      }),
      table.column({
        accessor: "name",
        header: "Name",
      }),
      table.column({
        accessor: "email",
        header: "Email",
      }),
      table.column({
        accessor: "id",
        header: "View",
      }),
    ]);
    const {
      headerRows,
      pageRows,
      tableAttrs,
      flatColumns,
      tableBodyAttrs,
      pluginStates,
    } = table.createViewModel(columns);
    tableHeaderRows = headerRows;
    _tableBodyAttrs = tableBodyAttrs;
    tablePageRows = pageRows;
    _tableAttrs = tableAttrs;
    const { hasNextPage, hasPreviousPage, pageIndex } = pluginStates.page;
    _hasNextPage = hasNextPage;
    _hasPreviousPage = hasPreviousPage;
    _pageIndex = pageIndex;
    _flatColumns = flatColumns;
  }

  let showResultLengthList: boolean = false;
  let selectedResultList = writable<number>(10);
  let isLoading: boolean = false;

  async function loadPage(counter: number, startIndex: number) {
    isLoading = true;
    let body: { skip: number; take: number; name?: string } = {
      skip: startIndex,
      take: $selectedResultList,
    };
    if (searchName) {
      body.name = searchName;
    }
    const result = await fetch(`${baseURL}/api/users/GetAllUsers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const resp = await result.json();
    const users: any[] = resp.users;
    let _dataList: UserTableRow[] = [];
    for (let i = 0; i < users.length; i++) {
      _dataList.push({
        sn: startIndex + i + 1,
        name: users[i].name,
        email: users[i].email,
        id: users[i].id,
      });
    }
    usersList = _dataList;
    count = resp.totalCount;
    isLoading = false;
  }

  export let count: number = 0;
  let searchName: string | undefined = undefined;

  async function searchUsers() {
    _pageIndex = 0;
    currentDataPage = 0;
    loadPage(0, 0);
  }

  function getNumericRoles(): UserRoles[] {
    return Object.values(UserRoles).filter(
      (x): x is UserRoles => typeof x === "number",
    );
  }
</script>

<Toaster />
<Sheet.Root bind:open={viewUserDetails}>
  <Sheet.Content class="overflow-y-auto">
    <Sheet.Header>
      <Sheet.Title class="text-lg font-semibold"
        >{selectedUser?.name ??
          `${selectedUser?.firstName} ${selectedUser?.lastName}`}</Sheet.Title
      >
      <Sheet.Description class="text-muted-foreground"
        >User ID: {selectedUser?.id}</Sheet.Description
      >
    </Sheet.Header>
    <div class="mt-6 space-y-5">
      <div class="rounded-md border border-border bg-muted/30 p-4 space-y-3">
        <div>
          <Label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >Display Name</Label
          >
          <p class="mt-1 text-sm font-medium">
            {selectedUser?.name ??
              `${selectedUser?.firstName} ${selectedUser?.lastName}`}
          </p>
        </div>
        <div>
          <Label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >Email</Label
          >
          <p class="mt-1 text-sm font-medium">{selectedUser?.email}</p>
        </div>
        <div>
          <Label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >Current Roles</Label
          >
          <div class="mt-2 flex flex-wrap gap-2">
            {#each selectedUser?.userRoles ?? [] as userRole}
              <span
                class="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary border border-primary/20"
              >
                {mapRoleToString(userRole)}
              </span>
            {/each}
          </div>
        </div>
      </div>
      {#if $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin)}
        <div>
          <Label class="text-sm font-medium">Update Roles</Label>
          <p class="text-xs text-muted-foreground mt-1 mb-3">
            Select all that apply
          </p>
          <div class="grid grid-cols-2 gap-2">
            {#each getNumericRoles() as role}
              <Button
                variant="outline"
                size="sm"
                class="justify-start text-xs {$updatedRoles.includes(role)
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'hover:bg-accent'}"
                on:click={() => {
                  if ($updatedRoles.includes(role)) {
                    updatedRoles.update((x) => {
                      x.splice(x.indexOf(role), 1);
                      return [...x];
                    });
                  } else {
                    updatedRoles.update((t) => {
                      t.push(role);
                      return [...t];
                    });
                  }
                }}
              >
                {mapRoleToString(role)}
              </Button>
            {/each}
          </div>
          <Button class="w-full mt-4" on:click={() => saveRoles()}>
            {#if isUpdatingUser}
              <Icon
                icon="line-md:loading-loop"
                width="1rem"
                height="1rem"
                class="mr-2"
              />
            {/if}
            Update User
          </Button>
        </div>
      {/if}
    </div>
  </Sheet.Content>
</Sheet.Root>

{#if isLoading}
  <div class="flex items-center justify-center w-full py-32">
    <Icon
      icon="line-md:loading-loop"
      width="2rem"
      height="2rem"
      class="text-primary"
    />
  </div>
{:else}
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <div class="relative flex-1">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        />
        <Input
          placeholder="Search for any user..."
          bind:value={searchName}
          class="pl-9"
          on:keydown={(e) => {
            if (e.key === "Enter") searchUsers();
          }}
        />
      </div>
      <Button on:click={() => searchUsers()}>Search</Button>
      <DropdownMenu.Root bind:open={showResultLengthList}>
        <DropdownMenu.Trigger asChild let:builder>
          <Button builders={[builder]} variant="outline" size="sm">
            {$selectedResultList} per page
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

    <div class="rounded-lg border border-border overflow-hidden">
      <Table.Root {...$_tableAttrs}>
        <Table.Header class="bg-muted/50">
          {#each $tableHeaderRows as headerRow}
            <Subscribe rowAttrs={headerRow.attrs()}>
              <Table.Row class="hover:bg-transparent">
                {#each headerRow.cells as cell (cell.id)}
                  <Subscribe
                    attrs={cell.attrs()}
                    let:attrs
                    props={cell.props()}
                  >
                    <Table.Head
                      {...attrs}
                      class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {#if cell.id === "id"}
                        <span>Action</span>
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
              <Table.Row
                {...rowAttrs}
                class="transition-colors hover:bg-muted/50"
              >
                {#each row.cells as cell (cell.id)}
                  <Subscribe attrs={cell.attrs()} let:attrs>
                    <Table.Cell {...attrs} class="text-sm">
                      {#if cell.id === "id"}
                        <Button
                          variant="outline"
                          size="sm"
                          on:click={() => viewUser(cell.render())}
                        >
                          {#if loadingUserId === cell.render()}
                            <Icon
                              icon="line-md:loading-loop"
                              width="1rem"
                              height="1rem"
                              class="mr-1"
                            />
                          {/if}
                          View
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

    <div class="flex items-center justify-between py-2">
      <p class="text-sm text-muted-foreground">
        {count} total users
      </p>
      <Pagination.Root
        {count}
        perPage={$selectedResultList}
        let:pages
        let:currentPage
      >
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
            {#if page.type === "ellipsis"}
              <Pagination.Item>
                <Pagination.Ellipsis />
              </Pagination.Item>
            {:else}
              <Pagination.Item>
                <Pagination.Link
                  {page}
                  isActive={_pageIndex + 1 === page.value}
                  on:click={() => {
                    _pageIndex = page.value - 1;
                    loadPage(
                      $selectedResultList,
                      $selectedResultList * _pageIndex,
                    );
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

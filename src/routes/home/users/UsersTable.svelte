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
  import { ChevronsUpDown, Search, Users, ArrowUpRight } from "lucide-svelte";
  import { Input } from "$lib/components/ui/input";
  import Icon from "@iconify/svelte";
  import { Label } from "$lib/components/ui/label";
  import { toast } from "svelte-sonner";
  import { loggedInUser } from "$lib/store";
  import { authFetch } from "$lib/utils/authFetch";
  import {
    roleDisplayName,
    roleErrorMessage,
    type RoleOption,
  } from "$lib/utils/userRolesApi";
  import UserRoleEditor from "./UserRoleEditor.svelte";

  interface UserTableRow {
    sn: number;
    name: string;
    email: string;
    id: string;
  }

  export let usersList: UserTableRow[] | null = [];
  export let roles: RoleOption[] = [];
  let tableHeaderRows: any,
    tablePageRows: any,
    _tableAttrs: any,
    _tableBodyAttrs: any;
  let _hasNextPage: any,
    _hasPreviousPage: any,
    _pageIndex: any = 0;
  let _flatColumns: any;
  export let currentDataPage: number = 0;

  $: {
    _pageIndex = currentDataPage;
  }

  let selectedUser: UsersType | null = null;
  let viewUserDetails = false;
  let loadingUserId: string | null = null;

  async function viewUser(id: string) {
    loadingUserId = id;
    try {
      const result = await authFetch(
        `${baseURL}/api/users/GetUserById?id=${encodeURIComponent(id)}`,
      );
      if (!result.ok) {
        throw new Error(
          result.status === 403
            ? "Access denied."
            : `Unable to load user (${result.status}). Please retry.`,
        );
      }
      selectedUser = await result.json();
      viewUserDetails = true;
    } catch (error) {
      toast.error(roleErrorMessage(error), { position: "top-right" });
    } finally {
      loadingUserId = null;
    }
  }

  const resultLength = [10, 20, 50, 100];
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
    const result = await authFetch(`${baseURL}/api/users/GetAllUsers`, {
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

</script>

<Sheet.Root bind:open={viewUserDetails}>
  <Sheet.Content class="user-role-sheet">
    <Sheet.Header class="users-sheet-header">
      <div class="users-sheet-icon"><Users size={22} aria-hidden="true" /></div>
      <Sheet.Title class="text-lg font-semibold"
        >{selectedUser?.name ??
          `${selectedUser?.firstName} ${selectedUser?.lastName}`}</Sheet.Title
      >
      <Sheet.Description class="text-muted-foreground break-all"
        >{selectedUser?.email}</Sheet.Description
      >
    </Sheet.Header>
    <div class="mt-6 space-y-5">
      <div class="users-profile-card space-y-4">
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
                class="users-role-badge"
              >
                {$loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin)
                  ? roleDisplayName(userRole, roles)
                  : mapRoleToString(userRole)}
              </span>
            {/each}
          </div>
        </div>
      </div>
      {#if $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin) && selectedUser && viewUserDetails}
        {#key selectedUser.id}
          <UserRoleEditor
            userId={selectedUser.id}
            originalRoles={selectedUser.userRoles ?? []}
            {roles}
            on:updated={(event) => {
              if (selectedUser) {
                selectedUser = { ...selectedUser, userRoles: event.detail };
              }
            }}
          />
        {/key}
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
  <div class="users-panel space-y-5">
    <div class="users-section-heading">
      <div>
        <h2>User Directory</h2>
        <p class="users-section-description">Find an account and open its details to review profile information and roles.</p>
      </div>
      <span class="users-count-badge"><Users size={14} aria-hidden="true" />{count} total users</span>
    </div>
    <div class="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4">
      <div class="users-search-wrap min-w-[160px] flex-1">
        <Search
          class="users-search-icon h-4 w-4"
          aria-hidden="true"
        />
        <Input
          placeholder="Search for any user..."
          bind:value={searchName}
          class="users-search-input"
          aria-label="Search users"
          on:keydown={(e) => {
            if (e.key === "Enter") searchUsers();
          }}
        />
      </div>
      <Button class="users-primary-action h-[42px] gap-2 rounded-lg px-5 text-xs" on:click={() => searchUsers()}><Search size={14} aria-hidden="true" />Search</Button>
      <DropdownMenu.Root bind:open={showResultLengthList}>
        <DropdownMenu.Trigger asChild let:builder>
          <Button builders={[builder]} variant="outline" size="sm" class="h-[42px] rounded-lg border-slate-200 bg-white text-xs">
            {$selectedResultList} per page
            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content class="w-fit p-1">
          {#each resultLength as rl}
            <DropdownMenu.Item on:click={() => {
              $selectedResultList = rl;
              searchUsers();
            }}>
              <span>{rl}</span>
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>

    <div class="users-table-wrap">
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
                          class="users-row-action"
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
                          View <ArrowUpRight size={13} aria-hidden="true" />
                        </Button>
                      {:else if cell.id === "name"}
                        <div class="users-person">
                          <span class="users-avatar" aria-hidden="true">{String(cell.render() ?? "").trim().charAt(0).toUpperCase() || "U"}</span>
                          <Render of={cell.render()} />
                        </div>
                      {:else if cell.id === "email"}
                        <span class="users-secondary-text"><Render of={cell.render()} /></span>
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

    <div class="users-pagination">
      <p>
        {count} total users
      </p>
      <Pagination.Root
        {count}
        perPage={$selectedResultList}
        page={currentDataPage + 1}
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
                  aria-current={_pageIndex + 1 === page.value ? "page" : undefined}
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

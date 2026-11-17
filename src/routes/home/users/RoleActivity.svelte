<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import * as Table from "$lib/components/ui/table";
  import { createRoleQuery } from "$lib/utils/roleQuery";
  import { userRolesRefresh } from "$lib/utils/userRolesRefresh";
  import {
    userRolesApi,
    roleDisplayName,
    type RoleOption,
    type RolePage,
    type RoleAssigner,
    type RoleActivity,
  } from "$lib/utils/userRolesApi";
  import RolePagination from "./RolePagination.svelte";
  import {
    History,
    Users,
    Info,
    Search,
    ArrowUpRight,
    ShieldCheck,
    LoaderCircle,
    Plus,
    Minus,
  } from "lucide-svelte";

  export let roles: RoleOption[];
  let view: "assigners" | "history" = "assigners";
  let assigner: RoleAssigner | null = null;
  const assigners = createRoleQuery<RolePage<RoleAssigner>>();
  const history = createRoleQuery<RolePage<RoleActivity>>();
  let assignerSearch = "";
  let assignerPage = 0;
  let assignerPageSize = 10;
  let search = "";
  let historyPage = 0;
  let historyPageSize = 10;
  let role: number | "" = "";
  let action: "" | "Added" | "Removed" = "";
  let from = "";
  let to = "";
  let timer: ReturnType<typeof setTimeout>;

  function refresh() {
    if (view === "assigners") loadAssigners();
    else loadHistory();
  }

  function localDate(value: string) {
    return new Date(value).toLocaleString();
  }

  function loadAssigners() {
    clearTimeout(timer);
    void assigners.load((signal) =>
      userRolesApi.getAssigners(
        {
          search: assignerSearch,
          pageIndex: assignerPage,
          pageSize: assignerPageSize,
        },
        signal,
      ),
    );
  }

  function loadHistory() {
    clearTimeout(timer);
    void history.load((signal) =>
      userRolesApi.getHistory(
        {
          search,
          pageIndex: historyPage,
          pageSize: historyPageSize,
          assignedById: assigner?.id,
          role,
          action,
          from,
          to,
        },
        signal,
      ),
    );
  }

  function searchAssigners() {
    assignerPage = 0;
    assigners.cancel();
    clearTimeout(timer);
    timer = setTimeout(loadAssigners, 300);
  }

  function filtersChanged(debounce = false) {
    historyPage = 0;
    history.cancel();
    clearTimeout(timer);
    if (debounce) timer = setTimeout(loadHistory, 300);
    else loadHistory();
  }

  function showAssigners() {
    history.cancel();
    view = "assigners";
    loadAssigners();
  }

  function showHistory(selected: RoleAssigner | null = null) {
    assigners.cancel();
    assigner = selected;
    view = "history";
    search = "";
    role = "";
    action = "";
    from = "";
    to = "";
    historyPage = 0;
    loadHistory();
  }

  onMount(() => userRolesRefresh.subscribe(refresh));
  onDestroy(() => {
    clearTimeout(timer);
    assigners.cancel();
    history.cancel();
  });
</script>

<section
  class="users-content-card users-panel space-y-5"
  aria-label="Role Assignment Activity"
>
  <div class="users-section-heading">
    <div>
      <h2>Role Assignment Activity</h2>
      <p class="users-section-description">
        A clear view of who changed access, which roles changed, and when.
      </p>
    </div>
    <span class="users-count-badge"
      ><ShieldCheck size={14} aria-hidden="true" />Read-only audit</span
    >
  </div>
  <div class="users-audit-note">
    <Info size={16} aria-hidden="true" />
    <p>
      Read-only audit records cover changes recorded since tracking was
      introduced. Empty history does not mean no roles were assigned before
      tracking began. Names and emails are historical snapshots and may differ
      from current profiles.
    </p>
  </div>
  <div class="users-view-switch" aria-label="Activity views">
    <Button
      variant="ghost"
      aria-pressed={view === "assigners"}
      on:click={showAssigners}
      ><Users size={15} aria-hidden="true" />Assigners</Button
    >
    <Button
      variant="ghost"
      aria-pressed={view === "history" && !assigner}
      on:click={() => showHistory()}
      ><History size={15} aria-hidden="true" />All Activity</Button
    >
  </div>

  {#if view === "assigners"}
    <p class="users-section-description">
      Users who actually added roles. Total role additions count individual
      roles, not recipients or requests. Users who only removed roles appear in
      All Activity.
    </p>
    <div class="users-filter-panel">
      <label for="role-assigner-search">
        Search assigners
        <div class="users-search-wrap">
          <Search size={16} class="users-search-icon" aria-hidden="true" />
          <Input
            id="role-assigner-search"
            class="users-search-input"
            placeholder="Search names or emails..."
            maxlength={200}
            bind:value={assignerSearch}
            on:input={searchAssigners}
          />
        </div>
      </label>
    </div>
    {#if $assigners.loading}
      <p role="status" class="users-state">
        <LoaderCircle size={18} class="animate-spin" aria-hidden="true" />
        Loading assigners...
      </p>
    {:else if $assigners.error}
      <div role="alert" class="users-error space-y-2">
        <p>{$assigners.error}</p>
        {#if $assigners.retryable}<Button
            variant="outline"
            on:click={loadAssigners}>Retry</Button
          >{/if}
      </div>
    {:else if $assigners.data}
      {#if $assigners.data.items.length === 0}
        <p class="users-state">No recorded role assigners match this search.</p>
      {:else}
        <div class="users-table-wrap">
          <Table.Root>
            <Table.Header class="bg-muted/50">
              <Table.Row>
                <Table.Head>Name</Table.Head><Table.Head>Email</Table.Head>
                <Table.Head>Total role additions</Table.Head><Table.Head
                  >Last assignment</Table.Head
                >
                <Table.Head>Action</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each $assigners.data.items as actor (actor.id)}
                <Table.Row>
                  <Table.Cell
                    ><div class="users-person">
                      <span class="users-avatar" aria-hidden="true"
                        >{actor.name?.trim().charAt(0).toUpperCase() ||
                          "U"}</span
                      ><span>{actor.name}</span>
                    </div></Table.Cell
                  ><Table.Cell class="users-secondary-text"
                    >{actor.email}</Table.Cell
                  >
                  <Table.Cell
                    ><span class="users-count-badge tabular-nums"
                      >{actor.assignmentCount}</span
                    ></Table.Cell
                  >
                  <Table.Cell class="whitespace-nowrap users-secondary-text"
                    >{localDate(actor.lastAssignedAt)}</Table.Cell
                  >
                  <Table.Cell
                    ><Button
                      variant="outline"
                      size="sm"
                      class="users-row-action"
                      on:click={() => showHistory(actor)}
                      >View Activity <ArrowUpRight
                        size={13}
                        aria-hidden="true"
                      /></Button
                    ></Table.Cell
                  >
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      {/if}
      <RolePagination
        bind:pageIndex={assignerPage}
        bind:pageSize={assignerPageSize}
        totalCount={$assigners.data.totalCount}
        on:change={loadAssigners}
      />
    {/if}
  {:else}
    {#if assigner}
      <div class="users-assigner-card">
        <div class="users-avatar" aria-hidden="true"><History size={18} /></div>
        <div class="min-w-0">
          <h3 class="font-semibold">Activity by {assigner.name}</h3>
          <p class="users-secondary-text mt-1">
            {assigner.email}
          </p>
          <p class="users-section-description">
            Showing recorded additions and removals by this assigner.
          </p>
        </div>
      </div>
    {/if}
    <div class="users-filter-panel sm:grid-cols-2 xl:grid-cols-3">
      <label for="role-activity-search" class="space-y-1 text-sm font-medium">
        Search activity
        <Input
          id="role-activity-search"
          placeholder="Actor or recipient name/email"
          maxlength={200}
          bind:value={search}
          on:input={() => filtersChanged(true)}
        />
      </label>
      <label class="space-y-1 text-sm font-medium">
        Role
        <select
          class="h-10 w-full rounded-md border bg-background px-3"
          bind:value={role}
          on:change={() => filtersChanged()}
        >
          <option value="">All roles</option>
          {#each roles as option (option.id)}<option value={option.id}
              >{option.name}</option
            >{/each}
        </select>
      </label>
      <label class="space-y-1 text-sm font-medium">
        Action
        <select
          class="h-10 w-full rounded-md border bg-background px-3"
          bind:value={action}
          on:change={() => filtersChanged()}
        >
          <option value="">All actions</option><option value="Added"
            >Added</option
          ><option value="Removed">Removed</option>
        </select>
      </label>
      <label for="role-activity-from" class="space-y-1 text-sm font-medium">
        From (local time, inclusive)
        <Input
          id="role-activity-from"
          type="datetime-local"
          step="1"
          bind:value={from}
          on:change={() => filtersChanged()}
        />
      </label>
      <label for="role-activity-to" class="space-y-1 text-sm font-medium">
        To (local time, inclusive)
        <Input
          id="role-activity-to"
          type="datetime-local"
          step="1"
          bind:value={to}
          on:change={() => filtersChanged()}
        />
      </label>
    </div>
    <p class="text-xs text-muted-foreground">
      Dates are displayed in your local timezone. Date filters are sent as UTC
      timestamps.
    </p>
    {#if $history.loading}
      <p role="status" class="users-state">
        <LoaderCircle size={18} class="animate-spin" aria-hidden="true" />
        Loading role activity...
      </p>
    {:else if $history.error}
      <div role="alert" class="users-error space-y-2">
        <p>{$history.error}</p>
        {#if $history.retryable}<Button variant="outline" on:click={loadHistory}
            >Retry</Button
          >{/if}
      </div>
    {:else if $history.data}
      {#if $history.data.items.length === 0}
        <p class="users-state">No recorded role changes match these filters.</p>
      {:else}
        <div class="users-table-wrap">
          <Table.Root>
            <Table.Header class="bg-muted/50">
              <Table.Row>
                <Table.Head>Changed by</Table.Head><Table.Head
                  >Recipient</Table.Head
                >
                <Table.Head>Role</Table.Head><Table.Head
                  >Added/Removed</Table.Head
                ><Table.Head>Date and time</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each $history.data.items as entry (entry.id)}
                <Table.Row>
                  <Table.Cell
                    ><p class="font-medium">{entry.assignedByName}</p>
                    <p class="text-xs text-muted-foreground">
                      {entry.assignedByEmail}
                    </p></Table.Cell
                  >
                  <Table.Cell
                    ><p class="font-medium">{entry.assignedToName}</p>
                    <p class="text-xs text-muted-foreground">
                      {entry.assignedToEmail}
                    </p></Table.Cell
                  >
                  <Table.Cell
                    ><span class="users-role-badge"
                      >{roleDisplayName(entry.role, roles)}</span
                    ></Table.Cell
                  >
                  <Table.Cell>
                    <span
                      class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold {entry.action ===
                      'Added'
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-rose-200 bg-rose-50 text-rose-700'}"
                    >
                      {#if entry.action === "Added"}<Plus
                          size={12}
                          aria-hidden="true"
                        />{:else}<Minus size={12} aria-hidden="true" />{/if}
                      {entry.action}</span
                    >
                  </Table.Cell>
                  <Table.Cell class="whitespace-nowrap users-secondary-text"
                    >{localDate(entry.occurredAt)}</Table.Cell
                  >
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      {/if}
      <RolePagination
        bind:pageIndex={historyPage}
        bind:pageSize={historyPageSize}
        totalCount={$history.data.totalCount}
        on:change={loadHistory}
      />
    {/if}
  {/if}
</section>

<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import * as Table from "$lib/components/ui/table";
  import * as Sheet from "$lib/components/ui/sheet";
  import { createRoleQuery } from "$lib/utils/roleQuery";
  import { userRolesRefresh } from "$lib/utils/userRolesRefresh";
  import {
    userRolesApi,
    roleDisplayName,
    type RoleOption,
    type RolePage,
    type RoleUser,
  } from "$lib/utils/userRolesApi";
  import RolePagination from "./RolePagination.svelte";
  import UserRoleEditor from "./UserRoleEditor.svelte";
  import {
    Search,
    ShieldCheck,
    ArrowUpRight,
    LoaderCircle,
  } from "lucide-svelte";

  export let roles: RoleOption[];
  const members = createRoleQuery<RolePage<RoleUser>>();
  let selectedRole = roles[0]?.id;
  let search = "";
  let pageIndex = 0;
  let pageSize = 10;
  let timer: ReturnType<typeof setTimeout>;
  let selectedUser: RoleUser | null = null;
  let detailsOpen = false;
  $: roleName = roles.find((role) => role.id === selectedRole)?.name ?? "";

  async function load() {
    clearTimeout(timer);
    if (selectedRole === undefined) return;
    await members.load((signal) =>
      userRolesApi.getMembers(
        selectedRole,
        { search, pageIndex, pageSize },
        signal,
      ),
    );
    if (
      $members.data &&
      pageIndex > 0 &&
      pageIndex * pageSize >= $members.data.totalCount
    ) {
      pageIndex = Math.max(
        0,
        Math.ceil($members.data.totalCount / pageSize) - 1,
      );
      void load();
    }
  }

  function searchChanged() {
    pageIndex = 0;
    members.cancel();
    clearTimeout(timer);
    timer = setTimeout(load, 300);
  }

  onMount(() =>
    userRolesRefresh.subscribe(() => {
      void load();
    }),
  );
  onDestroy(() => {
    clearTimeout(timer);
    members.cancel();
  });
</script>

<section
  class="users-content-card users-panel space-y-5"
  aria-label="Users by Role"
>
  <div class="users-section-heading">
    <div>
      <h2>Users by Role</h2>
      <p class="users-section-description">
        Choose a role to explore its current members and manage their access.
      </p>
    </div>
    <span class="users-count-badge"
      ><ShieldCheck size={14} aria-hidden="true" />{roles.length} available roles</span
    >
  </div>
  {#if roles.length === 0}
    <p class="text-muted-foreground">No roles are available.</p>
  {:else}
    <div class="users-filter-panel md:grid-cols-2">
      <label class="space-y-1 text-sm font-medium">
        Role
        <select
          class="h-10 w-full rounded-md border bg-background px-3"
          bind:value={selectedRole}
          on:change={() => {
            pageIndex = 0;
            load();
          }}
        >
          {#each roles as role (role.id)}
            <option value={role.id}>{role.name}</option>
          {/each}
        </select>
      </label>
      <label for="role-member-search" class="space-y-1 text-sm font-medium">
        Search members
        <div class="users-search-wrap">
          <Search size={16} class="users-search-icon" aria-hidden="true" />
          <Input
            id="role-member-search"
            class="users-search-input"
            placeholder="Search users..."
            maxlength={200}
            bind:value={search}
            on:input={searchChanged}
          />
        </div>
      </label>
    </div>
    <div
      class="flex flex-wrap items-center justify-between gap-2"
      aria-live="polite"
    >
      <span class="users-role-badge">{roleName}</span>
      {#if $members.data}<p class="users-secondary-text">
          {$members.data.totalCount} matching users
        </p>{/if}
    </div>
    {#if $members.loading}
      <p role="status" class="users-state">
        <LoaderCircle size={18} class="animate-spin" aria-hidden="true" />
        Loading members...
      </p>
    {:else if $members.error}
      <div role="alert" class="users-error space-y-2">
        <p>{$members.error}</p>
        {#if $members.retryable}<Button variant="outline" on:click={load}
            >Retry</Button
          >{/if}
      </div>
    {:else if $members.data}
      {#if $members.data.items.length === 0}
        <p class="users-state">No users match this role and search.</p>
      {:else}
        <div class="users-table-wrap">
          <Table.Root>
            <Table.Header class="bg-muted/50">
              <Table.Row>
                <Table.Head>Name</Table.Head><Table.Head>Email</Table.Head>
                <Table.Head>Phone number</Table.Head><Table.Head
                  >Verification</Table.Head
                >
                <Table.Head>Roles</Table.Head><Table.Head>Action</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each $members.data.items as member (member.id)}
                <Table.Row>
                  <Table.Cell>
                    <div class="users-person">
                      <span class="users-avatar" aria-hidden="true"
                        >{member.name?.trim().charAt(0).toUpperCase() ||
                          "U"}</span
                      ><span>{member.name}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell class="users-secondary-text"
                    >{member.email}</Table.Cell
                  >
                  <Table.Cell class="whitespace-nowrap users-secondary-text"
                    >{member.phoneNumber || "Not provided"}</Table.Cell
                  >
                  <Table.Cell>
                    <span
                      class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-medium {member.isVerified
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'}"
                    >
                      {#if member.isVerified}<ShieldCheck
                          size={12}
                          aria-hidden="true"
                        />{/if}
                      {member.isVerified ? "Verified" : "Not verified"}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <div class="flex min-w-[140px] flex-wrap gap-1.5">
                      {#each member.userRoles as role}
                        <span class="users-role-badge"
                          >{roleDisplayName(role, roles)}</span
                        >
                      {/each}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      variant="outline"
                      size="sm"
                      class="users-row-action"
                      on:click={() => {
                        selectedUser = member;
                        detailsOpen = true;
                      }}
                      >View <ArrowUpRight
                        size={13}
                        aria-hidden="true"
                      /></Button
                    >
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      {/if}
      <RolePagination
        bind:pageIndex
        bind:pageSize
        totalCount={$members.data.totalCount}
        on:change={load}
      />
    {/if}
  {/if}
</section>

<Sheet.Root bind:open={detailsOpen}>
  <Sheet.Content class="user-role-sheet">
    <Sheet.Header class="users-sheet-header">
      <div class="users-sheet-icon">
        <ShieldCheck size={22} aria-hidden="true" />
      </div>
      <Sheet.Title>{selectedUser?.name ?? "User roles"}</Sheet.Title>
      <Sheet.Description class="break-all"
        >{selectedUser?.email ?? ""}</Sheet.Description
      >
    </Sheet.Header>
    {#if selectedUser && detailsOpen}
      <div class="mt-6">
        {#key selectedUser.id}
          <UserRoleEditor
            userId={selectedUser.id}
            originalRoles={selectedUser.userRoles}
            {roles}
            on:updated={(event) => {
              if (selectedUser)
                selectedUser = { ...selectedUser, userRoles: event.detail };
            }}
          />
        {/key}
      </div>
    {/if}
  </Sheet.Content>
</Sheet.Root>

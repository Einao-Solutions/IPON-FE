<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { onMount, onDestroy } from "svelte";
  import UsersTable from "./UsersTable.svelte";
  import UsersByRole from "./UsersByRole.svelte";
  import RoleActivity from "./RoleActivity.svelte";
  import { baseURL, UserRoles } from "$lib/helpers";
  import { loggedInUser } from "$lib/store";
  import { authFetch } from "$lib/utils/authFetch";
  import { createRoleQuery } from "$lib/utils/roleQuery";
  import { userRolesApi, type RoleOption } from "$lib/utils/userRolesApi";
  import { Toaster } from "$lib/components/ui/sonner";
  import { Users, ShieldCheck, History, ArrowUpRight } from "lucide-svelte";
  import "./users.css";

  interface UserRow {
    id: string;
    name: string;
    email: string;
    sn: number;
  }
  const catalogue = createRoleQuery<RoleOption[]>();
  const users = createRoleQuery<{ users: UserRow[]; totalCount: number }>();
  let activeTab: "users" | "roles" | "activity" = "users";
  let mounted = false;
  $: isSuperAdmin =
    $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin) ?? false;
  $: if (mounted && isSuperAdmin) loadRoles();
  $: if (!isSuperAdmin) {
    activeTab = "users";
    catalogue.cancel();
  }

  function loadRoles() {
    void catalogue.load((signal) => userRolesApi.getRoles(signal));
  }

  function loadUsers() {
    void users.load(async (signal) => {
      const response = await authFetch(`${baseURL}/api/users/GetAllUsers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skip: 0, take: 10 }),
        signal,
      });
      if (!response.ok)
        throw new Error(
          response.status === 403
            ? "Access denied."
            : `Unable to load users (${response.status}). Please retry.`,
        );
      const result: { users: UserRow[]; totalCount: number } =
        await response.json();
      return {
        ...result,
        users: result.users.map((user, index) => ({ ...user, sn: index + 1 })),
      };
    });
  }

  onMount(() => {
    mounted = true;
    loadUsers();
  });
  onDestroy(() => {
    users.cancel();
    catalogue.cancel();
  });
</script>

<Toaster />
<div class="user-management">
  <header class="users-page-header">
    <div class="users-heading-group">
      <div class="users-page-icon"><Users size={26} aria-hidden="true" /></div>
      <div>
        <p class="users-eyebrow">Account administration</p>
        <h1>User Management</h1>
        <p class="users-page-description">
          {isSuperAdmin
            ? "Manage your user directory, explore roles, and follow every recorded role change."
            : "Browse your user directory and view account details."}
        </p>
      </div>
    </div>
    {#if isSuperAdmin}
      <span class="users-access-badge"
        ><ShieldCheck size={15} aria-hidden="true" /> SuperAdmin workspace</span
      >
    {/if}
  </header>
  {#if isSuperAdmin}
    <nav class="users-module-nav" aria-label="User management">
      <Button
        variant="ghost"
        class="users-module-tab"
        aria-current={activeTab === "users" ? "page" : undefined}
        on:click={() => (activeTab = "users")}
        ><Users size={18} aria-hidden="true" /><span>All Users</span
        ><ArrowUpRight
          class="users-tab-arrow"
          size={16}
          aria-hidden="true"
        /></Button
      >
      <Button
        variant="ghost"
        class="users-module-tab"
        aria-current={activeTab === "roles" ? "page" : undefined}
        on:click={() => (activeTab = "roles")}
        ><ShieldCheck size={18} aria-hidden="true" /><span>Users by Role</span
        ><ArrowUpRight
          class="users-tab-arrow"
          size={16}
          aria-hidden="true"
        /></Button
      >
      <Button
        variant="ghost"
        class="users-module-tab"
        aria-current={activeTab === "activity" ? "page" : undefined}
        on:click={() => (activeTab = "activity")}
        ><History size={18} aria-hidden="true" /><span
          >Role Assignment Activity</span
        ><ArrowUpRight
          class="users-tab-arrow"
          size={16}
          aria-hidden="true"
        /></Button
      >
    </nav>
    {#if $catalogue.loading}
      <p role="status" class="users-loading-note">Loading role catalogue...</p>
    {:else if $catalogue.error}
      <div role="alert" class="users-error space-y-2">
        <p>{$catalogue.error}</p>
        {#if $catalogue.retryable}<Button variant="outline" on:click={loadRoles}
            >Retry role catalogue</Button
          >{/if}
      </div>
    {/if}
  {/if}
  {#if activeTab === "users"}
    <div class="users-content-card">
      {#if $users.loading}
        <p role="status" class="users-state">Loading users...</p>
      {:else if $users.error}
        <div role="alert" class="users-error space-y-2">
          <p>{$users.error}</p>
          <Button variant="outline" on:click={loadUsers}>Retry</Button>
        </div>
      {:else if $users.data}
        <UsersTable
          usersList={$users.data.users}
          count={$users.data.totalCount}
          roles={isSuperAdmin ? ($catalogue.data ?? []) : []}
        />
      {/if}
    </div>
  {:else if isSuperAdmin && $catalogue.data}
    {#if activeTab === "roles"}
      <UsersByRole roles={$catalogue.data} />
    {:else}
      <RoleActivity roles={$catalogue.data} />
    {/if}
  {/if}
</div>

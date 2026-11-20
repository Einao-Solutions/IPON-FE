<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { loggedInUser } from "$lib/store";
  import { UserRoles } from "$lib/helpers";
  import { toast } from "svelte-sonner";
  import { Building2, LoaderCircle } from "lucide-svelte";
  import {
    userAccountTypesApi,
    type AccountTypeOption,
    type UserAccountType,
  } from "$lib/utils/userAccountTypesApi";
  import {
    RoleApiError,
    roleErrorMessage,
    isRoleErrorRetryable,
  } from "$lib/utils/userRolesApi";

  export let userId: string;
  export let userName: string;

  let options: AccountTypeOption[] = [];
  let current: UserAccountType | null = null;
  let selected: number | "" = "";
  let loading = true;
  let saving = false;
  let error = "";
  let notice = "";
  let retryable = false;
  let needsReload = false;
  let blocked = false;
  let confirmationOpen = false;
  let controller: AbortController | undefined;
  let version = 0;
  let disposed = false;
  $: isSuperAdmin =
    $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin) ?? false;
  $: currentName =
    current?.accountType === null
      ? "Not set"
      : (current?.accountTypeName ??
        options.find((option) => option.id === current?.accountType)?.name ??
        "Unknown account type");
  $: selectedName =
    options.find((option) => option.id === selected)?.name ?? "";
  $: canSave =
    isSuperAdmin &&
    current !== null &&
    typeof selected === "number" &&
    options.some((option) => option.id === selected) &&
    selected !== current.accountType &&
    !loading &&
    !saving &&
    !needsReload &&
    !blocked;

  async function load(message = "") {
    if (!isSuperAdmin) return;
    const requestVersion = ++version;
    controller?.abort();
    controller = new AbortController();
    loading = true;
    error = "";
    notice = message;
    blocked = false;
    try {
      const [catalogue, value] = await Promise.all([
        userAccountTypesApi.getTypes(controller.signal),
        userAccountTypesApi.getCurrent(userId, controller.signal),
      ]);
      if (disposed || requestVersion !== version) return;
      options = catalogue;
      current = value;
      selected = value.accountType ?? "";
      needsReload = false;
    } catch (cause) {
      if (disposed || requestVersion !== version) return;
      current = null;
      error = roleErrorMessage(cause);
      retryable = isRoleErrorRetryable(cause);
    } finally {
      if (!disposed && requestVersion === version) loading = false;
    }
  }

  async function save() {
    if (!canSave || typeof selected !== "number") return;
    saving = true;
    error = "";
    notice = "";
    try {
      const result = await userAccountTypesApi.update(
        userId,
        selected,
        options,
      );
      toast.success(
        result.changed
          ? "Account type updated successfully."
          : "Account type is already up to date. No change was made.",
        { position: "top-right" },
      );
      if (disposed) return;
      current = result;
      selected = result.accountType ?? "";
    } catch (cause) {
      if (disposed) return;
      if (cause instanceof RoleApiError && cause.status === 409) {
        await load(
          "The account type changed since it was loaded. Review the latest value and select the intended type again before saving.",
        );
      } else {
        error = roleErrorMessage(cause);
        retryable = isRoleErrorRetryable(cause);
        needsReload = retryable;
        blocked =
          cause instanceof RoleApiError &&
          [401, 403, 404].includes(cause.status);
        toast.error(error, { position: "top-right" });
      }
    } finally {
      if (!disposed) {
        saving = false;
        confirmationOpen = false;
      }
    }
  }

  onMount(() => {
    void load();
  });
  onDestroy(() => {
    disposed = true;
    version++;
    controller?.abort();
  });
</script>

{#if isSuperAdmin}
  <section class="users-profile-card space-y-4" aria-label="Edit account type">
    <div>
      <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Building2 size={16} class="text-green-700" aria-hidden="true" />Edit
        account type
      </h3>
      <p class="mt-1.5 text-xs leading-relaxed text-slate-500">
        Existing roles will remain unchanged. The Tech account type does not
        grant the Tech role or any permissions.
      </p>
    </div>
    {#if loading}
      <p role="status" class="flex items-center gap-2 text-sm text-slate-500">
        <LoaderCircle
          size={16}
          class="animate-spin"
          aria-hidden="true"
        />Loading account type...
      </p>
    {:else}
      {#if notice}<p
          role="status"
          class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
        >
          {notice}
        </p>{/if}
      {#if current}
        <p class="text-xs text-slate-500">
          Current account type: <strong class="text-slate-800"
            >{currentName}</strong
          >
        </p>
        <label class="block space-y-1.5 text-sm font-medium">
          Account type
          <select
            class="h-10 w-full rounded-md border bg-background px-3"
            bind:value={selected}
            disabled={saving || needsReload || blocked || confirmationOpen}
          >
            <option value="" disabled
              >{current.accountType === null
                ? "Not set"
                : "Select an account type"}</option
            >
            {#each options as option (option.id)}
              <option value={option.id}>{option.name}</option>
            {/each}
          </select>
        </label>
        {#if options.length === 0}<p class="text-sm text-slate-500">
            No account types are available.
          </p>{/if}
      {/if}
      {#if error}
        <div role="alert" class="users-error space-y-2">
          <p>{error}</p>
          {#if needsReload}
            <p>
              The save may have reached the server. Reload the current type and
              review it before trying again.
            </p>
            <Button
              variant="outline"
              size="sm"
              on:click={() =>
                load(
                  "Latest account type loaded. Review it before saving again.",
                )}>Reload current account type</Button
            >
          {:else if !current && retryable}
            <Button variant="outline" size="sm" on:click={() => load()}
              >Retry account type</Button
            >
          {/if}
        </div>
      {/if}
      <Button
        class="w-full gap-2 rounded-xl bg-green-800 text-white hover:bg-green-900"
        disabled={!canSave}
        on:click={() => (confirmationOpen = true)}
      >
        {#if saving}<LoaderCircle
            size={15}
            class="animate-spin"
            aria-hidden="true"
          />{/if}
        {saving ? "Saving account type..." : "Save account type"}
      </Button>
    {/if}
  </section>

  <AlertDialog.Root bind:open={confirmationOpen}>
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title>Confirm account type change</AlertDialog.Title>
        <AlertDialog.Description>
          Change {userName}'s account type from {currentName} to {selectedName}?
          Existing roles will remain unchanged.
        </AlertDialog.Description>
      </AlertDialog.Header>
      <AlertDialog.Footer>
        <AlertDialog.Cancel disabled={saving}>Cancel</AlertDialog.Cancel>
        <Button disabled={!canSave} on:click={save}
          >{saving ? "Saving..." : "Confirm account type change"}</Button
        >
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>
{/if}

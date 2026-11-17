<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import { loggedInUser } from "$lib/store";
  import { UserRoles } from "$lib/helpers";
  import { toast } from "svelte-sonner";
  import { Check, ShieldCheck, Save, LoaderCircle } from "lucide-svelte";
  import {
    userRolesApi,
    roleErrorMessage,
    isRoleErrorRetryable,
    type RoleOption,
  } from "$lib/utils/userRolesApi";

  export let userId: string;
  export let originalRoles: number[];
  export let roles: RoleOption[];
  let selected: number[] = [...originalRoles];
  let saving = false;
  let error = "";
  let retryable = false;
  const dispatch = createEventDispatcher<{ updated: number[] }>();
  $: hasChanges =
    selected.some((role) => !originalRoles.includes(role)) ||
    originalRoles.some((role) => !selected.includes(role));

  async function save() {
    if (
      saving ||
      !hasChanges ||
      !$loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin)
    )
      return;
    saving = true;
    error = "";
    try {
      await userRolesApi.updateRoles(userId, originalRoles, selected, roles);
      originalRoles = [...selected];
      toast.success("Successfully updated user roles", {
        position: "top-right",
      });
      dispatch("updated", [...selected]);
    } catch (cause) {
      error = roleErrorMessage(cause);
      retryable = isRoleErrorRetryable(cause);
      toast.error(error, { position: "top-right" });
    } finally {
      saving = false;
    }
  }
</script>

{#if $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin)}
  <div class="role-editor">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3
          class="flex items-center gap-2 text-sm font-semibold text-slate-800"
        >
          <ShieldCheck
            size={16}
            class="text-green-700"
            aria-hidden="true"
          />Update Roles
        </h3>
        <p class="mt-1.5 text-xs leading-relaxed text-slate-500">
          Select the roles this user should hold.
        </p>
      </div>
      <span
        class="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-700"
        >{selected.length} selected</span
      >
    </div>
    {#if roles.length === 0}
      <p class="text-sm text-muted-foreground">No roles are available.</p>
    {/if}
    <div class="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
      {#each roles as role (role.id)}
        <Button
          variant="outline"
          size="sm"
          disabled={saving}
          aria-pressed={selected.includes(role.id)}
          class="role-choice {selected.includes(role.id)
            ? 'role-choice-selected'
            : ''}"
          on:click={() => {
            selected = selected.includes(role.id)
              ? selected.filter((id) => id !== role.id)
              : [...selected, role.id];
          }}
          ><span class="role-choice-check" aria-hidden="true"
            >{#if selected.includes(role.id)}<Check size={12} />{/if}</span
          ><span class="min-w-0 break-words">{role.name}</span></Button
        >
      {/each}
    </div>
    {#if error}<p
        role="alert"
        class="rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-relaxed text-red-700"
      >
        {error}
      </p>{/if}
    <div class="role-editor-footer">
      <p class="mb-3 text-[11px] text-slate-500">
        {hasChanges
          ? "You have unsaved role changes."
          : "No pending role changes."}
      </p>
      <Button
        class="h-11 w-full gap-2 rounded-xl bg-green-800 text-xs text-white shadow-sm hover:bg-green-900"
        disabled={saving || !hasChanges || roles.length === 0}
        on:click={save}
        >{#if saving}<LoaderCircle
            size={15}
            class="animate-spin"
            aria-hidden="true"
          />{:else}<Save size={15} aria-hidden="true" />{/if}{saving
          ? "Saving..."
          : error && retryable
            ? "Retry update"
            : "Update User"}</Button
      >
    </div>
  </div>
{/if}

<style>
  .role-editor {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .role-editor :global(.role-choice) {
    height: auto;
    min-height: 52px;
    justify-content: flex-start;
    gap: 9px;
    border: 1px solid #e2e8e4;
    border-radius: 10px;
    padding: 12px;
    background: #fff;
    color: #64746a;
    font-size: 11px;
    line-height: 1.5;
    text-align: left;
    white-space: normal;
  }

  .role-editor :global(.role-choice:hover) {
    border-color: #9dc9ac;
    background: #f7fbf8;
  }

  .role-editor :global(.role-choice-selected) {
    border-color: #abd3b6;
    background: #eff8f2;
    color: #166534;
  }

  .role-choice-check {
    display: grid;
    width: 17px;
    height: 17px;
    flex-shrink: 0;
    place-items: center;
    border: 1px solid #d5dfd8;
    border-radius: 5px;
    background: #fff;
  }

  :global(.role-choice-selected) .role-choice-check {
    border-color: #166534;
    background: #166534;
    color: #fff;
  }

  .role-editor-footer {
    position: sticky;
    bottom: -28px;
    z-index: 1;
    border-top: 1px solid #e5ece7;
    padding: 16px 0 20px;
    background: #fff;
  }
</style>

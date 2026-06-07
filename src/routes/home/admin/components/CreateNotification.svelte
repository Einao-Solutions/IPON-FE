<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import Icon from "@iconify/svelte";
  import * as Dialog from "$lib/components/ui/dialog";
  import { toast } from "svelte-sonner";
  import {
    NotificationAudience,
    NotificationCategory,
    NotificationPriority,
    createNotification,
    type CreateNotificationDto,
  } from "$lib/utils/notificationsApi";

  export let open = false;

  const dispatch = createEventDispatcher();

  let audience: NotificationAudience = NotificationAudience.System;
  let category: NotificationCategory = NotificationCategory.System;
  let priority: NotificationPriority = NotificationPriority.Medium;
  let title = "";
  let message = "";
  let recipientId = "";
  let actionUrl = "";
  let fileNumber = "";
  let expiresAt = "";
  let loading = false;
  let formError = "";

  const audienceOptions = [
    { value: NotificationAudience.User, label: "User" },
    { value: NotificationAudience.System, label: "General" },
  ];

  const categoryOptions = [
    { value: NotificationCategory.Application, label: "Application" },
    { value: NotificationCategory.System, label: "Maintenance" },
  ];

  const priorityOptions = [
    { value: NotificationPriority.Low, label: "Low" },
    { value: NotificationPriority.Medium, label: "Normal" },
    { value: NotificationPriority.High, label: "High" },
    { value: NotificationPriority.Critical, label: "Critical" },
  ];

  function reset() {
    audience = NotificationAudience.System;
    priority = NotificationPriority.Medium;
    title = "";
    message = "";
    recipientId = "";
    actionUrl = "";
    fileNumber = "";
    expiresAt = "";
    formError = "";
  }

  function handleClose() {
    if (loading) return;
    reset();
    open = false;
    dispatch("close");
  }

  async function handleSubmit() {
    formError = "";
    if (!title.trim()) {
      formError = "Title is required";
      return;
    }
    if (!message.trim()) {
      formError = "Message is required";
      return;
    }
    if (Number(audience) === NotificationAudience.User && !recipientId.trim()) {
      formError = "Recipient Email is required when targeting a single user";
      return;
    }

    loading = true;
    try {
      const dto: CreateNotificationDto = {
        audience: Number(audience),
        category: Number(category),
        priority: Number(priority),
        title: title.trim(),
        message: message.trim(),
        recipientId: recipientId.trim() || null,
        actionUrl: actionUrl.trim() || null,
        fileNumber: fileNumber.trim() || null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      };
      await createNotification(dto);
      toast.success("Notification created");
      dispatch("created");
      reset();
      open = false;
    } catch (err) {
      formError = "Failed to create notification";
      toast.error("Failed to create notification");
    } finally {
      loading = false;
    }
  }
</script>

<Dialog.Root bind:open onOpenChange={(v) => (!v ? handleClose() : null)}>
  <Dialog.Content class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Icon icon="mdi:bell-plus-outline" width="1.5em" height="1.5em" class="text-green-700" />
        Create Notification
      </Dialog.Title>
      <Dialog.Description>
        Send a notification to users, officers, or administrators.
      </Dialog.Description>
    </Dialog.Header>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
      <div class="space-y-1.5">
        <Label for="audience">Audience</Label>
        <select
          id="audience"
          bind:value={audience}
          disabled={loading}
          class="w-full h-10 px-3 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
        >
          {#each audienceOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </div>

      <div class="space-y-1.5">
        <Label for="category">Category</Label>
        <select
          id="category"
          bind:value={category}
          disabled={loading}
          class="w-full h-10 px-3 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
        >
          {#each categoryOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </div>

      <div class="space-y-1.5">
        <Label for="priority">Priority</Label>
        <select
          id="priority"
          bind:value={priority}
          disabled={loading}
          class="w-full h-10 px-3 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
        >
          {#each priorityOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </div>

      <div class="space-y-1.5 sm:col-span-3">
        <Label for="title">Title <span class="text-red-500">*</span></Label>
        <Input
          id="title"
          bind:value={title}
          placeholder="Short headline..."
          maxlength={120}
          disabled={loading}
        />
      </div>

      <div class="space-y-1.5 sm:col-span-3">
        <Label for="message">Message <span class="text-red-500">*</span></Label>
        <Textarea
          id="message"
          bind:value={message}
          placeholder="Notification body..."
          rows={4}
          disabled={loading}
        />
      </div>

      <div class="space-y-1.5 sm:col-span-3">
        <Label for="recipientId">
          Recipient Email
          <span class="text-xs text-slate-400 font-normal">
            (required when audience is a single user)
          </span>
        </Label>
        <Input
          id="recipientId"
          bind:value={recipientId}
          placeholder="User Email (leave blank for broadcast)"
          disabled={loading}
        />
      </div>

      <div class="space-y-1.5 sm:col-span-2">
        <Label for="actionUrl">Action URL</Label>
        <Input
          id="actionUrl"
          bind:value={actionUrl}
          placeholder="/home/..."
          disabled={loading}
        />
      </div>

      <div class="space-y-1.5">
        <Label for="fileNumber">File Number</Label>
        <Input
          id="fileNumber"
          bind:value={fileNumber}
          placeholder="Optional"
          disabled={loading}
        />
      </div>

      <div class="space-y-1.5 sm:col-span-3">
        <Label for="expiresAt">Expires At</Label>
        <Input
          id="expiresAt"
          type="datetime-local"
          bind:value={expiresAt}
          disabled={loading}
        />
      </div>

      {#if formError}
        <p
          class="sm:col-span-3 text-sm text-red-600"
          transition:fade={{ duration: 150 }}
        >
          {formError}
        </p>
      {/if}
    </div>

    <Dialog.Footer class="flex gap-2">
      <Button variant="outline" on:click={handleClose} disabled={loading}>
        Cancel
      </Button>
      <Button on:click={handleSubmit} disabled={loading}>
        {#if loading}
          <Icon icon="mdi:loading" width="1em" height="1em" class="animate-spin mr-2" />
        {/if}
        Send Notification
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

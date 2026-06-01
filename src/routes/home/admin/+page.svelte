<script lang="ts">
  import Icon from "@iconify/svelte";
  import { goto } from "$app/navigation";
  import FileNumberSearch from "./components/FileNumberSearch.svelte";
  import ApplicationSearchResults from "./components/ApplicationSearchResults.svelte";
  import { baseURL } from "$lib/helpers";
  import UserSearch from "./components/UserSearch.svelte";
  import UserSearchResults from "./components/UserSearchResults.svelte";
  import CreateNotification from "./components/CreateNotification.svelte";
  import { Toaster, toast } from "svelte-sonner";
  import { loggedInToken } from "$lib/store";

  let showSearchDialog = false;
  let showUserSearch = false;
  let showUserResults = false;
  let showResultsDialog = false;
  let showCreateNotification = false;
  let searchLoading = false;
  let userSearchLoading = false;
  let resetLoading = false;
  let resetSuccess = false;
  let resetError = "";
  let applications: any[] = [];
  let currentFileNumber = "";
  let foundUser: {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  } | null = null;

  async function searchApplicationsByFileNumber(fileNumber: string) {
    try {
      const response = await fetch(
        `${baseURL}/api/files/GetApplicationsByFile?fileId=${fileNumber}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }

      const data = await response.json();
      sessionStorage.setItem("fileNumber", fileNumber);
      sessionStorage.setItem("fileTitle", data.fileTitle);

      let applicationsList = Array.isArray(data.applications)
        ? [...data.applications]
        : [];

      if (data.certificateApp) {
        const cert = data.certificateApp;
        // check by both id AND applicationType (backend separates them)
        const exists = applicationsList.some(
          (a) => a.id === cert.id && a.applicationType === cert.applicationType,
        );
        if (!exists) {
          applicationsList.unshift(cert);
        }
      }

      // add a stable unique key to each entry so frontend can distinguish duplicates
      return applicationsList.map((a) => ({
        ...a,
        _uniqueKey: `${a.id}-${a.applicationType}`,
      }));
    } catch (error) {
      console.error("Error searching applications:", error);
      return [];
    }
  }
  async function searchUserByEmail(email: string) {
    try {
      const response = await fetch(
        `${baseURL}/api/admin/GetUserByEmail?email=${encodeURIComponent(email)}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${$loggedInToken}`,
          },
        },
      );

      if (!response.ok) {
        toast.error("User not found");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error searching user:", error);
      throw error;
    }
  }

  async function resetUserPassword(email: string) {
    try {
      const response = await fetch(
        `${baseURL}/api/admin/ResetPassword?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${$loggedInToken}`,
          },
        },
      );

      if (!response.ok) {
        toast.error("Failed to reset password");
      }
      toast.success("Password Reset Succesful");
      return true;
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    }
  }
  function handleOpenSearch() {
    showSearchDialog = true;
  }
  function searchUser() {
    showUserSearch = true;
  }

  async function handleUserSearch(event: CustomEvent<{ email: string }>) {
    const { email } = event.detail;
    userSearchLoading = true;

    try {
      foundUser = await searchUserByEmail(email);
      showUserSearch = false;
      resetSuccess = false;
      resetError = "";
      showUserResults = true;
    } catch (error) {
      console.error("User search failed:", error);
    } finally {
      userSearchLoading = false;
    }
  }

  async function handleResetPassword(event: CustomEvent<{ email: string }>) {
    const { email } = event.detail;
    resetLoading = true;
    resetError = "";

    try {
      await resetUserPassword(email);
      resetSuccess = true;
    } catch (error) {
      resetError = "Failed to reset password. Please try again.";
    } finally {
      resetLoading = false;
    }
  }

  function handleCloseUserResults() {
    showUserResults = false;
    foundUser = null;
    resetSuccess = false;
    resetError = "";
  }
  async function handleSearch(event: CustomEvent<{ fileNumber: string }>) {
    const { fileNumber } = event.detail;
    currentFileNumber = fileNumber;
    searchLoading = true;

    try {
      applications = await searchApplicationsByFileNumber(fileNumber);
      showSearchDialog = false;
      showResultsDialog = true;
    } catch (error) {
      console.error("Search failed:", error);
      // Handle error - maybe show a toast notification
    } finally {
      searchLoading = false;
    }
  }

  function handleCloseSearch() {
    showSearchDialog = false;
  }

  function handleCloseResults() {
    showResultsDialog = false;
    applications = [];
    currentFileNumber = "";
  }

  function handleSelectApplication(event: CustomEvent<{ application: any }>) {
    const { application } = event.detail;
    console.log("Selected application:", application);
    // Handle application selection - maybe navigate to edit page
    // goto(`/home/admin/app-payments/edit/${application.id}`);
  }
</script>

<svelte:head>
  <title>Update Payment ID - Admin</title>
</svelte:head>
<Toaster />
<div class="container mx-auto p-6 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Super Admin</h1>
      <p class="text-sm text-slate-500 mt-1">
        Administrative tools and account management
      </p>
    </div>

    <button
      on:click={() => goto("/home/dashboard")}
      class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
    >
      <Icon icon="mdi:arrow-left" width="1rem" height="1rem" />
      Back
    </button>
  </div>

  <!-- Action cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {#each [
      {
        icon: "mdi:file-document-edit-outline",
        title: "Update File Info",
        description: "Update file information",
        action: () => goto("/home/admin/updatefileinfo"),
      },
      {
        icon: "mdi:cash-sync",
        title: "Update Payment ID",
        description: "Update payment ID for application",
        action: handleOpenSearch,
      },
      {
        icon: "mdi:history",
        title: "View File History",
        description: "View all file update logs",
        action: () => goto("/home/admin/fileupdatehistory"),
      },
      {
        icon: "mdi:lock-reset",
        title: "Reset Password",
        description: "Reset account password",
        action: searchUser,
      },
      {
        icon: "mdi:bell-plus-outline",
        title: "Create Notification",
        description: "Send a notification to users",
        action: () => (showCreateNotification = true),
      },
    ] as item}
      <button
        on:click={item.action}
        class="group relative flex flex-col items-start gap-3 p-5 bg-white border border-slate-200 rounded-xl hover:border-green-400 hover:shadow-md transition-all duration-200 text-left"
      >
        <div
          class="flex items-center justify-center w-11 h-11 rounded-lg bg-green-50 text-green-700 group-hover:bg-green-100 transition-colors"
        >
          <Icon icon={item.icon} width="1.5rem" height="1.5rem" />
        </div>
        <div class="space-y-1">
          <h3 class="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            {item.title}
          </h3>
          <p class="text-xs text-slate-500">{item.description}</p>
        </div>
        <Icon
          icon="mdi:arrow-top-right"
          width="1rem"
          height="1rem"
          class="absolute top-4 right-4 text-slate-300 group-hover:text-green-600 transition-colors"
        />
      </button>
    {/each}
  </div>
</div>

<!-- Search Dialog -->
<FileNumberSearch
  bind:open={showSearchDialog}
  bind:loading={searchLoading}
  on:search={handleSearch}
  on:close={handleCloseSearch}
/>
<UserSearch
  bind:open={showUserSearch}
  bind:loading={userSearchLoading}
  on:search={handleUserSearch}
  on:close={() => (showUserSearch = false)}
/>

<UserSearchResults
  bind:open={showUserResults}
  bind:loading={resetLoading}
  bind:resetSuccess
  bind:resetError
  user={foundUser}
  on:reset={handleResetPassword}
  on:close={handleCloseUserResults}
/>
<!-- Results Dialog -->
<ApplicationSearchResults
  bind:open={showResultsDialog}
  bind:applications
  bind:fileNumber={currentFileNumber}
  on:select={handleSelectApplication}
  on:close={handleCloseResults}
/>

<!-- Create Notification Dialog -->
<CreateNotification bind:open={showCreateNotification} />

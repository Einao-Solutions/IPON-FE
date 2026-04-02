<script lang="ts">
  import { fade } from "svelte/transition";
  import { Button } from "$lib/components/ui/button";
  import Icon from "@iconify/svelte";
  import * as Card from "$lib/components/ui/card";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import FileNumberSearch from "./components/FileNumberSearch.svelte";
  import ApplicationSearchResults from "./components/ApplicationSearchResults.svelte";
  import { baseURL, FormApplicationTypes } from "$lib/helpers";
  import UserSearch from "./components/UserSearch.svelte";
  import UserSearchResults from "./components/UserSearchResults.svelte";
  import { Toaster, toast } from "svelte-sonner";
  import { he } from "@faker-js/faker";
  import { loggedInToken, loggedInUser } from "$lib/store";

  let showSearchDialog = false;
  let showUserSearch = false;
  let showUserResults = false;
  let showResultsDialog = false;
  let searchLoading = false;
  let userSearchLoading = false;
  let resetLoading = false;
  let resetSuccess = false;
  let resetError = "";
  let applications = [];
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

  async function handleUserSearch(event) {
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

  async function handleResetPassword(event) {
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
  async function handleSearch(event) {
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

  function handleSelectApplication(event) {
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
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Super Admin</h1>
    </div>

    <button
      on:click={() => goto("/home/dashboard")}
      class="border rounded p-2 text-white bg-black hover:bg-gray-600 transition-colors"
    >
      Back
    </button>
  </div>

  <div
    class="border rounded-md justify-between p-3 grid xl:grid-cols-5 lg:grid-cols-5 md:grid-cols-2 grid-cols-1 gap-3"
  >
    <button
      on:click={() => goto("/home/admin/updatefileinfo")}
      class="flex items-center bg-white space-x-3 p-3 border rounded-md hover:bg-accent hover:cursor-pointer transition-colors min-h-[100px]"
    >
      <Icon icon="mdi:file" width="2em" height="2em" class="text-green-800" />
      <div class="space-y-1">
        <Card.Title class="text-sm font-semibold">UPDATE FILE INFO</Card.Title>
        <Card.Description class="text-xs"
          >Update File Information</Card.Description
        >
      </div>
    </button>
    <button
      on:click={handleOpenSearch}
      class="flex items-center bg-white space-x-3 p-3 border rounded-md hover:bg-accent hover:cursor-pointer transition-colors min-h-[100px]"
    >
      <Icon
        icon="mdi:file-edit-outline"
        width="2rem"
        height="2rem"
        class="text-green-800"
      />
      <div class="space-y-1">
        <Card.Title class="text-sm font-semibold">UPDATE PAYMENT ID</Card.Title>
        <Card.Description class="text-xs"
          >Update Payment ID for application</Card.Description
        >
      </div>
    </button>
    <button
      on:click={() => goto("/home/admin/fileupdatehistory")}
      class="flex items-center bg-white space-x-3 p-3 border rounded-md hover:bg-accent hover:cursor-pointer transition-colors min-h-[100px]"
    >
      <Icon
        icon="mdi:history"
        width="2rem"
        height="2rem"
        class="text-green-800"
      />
      <div class="space-y-1">
        <Card.Title class="text-sm font-semibold">VIEW FILE HISTORY</Card.Title>
        <Card.Description class="text-xs"
          >View all file update logs</Card.Description
        >
      </div>
    </button>
    <button
      on:click={searchUser}
      class="flex items-center bg-white space-x-3 p-3 border rounded-md hover:bg-accent hover:cursor-pointer transition-colors min-h-[100px]"
    >
      <Icon
        icon="mdi:lock-reset"
        width="2rem"
        height="2rem"
        class="text-green-800"
      />
      <div class="space-y-1">
        <Card.Title class="text-sm font-semibold">RESET PASSWORD</Card.Title>
        <Card.Description class="text-xs"
          >Reset Account Password</Card.Description
        >
      </div>
    </button>
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

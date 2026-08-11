<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import type { PageData } from "./$types";
  import { onMount } from "svelte";
  import AddUser from "./AddUser.svelte";
  import Icon from "@iconify/svelte";
  import UsersTable from "./UsersTable.svelte";
  import { baseURL } from "$lib/helpers";

  export let data: PageData | null;
  let showAddUser: boolean = false;
  let addUser: any;
  let isAdmin: boolean = false;
  let isLoading = false;
  let userCreationData: any = {};
  let usersTable: any = null;
  let usersList: any = {};
  onMount(async () => {
    isLoading = true;
    usersTable = (await import("./UsersTable.svelte")).default;
    await loadData();

    isAdmin = data?.isAdmin ?? false;
  });
  async function addNewUser() {
    if (!addUser) {
      addUser = (await import("./AddUser.svelte")).default;
    }
    userCreationData = { open: true };
    showAddUser = true;
  }
  let skip = 0;
  let take = 10;
  let name = "";
  let usersdata: any = {};
  async function loadData() {
    const response = await fetch(`${baseURL}/api/users/GetAllUsers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        skip: skip,
        take: take,
      }),
    });
    usersList = await response.json();
    var dt = usersList.users.map((e: any, i: number) => {
      return { sn: i, name: e.name, email: e.email, id: e.id };
    });
    usersdata.usersList = dt;
    usersdata.count = usersList.totalCount;
    isLoading = false;
  }
  async function getAllUsers() {
    const response = await fetch(`${baseURL}/api/users/GetAllUsers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skip: 0, take: 10 }),
    });
    const data = await response.json();
    var dt = data.users.map((e: any, i: number) => {
      return { sn: i, name: e.name, email: e.email, id: e.id };
    });
    usersdata.usersList = dt;
    usersdata.count = data.totalCount;
  }
</script>

{#if showAddUser}
  <svelte:component this={addUser} {...userCreationData} />
{/if}

<div>
  <!-- <Button on:click={() => addNewUser()}>+ Add user</Button> -->
  {#if isLoading}
    <div class="flex items-center justify-center w-full h-full bg-gray-400">
      <Icon icon="eos-icons:loading" width="1.2rem" height="1.2rem" />
    </div>
  {:else}
    <svelte:component this={usersTable} {...usersdata} />
  {/if}
</div>

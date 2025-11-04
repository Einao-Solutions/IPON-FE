<script lang="ts">
  import SideMenu from "./SideMenu.svelte";
  import { Input } from "$lib/components/ui/input";
  import BottomNavBar from "./BottomNavBar.svelte";
  import { loggedInUser, loggedInToken } from "$lib/store";
  import { onMount } from "svelte";
  import type { LayoutServerData } from "../../../.svelte-kit/types/src/routes/home/$types";
  import { Button } from "$lib/components/ui/button";
  import FilterFile from "./FilterFile.svelte";
  import { goto } from "$app/navigation";
  import { toast } from "svelte-sonner";
  import { baseURL } from "$lib/helpers";
  $: userName = "";
  export let data: LayoutServerData;
  let filterFiles: FilterFile | null = null;
  let showFilterSheet: boolean = false;
  let searchTitle: string | null = null;

  loggedInUser.subscribe((user) => {
    userName = user?.firstName + " " + user?.lastName;
  });
  onMount(async () => {
    // don't try to redirect when already on the auth page
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/auth")
    ) {
      return;
    }

    const cookies = document.cookie.split(";").map((c) => c.trim());

    const tokenCookie = cookies.find((c) => c.startsWith("auth_token="));
    const userCookie = cookies.find((c) => c.startsWith("user="));
    console.log("token: ",$loggedInToken)
    // redirect to auth only if neither token nor user cookie present
    if (!tokenCookie && !userCookie) {
      toast.error("Please login", {
        position: "top-right",
      });
      goto("/auth");
    }
  });
  let filterData = {};

  function logout() {
    document.cookie = "auth_token=; path=/; max-age=0";
    document.cookie = "user=; path=/; max-age=0";
    loggedInToken.set(null);
    loggedInUser.set(null);
    goto("/auth");
  }
  // async function advancedSearch()
  // {
  // 	if (filterFiles === null) {
  // 		filterFiles = (await import('./FilterFile.svelte')).default;
  // 		const handleClose = () => {
  // 			showFilterSheet = false;
  // 		};
  // 		filterData={
  // 			open:true,
  // 			onclose:handleClose,
  // 		}
  // 	}
  // 	showFilterSheet=true;
  // }
</script>

{#if showFilterSheet}
  <svelte:component this={filterFiles} {...filterData} />
{/if}
<div class="flex h-screen p-1 sm:p-4 w-full">
  <nav
    class="hidden sm:block backdrop-blur-sm bg-gray-100 rounded-md fixed h-[calc(100vh-2rem)]"
  >
    <SideMenu />
  </nav>
  <div class="sm:ml-56 w-full flex flex-col">
    <div
      class="items-center mx-4 sm:justify-between flex rounded-md bg-gray-100 p-2"
    >
      <Input
        placeholder="Search by title, file number or applicant name"
        bind:value={searchTitle}
        type="search"
        class="w-[320px]"
        on:keypress={(event) => {
          if (event.key === "Enter") goto(`/files?title=${searchTitle}`);
        }}
      />
      <div class="relative ml-2">
        <details class="relative">
          <summary
            class="flex items-center gap-2 cursor-pointer list-none select-none"
          >
            <p class="hidden sm:inline">{userName}</p>
            <div
              class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium"
              aria-hidden="true"
            >
              {userName
                ? userName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                : ""}
            </div>
          </summary>

          <div
            class="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg z-50"
          >
            <ul class="py-1">
              <li>
                <a
                  href="/home/profile"
                  class="block px-4 py-2 text-sm hover:bg-gray-100">Profile</a
                >
              </li>
              <li>
                <button
                  class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  on:click={logout}
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </details>
      </div>
    </div>
    <br />
    <div class="px-5">
      <slot />
    </div>
    <nav
      class="sm:hidden fixed bottom-0 left-0 right-0 z-10 backdrop-blur-sm bg-white/30"
    >
      <div class="flex items-end justify-evenly h-14">
        <BottomNavBar />
      </div>
    </nav>
  </div>
</div>

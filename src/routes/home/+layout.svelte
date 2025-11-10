<script lang="ts">
	import SideMenu from './SideMenu.svelte';
	import { Input } from '$lib/components/ui/input';
	import { loggedInUser } from '$lib/store';
	import { onMount } from 'svelte';
	import type { LayoutServerData } from '../../../.svelte-kit/types/src/routes/home/$types';
	import { Button } from '$lib/components/ui/button';
	import FilterFile from './FilterFile.svelte';
	import { goto } from '$app/navigation';
	import { baseURL } from '$lib/helpers';
	import Icon from '@iconify/svelte';
	
	$: userName="";
	export let data:LayoutServerData;
	
	// Mobile sidebar state
	let isMobileSidebarOpen = false;

	function toggleMobileSidebar() {
		isMobileSidebarOpen = !isMobileSidebarOpen;
	}

	function closeMobileSidebar() {
		isMobileSidebarOpen = false;
	}
	let filterFiles:FilterFile|null=null;
	let showFilterSheet:boolean=false;
	let searchTitle:string|null=null;

	loggedInUser.subscribe((user)=>{
		userName = user?.name;
	})
	onMount(async ()=>{
		var cookieUser=document.cookie.split(';').find(x=>x.startsWith("user=") || x.startsWith(" user="))
		if(!cookieUser){
			goto("/auth")
		}
		else {

		}
	})
	let filterData={};

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
	<!-- Desktop Sidebar -->
	<nav class="hidden sm:block backdrop-blur-sm bg-gray-100 rounded-md fixed h-[calc(100vh-2rem)]">
		<SideMenu />
	</nav>

	<!-- Mobile Sidebar Overlay -->
	{#if isMobileSidebarOpen}
		<div 
			class="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden" 
			on:click={closeMobileSidebar}
			on:keydown={(e) => e.key === 'Escape' && closeMobileSidebar()}
			role="button"
			tabindex="0"
		></div>
	{/if}

	<!-- Mobile Sidebar -->
	<nav class="sm:hidden fixed left-0 top-0 h-full bg-gray-100 z-50 transform transition-transform duration-300 {isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}">
		<SideMenu isOpen={isMobileSidebarOpen} onClose={closeMobileSidebar} />
	</nav>

	<!-- Main Content -->
	<div class="sm:ml-56 w-full flex flex-col">
		<div class="items-center mx-4 sm:justify-between flex rounded-md bg-gray-100 p-2">
			<!-- Mobile hamburger button -->
			<Button 
				variant="ghost" 
				size="sm" 
				class="sm:hidden mr-2"
				on:click={toggleMobileSidebar}
			>
				<Icon icon="mdi:menu" width="20" height="20" />
			</Button>

			<Input 
				placeholder="Search by title, file number or applicant name" 
				bind:value={searchTitle} 
				type="search" 
				class="flex-1 sm:w-[320px]"
				on:keypress={(event) => {if(event.key === 'Enter') goto(`/files?title=${searchTitle}`)}} 
			/>
			<p class="hidden sm:inline ml-4">{userName}</p>
		</div>
		<br />
		<div class="px-5">
			<slot />
		</div>
	</div>
</div>
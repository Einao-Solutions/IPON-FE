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
<div class="flex h-screen w-full overflow-hidden">
	<!-- Desktop Sidebar -->
	<nav class="hidden sm:block backdrop-blur-sm bg-gray-100 fixed h-screen w-56">
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
	<div class="sm:ml-56 w-full h-screen flex flex-col overflow-hidden">
		<div class="flex-shrink-0 items-center mx-4 sm:justify-between flex gap-4 bg-white border border-gray-200 rounded-xl p-3 shadow-sm my-4">
			<!-- Mobile hamburger button -->
			<Button 
				variant="ghost" 
				size="sm" 
				class="sm:hidden p-2 hover:bg-gray-100 rounded-lg"
				on:click={toggleMobileSidebar}
			>
				<Icon icon="mdi:menu" width="20" height="20" />
			</Button>

			<div class="flex-1 relative max-w-md">
				<Input 
					placeholder="Search by title, file number and applicant name" 
					bind:value={searchTitle} 
					type="search" 
					class="w-full pl-10 pr-4 py-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					on:keypress={(event) => {if(event.key === 'Enter') goto(`/files?title=${searchTitle}`)}} 
				/>
				<Icon icon="mdi:magnify" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" />
			</div>
			
			<div class="hidden sm:flex items-center gap-3">
				<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
					<Icon icon="mdi:account" class="text-blue-600" width="18" height="18" />
				</div>
				<span class="font-medium text-gray-700">{userName}</span>
			</div>
		</div>
		<div class="flex-1 px-5 overflow-hidden">
			<slot />
		</div>
	</div>
</div>
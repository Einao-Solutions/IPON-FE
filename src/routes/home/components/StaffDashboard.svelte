<script lang="ts">
	import { appattachmentsData, DashStats, loggedInUser, loggedInToken, newApplicationType } from '$lib/store';
	import { DataMapper, FileStatsData, mapStatusToColor, mapTypeToString } from './dashboardutils';
	import * as Accordion from '$lib/components/ui/accordion';
	import {
		baseURL, type DashBoardStats,
		type FileStatsType, FileTypes,
		FilingType,
		type PatentData,
		UserRoles,
		type UsersType,
		UserTypes, FormApplicationTypes,
	} from '$lib/helpers';
	import { getRoleDisplayInfo, getUserPrimaryFileType } from './rolePermissions';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import { FetchData } from '../../application/apphelper';
	import { Input } from '$lib/components/ui/input';
	import { goto } from '$app/navigation';
import * as Card from "$lib/components/ui/card"
  import { User } from 'lucide-svelte';
	import ministry from "$lib/assets/cld.png";
	let isLoading: boolean = true;
	export let user: UsersType;
	let isStaff:boolean=true;
	onMount(async()=>{
		if ($DashStats===null)
		{
			isLoading=true;
			await loadDashStats()
		}
		else {
			isLoading=false;
		}
	})

	async function loadDashStats()
	{
		const userId=user.creatorId;
		// All staff users can see all file statistics (StaffDashboard is only shown to staff, not agents)
		const showId = true;
		const id=showId?null:userId;
		const url=`${baseURL}/api/files/FileStatistics?userId=${id}`;
		const data=await fetch(url,{headers:{
			'Authorization':`Bearer ${$loggedInToken}`
		}});
		if (data.ok)
		{
			const body=await data.json();
			const values=body as DashBoardStats[];
			DashStats.set(values[0])
			isLoading=false
		}
	}

	function isPatentRelated() {
		const show= user.userRoles?.some((x) =>
			[
				UserRoles.PatentSearch,
				UserRoles.PatentExaminer,
				UserRoles.PatentCertification,
				UserRoles.PatentDesignRegistrar,
				UserRoles.PermSec,
				UserRoles.Minister,
				// UserRoles.Staff,
				UserRoles.Tech,
				UserRoles.SuperAdmin
			].includes(x)
		);
return show;
	}

	function isDesignRelated() {
		return user.userRoles?.some((x) =>
			[
				UserRoles.DesignSearch,
				UserRoles.DesignExaminer,
				UserRoles.DesignCertification,
				UserRoles.PatentDesignRegistrar,
				UserRoles.Tech,
				UserRoles.Minister,
				UserRoles.PermSec,
				UserRoles.Tech,
				// UserRoles.Staff,
				UserRoles.SuperAdmin
			].includes(x)
		);
	}

	function isTradeMarkRelated(){
		return user.userRoles?.some((x) =>
			[
				UserRoles.TrademarkSearch,
				UserRoles.TrademarkExaminer,
				UserRoles.TrademarkOpposition,
				UserRoles.TrademarkAcceptance,
				UserRoles.TrademarkCertification,
				UserRoles.TrademarkRegistrar,
				UserRoles.PermSec,
				UserRoles.Minister,
				UserRoles.Tech,
				// UserRoles.Staff,
				UserRoles.SuperAdmin
			].includes(x)
		);
	}
	function getType(fileType: FileTypes) {
		const val = $DashStats?.detailedStats
			?.filter((x) => x.fileType === fileType) ?? [{ status: 0, count: 0 }];
		val.sort((a, v) => (a.status > v.status ? 1 : a.status < v.status ? -1 : 0));
		const grouped = val.reduce((acc, curr) => {
			const type = curr.type;
			acc[type] = (acc[type] || []).concat(curr);
			return acc;
		}, {});
		const mapped = Object.entries(grouped).map(([type, items]) => ({ type, items }));
		return mapped;
	}

	// Get role-specific display information
	function getRoleInfo() {
		// Find the primary IP-specific role for this user
		const roles = user.userRoles || [];
		
		// Check for IP-specific roles in order of priority
		const ipRoles = [
			UserRoles.TrademarkSearch, UserRoles.TrademarkExaminer, UserRoles.TrademarkPublication, 
			UserRoles.TrademarkOpposition, UserRoles.TrademarkAcceptance, UserRoles.TrademarkCertification,
			UserRoles.PatentSearch, UserRoles.PatentExaminer, UserRoles.PatentCertification,
			UserRoles.DesignSearch, UserRoles.DesignExaminer, UserRoles.DesignCertification
		];
		
		// Find first matching IP role
		const primaryRole = roles.find(role => ipRoles.includes(role)) || roles[0] || UserRoles.Staff;
		return getRoleDisplayInfo(primaryRole);
	}

	// Get registry hub title based on user's primary file type
	function getRegistryHubTitle() {
		const primaryFileType = getUserPrimaryFileType(user.userRoles || []);
		switch (primaryFileType) {
			case FileTypes.Trademark:
				return 'Trademark Registry Hub';
			case FileTypes.Patent:
				return 'Patent Registry Hub';
			case FileTypes.Design:
				return 'Design Registry Hub';
			default:
				return 'IP Registry Hub';
		}
	}

	// Get application types organized for dropdown format
	function getApplicationTypesData(fileType: FileTypes) {
		if (!$DashStats?.detailedStats) {
			return [];
		}
		
		const stats = $DashStats.detailedStats.filter(stat => stat.fileType === fileType);
		
		// Group by application type
		const grouped = stats.reduce((acc, stat) => {
			const appType = stat.type;
			if (!acc[appType]) {
				acc[appType] = [];
			}
			acc[appType].push({
				status: stat.status,
				count: stat.count
			});
			return acc;
		}, {} as Record<number, Array<{status: number, count: number}>>);

		// Convert to array format for rendering
		return Object.entries(grouped).map(([appType, statuses]) => ({
			appType: parseInt(appType),
			statuses: statuses
		}));
	}

	// Map application type number to display name
	function mapApplicationTypeName(appType: number): string {
		return mapTypeToString(appType);
	}

	// Get icon for each application type
	function getApplicationTypeIcon(appType: number): string {
		const iconMap: Record<number, string> = {
			[FormApplicationTypes.NewApplication]: 'mdi:file-plus-outline',
			[FormApplicationTypes.LicenseRenewal]: 'mdi:refresh-circle',
			[FormApplicationTypes.DataUpdate]: 'mdi:file-edit-outline',
			[FormApplicationTypes.Assignment]: 'mdi:account-switch',
			[FormApplicationTypes.Ownership]: 'mdi:account-group',
			[FormApplicationTypes.RegisteredUser]: 'mdi:account-check',
			[FormApplicationTypes.Merger]: 'mdi:merge',
			[FormApplicationTypes.ChangeOfName]: 'mdi:card-account-details',
			[FormApplicationTypes.ChangeOfAddress]: 'mdi:map-marker-outline',
			[FormApplicationTypes.ClericalUpdate]: 'mdi:pencil-outline',
			[FormApplicationTypes.StatusSearch]: 'mdi:magnify',
			[FormApplicationTypes.AppealRequest]: 'mdi:gavel',
			[FormApplicationTypes.PublicationStatusUpdate]: 'mdi:newspaper-variant'
		};
		return iconMap[appType] || 'mdi:file-document-outline';
	}

</script>
{#if isLoading}
	<Icon class="flex items-center justify-center w-full"
				icon="eos-icons:loading"
				width="1.6rem"
				height="1.6rem"
	/>
{:else}
	<!-- Unified Header -->
	<div class="bg-green-50 rounded-xl p-5 mb-8 border border-green-100 shadow-md hover:shadow-lg transition-shadow duration-200 sticky top-0 z-10">
		<div class="flex items-center justify-between space-x-6">
			<!-- Left Logo -->
			<div class="flex-shrink-0">
				<img src="{ministry}" alt="Ministry Logo" class="h-16 w-16 md:h-20 md:w-20 object-contain opacity-90" />
			</div>
			
			<!-- Center Content -->
			<div class="text-center flex-1">
				<h1 class="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-1 leading-tight">
					Intellectual Property Office Nigeria
				</h1>
				<p class="text-green-600 font-semibold text-xs md:text-sm tracking-wide mb-2">
					Commercial Law Department
				</p>
				<h2 class="text-lg md:text-xl font-bold text-gray-700">{getRoleInfo().title}</h2>
				<p class="text-green-600 text-xs md:text-sm">
					Manage {getRoleInfo().title.toLowerCase()} applications
				</p>
			</div>
			
			<!-- Right Logo (Officer's IP Type) -->
			<div class="flex-shrink-0">
			{#if getUserPrimaryFileType(user.userRoles || []) === FileTypes.Trademark}
				<div class="h-20 w-20 md:h-24 md:w-24 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-xl flex items-center justify-center transition-transform duration-300 shadow-sm">
					<Icon icon="mdi:scale-balance" class="w-12 h-12 md:w-16 md:h-16 text-green-600" />
				</div>
			{:else if getUserPrimaryFileType(user.userRoles || []) === FileTypes.Patent}
				<div class="h-20 w-20 md:h-24 md:w-24 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-xl flex items-center justify-center transition-transform duration-300 shadow-sm">
					<Icon icon="mdi:lightbulb-outline" class="w-12 h-12 md:w-16 md:h-16 text-green-600" />
				</div>
			{:else if getUserPrimaryFileType(user.userRoles || []) === FileTypes.Design}
				<div class="h-20 w-20 md:h-24 md:w-24 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-xl flex items-center justify-center transition-transform duration-300 shadow-sm">
					<Icon icon="mdi:palette-outline" class="w-12 h-12 md:w-16 md:h-16 text-green-600" />
				</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Trademark Registry Hub -->
	<div class="space-y-4 {isTradeMarkRelated() ? '' : 'hidden'}">
		<!-- <div class="mb-4">
			<div class="flex items-center space-x-2 mb-4">
				<Icon icon="mdi:scale-balance" class="text-2xl text-green-600" />
				<h3 class="text-xl font-semibold text-gray-800">Trademark Registry Hub</h3>
			</div>
		</div> -->

		<!-- Application Type Dropdowns -->
		<div class="space-y-3">
			<Accordion.Root>
				{#each getApplicationTypesData(FileTypes.Trademark) as appTypeData (appTypeData.appType)}
					<Accordion.Item value="{appTypeData.appType.toString()}" class="border border-slate-200/60 rounded-xl bg-gradient-to-r from-white via-slate-50/50 to-white mb-2 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60">
					<Accordion.Trigger class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline">
			<div class="flex items-center justify-between w-full px-3 py-2">
				<div class="flex items-center space-x-3">
					<div class="w-8 h-8 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-lg flex items-center justify-center shadow-sm">
						<Icon icon="{getApplicationTypeIcon(appTypeData.appType)}" class="text-base text-green-600" />
					</div>
					<div class="text-left">
						<p class="font-semibold text-slate-800 text-base underline">{mapApplicationTypeName(appTypeData.appType)}</p>
						<p class="text-sm text-slate-500 underline">{appTypeData.statuses.length} status{appTypeData.statuses.length !== 1 ? 'es' : ''}</p>
					</div>
							</div>
							<div class="flex-shrink-0 ml-2">
								<Icon icon="heroicons:chevron-down" class="w-6 h-6 text-green-600 transition-transform duration-200 data-[state=open]:rotate-180" />
							</div>
						</div>
					</Accordion.Trigger>
					<Accordion.Content>
							<div class="px-4 pb-3 space-y-1.5">
								{#if appTypeData.statuses && appTypeData.statuses.length > 0}
									{#each appTypeData.statuses as statusData}
										<a
											href="/files?fileType=2&appType={appTypeData.appType}&status={statusData.status}&titleType=custom"
											class="flex items-center justify-between p-2 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors duration-150"
											style="text-decoration: none;"
										>
											<AppStatusTag value={statusData.status} />
											<span class="font-semibold text-gray-700">{statusData.count}</span>
										</a>
									{/each}
								{:else}
									<p class="text-gray-500 text-sm py-2">No data available</p>
								{/if}
							</div>
						</Accordion.Content>
					</Accordion.Item>
				{/each}
			</Accordion.Root>
		</div>

		<!-- Additional Actions -->
		<!-- <div class="mt-6">
			<button 
				class="w-full bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
				on:click={() => goto('/home/trademarkpubs')}
			>
				<div class="flex items-center space-x-3">
					<Icon icon="mdi:newspaper-variant" class="text-xl text-green-600" />
					<div>
						<h4 class="font-medium text-gray-900">View Trademark Publications</h4>
						<p class="text-sm text-gray-600">Browse published trademark applications</p>
					</div>
				</div>
			</button>
		</div> -->
	</div>
	<!-- Patent Registry Hub -->
	<div class="space-y-4 {isPatentRelated() ? '' : 'hidden'}">
		<!-- <div class="mb-4">
			<div class="flex items-center space-x-2 mb-4">
				<Icon icon="mdi:lightbulb-outline" class="text-2xl text-green-600" />
				<h3 class="text-xl font-semibold text-gray-800">Patent Registry Hub</h3>
			</div>
		</div> -->

		<!-- Application Type Dropdowns -->
		<div class="space-y-3">
			<Accordion.Root>
				{#each getApplicationTypesData(FileTypes.Patent) as appTypeData (appTypeData.appType)}
					<Accordion.Item value="{appTypeData.appType.toString()}" class="border border-slate-200/60 rounded-xl bg-gradient-to-r from-white via-slate-50/50 to-white mb-2 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60">
					<Accordion.Trigger class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline">
						<div class="flex items-center justify-between w-full px-3 py-2">
							<div class="flex items-center space-x-3">
								<div class="w-8 h-8 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-lg flex items-center justify-center shadow-sm">
									<Icon icon="{getApplicationTypeIcon(appTypeData.appType)}" class="text-base text-green-600" />
								</div>
								<div class="text-left">
									<p class="font-semibold text-slate-800 text-base underline">{mapApplicationTypeName(appTypeData.appType)}</p>
									<p class="text-sm text-slate-500 underline">{appTypeData.statuses.length} status{appTypeData.statuses.length !== 1 ? 'es' : ''}</p>
								</div>
							</div>
							<div class="flex-shrink-0 ml-2">
								<Icon icon="heroicons:chevron-down" class="w-6 h-6 text-green-600 transition-transform duration-200 data-[state=open]:rotate-180" />
							</div>
						</div>
						</Accordion.Trigger>
						<Accordion.Content>
							<div class="px-4 pb-4 space-y-2">
								{#if appTypeData.statuses && appTypeData.statuses.length > 0}
									{#each appTypeData.statuses as statusData}
										<a
											href="/files?fileType=0&appType={appTypeData.appType}&status={statusData.status}&titleType=custom"
											class="flex items-center justify-between p-3 rounded-md border border-gray-100 hover:bg-gray-100 transition-colors duration-150"
											style="text-decoration: none;"
										>
											<AppStatusTag value={statusData.status} />
											<span class="font-semibold text-gray-700">{statusData.count}</span>
										</a>
									{/each}
								{:else}
									<p class="text-gray-500 text-sm py-2">No data available</p>
								{/if}
							</div>
						</Accordion.Content>
					</Accordion.Item>
				{/each}
			</Accordion.Root>
		</div>
	</div>

	<!-- Design Registry Hub -->
	<div class="space-y-4 {isDesignRelated() ? '' : 'hidden'}">
		<!-- <div class="mb-4">
			<div class="flex items-center space-x-2 mb-4">
				<Icon icon="mdi:palette-outline" class="text-2xl text-green-600" />
				<h3 class="text-xl font-semibold text-gray-800">Design Registry Hub</h3>
			</div>
		</div> -->

		<!-- Application Type Dropdowns -->
		<div class="space-y-3">
			<Accordion.Root>
				{#each getApplicationTypesData(FileTypes.Design) as appTypeData (appTypeData.appType)}
					<Accordion.Item value="{appTypeData.appType.toString()}" class="border border-slate-200/60 rounded-xl bg-gradient-to-r from-white via-slate-50/50 to-white mb-2 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60">
					<Accordion.Trigger class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline">
						<div class="flex items-center justify-between w-full px-3 py-2">
							<div class="flex items-center space-x-3">
								<div class="w-10 h-10 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-lg flex items-center justify-center shadow-sm">
									<Icon icon="{getApplicationTypeIcon(appTypeData.appType)}" class="text-base text-green-600" />
								</div>
								<div class="text-left">
									<p class="font-semibold text-slate-800 text-base underline">{mapApplicationTypeName(appTypeData.appType)}</p>
									<p class="text-sm text-slate-500 underline">{appTypeData.statuses.length} status{appTypeData.statuses.length !== 1 ? 'es' : ''}</p>
								</div>
							</div>
							<div class="flex-shrink-0 ml-2">
								<Icon icon="heroicons:chevron-down" class="w-6 h-6 text-green-600 transition-transform duration-200 data-[state=open]:rotate-180" />
							</div>
						</div>
						</Accordion.Trigger>
						<Accordion.Content>
							<div class="px-4 pb-3 space-y-1.5">
								{#if appTypeData.statuses && appTypeData.statuses.length > 0}
									{#each appTypeData.statuses as statusData}
										<a
											href="/files?fileType=1&appType={appTypeData.appType}&status={statusData.status}&titleType=custom"
											class="flex items-center justify-between p-2 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors duration-150"
											style="text-decoration: none;"
										>
											<AppStatusTag value={statusData.status} />
											<span class="font-semibold text-gray-700">{statusData.count}</span>
										</a>
									{/each}
								{:else}
									<p class="text-gray-500 text-sm py-2">No data available</p>
								{/if}
							</div>
						</Accordion.Content>
					</Accordion.Item>
				{/each}
			</Accordion.Root>
		</div>
	</div>
{/if}

<style>
	/* Allow underlines for elements with underline class */
	:global(button[data-accordion-trigger]) {
		text-decoration: none !important;
	}
	
	:global(button[data-accordion-trigger] *:not(.underline)) {
		text-decoration: none !important;
	}
	
	:global(button[data-accordion-trigger] p.underline) {
		text-decoration: underline !important;
	}
	
	/* Remove default accordion arrows to prevent double arrows */
	:global([data-accordion-trigger]:after) {
		content: none !important;
		display: none !important;
	}
	
	:global([data-accordion-trigger]::after) {
		content: none !important;
		display: none !important;
	}
	
	:global([data-accordion-trigger]:before) {
		content: none !important;
		display: none !important;
	}
	
	:global([data-accordion-trigger]::before) {
		content: none !important;
		display: none !important;
	}
	
	/* Hide any default SVG arrows from accordion component but keep application type icons */
	:global([data-accordion-trigger] svg:not(.w-6):not([class*="text-base"])) {
		display: none !important;
	}
	
	:global([data-radix-accordion-trigger]:after) {
		display: none !important;
	}
	
	:global([data-radix-accordion-trigger]::after) {
		display: none !important;
	}
</style>
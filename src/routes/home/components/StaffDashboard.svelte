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
import * as Dialog from "$lib/components/ui/dialog"
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
	/**
	 * GET ICON FOR APPLICATION TYPE
	 * ============================
	 * Returns appropriate SVG icon and color for each FormApplicationType
	 */
	function getApplicationTypeIcon(appType: number) {
		const uniformBgColor = "from-green-100 via-green-50 to-emerald-50";
		const uniformColor = "text-green-600";
		
		switch (appType) {
			case 0: // NewApplication
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 1: // LicenseRenewal
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 2: // DataUpdate
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 3: // Recapture
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 4: // None
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 5: // Assignment
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 6: // Ownership
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2L7.257 13.243A6 6 0 0113 5a2 2 0 012 2z"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 7: // RegisteredUser
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 8: // Merger
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 9: // ChangeOfName
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 10: // ChangeOfAddress
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 11: // ClericalUpdate
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 12: // StatusSearch
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 13: // AppealRequest
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l-3-3m3 3l3-3"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 14: // PublicationStatusUpdate
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 15: // WithdrawalRequest
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 16: // NewOpposition
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 17: // Amendment
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>', color: uniformColor, bgColor: uniformBgColor };
			case 18: // Certification
				return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>', color: uniformColor, bgColor: uniformBgColor };
		default:
			return { svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>', color: uniformColor, bgColor: uniformBgColor };
		}
	}

	function getSimpleIcon(type: number): string {
		switch (type) {
			case 0: // NewApplication
				return '+';
			case 1: // LicenseRenewal
				return '↻';
			case 2: // DataUpdate
				return '✎';
			case 3: // Recapture
				return '◐';
			case 4: // None
				return '□';
			case 5: // Assignment
				return '↔';
			case 6: // Ownership
				return '⚷';
			case 7: // RegisteredUser
				return '⚇';
			case 8: // Merger
				return '⧉';
			case 9: // ChangeOfName
				return '◈';
			case 10: // ChangeOfAddress
				return '⌖';
			case 11: // ClericalUpdate
				return '◈';
			case 12: // StatusSearch
				return '⚲';
			case 13: // AppealRequest
				return '◆';
			case 14: // PublicationStatusUpdate
				return '◉';
			case 15: // WithdrawalRequest
				return '⊖';
			case 16: // NewOpposition
				return '⚔';
			case 17: // Amendment
				return '◎';
			case 18: // Certification
				return '✓';
			default:
				return '◯';
		}
	}	/**
	 * CORE FUNCTION FOR DETAILED STATISTICS
	 * ====================================
	 * Processes and organizes detailed statistics data for the accordion sections.
	 * Takes raw statistics data and groups it by application type and status.
	 * 
	 * @param fileType - The FileType to get statistics for (0=Patent, 1=Design, 2=Trademark)
	 * @returns Array of objects containing:
	 *   - type: Application type ID (e.g., "1" for New Application)
	 *   - items: Array of {status, count} objects for each status within that type
	 * 
	 * Data Flow:
	 * 1. Filters detailedStats by fileType
	 * 2. Sorts by status for consistent ordering
	 * 3. Groups by application type (curr.type)
	 * 4. Maps to final structure used by the accordion components
	 */
	function getType(fileType: FileTypes) {
		// Step 1: Filter statistics data for the specified file type
		const val = $DashStats?.detailedStats
			?.filter((x) => x.fileType === fileType) ?? [];
		
		// Step 2: Sort by status for consistent display order
		val.sort((a, v) => (a.status > v.status ? 1 : a.status < v.status ? -1 : 0));
		
		// Step 3: Group statistics by application type (e.g., New Application, Renewal, etc.)
		const grouped = val.reduce((acc: Record<string, typeof val>, curr) => {
			const type = curr.type?.toString() || '0';
			acc[type] = (acc[type] || []).concat(curr);
			return acc;
		}, {} as Record<string, typeof val>);
		
		// Step 4: Convert grouped object to array format expected by the UI
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


</script>
{#if isLoading}
	<Icon class="flex items-center justify-center w-full"
				icon="eos-icons:loading"
				width="1.6rem"
				height="1.6rem"
	/>
{:else}

	<!-- Professional Header -->
	<div class="bg-white rounded-xl p-5 mb-8 border border-green-200/40 shadow-lg hover:shadow-xl transition-all duration-300 sticky top-0 z-10">
		<div class="flex items-center justify-between space-x-6">
			<!-- Left Logo -->
			<div class="flex-shrink-0">
				<img src="{ministry}" alt="Ministry Logo" class="h-16 w-16 md:h-20 md:w-20 object-contain hover:scale-105 transition-transform duration-300" />
			</div>
			
			<!-- Center Content -->
			<div class="text-center flex-1">
				<h1 class="text-xl md:text-2xl lg:text-3xl font-bold text-green-600 mb-1 leading-tight">
					Intellectual Property Office Nigeria
				</h1>
				<p class="text-green-600 font-semibold text-xs md:text-sm tracking-wide mb-2">
					Commercial Law Department
				</p>
				<h2 class="text-lg md:text-xl font-bold text-gray-700">{getRoleInfo().title}</h2>
				<p class="text-green-600 text-xs md:text-sm">
					Manage {getRoleInfo().title} Applications
				</p>
			</div>
			
			<!-- Right Logo (Officer's IP Type) -->
			<div class="flex-shrink-0">
			{#if getUserPrimaryFileType(user.userRoles || []) === FileTypes.Trademark}
				<div class="h-20 w-20 md:h-24 md:w-24 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center transition-transform duration-300 shadow-lg hover:shadow-xl border border-green-200/30 hover:scale-105">
					<Icon icon="mdi:scale-balance" class="w-12 h-12 md:w-16 md:h-16 text-green-600" />
				</div>
			{:else if getUserPrimaryFileType(user.userRoles || []) === FileTypes.Patent}
				<div class="h-20 w-20 md:h-24 md:w-24 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center transition-transform duration-300 shadow-lg hover:shadow-xl border border-green-200/30 hover:scale-105">
					<Icon icon="mdi:lightbulb-outline" class="w-12 h-12 md:w-16 md:h-16 text-green-600" />
				</div>
			{:else if getUserPrimaryFileType(user.userRoles || []) === FileTypes.Design}
				<div class="h-20 w-20 md:h-24 md:w-24 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center transition-transform duration-300 shadow-lg hover:shadow-xl border border-green-200/30 hover:scale-105">
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

		<div class="space-y-4">
			<Accordion.Root class="space-y-3">
			{#each getType(FileTypes.Trademark) as item}
				{@const iconInfo = getApplicationTypeIcon(parseInt(item.type))}
				<Accordion.Item value="{item.type}" class="border border-slate-200/60 rounded-xl bg-gradient-to-r from-white via-slate-50/50 to-white mb-2 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60">
					<Accordion.Trigger class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline">
						<div class="flex items-center justify-between w-full px-3 py-2">
							<div class="flex items-center space-x-3 flex-1">
								<div class="w-10 h-10 bg-gradient-to-br {iconInfo.bgColor} rounded-lg flex items-center justify-center shadow-sm border border-green-100">
									<div class="w-4 h-4 {iconInfo.color} font-bold text-lg flex items-center justify-center">{getSimpleIcon(parseInt(item.type))}</div>
								</div>
								<div class="flex-1 text-left">
									<div class="flex items-center gap-2 mb-0.5">
										<h4 class="font-bold text-gray-800 text-sm uppercase tracking-wide">{mapTypeToString(parseInt(item.type))}</h4>
										<span class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-semibold">{item.items.length}</span>
									</div>
									<p class="text-xs text-gray-500 font-medium">{item.items.length} status{item.items.length !== 1 ? 'es' : ''} available</p>
								</div>
							</div>
						<div class="flex-shrink-0 ml-2">
							<svg class="w-5 h-5 text-green-600 transition-transform duration-200 group-data-[state=open]:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
							</svg>
						</div>
						</div>
						</Accordion.Trigger>
						<Accordion.Content>
							<div class="px-4 pb-3 space-y-1.5">
								{#if item.items && item.items.length > 0}
									{#each item.items as appInfo}
										<a
											href="/files?fileType=2&appType={parseInt(item.type)}&status={appInfo.status}&titleType=custom"
											class="flex items-center justify-between p-2 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors duration-150"
											style="text-decoration: none;"
										>
											<AppStatusTag value={appInfo.status} />
											<span class="font-semibold text-gray-700">{appInfo.count}</span>
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
		</div>		<!-- Additional Actions -->
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

		<div class="space-y-4">
			<Accordion.Root class="space-y-3">
			{#each getType(FileTypes.Patent) as item}
				{@const iconInfo = getApplicationTypeIcon(parseInt(item.type))}
				<Accordion.Item value="{item.type}" class="border border-slate-200/60 rounded-xl bg-gradient-to-r from-white via-slate-50/50 to-white mb-2 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60">
					<Accordion.Trigger class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline">
						<div class="flex items-center justify-between w-full px-3 py-2">
							<div class="flex items-center space-x-3 flex-1">
								<div class="w-10 h-10 bg-gradient-to-br {iconInfo.bgColor} rounded-lg flex items-center justify-center shadow-sm border border-green-100">
									<div class="w-4 h-4 {iconInfo.color} font-bold text-lg flex items-center justify-center">{getSimpleIcon(parseInt(item.type))}</div>
								</div>
								<div class="flex-1 text-left">
									<div class="flex items-center gap-2 mb-0.5">
										<h4 class="font-bold text-gray-800 text-sm uppercase tracking-wide">{mapTypeToString(parseInt(item.type))}</h4>
										<span class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-semibold">{item.items.length}</span>
									</div>
									<p class="text-xs text-gray-500 font-medium">{item.items.length} status{item.items.length !== 1 ? 'es' : ''} available</p>
								</div>
							</div>
							<div class="flex-shrink-0 ml-2">
								<Icon icon="heroicons:chevron-down" class="w-5 h-5 text-green-600 transition-transform duration-200 data-[state=open]:rotate-180" />
							</div>
						</div>
						</Accordion.Trigger>
						<Accordion.Content>
							<div class="px-4 pb-3 space-y-1.5">
								{#if item.items && item.items.length > 0}
									{#each item.items as appInfo}
											<a
												href="/files?fileType=0&appType={parseInt(item.type)}&status={appInfo.status}&titleType=custom"
												class="flex items-center justify-between p-2 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors duration-150"
												style="text-decoration: none;"
										>
											<AppStatusTag value={appInfo.status} />
											<span class="font-semibold text-gray-700">{appInfo.count}</span>
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

		<div class="space-y-4">
			<Accordion.Root class="space-y-3">
			{#each getType(FileTypes.Design) as item}
				{@const iconInfo = getApplicationTypeIcon(parseInt(item.type))}
				<Accordion.Item value="{item.type}" class="border border-slate-200/60 rounded-xl bg-gradient-to-r from-white via-slate-50/50 to-white mb-2 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60">
					<Accordion.Trigger class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline">
						<div class="flex items-center justify-between w-full px-3 py-2">
							<div class="flex items-center space-x-3 flex-1">
								<div class="w-10 h-10 bg-gradient-to-br {iconInfo.bgColor} rounded-lg flex items-center justify-center shadow-sm border border-green-100">
									<div class="w-4 h-4 {iconInfo.color} font-bold text-lg flex items-center justify-center">{getSimpleIcon(parseInt(item.type))}</div>
								</div>
								<div class="flex-1 text-left">
									<div class="flex items-center gap-2 mb-0.5">
										<h4 class="font-bold text-gray-800 text-sm uppercase tracking-wide">{mapTypeToString(parseInt(item.type))}</h4>
										<span class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-semibold">{item.items.length}</span>
									</div>
									<p class="text-xs text-gray-500 font-medium">{item.items.length} status{item.items.length !== 1 ? 'es' : ''} available</p>
								</div>
							</div>
							<div class="flex-shrink-0 ml-2">
								<Icon icon="heroicons:chevron-down" class="w-5 h-5 text-green-600 transition-transform duration-200 data-[state=open]:rotate-180" />
							</div>
						</div>
						</Accordion.Trigger>
						<Accordion.Content>
							<div class="px-4 pb-3 space-y-1.5">
								{#if item.items && item.items.length > 0}
									{#each item.items as appInfo}
											<a
												href="/files?fileType=1&appType={parseInt(item.type)}&status={appInfo.status}&titleType=custom"
												class="flex items-center justify-between p-2 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors duration-150"
												style="text-decoration: none;"
										>
											<AppStatusTag value={appInfo.status} />
											<span class="font-semibold text-gray-700">{appInfo.count}</span>
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
				<!-- {/each} -->
			<!-- </Accordion.Root> -->
		</div>
	<!-- -->
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
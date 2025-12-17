<script lang="ts">
	import { BackgroundGradient } from '$lib/components/ui/BackgroundGradient';
	import { DashStats, loggedInToken, loggedInUser } from '$lib/store';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { baseURL, type DashBoardStats, FileTypes, UserRoles, type UsersType } from '$lib/helpers';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import { mapTypeToString } from './dashboardutils';
	import * as Accordion from "$lib/components/ui/accordion"
	export let user: UsersType ;
	export let showOnlyTotals: boolean = false;
	export let showOnlyStatistics: boolean = false;
	let isLoading: boolean = true;
	
	// Separate state for user dashboard to avoid conflicts with staff dashboard
	let userDashStats: DashBoardStats | null = null;

	// 🐛 DEBUG: Log DashStats changes for comparison with StaffDashboard
	// $: if ($DashStats) {
	// 	console.log('🔍 USER DASHBOARD - DashStats:', {
	// 		detailedStats: $DashStats.detailedStats,
	// 		detailedStatsCount: $DashStats.detailedStats?.length || 0,
	// 		patentStats: $DashStats.detailedStats?.filter(x => x.fileType === 0) || [],
	// 		trademarkStats: $DashStats.detailedStats?.filter(x => x.fileType === 2) || [],
	// 		designStats: $DashStats.detailedStats?.filter(x => x.fileType === 1) || [],
	// 		userType: user?.userType,
	// 		userRoles: user?.userRoles,
	// 		userId: user?.creatorId
	// 	});
	// }

	onMount(async () => {
		isLoading = true;
		await loadDashStats();
	});

	async function loadDashStats() {
		// Use $loggedInUser instead of user prop for consistent role checking
		const currentUser = $loggedInUser || user;
		const userId = currentUser.creatorId;
		
		// Only show all files for Tech, SuperAdmin roles
		// Regular users (UserRoles.User) should only see their own files
		const canSeeAllFiles = currentUser.userRoles?.some(role => 
			[UserRoles.Tech, UserRoles.SuperAdmin].includes(role)
		);
		

		
		let id = canSeeAllFiles ? null : userId;
		const url = `${baseURL}/api/files/FileStatistics?userId=${id}`;
		

		const data = await fetch(url, {
			headers: {
				'Authorization': `Bearer ${$loggedInToken}`
			}
		});
		if (data.ok) {
			const body = await data.json();
			const values = body as DashBoardStats[];
			userDashStats = values[0]; // Use local state instead of global store
			isLoading = false;
		}
	}

	/**
	 * Gets the total count of applications for a specific file type (Patents, Designs, Trademarks)
	 * Used in the summary cards at the top of the dashboard
	 * @param type - The FileType enum (Patent=0, Design=1, Trademark=2)
	 * @returns Total count of applications for this file type
	 */
	function getTotal(type: FileTypes) {
		return userDashStats?.fileStats.find((x) => x.fileType === type)?.count??0;
	}
	
	/**
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
		const val = userDashStats?.detailedStats
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

	function getRenewal() {
		return userDashStats?.inactive[0]?.total??0;
	}

	/**
	 * Generate filtered file URLs for regular users
	 * Tech/SuperAdmin see all files, regular users see only their own files
	 */
	function getFileUrl(baseParams: string): string {
		// Use $loggedInUser for consistent role checking
		const currentUser = $loggedInUser || user;
		const canSeeAllFiles = currentUser.userRoles?.some(role => 
			[UserRoles.Tech, UserRoles.SuperAdmin].includes(role)
		);
		

		
		if (canSeeAllFiles) {
			// Tech/SuperAdmin see all files
			return `/files?${baseParams}`;
		} else {
			// Regular users see only their own files
			return `/files?${baseParams}&userId=${currentUser.creatorId}`;
		}
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
	}
</script>

{#if isLoading}
	<Icon
		class="flex items-center justify-center w-full"
		icon="eos-icons:loading"
		width="1.6rem"
		height="1.6rem"
	/>
{:else}
	{#if !showOnlyStatistics}
	<div class="space-y-3">
		<!-- Trademark Total -->
		<a href={getFileUrl("fileType=2&titleType=specific")} class="group flex items-center justify-between p-4 bg-gradient-to-r from-white via-slate-50/50 to-white border border-slate-200/60 rounded-xl hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60">
			<div class="flex items-center space-x-4">
				<div class="w-10 h-10 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
					<Icon icon="mdi:scale-balance" class="text-lg text-green-600 group-hover:text-green-700" />
				</div>
				<div>
					<p class="font-semibold text-slate-800 group-hover:text-slate-900">Trademark Applications</p>
					<p class="text-xs text-slate-500">Registered brand identities</p>
				</div>
			</div>
			<div class="text-right">
				<p class="text-2xl font-bold text-slate-800 group-hover:text-green-700 transition-colors duration-300">{getTotal(FileTypes.Trademark).toLocaleString()}</p>
				<div class="flex items-center justify-end mt-1">
					<Icon icon="heroicons:arrow-right" class="text-slate-400 group-hover:text-green-500 text-sm transition-colors duration-300" />
				</div>
			</div>
		</a>

		<!-- Patent Total -->
		<a href={getFileUrl("fileType=0&titleType=specific")} class="group flex items-center justify-between p-4 bg-gradient-to-r from-white via-slate-50/50 to-white border border-slate-200/60 rounded-xl hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60">
			<div class="flex items-center space-x-4">
				<div class="w-10 h-10 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
					<Icon icon="mdi:lightbulb-outline" class="text-lg text-green-600 group-hover:text-green-700" />
				</div>
				<div>
					<p class="font-semibold text-slate-800 group-hover:text-slate-900">Patent Applications</p>
					<p class="text-xs text-slate-500">Protected inventions and innovations</p>
				</div>
			</div>
			<div class="text-right">
				<p class="text-2xl font-bold text-slate-800 group-hover:text-green-700 transition-colors duration-300">{getTotal(FileTypes.Patent).toLocaleString()}</p>
				<div class="flex items-center justify-end mt-1">
					<Icon icon="heroicons:arrow-right" class="text-slate-400 group-hover:text-green-500 text-sm transition-colors duration-300" />
				</div>
			</div>
		</a>

		<!-- Design Total -->
		<a href={getFileUrl("fileType=1&titleType=specific")} class="group flex items-center justify-between p-4 bg-gradient-to-r from-white via-slate-50/50 to-white border border-slate-200/60 rounded-xl hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60">
			<div class="flex items-center space-x-4">
				<div class="w-10 h-10 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
					<Icon icon="mdi:palette-outline" class="text-lg text-green-600 group-hover:text-green-700" />
				</div>
				<div>
					<p class="font-semibold text-slate-800 group-hover:text-slate-900">Design Applications</p>
					<p class="text-xs text-slate-500">Safeguarded creative designs</p>
				</div>
			</div>
			<div class="text-right">
				<p class="text-2xl font-bold text-slate-800 group-hover:text-green-700 transition-colors duration-300">{getTotal(FileTypes.Design).toLocaleString()}</p>
				<div class="flex items-center justify-end mt-1">
					<Icon icon="heroicons:arrow-right" class="text-slate-400 group-hover:text-green-500 text-sm transition-colors duration-300" />
				</div>
			</div>
		</a>
	</div>
	{/if}
	
	{#if !showOnlyTotals && !showOnlyStatistics}
	<Accordion.Root>
		<Accordion.Item value="pending" class="border rounded-md p-3 bg-white">
			<Accordion.Trigger>
				<div class="flex px-3">
					<Icon
						icon="arcticons:letter-uppercase-square-p"
						width="1.5rem"
						height="1.5rem"
						class="mr-1.5 text-green-800"
					/>
					<p>Patent Applications Statistics</p>
				</div>
			</Accordion.Trigger>
			<Accordion.Content>
				<div class="grid grid-cols-3 gap-2">
					{#each getType(FileTypes.Patent) as item}
						<div>
							<p>{mapTypeToString(parseInt(item.type))}</p>
							<div class="border rounded-md p-2">
								{#each item.items as appInfo}
									<a
										class="flex space-x-2 hover:bg-gray-500 my-1.5 items-center justify-between"
									href={getFileUrl(`fileType=0&appType=${parseInt(item.type)}&status=${appInfo.status}&titleType=custom`)}
									>
										<AppStatusTag value={appInfo.status} />
										<p class="">{appInfo.count}</p>
									</a>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
	<br />
	<Accordion.Root>
		<Accordion.Item value="pending" class="border rounded-md p-3 bg-white">
			<Accordion.Trigger>
				<div class="flex px-3">
					<Icon
						icon="arcticons:letter-uppercase-square-d"
						width="1.5rem"
						height="1.5rem"
						class="mr-1.5 text-green-800"
					/>
					<p>Design Applications Statistics</p>
				</div>
			</Accordion.Trigger>
			<Accordion.Content>
				<div class="grid grid-cols-3 gap-2">
					{#each getType(1) as item}
						<div>
							<p>{mapTypeToString(parseInt(item.type))}</p>
							<div class="border rounded-md p-2">
								{#each item.items as appInfo}
									<a
										class="flex space-x-2 hover:bg-gray-500 my-1.5 items-center justify-between"
									href={getFileUrl(`fileType=1&appType=${parseInt(item.type)}&status=${appInfo.status}&titleType=custom`)}
									>
										<AppStatusTag value={appInfo.status} />
										<p class="">{appInfo.count}</p>
									</a>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
	<!-- Trademark Registry Hub -->
	<div class="space-y-4">
		<Accordion.Root class="space-y-3">
			<Accordion.Item value="trademarks" class="border border-slate-200/60 rounded-xl bg-gradient-to-r from-white via-slate-50/50 to-white mb-2 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60">
				<Accordion.Trigger class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline">
					<div class="flex items-center justify-between w-full px-3 py-2">
						<div class="flex items-center space-x-3 flex-1">
							<div class="w-10 h-10 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-lg flex items-center justify-center shadow-sm border border-green-100">
								<Icon icon="mdi:scale-balance" class="w-6 h-6 text-green-600" />
							</div>
							<div class="flex-1 text-left">
								<div class="flex items-center gap-2 mb-0.5">
									<h4 class="font-semibold text-slate-800">Trademark Applications Statistics</h4>
									<span class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-semibold">{getType(FileTypes.Trademark).length}</span>
								</div>
								<p class="text-xs text-slate-500">Registered brand identities</p>
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
					<div class="px-2 pb-3">
						<Accordion.Root class="space-y-2">
						{#each getType(FileTypes.Trademark) as item}
							{@const iconInfo = getApplicationTypeIcon(parseInt(item.type))}
							<Accordion.Item value="trademark-{item.type}" class="border border-slate-200/40 rounded-lg bg-white/80 hover:shadow-md hover:shadow-green-500/5 transition-all duration-200">
								<Accordion.Trigger class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline">
									<div class="flex items-center justify-between w-full px-2 py-1.5">
										<div class="flex items-center space-x-2 flex-1">
											<div class="w-8 h-8 bg-gradient-to-br {iconInfo.bgColor} rounded-md flex items-center justify-center shadow-sm border border-green-100">
												<div class="w-3 h-3 {iconInfo.color} font-bold text-sm flex items-center justify-center">{getSimpleIcon(parseInt(item.type))}</div>
											</div>
											<div class="flex-1 text-left">
												<div class="flex items-center gap-2">
													<h5 class="font-semibold text-gray-800 text-xs">{mapTypeToString(parseInt(item.type))}</h5>
													<span class="bg-green-50 text-green-600 px-1 py-0.5 rounded text-xs font-medium">{item.items.length}</span>
												</div>
											</div>
										</div>
										<div class="flex-shrink-0 ml-1">
											<Icon icon="heroicons:chevron-down" class="w-4 h-4 text-green-500 transition-transform duration-200 data-[state=open]:rotate-180" />
										</div>
									</div>
								</Accordion.Trigger>
								<Accordion.Content>
									<div class="px-3 pb-2 space-y-1">
										{#if item.items && item.items.length > 0}
											{#each item.items as appInfo}
												<a
													href={getFileUrl(`fileType=2&appType=${parseInt(item.type)}&status=${appInfo.status}&titleType=custom`)}
													class="flex items-center justify-between p-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors duration-150"
													style="text-decoration: none;"
												>
													<AppStatusTag value={appInfo.status} />
													<span class="font-medium text-gray-700 text-sm">{appInfo.count}</span>
												</a>
											{/each}
										{:else}
											<p class="text-gray-500 text-xs py-1">No data available</p>
										{/if}
									</div>
								</Accordion.Content>
							</Accordion.Item>
						{/each}
						</Accordion.Root>
					</div>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	</div>
	{/if}

	<!-- 
		DETAILED STATISTICS VIEW
		========================
		This section renders when showOnlyStatistics={true} is passed from the parent component.
		It displays comprehensive statistics for all IP types in accordion format.
		Each accordion contains application type breakdowns with status counts and clickable links.
	-->
	{#if showOnlyStatistics}
	<Accordion.Root class="space-y-4">

		<!-- Trademark Applications Hub -->
		<Accordion.Item value="trademarks" class="border border-slate-200/60 rounded-xl bg-gradient-to-r from-white via-slate-50/50 to-white hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60">
			<Accordion.Trigger class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline">
				<div class="flex items-center justify-between w-full px-3 py-2">
					<div class="flex items-center space-x-3 flex-1">
						<div class="w-10 h-10 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-lg flex items-center justify-center shadow-sm border border-green-100">
							<Icon icon="mdi:scale-balance" class="w-6 h-6 text-green-600" />
						</div>
						<div class="flex-1 text-left">
							<div class="flex items-center gap-2 mb-0.5">
								<h4 class="font-semibold text-slate-800">Trademark Applications Statistics</h4>
								<span class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-semibold">{getType(FileTypes.Trademark).length}</span>
							</div>
							<p class="text-xs text-slate-500">Registered brand identities</p>
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
				<div class="px-2 pb-3">
					<Accordion.Root class="space-y-2">
					{#each getType(FileTypes.Trademark) as item}
						{@const iconInfo = getApplicationTypeIcon(parseInt(item.type))}
						<Accordion.Item value="trademark-{item.type}" class="border border-slate-200/40 rounded-lg bg-white/80 hover:shadow-md hover:shadow-green-500/5 transition-all duration-200">
							<Accordion.Trigger class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline">
								<div class="flex items-center justify-between w-full px-2 py-1.5">
									<div class="flex items-center space-x-2 flex-1">
										<div class="w-8 h-8 bg-gradient-to-br {iconInfo.bgColor} rounded-md flex items-center justify-center shadow-sm border border-green-100">
											<div class="w-3 h-3 {iconInfo.color} font-bold text-sm flex items-center justify-center">{getSimpleIcon(parseInt(item.type))}</div>
										</div>
										<div class="flex-1 text-left">
											<div class="flex items-center gap-2">
												<h5 class="font-semibold text-gray-800 text-xs">{mapTypeToString(parseInt(item.type))}</h5>
												<span class="bg-green-50 text-green-600 px-1 py-0.5 rounded text-xs font-medium">{item.items.length}</span>
											</div>
										</div>
									</div>
									<div class="flex-shrink-0 ml-1">
										<Icon icon="heroicons:chevron-down" class="w-4 h-4 text-green-500 transition-transform duration-200 data-[state=open]:rotate-180" />
									</div>
								</div>
							</Accordion.Trigger>
							<Accordion.Content>
								<div class="px-3 pb-2 space-y-1">
									{#if item.items && item.items.length > 0}
										{#each item.items as appInfo}
											<a
												href={getFileUrl(`fileType=2&appType=${parseInt(item.type)}&status=${appInfo.status}&titleType=custom`)}
												class="flex items-center justify-between p-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors duration-150"
												style="text-decoration: none;"
											>
												<AppStatusTag value={appInfo.status} />
												<span class="font-medium text-gray-700 text-sm">{appInfo.count}</span>
											</a>
										{/each}
									{:else}
										<p class="text-gray-500 text-xs py-1">No data available</p>
									{/if}
								</div>
							</Accordion.Content>
						</Accordion.Item>
					{/each}
					</Accordion.Root>
				</div>
			</Accordion.Content>
		</Accordion.Item>

		<!-- Patent Applications Hub -->
		<Accordion.Item value="patents" class="border border-slate-200/60 rounded-xl bg-gradient-to-r from-white via-slate-50/50 to-white hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60">
			<Accordion.Trigger class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline">
				<div class="flex items-center justify-between w-full px-3 py-2">
					<div class="flex items-center space-x-3 flex-1">
						<div class="w-10 h-10 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-lg flex items-center justify-center shadow-sm border border-green-100">
							<Icon icon="mdi:lightbulb-outline" class="w-6 h-6 text-green-600" />
						</div>
						<div class="flex-1 text-left">
							<div class="flex items-center gap-2 mb-0.5">
								<h4 class="font-semibold text-slate-800">Patent Applications Statistics</h4>
								<span class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-semibold">{getType(FileTypes.Patent).length}</span>
							</div>
							<p class="text-xs text-slate-500">Protected inventions and innovations</p>
						</div>
					</div>
					<div class="flex-shrink-0 ml-2">
						<Icon icon="heroicons:chevron-down" class="w-5 h-5 text-green-600 transition-transform duration-200 data-[state=open]:rotate-180" />
					</div>
				</div>
			</Accordion.Trigger>
			<Accordion.Content>
				<div class="px-2 pb-3">
					<Accordion.Root class="space-y-2">
					{#each getType(FileTypes.Patent) as item}
						{@const iconInfo = getApplicationTypeIcon(parseInt(item.type))}
						<Accordion.Item value="patent-{item.type}" class="border border-slate-200/40 rounded-lg bg-white/80 hover:shadow-md hover:shadow-green-500/5 transition-all duration-200">
							<Accordion.Trigger class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline">
								<div class="flex items-center justify-between w-full px-2 py-1.5">
									<div class="flex items-center space-x-2 flex-1">
										<div class="w-8 h-8 bg-gradient-to-br {iconInfo.bgColor} rounded-md flex items-center justify-center shadow-sm border border-green-100">
											<div class="w-3 h-3 {iconInfo.color} font-bold text-sm flex items-center justify-center">{getSimpleIcon(parseInt(item.type))}</div>
										</div>
										<div class="flex-1 text-left">
											<div class="flex items-center gap-2">
												<h5 class="font-semibold text-gray-800 text-xs">{mapTypeToString(parseInt(item.type))}</h5>
												<span class="bg-green-50 text-green-600 px-1 py-0.5 rounded text-xs font-medium">{item.items.length}</span>
											</div>
										</div>
									</div>
									<div class="flex-shrink-0 ml-1">
										<Icon icon="heroicons:chevron-down" class="w-4 h-4 text-green-500 transition-transform duration-200 data-[state=open]:rotate-180" />
									</div>
								</div>
							</Accordion.Trigger>
							<Accordion.Content>
								<div class="px-3 pb-2 space-y-1">
									{#if item.items && item.items.length > 0}
										{#each item.items as appInfo}
											<a
												href={getFileUrl(`fileType=0&appType=${parseInt(item.type)}&status=${appInfo.status}&titleType=custom`)}
												class="flex items-center justify-between p-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors duration-150"
												style="text-decoration: none;"
											>
												<AppStatusTag value={appInfo.status} />
												<span class="font-medium text-gray-700 text-sm">{appInfo.count}</span>
											</a>
										{/each}
									{:else}
										<p class="text-gray-500 text-xs py-1">No data available</p>
									{/if}
								</div>
							</Accordion.Content>
						</Accordion.Item>
					{/each}
					</Accordion.Root>
				</div>
			</Accordion.Content>
		</Accordion.Item>
		<!-- Design Applications Hub -->
		<Accordion.Item value="designs" class="border border-slate-200/60 rounded-xl bg-gradient-to-r from-white via-slate-50/50 to-white hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60">
			<Accordion.Trigger class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline">
				<div class="flex items-center justify-between w-full px-3 py-2">
					<div class="flex items-center space-x-3 flex-1">
						<div class="w-10 h-10 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-lg flex items-center justify-center shadow-sm border border-green-100">
							<Icon icon="mdi:palette-outline" class="w-6 h-6 text-green-600" />
						</div>
						<div class="flex-1 text-left">
							<div class="flex items-center gap-2 mb-0.5">
								<h4 class="font-semibold text-slate-800">Design Applications Statistics</h4>
								<span class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-semibold">{getType(FileTypes.Design).length}</span>
							</div>
							<p class="text-xs text-slate-500">Safeguarded creative designs</p>
						</div>
					</div>
					<div class="flex-shrink-0 ml-2">
						<Icon icon="heroicons:chevron-down" class="w-5 h-5 text-green-600 transition-transform duration-200 data-[state=open]:rotate-180" />
					</div>
				</div>
			</Accordion.Trigger>
			<Accordion.Content>
				<div class="px-2 pb-3">
					<Accordion.Root class="space-y-2">
					{#each getType(FileTypes.Design) as item}
						{@const iconInfo = getApplicationTypeIcon(parseInt(item.type))}
						<Accordion.Item value="design-{item.type}" class="border border-slate-200/40 rounded-lg bg-white/80 hover:shadow-md hover:shadow-green-500/5 transition-all duration-200">
							<Accordion.Trigger class="hover:bg-transparent data-[state=open]:bg-transparent [&>div]:no-underline">
								<div class="flex items-center justify-between w-full px-2 py-1.5">
									<div class="flex items-center space-x-2 flex-1">
										<div class="w-8 h-8 bg-gradient-to-br {iconInfo.bgColor} rounded-md flex items-center justify-center shadow-sm border border-green-100">
											<div class="w-3 h-3 {iconInfo.color} font-bold text-sm flex items-center justify-center">{getSimpleIcon(parseInt(item.type))}</div>
										</div>
										<div class="flex-1 text-left">
											<div class="flex items-center gap-2">
												<h5 class="font-semibold text-gray-800 text-xs">{mapTypeToString(parseInt(item.type))}</h5>
												<span class="bg-green-50 text-green-600 px-1 py-0.5 rounded text-xs font-medium">{item.items.length}</span>
											</div>
										</div>
									</div>
									<div class="flex-shrink-0 ml-1">
										<Icon icon="heroicons:chevron-down" class="w-4 h-4 text-green-500 transition-transform duration-200 data-[state=open]:rotate-180" />
									</div>
								</div>
							</Accordion.Trigger>
							<Accordion.Content>
								<div class="px-3 pb-2 space-y-1">
									{#if item.items && item.items.length > 0}
										{#each item.items as appInfo}
											<a
												href={getFileUrl(`fileType=1&appType=${parseInt(item.type)}&status=${appInfo.status}&titleType=custom`)}
												class="flex items-center justify-between p-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors duration-150"
												style="text-decoration: none;"
											>
												<AppStatusTag value={appInfo.status} />
												<span class="font-medium text-gray-700 text-sm">{appInfo.count}</span>
											</a>
										{/each}
									{:else}
										<p class="text-gray-500 text-xs py-1">No data available</p>
									{/if}
								</div>
							</Accordion.Content>
						</Accordion.Item>
					{/each}
					</Accordion.Root>
				</div>
			</Accordion.Content>
		</Accordion.Item>	
	</Accordion.Root>
	<!-- End of detailed statistics view -->
	{/if}
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
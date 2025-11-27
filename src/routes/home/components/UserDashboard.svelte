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
	onMount(async () => {
		if ($DashStats === null) {
			isLoading = true;
			await loadDashStats();
		} else {
			isLoading = false;
		}
	});

	async function loadDashStats() {
		const userId = user.creatorId;
		const showId = user.userRoles.includes(UserRoles.Tech || UserRoles.SuperAdmin || UserRoles.Staff);
		let id = showId ? null : userId;
		const url = `${baseURL}/api/files/FileStatistics?userId=${id}`;
		const data = await fetch(url, {
			headers: {
				'Authorization': `Bearer ${$loggedInToken}`
			}
		});
		if (data.ok) {
			const body = await data.json();
			const values = body as DashBoardStats[];
			DashStats.set(values[0]);
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
		return $DashStats?.fileStats.find((x) => x.fileType === type)?.count??0;
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

	function getRenewal() {
		return $DashStats?.inactive[0]?.total??0;
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
		<a href="/files?fileType=2&titleType=specific" class="group flex items-center justify-between p-4 bg-gradient-to-r from-white via-slate-50/50 to-white border border-slate-200/60 rounded-xl hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60">
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
		<a href="/files?fileType=0&titleType=specific" class="group flex items-center justify-between p-4 bg-gradient-to-r from-white via-slate-50/50 to-white border border-slate-200/60 rounded-xl hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60">
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
		<a href="/files?fileType=1&titleType=specific" class="group flex items-center justify-between p-4 bg-gradient-to-r from-white via-slate-50/50 to-white border border-slate-200/60 rounded-xl hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:scale-[1.01] hover:border-green-300/60">
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
										href="/files?fileType=0&appType={parseInt(
											item.type
										)}&status={appInfo.status}&titleType=custom"
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
										href="/files?fileType=1&appType={parseInt(
											item.type
										)}&status={appInfo.status}&titleType=custom"
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
							icon="arcticons:letter-uppercase-square-t"
							width="1.5rem"
							height="1.5rem"
							class="mr-1.5 text-green-800"
						/>
						<p>Trademark Applications Statistics</p>
					</div>
				</Accordion.Trigger>
				<Accordion.Content>
					<div class="grid grid-cols-3 gap-2">
						{#each getType(2) as item}
							<div>
								<p>{mapTypeToString(parseInt(item.type))}</p>
								<div class="border rounded-md p-2">
									{#each item.items as appInfo}
										<a
											class="flex space-x-2 hover:bg-gray-500 my-1.5 items-center justify-between"
											href="/files?fileType=2&appType={parseInt(item.type)}&status={appInfo.status}&titleType=custom"
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
	{/if}

	<!-- 
		DETAILED STATISTICS VIEW
		========================
		This section renders when showOnlyStatistics={true} is passed from the parent component.
		It displays comprehensive statistics for all IP types in accordion format.
		Each accordion contains application type breakdowns with status counts and clickable links.
	-->
	{#if showOnlyStatistics}
	<Accordion.Root>
		<!-- 
			PATENT APPLICATIONS STATISTICS ACCORDION
			===========================================
			Displays detailed breakdown of patent applications by:
			- Application type (mapped via mapTypeToString function)
			- Application status (shown with AppStatusTag component)
			- Count of applications in each status
			- Clickable links to filtered file views
		-->
		<Accordion.Item value="patents" class="border rounded-md p-3 bg-white">
			<!-- Accordion header with patent icon and title -->
			<Accordion.Trigger>
				<div class="flex px-3">
					<!-- Patent icon (Square P) -->
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
				<!-- 
					Patent Statistics Grid:
					- 3-column responsive grid layout
					- Each column represents a different patent application type
					- getType(FileTypes.Patent) fetches patent data grouped by type
				-->
				<div class="grid grid-cols-3 gap-2">
					<!-- Loop through each patent application type -->
					{#each getType(FileTypes.Patent) as item}
						<div>
							<!-- Application type header (e.g., "New Application", "Renewal", etc.) -->
							<p>{mapTypeToString(parseInt(item.type))}</p>
							<!-- Container for status breakdown within this application type -->
							<div class="border rounded-md p-2">
								<!-- Loop through each status within this application type -->
								{#each item.items as appInfo}
									<!-- 
										Clickable status row:
										- Links to filtered file view with specific parameters
										- fileType=0 (Patent), appType, status, titleType=custom
										- Shows status tag and count of applications
									-->
									<a
										class="flex space-x-2 hover:bg-gray-500 my-1.5 items-center justify-between"
										href="/files?fileType=0&appType={parseInt(item.type)}&status={appInfo.status}&titleType=custom"
									>
										<!-- Status badge component (e.g., "Pending", "Approved", etc.) -->
										<AppStatusTag value={appInfo.status} />
										<!-- Count of applications in this status -->
										<p class="">{appInfo.count}</p>
									</a>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</Accordion.Content>
		</Accordion.Item>
		<br />
		<!-- 
			DESIGN APPLICATIONS STATISTICS ACCORDION
			=========================================== 
			Similar structure to patents but for design applications (fileType=1).
			Displays breakdown by design application types and their statuses.
		-->
		<Accordion.Item value="designs" class="border rounded-md p-3 bg-white">
			<!-- Accordion header with design icon and title -->
			<Accordion.Trigger>
				<div class="flex px-3">
					<!-- Design icon (Square D) -->
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
				<!-- Design statistics grid (3-column layout) -->
				<div class="grid grid-cols-3 gap-2">
					<!-- Loop through design application types (getType(1) where 1 = FileTypes.Design) -->
					{#each getType(1) as item}
						<div>
							<!-- Design application type header -->
							<p>{mapTypeToString(parseInt(item.type))}</p>
							<!-- Status breakdown container -->
							<div class="border rounded-md p-2">
								<!-- Loop through each status within this design application type -->
								{#each item.items as appInfo}
									<!-- 
										Clickable design status row:
										- Links to design file view (fileType=1)
										- Includes application type and status filters
									-->
									<a
										class="flex space-x-2 hover:bg-gray-500 my-1.5 items-center justify-between"
										href="/files?fileType=1&appType={parseInt(item.type)}&status={appInfo.status}&titleType=custom"
									>
										<!-- Design status badge -->
										<AppStatusTag value={appInfo.status} />
										<!-- Count of design applications in this status -->
										<p class="">{appInfo.count}</p>
									</a>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</Accordion.Content>
		</Accordion.Item>
		<br />
		<!-- 
			TRADEMARK APPLICATIONS STATISTICS ACCORDION
			============================================== 
			Final accordion section for trademark applications (fileType=2).
			Follows same pattern as patents and designs with type and status breakdowns.
		-->
		<Accordion.Item value="trademarks" class="border rounded-md p-3 bg-white">
			<!-- Accordion header with trademark icon and title -->
			<Accordion.Trigger>
				<div class="flex px-3">
					<!-- Trademark icon (Square T) -->
					<Icon
						icon="arcticons:letter-uppercase-square-t"
						width="1.5rem"
						height="1.5rem"
						class="mr-1.5 text-green-800"
					/>
					<p>Trademark Applications Statistics</p>
				</div>
			</Accordion.Trigger>
			<Accordion.Content>
				<!-- Trademark statistics grid (3-column layout) -->
				<div class="grid grid-cols-3 gap-2">
					<!-- Loop through trademark application types (getType(2) where 2 = FileTypes.Trademark) -->
					{#each getType(2) as item}
						<div>
							<!-- Trademark application type header -->
							<p>{mapTypeToString(parseInt(item.type))}</p>
							<!-- Status breakdown container -->
							<div class="border rounded-md p-2">
								<!-- Loop through each status within this trademark application type -->
								{#each item.items as appInfo}
									<!-- 
										Clickable trademark status row:
										- Links to trademark file view (fileType=2) 
										- Filters by application type and status
										- Shows status badge and application count
									-->
									<a
										class="flex space-x-2 hover:bg-gray-500 my-1.5 items-center justify-between"
										href="/files?fileType=2&appType={parseInt(item.type)}&status={appInfo.status}&titleType=custom"
									>
										<!-- Trademark status badge -->
										<AppStatusTag value={appInfo.status} />
										<!-- Count of trademark applications in this status -->
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
	<!-- End of detailed statistics view -->
	{/if}
{/if}

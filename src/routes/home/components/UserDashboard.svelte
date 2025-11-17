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
		const userId = user.id;
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

	function getTotal(type: FileTypes) {
		return $DashStats?.fileStats.find((x) => x.fileType === type)?.count??0;
	}
	function getType(fileType: FileTypes) {
		const val = $DashStats?.detailedStats
			?.filter((x) => x.fileType === fileType) ?? [];
		val.sort((a, v) => (a.status > v.status ? 1 : a.status < v.status ? -1 : 0));
		const grouped = val.reduce((acc: Record<string, typeof val>, curr) => {
			const type = curr.type?.toString() || '0';
			acc[type] = (acc[type] || []).concat(curr);
			return acc;
		}, {} as Record<string, typeof val>);
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

	{#if showOnlyStatistics}
	<Accordion.Root>
		<Accordion.Item value="patents" class="border rounded-md p-3 bg-white">
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
										href="/files?fileType=0&appType={parseInt(item.type)}&status={appInfo.status}&titleType=custom"
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
		<br />
		<Accordion.Item value="designs" class="border rounded-md p-3 bg-white">
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
										href="/files?fileType=1&appType={parseInt(item.type)}&status={appInfo.status}&titleType=custom"
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
		<br />
		<Accordion.Item value="trademarks" class="border rounded-md p-3 bg-white">
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
{/if}

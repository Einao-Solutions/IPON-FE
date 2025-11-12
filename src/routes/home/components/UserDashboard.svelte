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

	function getTotal(type: FileTypes) {
		return $DashStats?.fileStats.find((x) => x.fileType === type)?.count??0;
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
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
		<a href="/files?fileType=2&titleType=specific" class="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-200 hover:scale-[1.02] text-left hover:border-green-300/50">
			<p class="text-sm text-slate-500 font-medium mb-2">Total Trademarks</p>
			<p class="text-2xl font-bold text-slate-800">{getTotal(FileTypes.Trademark).toLocaleString()}</p>
		</a>
		<a href="/files?fileType=0&titleType=specific" class="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-200 hover:scale-[1.02] text-left hover:border-green-300/50">
			<p class="text-sm text-slate-500 font-medium mb-2">Total Patents</p>
			<p class="text-2xl font-bold text-slate-800">{getTotal(FileTypes.Patent).toLocaleString()}</p>
		</a>
		<a href="/files?fileType=1&titleType=specific" class="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-200 hover:scale-[1.02] text-left hover:border-green-300/50">
			<p class="text-sm text-slate-500 font-medium mb-2">Total Designs</p>
			<p class="text-2xl font-bold text-slate-800">{getTotal(FileTypes.Design).toLocaleString()}</p>
		</a>
		

		<!-- <a href="/files?status=1&titleType=renew">
			<BackgroundGradient className="rounded-md p-2  bg-white dark:bg-zinc-900">
				<p class="mb-2 mt-2 text-base text-black dark:text-neutral-200 sm:text-xl">Renewal Due</p>
				<p class="text-2xl text-neutral-600 dark:text-neutral-400">
					{getRenewal()}
				</p>
			</BackgroundGradient>
		</a> -->
	</div>
	
	{#if !showOnlyTotals}
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
{/if}

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
		UserTypes
	} from '$lib/helpers';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import { FetchData } from '../../application/apphelper';
	import { Input } from '$lib/components/ui/input';
	import { goto } from '$app/navigation';
import * as Card from "$lib/components/ui/card"
  import { User } from 'lucide-svelte';
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
		const showId= true;
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

</script>
{#if isLoading}
	<Icon class="flex items-center justify-center w-full"
				icon="eos-icons:loading"
				width="1.6rem"
				height="1.6rem"
	/>
{:else}
	<div class="grid grid-cols-1 space-y-4 {isTradeMarkRelated() ? '' : 'hidden'}">
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
		<div class="bg-white border rounded-md h-fit p-2 md:px-3 sm:py-7 hover:cursor-pointer hover:bg-accent " on:click={() => goto('/home/trademarkpubs')}>
			<Card.Title>View Trademark Publications</Card.Title>
		</div>
	</div>
	<div class="grid grid-cols-1 space-x-4 {isPatentRelated() ? '' : 'hidden'}">
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
	</div>

	<div class="grid grid-cols-1 space-x-4 {isDesignRelated() ? '' : 'hidden'}">
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

	</div>
{/if}
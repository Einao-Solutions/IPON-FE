<script lang="ts">
	import Icon from '@iconify/svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import { base } from '$app/paths';
	import DataTable from './DataTable.svelte';
	import type { PageServerData } from '../../../.svelte-kit/types/src/routes/$types';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { baseURL, UserRoles } from '$lib/helpers';
	import { fileTypeToString, mapTypeToString } from '../home/components/dashboardutils';
	import { writable } from 'svelte/store';
	import { listOfIds, loggedInUser, queryBody, loggedInToken } from '$lib/store';

	export let dataList: [] | null = null;
	let count: number = 0;
	let previousPage: string = base;
	let isLoading = writable<boolean>(false);
	let currentPage: number = 0;
	let currentUrl = writable<URL>($page.url);
	export let serverData: PageServerData;
	afterNavigate(({ from, to }) => {
		previousPage = from?.url.pathname || previousPage;
		if (to?.url) {
		}
	});
	function paginated(startIndex: number, count: number, _currentPage: number) {
		currentPage = _currentPage;
			$currentUrl.searchParams.set('quantity', count);
			$currentUrl.searchParams.set('index', startIndex);
			loadData();
	}
	onMount(async()=>{
		var cookieUser = document.cookie
			.split(';')
			.find((x) => x.startsWith(' user=') || x.startsWith('user='));
		if (!cookieUser) {
			await goto('/auth/');
		}
		else {
			var user = cookieUser.trimStart();
			user = user.slice(5);
			loggedInUser.set(JSON.parse(decodeURIComponent(user)));
		}
		await loadData();
	})
	let showRenew:boolean=false;
	async function loadData() {
		isLoading.set(true);
		if (!$currentUrl) return;
		const url = $currentUrl;
		const type = url.searchParams.get('fileType');
		const typeconverted = type ? (type.split(',').map(Number) as number[]) : null;
		const PriorityNumber = url.searchParams.get('PriorityNumber');
		const priConverted = PriorityNumber ? PriorityNumber : null;
		const status = url.searchParams.get('status');
		// showRenew=status==="1" &&  $loggedInUser.type===UserTypes.User;
		const statusConverted = status ? (status?.split(',').map(Number) as number[]) : null;
		const applicationType = url.searchParams.get('appType');
		const appTypeConverted = applicationType
			? (applicationType?.split(',').map(Number) as number[])
			: null;
		const indexString = url.searchParams.get('index');
		const quantityString = url.searchParams.get('quantity');
		const startDate = url.searchParams.get("startDate")
		const endDate = url.searchParams.get("endDate")
		const title = url.searchParams.get('title');
		const userId = $loggedInUser?.creatorId;
		const index = indexString ? parseInt(indexString) : 0;
		const quantity = quantityString ? parseInt(quantityString) : 10;
		const fileUrl = `${baseURL}/api/files/summary?index=${index}&quantity=${quantity}`;
		const body = {
			userType: $loggedInUser?.userRoles.includes(UserRoles.Tech) ? 1 : 0,
			userId,
			types: typeconverted,
			status: statusConverted,
			applicationTypes: appTypeConverted,
			Title: title ?? null,
			PriorityNumber: priConverted
		};
		if (startDate!=null){
			body.startDate= startDate;
		}
		if (endDate!=null){
			body.endDate= endDate
		}
		queryBody.set(JSON.stringify(body));
		const result = await fetch(fileUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization' : `Bearer ${$loggedInToken}`
			},
			body: JSON.stringify({ ...body })
		});
		const resp = await result.json();
		const values: any[] = resp.result;
		const filescount: number = resp.count;
		let _dataList = [];
		for (let i = 0; i < values.length; i++) {
			const curr: any = values[i];
			const allPending: any[] = Array.isArray(curr.summaries) ? curr.summaries : [];
			const first = allPending.length > 0 ? allPending[0] : null;

			const applicationDate = first?.applicationDate ?? curr.createdAt ?? new Date().toISOString();
			const formattedDate = Intl.DateTimeFormat('en-NG', {
				year: '2-digit',
				month: 'short',
				day: 'numeric',
				weekday: 'short',
				hour: 'numeric',
				minute: 'numeric'
			}).format(new Date(applicationDate));

			_dataList.push({
				's/n': i + 1,
				date: formattedDate,
				fileId: curr.fileId,
				fileStatus: curr.fileStatus,
				title: curr.title,
				fileType: fileTypeToString(curr.type),
				id: curr.id,
				status: allPending.length > 1 ? 'Multiple' : (first?.applicationStatus ?? 'Unknown'),
				appType: allPending.length > 1 ? 'Multiple' : (first ? mapTypeToString(first.applicationType) : 'Unknown')
			});
		}
		dataList = [..._dataList];
		const _listOfIds = _dataList.map((x) => x.id);
		listOfIds.set(_listOfIds);
		count = filescount;
		isLoading.set(false);
	}
</script>

<div class="container h-full">
	{#if $isLoading}
		<div class=" w-full h-full flex">
			<Icon
				class="mx-auto my-auto"
				icon="line-md:loading-twotone-loop"
				width="1.2rem"
				height="1.2rem"
			/>
		</div>
	{:else}
		<div class="container">
			<DataTable
				{dataList}
				showAppStatus={false}
				showType={true}
				{count}
				{showRenew}
			/>
		</div>
	{/if}
</div>

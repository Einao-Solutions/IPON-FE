<script lang="ts">
	import { baseURL, UserRoles, UserTypes } from '$lib/helpers';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import OppositionTable from './OppositionTable.svelte';
	import { loggedInUser, loggedInToken } from '$lib/store';

	let data = [];
	let counter = {};
	let awaitingCounter = 0;
	let newOpposition = 0;
	let awaitingOfficeProcess = 0;
	let abandoned = 0;
	let isLoading: boolean = false;
	onMount(async () => {
		await loadOppositionStats();
		await loadData(undefined, 10, 0);
	});
	// async function loadCounter() {
	// 	let url = `${baseURL}/api/opposition/count`;
	// 	if (
	// 		$loggedInUser?.userRoles.some((role) =>
	// 			[
	// 				UserRoles.TrademarkCertification,
	// 				UserRoles.TrademarkSearch,
	// 				UserRoles.TrademarkOpposition,
	// 				UserRoles.TrademarkExaminer,
	// 				UserRoles.Tech,
	// 				UserRoles.SuperAdmin
	// 			].includes(role)
	// 		) == false
	// 	) {
	// 		url = url + `?userId=${$loggedInUser.id}`;
	// 	}
	// 	const response = await fetch(url);
	// 	counter = await response.json();
	// }
	async function loadOppositionStats() {
		const headers = { Authorization: `Bearer ${$loggedInToken}` };
		const response = await fetch(`${baseURL}/api/opposition/stats`, { headers });
		const stats = await response.json();
		awaitingCounter = stats.awaitingCounter;
		newOpposition = stats.newOpposition;
		awaitingOfficeProcess = stats.awaitingOfficeProcess ?? 0;
		abandoned = stats.abandoned ?? 0;

		// If backend doesn't provide awaitingOfficeProcess, fetch it directly
		if (!stats.awaitingOfficeProcess) {
			const res = await fetch(`${baseURL}/api/opposition/loadSummary?quantity=1&skip=0&type=36`, { headers });
			if (res.ok) {
				const result = await res.json();
				awaitingOfficeProcess = result.count ?? 0;
			}
		}
	}
	let oppositionType = undefined;
	let count = 0;
	async function loadData(type: number | undefined, quantity: number, skip: number) {
		data = [];
		isLoading = true;
		let url = `${baseURL}/api/opposition/loadSummary?quantity=${quantity}&skip=${skip}`;
		if (type !== undefined) {
			url = url + `&type=${type}`;
			oppositionType = type;
		}
		// if ($loggedInUser.userRoles.includes(UserRoles.StaffMenu)==false) {
		// 	url = url + `&userId=${$loggedInUser.id}`;
		// }
		const response = await fetch(url, { headers: { Authorization: `Bearer ${$loggedInToken}` } });

		const _data = await response.json();
		const __data = _data.data;
		count = _data.count;
		for (let i = 0; i < __data.length; i++) {
			let curr = __data[i];
			data.push({
				's/n': __data.indexOf(curr) + 1,
				id: curr.id,
				title: curr.title,
				creatorId: curr.creatorId,
				fileCreatorId: curr.fileCreatorId,
				paymentId: curr.paymentId,
				fileId: curr.fileId,
				date: curr.date,
				name: curr.name,
				currentStatus: curr.status
			});
		}
		isLoading = false;
		console.log(data);
	}
</script>

<div>
	{#if isLoading === true}
		<div class="items-center justify-center flex h-screen">
			<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
		</div>
	{:else if isLoading === false}
		<div class="flex flex-col space-y-3">
			<div class="flex gap-3">
				<Button
					class="group relative overflow-hidden bg-gray-500 hover:bg-gray-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] px-6 py-3 rounded-xl"
					on:click={() => loadData(29, 10, 0)}
				>
					<div class="flex items-center space-x-3">
						<div class="relative z-10">
							Opposed
						</div>
						<span class="relative z-10 font-semibold tracking-wide">{newOpposition}</span>
					</div>
					<!-- Subtle animated background -->
					<div
						class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
					></div>
				</Button>

				<Button
					class="group relative overflow-hidden bg-yellow-500 hover:bg-yellow-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] px-6 py-3 rounded-xl"
					on:click={() => loadData(30, 10, 0)}
				>
					<div class="flex items-center space-x-3">
						<div class="relative z-10">
							Awaiting Counter Statement
						</div>
						<span class="relative z-10 font-semibold tracking-wide">{awaitingCounter}</span>
					</div>
					<!-- Subtle animated background -->
					<div
						class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
					></div>
				</Button>

				{#if $loggedInUser?.userRoles?.includes(UserRoles.TrademarkOpposition) || $loggedInUser?.userRoles?.includes(UserRoles.Tech) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin)}
				<Button
					class="group relative overflow-hidden bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] px-6 py-3 rounded-xl"
					on:click={() => loadData(36, 10, 0)}
				>
					<div class="flex items-center space-x-3">
						<div class="relative z-10">
							Awaiting Office Process
						</div>
						<span class="relative z-10 font-semibold tracking-wide">{awaitingOfficeProcess}</span>
					</div>
					<div
						class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
					></div>
				</Button>

				<Button
					class="group relative overflow-hidden bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] px-6 py-3 rounded-xl"
					on:click={() => loadData(37, 10, 0)}
				>
					<div class="flex items-center space-x-3">
						<div class="relative z-10">
							Abandoned
						</div>
						<span class="relative z-10 font-semibold tracking-wide">{abandoned}</span>
					</div>
					<div
						class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
					></div>
				</Button>
				{/if}
			</div>
			<div>
				<OppositionTable dataList={data} {count} {oppositionType} />
			</div>
		</div>
	{/if}
</div>

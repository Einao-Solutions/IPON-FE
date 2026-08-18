<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import { baseURL, UserRoles } from '$lib/helpers';
	import { loggedInToken, loggedInUser } from '$lib/store';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Tabs from '$lib/components/ui/tabs';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import { mapDateToString, mapTypeToString } from '../components/dashboardutils';
	import { toast } from 'svelte-sonner';

	let oppositions: any[] = [];
	let otherApps: any[] = [];
	let oppositionsLoading = false;
	let search = '';
	let activeTab = 'oppositions';

	let selectedOpposition: any = null;
	let showOppositionDetail = false;
	let oppositionDetailLoading = false;

	let showStatusHistory = false;
	let historyComponent: any = null;
	let historyData: any = {};

	async function viewHistory(row: any) {
		if (!historyComponent) {
			historyComponent = (await import('../components/HistorySheet.svelte')).default;
		}
		historyData = {
			title: 'Status History',
			description: 'Application status changes',
			dataList: row.history ?? [],
			onclose: () => {
				showStatusHistory = false;
				historyData = {};
			},
			isVisible: true
		};
		showStatusHistory = true;
	}

	onMount(async () => {
		await loadApplications();
		const oppositionId = $page.url.searchParams.get('oppositionId');
		if (oppositionId) {
			viewOppositionDetail('', oppositionId);
		}
	});

	async function loadApplications() {
		const currentUser = $loggedInUser;
		if (!currentUser) return;
		oppositionsLoading = true;
		try {
			const [oppItems, otherItems] = await Promise.all([
				loadOppositions(currentUser),
				fetchOtherApps(currentUser.id)
			]);
			oppositions = oppItems.map((x, i) => ({ ...x, sn: i + 1 }));
			otherApps = otherItems.map((x, i) => ({ ...x, sn: i + 1 }));
		} catch (e) {
			console.error('Failed to load applications', e);
			toast.error('Failed to load applications');
		} finally {
			oppositionsLoading = false;
		}
	}

	async function loadOppositions(currentUser: any): Promise<any[]> {
		try {
			const isSuperOrTech = currentUser.userRoles?.some((role: number) =>
				[UserRoles.Tech, UserRoles.SuperAdmin].includes(role)
			);
			const url = isSuperOrTech
				? `${baseURL}/api/opposition/loadSummary?quantity=200&skip=0`
				: `${baseURL}/api/opposition/loadSummary?quantity=200&skip=0&userId=${currentUser.id}`;
			const res = await fetch(url, {
				headers: { Authorization: `Bearer ${$loggedInToken}` }
			});
			if (!res.ok) return [];
			const body = await res.json();
			const items = body.data ?? [];
			return items.map((x: any) => ({
				date: x.date,
				title: x.title,
				name: x.name,
				status: x.status,
				paymentId: x.paymentId,
				fileId: x.fileId,
				id: x.id,
				kind: 'opposition'
			}));
		} catch (e) {
			console.error('Failed to load oppositions', e);
			return [];
		}
	}

	async function fetchOtherApps(userId: string): Promise<any[]> {
		try {
			const res = await fetch(
				`${baseURL}/api/users/GetOtherApplications?userId=${encodeURIComponent(userId)}`,
				{ headers: { Authorization: `Bearer ${$loggedInToken}` } }
			);
			if (!res.ok) return [];
			const body = await res.json();
			const items = Array.isArray(body) ? body : body.data ?? body.applications ?? [];
			return items.map((x: any) => ({
				date: x.applicationDate,
				status: x.currentStatus,
				paymentId: x.paymentId,
				id: x.id,
				applicationType: mapTypeToString(x.applicationType),
				history: x.statusHistory
			}));
		} catch (e) {
			console.error('Failed to load other applications', e);
			return [];
		}
	}

	async function viewOppositionDetail(fileNumberOrId: string, fallbackId?: string) {
		oppositionDetailLoading = true;
		showOppositionDetail = true;
		try {
			let url = `${baseURL}/api/opposition/getOppositionDetail`;
			if (fileNumberOrId) {
				url += `?fileNumber=${fileNumberOrId}`;
			} else if (fallbackId) {
				url += `?oppositionId=${fallbackId}`;
			} else {
				throw new Error('No valid opposition identifier provided');
			}
			const res = await fetch(url);
			if (res.ok) {
				const json = await res.json();
				const data = json.opposition ?? json.data ?? json;
				if (Array.isArray(data)) {
					selectedOpposition = fallbackId
						? data.find((o: any) => o.id === fallbackId) ?? data[0]
						: data[0];
				} else {
					selectedOpposition = data;
				}
			} else {
				toast.error('Failed to load opposition details');
				showOppositionDetail = false;
			}
		} catch (e) {
			console.error('Failed to load opposition detail', e);
			toast.error('Failed to load opposition details');
			showOppositionDetail = false;
		} finally {
			oppositionDetailLoading = false;
		}
	}

	function filterList(list: any[]) {
		if (!search) return list;
		const t = search.toLowerCase();
		return list.filter(
			(o) =>
				(o.title ?? '').toLowerCase().includes(t) ||
				(o.fileId ?? '').toLowerCase().includes(t) ||
				(o.name ?? '').toLowerCase().includes(t) ||
				(o.paymentId ?? '').toLowerCase().includes(t)
		);
	}

	$: filteredOppositions = filterList(oppositions);
	$: filteredOtherApps = filterList(otherApps);
</script>

<div class="p-6 space-y-6">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-3">
			<button
				type="button"
				on:click={() => goto('/home/dashboard')}
				class="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
				aria-label="Back to dashboard"
			>
				<Icon icon="heroicons:arrow-left" class="w-5 h-5 text-slate-700" />
			</button>
			<div class="w-12 h-12 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-xl flex items-center justify-center shadow-sm border border-green-100">
				<Icon icon="mdi:file-multiple-outline" class="w-7 h-7 text-green-600" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-slate-900">Other Applications</h1>
				<!-- <p class="text-sm text-slate-500">User</p> -->
			</div>
		</div>
		<div class="flex items-center gap-2">
			<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
				{oppositions.length} Oppositions
			</span>
			<span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
				{otherApps.length} Other
			</span>
		</div>
	</div>

	<!-- Search -->
	<div class="flex items-center gap-3">
		<div class="relative flex-1 max-w-md">
			<Icon icon="heroicons:magnifying-glass" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
			<Input bind:value={search} placeholder="Search by title, file ID, name or payment ID..." class="pl-9" />
		</div>
		<Button variant="outline" on:click={() => loadApplications()}>
			<Icon icon="heroicons:arrow-path" class="w-4 h-4 mr-1.5" />
			Refresh
		</Button>
	</div>

	<!-- Tabs -->
	<Tabs.Root bind:value={activeTab} class="w-full">
		<Tabs.List class="grid w-full max-w-md grid-cols-2">
			<Tabs.Trigger value="oppositions">
				Oppositions ({oppositions.length})
			</Tabs.Trigger>
			<Tabs.Trigger value="other">
				Other Applications ({otherApps.length})
			</Tabs.Trigger>
		</Tabs.List>

		<!-- Oppositions Tab -->
		<Tabs.Content value="oppositions" class="mt-4">
			<div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
				{#if oppositionsLoading}
					<div class="flex justify-center items-center py-16">
						<Icon icon="line-md:loading-loop" class="w-8 h-8 text-green-600" />
					</div>
				{:else if filteredOppositions.length === 0}
					<div class="flex flex-col items-center justify-center py-16 text-center">
						<Icon icon="mdi:inbox-outline" class="w-12 h-12 text-slate-300 mb-2" />
						<p class="text-slate-500 text-sm">No opposition applications found.</p>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-slate-50 text-slate-600">
								<tr>
									<th class="px-4 py-3 text-left font-semibold">S/N</th>
									<th class="px-4 py-3 text-left font-semibold">Date</th>
									<th class="px-4 py-3 text-left font-semibold">Title</th>
									<th class="px-4 py-3 text-left font-semibold">File ID</th>
									<th class="px-4 py-3 text-left font-semibold">Opposer Name</th>
									<th class="px-4 py-3 text-left font-semibold">Status</th>
									<th class="px-4 py-3 text-left font-semibold">Payment ID</th>
									<th class="px-4 py-3 text-left font-semibold">Action</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-100">
								{#each filteredOppositions as row, i}
									<tr class="hover:bg-slate-50 transition-colors">
										<td class="px-4 py-3 text-slate-700">{i + 1}</td>
										<td class="px-4 py-3 text-slate-700 whitespace-nowrap">{row.date ? mapDateToString(row.date) : '—'}</td>
										<td class="px-4 py-3 text-slate-700">{row.title ?? '—'}</td>
										<td class="px-4 py-3 text-slate-700">{row.fileId ?? '—'}</td>
										<td class="px-4 py-3 text-slate-700">{row.name ?? '—'}</td>
										<td class="px-4 py-3">
											{#if row.status === 30 || row.status === 29 || row.status === 31}
												<span class="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">Awaiting Counter Statement</span>
											{:else if row.status === 33}
												<span class="inline-block px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">Awaiting Statutory Declaration</span>
											{:else if row.status === 36}
												<span class="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">Awaiting Office Process</span>
											{:else if row.status === 17}
												<span class="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Awaiting Resolution</span>
											{:else if row.status === 19}
												<span class="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">Resolved</span>
											{:else if row.status === 37}
												<span class="inline-block px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">Abandoned</span>
											{:else}
												<AppStatusTag value={row.status} />
											{/if}
										</td>
										<td class="px-4 py-3 text-slate-700">{row.paymentId ?? '—'}</td>
										<td class="px-4 py-3">
											{#if row.id}
												<DropdownMenu.Root>
													<DropdownMenu.Trigger asChild let:builder>
														<Button builders={[builder]} size="sm" class="text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
															More Action
															<Icon icon="lucide:chevron-down" class="w-3 h-3 ml-1" />
														</Button>
													</DropdownMenu.Trigger>
													<DropdownMenu.Content align="end" class="w-56">
														<DropdownMenu.Item on:click={() => viewOppositionDetail(row.fileId || '', row.id)}>
															View Opposition
														</DropdownMenu.Item>
														{#if row.status !== 2}
														<DropdownMenu.Separator />
														<DropdownMenu.Label>Print</DropdownMenu.Label>
														<DropdownMenu.Separator />
														<DropdownMenu.Item on:click={() => window.open(`${baseURL}/api/letters/generate?letterType=16&oppositionId=${row.id}`)}>
															Opposition Acknowledgement Letter
														</DropdownMenu.Item>
														{#if row.status !== 30 && row.status !== 29 && row.status !== 31}
														<DropdownMenu.Item on:click={() => window.open(`${baseURL}/api/letters/generate?fileId=${row.fileId}&letterType=93&applicationId=${row.id}`)}>
															Statutory Declaration Acknowledgement
														</DropdownMenu.Item>
														{/if}
														{/if}
													</DropdownMenu.Content>
												</DropdownMenu.Root>
											{:else}
												<span class="text-slate-400 text-xs">—</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</Tabs.Content>

		<!-- Other Applications Tab -->
		<Tabs.Content value="other" class="mt-4">
			<div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
				{#if oppositionsLoading}
					<div class="flex justify-center items-center py-16">
						<Icon icon="line-md:loading-loop" class="w-8 h-8 text-blue-600" />
					</div>
				{:else if filteredOtherApps.length === 0}
					<div class="flex flex-col items-center justify-center py-16 text-center">
						<Icon icon="mdi:inbox-outline" class="w-12 h-12 text-slate-300 mb-2" />
						<p class="text-slate-500 text-sm">No other applications found.</p>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-slate-50 text-slate-600">
								<tr>
									<th class="px-4 py-3 text-left font-semibold">S/N</th>
									<th class="px-4 py-3 text-left font-semibold">Date</th>
									<th class="px-4 py-3 text-left font-semibold">Application Type</th>
									<th class="px-4 py-3 text-left font-semibold">Status</th>
									<th class="px-4 py-3 text-left font-semibold">Payment ID</th>
									<!-- <th class="px-4 py-3 text-left font-semibold">Status History</th> -->
									<th class="px-4 py-3 text-left font-semibold">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-100">
								{#each filteredOtherApps as row, i}
									<tr class="hover:bg-slate-50 transition-colors">
										<td class="px-4 py-3 text-slate-700">{i + 1}</td>
										<td class="px-4 py-3 text-slate-700 whitespace-nowrap">{row.date ? mapDateToString(row.date) : '—'}</td>
										<td class="px-4 py-3 text-slate-700 capitalize">{row.applicationType ?? '—'}</td>
										<td class="px-4 py-3">
											<AppStatusTag value={row.status} />
										</td>
										<td class="px-4 py-3 text-slate-700">{row.paymentId ?? '—'}</td>
										<!-- <td class="px-4 py-3">
											{#if row.history && row.history.length > 0}
												<Button
													variant="outline"
													size="sm"
													class="text-xs"
													on:click={() => viewHistory(row)}
												>
													<Icon icon="mdi:history" class="w-4 h-4 mr-1.5" />
													View History
												</Button>
											{:else}
												<span class="text-slate-400 text-xs">—</span>
											{/if}
										</td> -->
										<td class="px-4 py-3">
											<DropdownMenu.Root>
												<DropdownMenu.Trigger class="text-slate-600 hover:text-slate-900">
													<Icon icon="mdi:dots-vertical" class="w-5 h-5" />
												</DropdownMenu.Trigger>
												<DropdownMenu.Content align="end" class="w-48">
													<DropdownMenu.Item>Journal Request Acknowledgement</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Root>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>

<!-- Opposition Detail Sheet -->
<Sheet.Root bind:open={showOppositionDetail}>
	<Sheet.Content side="right" class="w-full sm:max-w-2xl overflow-y-auto">
		{#if oppositionDetailLoading}
			<div class="flex justify-center items-center h-full">
				<Icon icon="line-md:loading-loop" class="w-8 h-8 text-green-600" />
			</div>
		{:else if selectedOpposition}
			<Sheet.Header>
				<Sheet.Title class="text-2xl font-bold text-slate-900">Opposition Details</Sheet.Title>
				<Sheet.Description class="text-slate-600 mt-2">
					File: <span class="font-semibold">{selectedOpposition.fileNumber}</span>
				</Sheet.Description>
			</Sheet.Header>

			<div class="space-y-6 mt-6">
				<!-- Status Section -->
				<div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
					<div class="space-y-3">
						<div>
							<p class="text-sm font-semibold text-slate-600">Opposition ID</p>
							<p class="text-sm font-mono text-slate-800 mt-1" title={selectedOpposition.id}>
								OPP-{selectedOpposition.id?.slice(0, 8).toUpperCase()}
							</p>
						</div>
						<div class="border-t border-green-200 pt-3">
							<p class="text-sm font-semibold text-slate-600">File Status</p>
							<div class="mt-1">
								<AppStatusTag value={selectedOpposition.fileStatus} />
							</div>
						</div>
						<div class="border-t border-green-200 pt-3">
							<p class="text-sm font-semibold text-slate-600">Opposition Application Status</p>
							<div class="mt-1">
								{#if (selectedOpposition.status ?? selectedOpposition.oppositionStatus) === 36}
									<AppStatusTag value={36} />
								{:else if selectedOpposition.hasCounterStatement || (selectedOpposition.status ?? selectedOpposition.oppositionStatus) === 33}
									<span class="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">Awaiting Statutory Declaration</span>
								{:else if (selectedOpposition.status ?? selectedOpposition.oppositionStatus) === 30 || (selectedOpposition.status ?? selectedOpposition.oppositionStatus) === 29 || (selectedOpposition.status ?? selectedOpposition.oppositionStatus) === 31}
									<span class="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">Awaiting Counter Statement</span>
								{:else}
									<AppStatusTag value={selectedOpposition.status ?? selectedOpposition.oppositionStatus} />
								{/if}
							</div>
						</div>
					</div>
					{#if selectedOpposition.hasCounterStatement || selectedOpposition.oppositionStatus === 33}
						<div class="mt-3 pt-3 border-t border-green-200 flex items-center gap-2 text-orange-600">
							<Icon icon="mdi:alert-circle" class="w-5 h-5" />
							<span class="text-sm font-medium">Counter Statement Filed</span>
							{#if selectedOpposition.counterStatementDate}
								<span class="text-xs text-slate-600">on {mapDateToString(selectedOpposition.counterStatementDate)}</span>
							{/if}
						</div>
					{:else}
						<div class="mt-3 pt-3 border-t border-red-200 flex items-center gap-2 text-red-600">
							<Icon icon="mdi:close-circle" class="w-5 h-5" />
							<span class="text-sm font-medium">No Counter Statement Yet</span>
						</div>
					{/if}
				</div>

				<!-- Opposition Details -->
				<div class="space-y-4">
					<div class="border-b border-slate-200 pb-3">
						<p class="text-xs font-semibold text-slate-500 uppercase">Opposition Date</p>
						<p class="text-sm text-slate-700 mt-1">{mapDateToString(selectedOpposition.date)}</p>
					</div>
				</div>

				<!-- Opposer Information -->
				<div>
					<h3 class="font-semibold text-slate-900 text-lg mb-4">Opposer Information</h3>
					<div class="bg-slate-50 rounded-lg p-4 space-y-3">
						<div>
							<p class="text-xs font-semibold text-slate-600 uppercase">Name</p>
							<p class="text-sm text-slate-900 mt-1">{selectedOpposition.name}</p>
						</div>
						<div>
							<p class="text-xs font-semibold text-slate-600 uppercase">Email</p>
							<p class="text-sm text-slate-900 mt-1">{selectedOpposition.email}</p>
						</div>
						<div>
							<p class="text-xs font-semibold text-slate-600 uppercase">Phone</p>
							<p class="text-sm text-slate-900 mt-1">{selectedOpposition.phone || '—'}</p>
						</div>
						<div>
							<p class="text-xs font-semibold text-slate-600 uppercase">Address</p>
							<p class="text-sm text-slate-900 mt-1">{selectedOpposition.address || '—'}</p>
						</div>
						<div>
							<p class="text-xs font-semibold text-slate-600 uppercase">Nationality</p>
							<p class="text-sm text-slate-900 mt-1">{selectedOpposition.nationality || '—'}</p>
						</div>
					</div>
				</div>

				<!-- Opposition Grounds -->
				<div>
					<h3 class="font-semibold text-slate-900 text-lg mb-4">Grounds for Opposition</h3>
					<div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
						<p class="text-sm text-slate-700 whitespace-pre-wrap">{selectedOpposition.reason}</p>
					</div>
				</div>

				<!-- Supporting Documents -->
				{#if selectedOpposition.supportingDocs && selectedOpposition.supportingDocs.length > 0}
					<div>
						<h3 class="font-semibold text-slate-900 text-lg mb-4">Supporting Documents</h3>
						<div class="space-y-2">
							{#each selectedOpposition.supportingDocs as doc, idx}
								<a
									href={doc}
									target="_blank"
									rel="noopener noreferrer"
									class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
								>
									<div class="flex items-center gap-2">
										<Icon icon="mdi:file-document" class="w-5 h-5 text-slate-600" />
										<span class="text-sm font-medium text-slate-900">Document {idx + 1}</span>
									</div>
									<Icon icon="mdi:download" class="w-4 h-4 text-green-600" />
								</a>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Counter Statements -->
				{#if selectedOpposition.counterStatements && selectedOpposition.counterStatements.filter((c) => !c.oppositionId || c.oppositionId === selectedOpposition.id).length > 0}
					<div>
						<h3 class="font-semibold text-slate-900 text-lg mb-4">Counter Statements</h3>
						<div class="space-y-4">
							{#each selectedOpposition.counterStatements.filter((c) => !c.oppositionId || c.oppositionId === selectedOpposition.id) as cs, idx}
								<div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
									<div class="flex items-start justify-between mb-2">
										<p class="text-sm font-semibold text-orange-900">Counter Statement {idx + 1}</p>
										<p class="text-xs text-orange-700">{mapDateToString(cs.submittedDate)}</p>
									</div>
									<p class="text-sm text-orange-900 whitespace-pre-wrap">{cs.text}</p>
									{#if cs.attachments && cs.attachments.length > 0}
										<div class="mt-3 pt-3 border-t border-orange-200">
											<p class="text-xs font-semibold text-orange-700 mb-2">Attachments:</p>
											<div class="space-y-1">
												{#each cs.attachments as attachment}
													<a href={attachment} target="_blank" rel="noopener noreferrer" class="text-xs text-orange-600 hover:text-orange-800 underline block">
														View Document
													</a>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Statutory Declarations -->
				{#if selectedOpposition.statutoryDeclarations && selectedOpposition.statutoryDeclarations.length > 0}
					<div>
						<h3 class="font-semibold text-slate-900 text-lg mb-4">Statutory Declarations</h3>
						<div class="space-y-4">
							{#each selectedOpposition.statutoryDeclarations as sd, idx}
								<div class="{sd.role === 'applicant' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4">
									<div class="flex items-start justify-between mb-2">
										<div>
											<p class="text-sm font-semibold {sd.role === 'applicant' ? 'text-green-900' : 'text-blue-900'}">Declaration {idx + 1}</p>
											<span class="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full {sd.role === 'applicant' ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}">
												{sd.role === 'applicant' ? 'Applicant' : 'Opposer'}
											</span>
										</div>
										<p class="text-xs {sd.role === 'applicant' ? 'text-green-700' : 'text-blue-700'}">{mapDateToString(sd.submittedDate ?? sd.dateCreated)}</p>
									</div>
									{#if sd.text || sd.comment}
										<p class="text-sm {sd.role === 'applicant' ? 'text-green-900' : 'text-blue-900'} whitespace-pre-wrap">{sd.text ?? sd.comment}</p>
									{/if}
									{#if sd.attachments && sd.attachments.length > 0}
										<div class="mt-3 pt-3 border-t {sd.role === 'applicant' ? 'border-green-200' : 'border-blue-200'}">
											<p class="text-xs font-semibold {sd.role === 'applicant' ? 'text-green-700' : 'text-blue-700'} mb-2">Attachments:</p>
											<div class="space-y-1">
												{#each sd.attachments as attachment}
													<a href={attachment} target="_blank" rel="noopener noreferrer" class="text-xs {sd.role === 'applicant' ? 'text-green-600 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'} underline block">
														View Document
													</a>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- File Statutory Declaration Button (Opposer) -->
				{#if selectedOpposition && (selectedOpposition.hasCounterStatement || (selectedOpposition.status ?? selectedOpposition.oppositionStatus) === 33) && !(selectedOpposition.statutoryDeclarations && selectedOpposition.statutoryDeclarations.some((sd) => sd.role === 'opposer'))}
					<div class="mt-8 pt-6 border-t border-slate-200">
						<Button
							on:click={() => {
								const fileNumber = selectedOpposition.fileNumber;
								const oppId = selectedOpposition.id;
								window.location.href = `/opposition?step=statutorydeclaration&role=opposer&fileNumber=${fileNumber}&oppositionId=${oppId}`;
							}}
							class="w-full bg-orange-600 hover:bg-orange-700 text-white"
						>
							<Icon icon="mdi:file-document-edit" class="w-4 h-4 mr-2" />
							File Statutory Declaration
						</Button>
					</div>
				{/if}
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>

{#if showStatusHistory && historyComponent}
	<svelte:component this={historyComponent} {...historyData} />
{/if}

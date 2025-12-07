<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { loggedInUser } from '$lib/store';

	onMount(async () => {
		// Check if user has access
		if (!$loggedInUser) {
			await goto('/auth');
		}
	});

	// Function to get service count (placeholder for now)
	function getServiceCount(type: string): number {
		// This would typically come from an API or store
		const counts = {
			trademark: 8,
			patent: 12,
			design: 6
		};
		return counts[type] || 0;
	}

	// Navigation functions for each card
	function goToTrademarkResources() {
		goto('/home/resources/trademark');
	}

	function goToPatentResources() {
		goto('/home/resources/patent');
	}

	function goToDesignResources() {
		goto('/home/resources/design');
	}
</script>

<svelte:head>
	<title>Resources - IPON</title>
</svelte:head>

<div class="bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-full rounded-xl p-6 shadow-xl border border-slate-200/60">
	<div class="max-w-7xl mx-auto flex flex-col">
		<!-- Back Button -->
		<button
			class="mb-4 flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors duration-200"
			on:click={() => goto('/home/dashboard')}
		>
			<Icon icon="heroicons:arrow-left" class="text-lg" />
			<span class="text-sm font-medium">Back to Dashboard</span>
		</button>

		<!-- Header Section -->
		<div class="mb-5 flex-shrink-0">
			<div class="flex items-center space-x-3 mb-1">
				<div>
					<h1 class="text-2xl md:text-3xl font-bold text-black bg-clip-text">Intellectual Property Resources</h1>
					<p class="text-slate-600 text-sm">Access learning materials and guides for IP management</p>
				</div>
			</div>
		</div>

		<!-- Three IP Category Cards -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4 flex-shrink-0 bg-slate-50/40 backdrop-blur-sm rounded-lg border border-slate-100/50 p-4 shadow-sm">
			<!-- Trademark Card -->
			<button 
				class="text-left w-full group relative overflow-hidden"
				on:click={goToTrademarkResources}
			>
				<div class="relative bg-gradient-to-br from-white via-slate-50 to-white border border-slate-200/60 rounded-2xl p-6 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 hover:scale-[1.03] hover:border-green-300/60 hover:-translate-y-1">
					<!-- Subtle background pattern -->
					<div class="absolute inset-0 bg-gradient-to-br from-transparent via-green-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
					
					<div class="relative z-10">
						<div class="mb-5">
							<div class="w-14 h-14 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg group-hover:shadow-xl">
								<Icon icon="mdi:scale-balance" class="text-2xl text-green-600 group-hover:text-green-700" />
							</div>
							<h3 class="text-xl font-bold mb-2 text-slate-800 group-hover:text-slate-900">Trademark</h3>
							<p class="text-slate-600 text-sm leading-relaxed">Resources for brand identity protection</p>
						</div>
					<div class="flex items-center justify-between">
						<span class="text-xs text-slate-500 font-medium">Coming soon</span>
						<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300">
							<Icon icon="heroicons:arrow-right" class="text-green-600 text-sm" />
						</div>
					</div>
					</div>
				</div>
			</button>

			<!-- Patent Card -->
			<button 
				class="text-left w-full group relative overflow-hidden"
				on:click={goToPatentResources}
			>
				<div class="relative bg-gradient-to-br from-white via-slate-50 to-white border border-slate-200/60 rounded-2xl p-6 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 hover:scale-[1.03] hover:border-green-300/60 hover:-translate-y-1">
					<!-- Subtle background pattern -->
					<div class="absolute inset-0 bg-gradient-to-br from-transparent via-green-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
					
					<div class="relative z-10">
						<div class="mb-5">
							<div class="w-14 h-14 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg group-hover:shadow-xl">
								<Icon icon="mdi:lightbulb-outline" class="text-2xl text-green-600 group-hover:text-green-700" />
							</div>
							<h3 class="text-xl font-bold mb-2 text-slate-800 group-hover:text-slate-900">Patent</h3>
							<p class="text-slate-600 text-sm leading-relaxed">Resources for invention protection</p>
						</div>
					<div class="flex items-center justify-between">
						<span class="text-xs text-slate-500 font-medium">Coming soon</span>
						<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300">
							<Icon icon="heroicons:arrow-right" class="text-green-600 text-sm" />
						</div>
					</div>
					</div>
				</div>
			</button>

			<!-- Design Card -->
			<button 
				class="text-left w-full group relative overflow-hidden"
				on:click={goToDesignResources}
			>
				<div class="relative bg-gradient-to-br from-white via-slate-50 to-white border border-slate-200/60 rounded-2xl p-6 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 hover:scale-[1.03] hover:border-green-300/60 hover:-translate-y-1">
					<!-- Subtle background pattern -->
					<div class="absolute inset-0 bg-gradient-to-br from-transparent via-green-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
					
					<div class="relative z-10">
						<div class="mb-5">
							<div class="w-14 h-14 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg group-hover:shadow-xl">
								<Icon icon="mdi:palette-outline" class="text-2xl text-green-600 group-hover:text-green-700" />
							</div>
							<h3 class="text-xl font-bold mb-2 text-slate-800 group-hover:text-slate-900">Design</h3>
							<p class="text-slate-600 text-sm leading-relaxed">Resources for creative design protection</p>
						</div>
					<div class="flex items-center justify-between">
						<span class="text-xs text-slate-500 font-medium">Coming soon</span>
						<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300">
							<Icon icon="heroicons:arrow-right" class="text-green-600 text-sm" />
						</div>
					</div>
					</div>
				</div>
			</button>
		</div>
	</div>
</div>
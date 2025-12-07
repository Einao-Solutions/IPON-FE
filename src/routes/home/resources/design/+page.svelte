<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { loggedInUser } from '$lib/store';

	onMount(async () => {
		if (!$loggedInUser) {
			await goto('/auth');
		}
	});

	function goBack() {
		goto('/home/resources');
	}
</script>

<svelte:head>
	<title>Design Resources - IPON</title>
</svelte:head>

<div class="bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-full rounded-xl p-6 shadow-xl border border-slate-200/60">
	<div class="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
		<!-- Back Button -->
		<!-- <button
			class="absolute top-6 left-6 flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors duration-200"
			on:click={goBack}
		>
			<Icon icon="heroicons:arrow-left" class="text-lg" />
			<span class="text-sm font-medium">Back to Resources</span>
		</button> -->

        <!-- Back Button -->
		<button
			class="mb-4 flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors duration-200"
			on:click={() => goto('/home/resources')}
		>
			<Icon icon="heroicons:arrow-left" class="text-lg" />
			<span class="text-sm font-medium">Back to Resources</span>
		</button>

		<!-- Coming Soon Content -->
		<div class="text-center space-y-6">
			<!-- Icon -->
			<div class="w-24 h-24 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
				<Icon icon="mdi:palette-outline" class="text-4xl text-green-600" />
			</div>

			<!-- Title -->
			<h1 class="text-3xl md:text-4xl font-bold text-slate-800">Design Resources</h1>

			<!-- Coming Soon Badge -->
			<div class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-200">
				<Icon icon="heroicons:clock" class="text-green-600 mr-2" />
				<span class="text-green-700 font-semibold text-lg">Coming Soon</span>
			</div>

			<!-- Description -->
			<div class="max-w-md mx-auto space-y-3">
				<p class="text-slate-600 text-lg leading-relaxed">
					We're creating detailed design resources covering industrial design protection, creative rights, and aesthetic innovation guidelines.
				</p>
				<p class="text-slate-500 text-sm">
					This section will feature design registration processes, visual examples, and comprehensive guides for protecting your creative works.
				</p>
			</div>

			<!-- Features Preview -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
				<div class="bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-xl p-4 text-center">
					<Icon icon="heroicons:swatch" class="text-2xl text-green-600 mx-auto mb-2" />
					<h3 class="font-semibold text-slate-700 text-sm">Design Types</h3>
				</div>
				<div class="bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-xl p-4 text-center">
					<Icon icon="heroicons:photo" class="text-2xl text-green-600 mx-auto mb-2" />
					<h3 class="font-semibold text-slate-700 text-sm">Visual Examples</h3>
				</div>
				<div class="bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-xl p-4 text-center">
					<Icon icon="heroicons:cube" class="text-2xl text-green-600 mx-auto mb-2" />
					<h3 class="font-semibold text-slate-700 text-sm">3D Designs</h3>
				</div>
			</div>
		</div>
	</div>
</div>
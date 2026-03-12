<script lang="ts">
	import Sidebar from './designSidebar.svelte';
	// Replace with design-specific step store and components

	import { currentStep, steps } from '$lib/utils/design';
	import DesignApplicantinformation from './components/designApplicantinformation.svelte';
	import DesignCreatorinformation from './components/designCreatorinformation.svelte';
	import DesignInformation from './components/DesignInformation.svelte';
	import designPriorityinformation from './components/designPriorityinformation.svelte';
	import designCorrespondenceInformation from './components/designCorrespondenceInformation.svelte';
	import designAttachment from './components/designAttachment.svelte';
    import designSummary from './components/designSummary.svelte';
	import { onMount } from 'svelte';

	let stepIndex: number;

	let stepList = steps;
	$: stepIndex = $currentStep;

	const allComponents: Record<string, any> = {
		'Design Information': DesignInformation,
		'Applicants Information': DesignApplicantinformation,
		'Creators Information': DesignCreatorinformation,
		'Priority Information': designPriorityinformation,
		'Correspondence Information': designCorrespondenceInformation,
		'Attachments': designAttachment,
		'Review and Submit': designSummary
	};

	onMount(() => {
		// Add any design-specific logic here
		const onPopState = () => {
			if (window.history.length > 1) {
				window.history.back();
			} else {
				window.location.href = "/";
			}
		};
		window.addEventListener("popstate", onPopState);
		return () => {
			window.removeEventListener("popstate", onPopState);
		};
	});
</script>

<div class="flex h-screen">
	<!-- Sidebar (fixed width) -->
	<div class="w-80 fixed top-0 left-0 h-screen z-10 bg-white border-r">
		<Sidebar />
	</div>

	<!-- Main Content (scrollable area with left margin to offset fixed sidebar) -->
	<main class="ml-80 flex-1 h-screen overflow-y-auto px-8 py-10 bg-gray-50">
		<div class="max-w-5xl mx-auto">
			{#if stepList[stepIndex]}
				<svelte:component this={allComponents[stepList[stepIndex]]} />
			{:else}
				<p class="text-gray-500">Invalid step.</p>
			{/if}
		</div>
	</main>
</div>
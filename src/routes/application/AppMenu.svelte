<script lang="ts">
	import {
		applicationData,
		applicationMode,
		applicationScreen,
		formsData,
		newApplicationType,
		savePageData,
		validatedPages
	} from '$lib/store';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import { PatentSections, DesignSections, TrademarkSections } from '$lib/helpers';
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	const sections = $newApplicationType === 0 ? PatentSections :  $newApplicationType === 1? DesignSections: TrademarkSections;
	let currentView = 0;
	applicationScreen.subscribe((newValue) => (currentView = newValue));
	function changeScreen(index: number) {
		savePageData.set(sections[currentView].name);
		applicationScreen.set(index);
	}
	let previousPage: string = base;
	afterNavigate(({ from }) => {
		previousPage = from?.url.pathname || previousPage || '/home/dashboard';
	});
</script>

<div class="my-3 px-0 flex flex-col h-full">
	<p class="border rounded m-2 p-1 mb-8">
		{$applicationMode === 2 ? 'Application' : 'Update'} Menu
	</p>
	{#each sections as menuItem, i (i)}
		<Button
			class="flex gap-3 justify-start mr-3 mb-5"
			variant={currentView === sections.indexOf(menuItem) ? 'default' : 'outline'}
			on:click={() => changeScreen(i)}
		>
			<Icon icon={menuItem.icon} width="1.2rem" height="1.2rem" />
			{menuItem.description}
			<Icon
				class="{$validatedPages?.find((x) => x.name === menuItem.name)?.status === true
					? ''
					: 'hidden'} text-green-500 ml-auto"
				icon="zondicons:checkmark-outline"
				width="1.2rem"
				height="1.2rem"
			/>
			<Icon
				class="{$validatedPages?.find((x) => x.name === menuItem.name)?.status === false
					? ''
					: 'hidden'} text-red-500 ml-auto"
				icon="solar:danger-bold-duotone"
				width="1.2rem"
				height="1.2rem"
			/>
		</Button>
	{/each}
	<Button
		variant="destructive"
		class="mb-20 flex mr-3 mt-auto justify-start gap-2"
		on:click={() => {
			window.history.back()
			formsData.set([]);
			applicationData.set(null);
			// applicationScreen.set(0);
		}}
	>
		<p>Cancel Application</p>
	</Button>
</div>

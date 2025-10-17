<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover/index';
	import * as Command from '$lib/components/ui/command/index';
	import { writable } from 'svelte/store';
	import { tradeMarkClasses } from '$lib/constants';
	import { cn } from '$lib/utils';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		formsData,
		savePageData,
		applicationScreen,
		pageSaveStatus,
		validatePage,
		validatedPages,
		applicationMode, applicationData, changesMade
	} from '$lib/store';
	import { onMount } from 'svelte';
	let title = writable<string | undefined>(undefined);
	let disclaimer = writable<string | undefined>(undefined);
	let markclass = writable<number | undefined>(undefined);
	let markType = writable<number | undefined>(undefined);
	let classDescription = writable<string | undefined>(undefined);
	let markLogoDesc = writable<number | undefined>(undefined);
	let isclassOpen: boolean = false;
	let isLogoDescOpen: boolean = false;
	let ismarkTypeOpen: boolean = false;
	let showTitleError,
		showClassError,
		showTypeError,
		showLogoError,
		showDisclaimerError = false;
	savePageData.subscribe((toSave) => {
		if (toSave === 'basicTrade' && $applicationScreen === 0) {
			if ($formsData === null) {
				formsData.set([
					{
						name: 'basic',
						data: {
							title: $title,
							class: $markclass,
							description:$classDescription,
							type: $markType,
							disclaimer: $disclaimer,
							logo: $markLogoDesc
						}
					}
				]);
			} else {
				formsData.update((forms) => {
					let index = forms!.findIndex((x) => x.name === 'basic');
					if (index === -1) {
						forms!.push({
							name: 'basic',
							data: {
								title: $title,
								class: $markclass,
								description:$classDescription,
								type: $markType,
								disclaimer: $disclaimer,
								logo: $markLogoDesc
							}
						});
					} else {
						forms![index].data = {
							title: $title,
							class: $markclass,
							description:$classDescription,
							type: $markType,
							disclaimer: $disclaimer,
							logo: $markLogoDesc
						};
					}
					return [...forms];
				});
			}
			pageSaveStatus.set(true);
		}
	});

	validatePage.subscribe((x) => {
		if (x === 'basicTrade') {
			const status = validate();
			if ($validatedPages === null) {
				validatedPages.set([{ name: 'basicTrade', status: status }]);
				return;
			} else {
				validatedPages.update((pages) => {
					pages = pages!;
					const index = pages.findIndex((x) => x.name === 'basicTrade');
					if (index === -1) {
						pages.push({ name: 'basicTrade', status: status });
					} else {
						pages[index].status = status;
					}
					return [...pages];
				});
			}
		}
	});

	let originalData={}
	onMount(() => {
		let parsedData = $formsData?.filter((x) => x.name == 'basic')[0]?.data || null;
		if ($applicationMode === 2) {
			// creation mode
			title.set(parsedData?.title ?? undefined);
			disclaimer.set(parsedData?.disclaimer ?? undefined);
			markclass.set(parsedData?.class ?? undefined);
			classDescription.set(parsedData?.description ?? undefined);
			markType.set(parsedData?.type ?? undefined);
			markLogoDesc.set(parsedData?.logo ?? undefined);
		}
		if ($applicationMode===1){
			originalData = parsedData || {
				title: $applicationData.titleOfTradeMark ?? undefined,
				disclaimer: $applicationData.trademarkDisclaimer ?? undefined,
				markclass: $applicationData.trademarkClass ?? undefined,
				description: $applicationData.trademarkClassDescription ?? undefined,
				markType: $applicationData.trademarkType ?? undefined,
				markLogoDesc: $applicationData.trademarkLogo ?? undefined
			};
			$title= parsedData?.title?? $applicationData.titleOfTradeMark ?? undefined
			$disclaimer= parsedData?.disclaimer?? $applicationData.trademarkDisclaimer ?? undefined
			$markclass= parsedData?.markclass?? $applicationData.trademarkClass ?? undefined
			$classDescription= parsedData?.description?? $applicationData.trademarkClassDescription ?? undefined
			$markType= parsedData?.markType?? $applicationData.trademarkType ?? undefined
			$markLogoDesc= parsedData?.markLogoDesc?? $applicationData.trademarkLogo ?? undefined

		}
	});

	function validate(): boolean {
		showTitleError = $title === '' || $title === undefined;
		showClassError = $markclass === undefined;
		showTypeError = $markType === undefined;
		showLogoError = $markLogoDesc === undefined;
		showDisclaimerError = $disclaimer === undefined || $disclaimer === '';
		return (
			showTitleError === false &&
			showClassError === false &&
			showTypeError === false &&
			showLogoError === false &&
			showDisclaimerError === false
		);
	}

	// read and wait for update
	title.subscribe((value)=>{
		if ($applicationMode===1){
			// notify changes
			if (value!==originalData?.title) {
				changesMade.update((changes) => {
					changes = changes ?? [];
					let index = changes.findIndex((x) => x.name == 'basic');
					if (index !== -1) {
						changes[index].hasChanges = true;
					} else {
						changes.push({ name: 'basic', hasChanges: true });
					}
					return [...changes];
				});
			}
		}
	})

	markclass.subscribe((value)=>{
		if ($applicationMode===1){
			// notify changes
			if (value!==originalData?.markclass) {
				changesMade.update((changes) => {
					changes = changes ?? [];
					let index = changes.findIndex((x) => x.name == 'basic');
					if (index !== -1) {
						changes[index].hasChanges = true;
					} else {
						changes.push({ name: 'basic', hasChanges: true });
					}
					return [...changes];
				});
			}
		}
	})

	markType.subscribe((value)=>{
		if ($applicationMode===1){
			// notify changes
			if (value!==originalData?.markType) {
				changesMade.update((changes) => {
					changes = changes ?? [];
					let index = changes.findIndex((x) => x.name == 'basic');
					if (index !== -1) {
						changes[index].hasChanges = true;
					} else {
						changes.push({ name: 'basic', hasChanges: true });
					}
					return [...changes];
				});
			}
		}
	})


	markLogoDesc.subscribe((value)=>{
		if ($applicationMode===1){
			// notify changes
			if (value!==originalData?.markLogoDesc) {
				changesMade.update((changes) => {
					changes = changes ?? [];
					let index = changes.findIndex((x) => x.name == 'basic');
					if (index !== -1) {
						changes[index].hasChanges = true;
					} else {
						changes.push({ name: 'basic', hasChanges: true });
					}
					return [...changes];
				});
			}
		}
	})


	classDescription.subscribe((value)=>{
		if ($applicationMode===1){
			// notify changes
			if (value!==originalData?.description) {
				changesMade.update((changes) => {
					changes = changes ?? [];
					let index = changes.findIndex((x) => x.name == 'basic');
					if (index !== -1) {
						changes[index].hasChanges = true;
					} else {
						changes.push({ name: 'basic', hasChanges: true });
					}
					return [...changes];
				});
			}
		}
	})

	disclaimer.subscribe((value)=>{
		if ($applicationMode===1){
			// notify changes
			if (value!==originalData?.disclaimer) {
				changesMade.update((changes) => {
					changes = changes ?? [];
					let index = changes.findIndex((x) => x.name == 'basic');
					if (index !== -1) {
						changes[index].hasChanges = true;
					} else {
						changes.push({ name: 'basic', hasChanges: true });
					}
					return [...changes];
				});
			}
		}
	})
</script>

<div class="p-3 space-y-3">
	<div>
		<Label for="title">Title of trademark</Label>
		<Input id="title" bind:value={$title} />
	</div>
	<div>
		<Label for="class">Trademark class</Label>
		<Popover.Root open={isclassOpen} let:ids>
			<Popover.Trigger asChild let:builder>
				<Button
					builders={[builder]}
					variant="outline"
					role="combobox"
					aria-expanded={false}
					class="w-[200px] justify-between"
				>
					<p>{$markclass ? `class ${$markclass}` : 'Select a class'}</p>
					<Icon
						icon="ph:caret-up-down-thin"
						width="1.2rem"
						height="1.2rem"
						class="opacity-50 shrink-0 ml-2"
					/>
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-[250px] h-[350px] p-0 z-50">
				<Command.Root>
					<Command.Input placeholder="Search classes..." />
					<Command.Empty>No classes found.</Command.Empty>
					<Command.Group class="overflow-y-auto">
						{#each Array.from({ length: 45 }, (_, i) => i + 1) as cat, i}
							<Command.Item
								value={cat.toString()}
								onSelect={(currentValue) => {
									$markclass = parseInt(currentValue);
									$classDescription=tradeMarkClasses[parseInt($markclass) - 1]
									isclassOpen = false;
									document.getElementById(ids.trigger)?.focus();
								}}
							>
								<Icon
									icon="basil:check-solid"
									class={cn('mr-2 h-4 w-4', $markclass !== i + 1 && 'text-transparent')}
								/>
								<p class="mr-1.5 w-8 items-center flex text-center pl-2.5 border rounded-md p-1">
									{i + 1}
								</p>
								class {cat}
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>
	<Textarea bind:value={$classDescription} placeholder='Description of selected class will appear here' />
	<div>
		<Label for="class">Trademark Type</Label>
		<Popover.Root open={ismarkTypeOpen} let:ids>
			<Popover.Trigger asChild let:builder>
				<Button
					builders={[builder]}
					variant="outline"
					role="combobox"
					aria-expanded={false}
					class="w-[200px] justify-between"
				>
					<p>{['Local', 'Foreign'][$markType] ?? 'Select trademark type'}</p>
					<Icon
						icon="ph:caret-up-down-thin"
						width="1.2rem"
						height="1.2rem"
						class="opacity-50 shrink-0 ml-2"
					/>
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-[250px] h-[100px] p-0 z-50">
				<Command.Root>
					<Command.Group class="overflow-y-auto">
						{#each ['Local', 'Foreign'] as cat, i}
							<Command.Item
								value={cat}
								onSelect={() => {
									$markType = i;
									ismarkTypeOpen = false;
									document.getElementById(ids.trigger)?.focus();
								}}
							>
								<Icon
									icon="basil:check-solid"
									class={cn('mr-2 h-4 w-4', $markType !== i && 'text-transparent')}
								/>
								<p class="mr-1.5 w-8 items-center flex text-center pl-2.5 border rounded-md p-1">
									{i + 1}
								</p>
								{cat}
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>
	<div>
		<Label for="class">Logo description</Label>
		<Popover.Root open={isLogoDescOpen} let:ids>
			<Popover.Trigger asChild let:builder>
				<Button
					builders={[builder]}
					variant="outline"
					role="combobox"
					aria-expanded={false}
					class="w-[200px] justify-between"
				>
					<p>{['Device', 'Word Mark', 'Word and Device'][$markLogoDesc] ?? 'Select logo type'}</p>
					<Icon
						icon="ph:caret-up-down-thin"
						width="1.2rem"
						height="1.2rem"
						class="opacity-50 shrink-0 ml-2"
					/>
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-[250px] h-[150px] p-0 z-50">
				<Command.Root>
					<Command.Group class="overflow-y-auto">
						{#each ['Device', 'Word Mark', 'Word and Device'] as cat, i}
							<Command.Item
								value={cat}
								onSelect={() => {
									$markLogoDesc = i;
									isLogoDescOpen = false;
									document.getElementById(ids.trigger)?.focus();
								}}
							>
								<Icon
									icon="basil:check-solid"
									class={cn('mr-2 h-4 w-4', $markLogoDesc !== i && 'text-transparent')}
								/>
								<p class="mr-1.5 w-8 items-center flex text-center pl-2.5 border rounded-md p-1">
									{i + 1}
								</p>
								{cat}
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>
	<div>
		<Label>Claims and disclaimer</Label>
		<Textarea bind:value={$disclaimer} placeholder="claims and disclaimer" />
	</div>
</div>

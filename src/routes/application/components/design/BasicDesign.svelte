
<script lang="ts">
	import type { DesignTypes } from '$lib/designutils';
	import { Textarea } from '$lib/components/ui/textarea';
	import Icon from '@iconify/svelte';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from "$lib/components/ui/dialog"
	import { onMount } from 'svelte';
	import {
		formsData,
		applicationData,
		applicationMode,
		validatedPages,
		savePageData,
		applicationScreen, validatePage, changesMade
	} from '$lib/store';
	import type { BasicDesignType } from '$lib/helpers';
	import { Button } from '$lib/components/ui/button';
	let selectedDesignType: DesignTypes | null = null;
	let titleOfDesign: string | null = null;
	let statementOfNovelty: string | null = null;
	let showTitleError: boolean = false;
	let showStatementError: boolean = false;
	let showTypeError = false;
	let showTitleReset:boolean=false;
	let showSONReset:boolean=false;
	let showDesignTypeReset:boolean=false;
	savePageData.subscribe((toSave) => {
		if (toSave === 'designBasic' && $applicationScreen === 0) {
			if ($formsData === null) {
				formsData.set([
					{
						name: 'basic',
						data: {
							title: titleOfDesign,
							statementOfNovelty: statementOfNovelty,
							designType: selectedDesignType
						}
					}
				]);
			} else {
				formsData.update((forms) => {
					let index = forms!.findIndex((x) => x.name === 'basic');
					if (index !== -1) {
						forms![index].data = {
							title: titleOfDesign,
							statementOfNovelty: statementOfNovelty,
							designType: selectedDesignType
						};
					} else {
						forms!.push({
							name: 'basic',
							data: {
								title: titleOfDesign,
								statementOfNovelty: statementOfNovelty,
								designType: selectedDesignType
							}
						});
					}
					return [...forms!];
				});
			}
		}
	});
	$: {
		if ($applicationMode === 1) {
			//edit mode
			showTitleReset = titleOfDesign !== '' && titleOfDesign !== $applicationData?.titleOfDesign;
			showSONReset = statementOfNovelty !== '' && statementOfNovelty !== $applicationData?.statementOfNovelty;
			showDesignTypeReset =
				selectedDesignType !== null && selectedDesignType !== $applicationData?.designType;
			if (showTitleReset || showSONReset || showDesignTypeReset) {
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
			} else {
				changesMade.update((changes) => {
					changes = changes ?? [];
					let index = changes.findIndex((x) => x.name == 'basic');
					if (index !== -1) {
						changes.splice(index, 1);
						return [...changes];
					}
					return [...changes];
				});
			}
		}
	}


	onMount(() => {
		let parsedData =
			($formsData?.filter((x) => x.name == 'basic')[0]?.data as BasicDesignType) || null;
		if ($applicationMode === 2) {
			// creation mode
			titleOfDesign = parsedData?.title ?? '';
			statementOfNovelty = parsedData?.statementOfNovelty ?? '';
			selectedDesignType = parsedData?.designType ?? null;
		} else if ($applicationMode === 1) {
			// data update mode
			titleOfDesign = parsedData?.title ?? $applicationData?.titleOfDesign ?? '';
			statementOfNovelty =
				parsedData?.statementOfNovelty ?? $applicationData?.statementOfNovelty ?? '';
			selectedDesignType = parsedData?.designType ?? $applicationData?.designType ?? null;
		}
		if ($validatedPages?.find((x) => x.name === 'designBasic')) {
			validate();
		}
	});

	validatePage.subscribe((x) => {
		if (x === 'designBasic') {
			const status = validate();
			if($validatedPages===null) {
				validatedPages.set([{ name: 'designBasic', status: status }]);
			}
			else
			{
				validatedPages.update((pages) => {
					pages = pages!;
					const index = pages.findIndex((x) => x.name === 'designBasic');
					if (index === -1) {
						pages.push({ name: 'designBasic', status: status });
					} else {
						pages[index].status = status;
					}
					return [...pages];
				});
			}
		}
	});

	function validate(): boolean {
		showTitleError = titleOfDesign === '' || titleOfDesign === null;
		showStatementError = statementOfNovelty === '' || statementOfNovelty === null;
		showTypeError = selectedDesignType === null;
		return (
			titleOfDesign !== '' &&
			titleOfDesign !== null &&
			statementOfNovelty !== '' &&
			statementOfNovelty !== null &&
			selectedDesignType != null
		);
	}
	let resetMessage = '';
	let showResetConfirmation = false;
	let resetType = '';
	function Reset(message: string, type: string) {
		showResetConfirmation = true;
		resetType = type;
		resetMessage = `Are you sure you want to reset the ${message}`;
	}

	function ResetValue()
	{
		if (resetType === 'title') {
			titleOfDesign = $applicationData?.titleOfDesign ?? '';
		}
		if (resetType === 'statementOfNovelty') {
			statementOfNovelty = $applicationData?.statementOfNovelty?? '';
		}

		if (resetType === 'designType') {
			selectedDesignType=($applicationData?.designType ?? null);
		}
		showResetConfirmation = false;
	}
</script>

<Dialog.Root bind:open={showResetConfirmation}>
	<Dialog.Content class="min-w-fit mx-1.5">
		<Dialog.Header>
			<Dialog.Title>Confirmation</Dialog.Title>
			<Dialog.Description>Reset confirmation</Dialog.Description>
		</Dialog.Header>
		<br />
		<p>{resetMessage}</p>
		<br />
		<Dialog.Footer class="sm:flex gap-3">
			<Button
				variant="outline"
				on:click={() => {
					showResetConfirmation = false;
				}}>Cancel</Button
			>
			<Button on:click={() => ResetValue()}>Continue</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<div class="p-10 space-y-4 m-2 border rounded-md">
	<div class="space-y-4">
		<div class="flex items-center h-4">
		<Label for="designType">Select Design Type</Label>
		<Button
			on:click={() => Reset('Design Type', 'designType')}
			variant="ghost"
			class="{showDesignTypeReset ? 'inline' : 'hidden'} text-blue-500">Reset</Button
		>
		</div>
		<div class="rounded-md border flex space-x-4 w-fit px-4" id="designType">
			<div
				class="flex hover:cursor-pointer space-x-2 border rounded-md items-center p-2 m-2 {selectedDesignType ===
				0
					? 'bg-gray-600'
					: ''}"
				on:click={() => (selectedDesignType = 0)}
			>
				<Icon icon="arcticons:letter-uppercase-square-t" width="1.5rem" height="1.5rem" />
				<p>Textile</p>
			</div>
			<div
				class="flex hover:cursor-pointer space-x-2 border rounded-md items-center p-2 m-2 {selectedDesignType ===
				1
					? 'bg-gray-600'
					: ''}"
				on:click={() => (selectedDesignType = 1)}
			>
				<Icon icon="arcticons:letter-uppercase-square-n" width="1.5rem" height="1.5rem" />
				<p>Non Textile</p>
			</div>
		</div>
		<Label style="color: darkred" class={showTypeError ? 'block' : 'hidden'}
			>Design Type is required</Label
		>
	</div>
	<div class="flex items-center h-4">
		<Label>Title of design</Label>
	<Button
		on:click={() => Reset('Title of Design', 'title')}
		variant="ghost"
		class="{showTitleReset ? 'inline' : 'hidden'} text-blue-500">Reset</Button
	>
	</div>

	<Textarea placeholder="Enter title of design" class="min-h-[80px]" bind:value={titleOfDesign} />
	<Label style="color: darkred" class={showTitleError ? 'block' : 'hidden'}>Title is required</Label
	>
<div class="flex items-center h-4">
	<Label>Statement of Novelty</Label>
	<Button
		on:click={() => Reset('Statement of Novelty', 'statementOfNovelty')}
		variant="ghost"
		class="{showSONReset ? 'inline' : 'hidden'} text-blue-500">Reset</Button
	>
</div>
	<Textarea
		placeholder="Enter statement of novelty"
		class="min-h-[130px]"
		bind:value={statementOfNovelty}
	/>
	<Label style="color: darkred" class={showStatementError ? 'block' : 'hidden'}
		>Statement of novelty is required</Label
	>
</div>

<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input/index';
	import { fade } from 'svelte/transition';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Dialog from '$lib/components/ui/dialog';
	import Icon from '@iconify/svelte';
	import {
		type BasicFormType,
		conventionalDescription,
		nonConventionalDescription,
		pctDescription
	} from '$lib/helpers';
	import {
		applicationMode,
		applicationScreen,
		formsData,
		isPCT,
		pageSaveStatus,
		savePageData,
		applicationData,
		changesMade,
		validatePage,
		validatedPages
	} from '$lib/store';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { Button } from '$lib/components/ui/button';
	let selectedPatentType = writable<number | null>(null);
	let selectedPatentApplicationType = writable<number | null>(null);
	let title = '';
	$: showTitleError = false;
	$: showPatentError = false;
	$: showAbstactError = false;
	$: showTypeError = false;
	let abstract = '';
	let showTitleReset: boolean = false;
	let showAbstractReset: boolean = false;
	let showPatentTypeReset: boolean = false;
	let showPatentAppTypeReset: boolean = false;

	selectedPatentType.subscribe((data) => {
		isPCT.set(data === 2);
	});
	savePageData.subscribe((toSave) => {
		if (toSave === 'basic' && $applicationScreen === 0) {
			if ($formsData === null) {
				formsData.set([
					{
						name: 'basic',
						data: {
							title: title,
							abstract: abstract,
							patentType: $selectedPatentType,
							patentApplicationType: $selectedPatentApplicationType
						}
					}
				]);
			} else {
				formsData.update((forms) => {
					let index = forms!.findIndex((x) => x.name === 'basic');
					if (index !== -1) {
						forms![index].data = {
							title: title,
							abstract: abstract,
							patentType: $selectedPatentType,
							patentApplicationType: $selectedPatentApplicationType
						};
					} else {
						forms!.push({
							name: 'basic',
							data: {
								title: title,
								abstract: abstract,
								patentType: $selectedPatentType,
								patentApplicationType: $selectedPatentApplicationType
							}
						});
					}
					forms!.filter((x) => x.name === 'basic')[0].data = {
						title: title,
						abstract: abstract,
						patentType: $selectedPatentType,
						patentApplicationType: $selectedPatentApplicationType
					};
					return [...forms!];
				});
			}
			pageSaveStatus.set(true);
			validatePage.subscribe((x) => {
				if (x === 'basic') {
					const status = validate();
					if ($validatedPages === null) {
						validatedPages.set([{ name: 'basic', status: status }]);
						return;
					} else {
						validatedPages.update((pages) => {
							pages = pages!;
							const index = pages.findIndex((x) => x.name === 'basic');
							if (index === -1) {
								pages.push({ name: 'basic', status: status });
							} else {
								pages[index].status = status;
							}
							return [...pages];
						});
					}
				}
			});
		}
	});
	$: {
		if ($applicationMode === 1) {
			//edit mode
			showTitleReset = title !== '' && title !== $applicationData?.titleOfInvention;
			showAbstractReset = abstract !== '' && abstract !== $applicationData?.patentAbstract;
			showPatentTypeReset =
				$selectedPatentType !== null && $selectedPatentType !== $applicationData?.patentType;
			showPatentAppTypeReset =
				$selectedPatentApplicationType !== null &&
				$selectedPatentApplicationType !== $applicationData?.patentApplicationType;
			if (showAbstractReset || showPatentTypeReset || showTitleReset || showPatentAppTypeReset) {
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
		console.log($formsData)
		let parsedData =
			($formsData?.filter((x) => x.name == 'basic')[0]?.data as BasicFormType) || null;
		if ($applicationMode === 2) {
			// creation mode
			title = parsedData?.title ?? '';
			abstract = parsedData?.abstract ?? '';
			$selectedPatentType = parsedData?.patentType ?? null;
			$selectedPatentApplicationType = parsedData?.patentApplicationType ?? null;
		} else if ($applicationMode === 1) {
			// data update mode
			console.log(parsedData)
			title = parsedData?.title ?? $applicationData?.titleOfInvention ?? '';
			abstract = parsedData?.abstract ?? $applicationData?.patentAbstract ?? '';
			$selectedPatentType = parsedData?.patentType ?? $applicationData?.patentType ?? null;
			$selectedPatentApplicationType =
				parsedData?.patentApplicationType ?? $applicationData?.patentApplicationType ?? null;
		}
		if ($validatedPages?.find((x) => x.name === 'basic')) {
			validate();
		}
	});

	function validate(): boolean {
		showTitleError = title === '';
		showAbstactError = abstract === '';
		showTypeError = $selectedPatentType === null;
		showPatentError = $selectedPatentApplicationType == null;
		return title != '' && abstract != '' && $selectedPatentType != null;
	}

	function Reset(message: string, type: string) {
		showResetConfirmation = true;
		resetType = type;
		resetMessage = `Are you sure you want to reset the ${message}`;
	}

	function ResetValue() {
		if (resetType === 'title') {
			title = $applicationData?.titleOfInvention ?? '';
		}
		if (resetType === 'abstract') {
			abstract = $applicationData?.patentAbstract ?? '';
		}

		if (resetType === 'patentType') {
			selectedPatentType.set($applicationData?.patentType ?? null);
		}
		if (resetType === 'patentApplicationType') {
			selectedPatentApplicationType.set($applicationData?.patentApplicationType ?? null);
		}
		showResetConfirmation = false;
	}
	let resetMessage: string = '';
	let resetType: string = '';
	let showResetConfirmation: boolean = false;
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
<div class="h-full flex flex-col">
	<form class="border rounded-md space-y-7 p-2 sm:p-7 sm:my-2 sm:mx-20">
			<div>
				<Label for="title"
					>Patent Type
					<Button
						on:click={() => Reset('Patent Type', 'patentType')}
						variant="ghost"
						class="{showPatentTypeReset ? 'inline' : 'hidden'} text-blue-500">Reset</Button
					>
				</Label>
				<div class="gap-1 sm:gap-4 flex">
					<a
						on:click={() => ($selectedPatentType = 0)}
						class="border rounded-md flex p-2 flex-grow items-center hover:bg-accent hover:cursor-pointer {$selectedPatentType ===
						0
							? 'bg-accent'
							: 'bg-none'}  "
					>
						<Icon
							icon="arcticons:letter-lowercase-square-c"
							width="1.5rem"
							height="1.5rem"
							class="hidden sm:block mr-1.5"
						/>
						<p>Conventional</p>
					</a>
					<a
						on:click={() => ($selectedPatentType = 1)}
						class="border rounded-md flex p-2 flex-grow items-center hover:bg-accent hover:cursor-pointer {$selectedPatentType ===
						1
							? 'bg-accent'
							: 'bg-none'} "
					>
						<Icon
							icon="arcticons:letter-lowercase-square-n"
							width="1.5rem"
							height="1.5rem"
							class="hidden sm:block mr-1.5"
						/>
						<p>Non Conventional</p>
					</a>
					<a
						on:click={() => ($selectedPatentType = 2)}
						class="border rounded-md flex p-2 flex-grow items-center hover:bg-accent hover:cursor-pointer {$selectedPatentType ===
						2
							? 'bg-accent'
							: 'bg-none'} "
					>
						<Icon
							icon="arcticons:letter-uppercase-square-p"
							width="1.5rem"
							height="1.5rem"
							class="hidden sm:block mr-1.5"
						/>
						<p>PCT</p>
					</a>
				</div>
				<Label style="color: darkred" class={showTypeError ? 'block' : 'hidden'}>Select one</Label>
			</div>
			{#if $selectedPatentType != null}
				<div transition:fade={{ duration: 500 }} class="bg-accent rounded-sm flex-grow p-4">
					<strong>Description</strong>
					<p>
						{$selectedPatentType === 0
							? conventionalDescription
							: $selectedPatentType === 1
								? nonConventionalDescription
								: pctDescription}
					</p>
				</div>
			{/if}
<div>
		<Label>Patent Application Type
			<Button
				id="ptype"
				on:click={() => Reset('Patent Application Type', 'patentApplicationType')}
				variant="ghost"
				class="{showPatentAppTypeReset ? 'inline' : 'hidden'} text-blue-500">Reset</Button>
		</Label>
		<div class="gap-1 sm:gap-4 flex">
			<a
				on:click={() => ($selectedPatentApplicationType = 0)}
				class="border rounded-md flex p-2 flex-grow items-center hover:bg-accent hover:cursor-pointer {$selectedPatentApplicationType ===
				0
					? 'bg-accent'
					: 'bg-none'}  "
			>
				<Icon
					icon="arcticons:letter-lowercase-square-c"
					width="1.5rem"
					height="1.5rem"
					class="hidden sm:block mr-1.5"
				/>
				<p>Patent</p>
			</a>
			<a
				on:click={() => ($selectedPatentApplicationType = 1)}
				class="border rounded-md flex p-2 flex-grow items-center hover:bg-accent hover:cursor-pointer {$selectedPatentApplicationType ===
				1
					? 'bg-accent'
					: 'bg-none'} "
			>
				<Icon
					icon="arcticons:letter-lowercase-square-n"
					width="1.5rem"
					height="1.5rem"
					class="hidden sm:block mr-1.5"
				/>
				<p>Business Method</p>
			</a>
			<a
				on:click={() => ($selectedPatentApplicationType = 2)}
				class="border rounded-md flex p-2 flex-grow items-center hover:bg-accent hover:cursor-pointer {$selectedPatentApplicationType ===
				2
					? 'bg-accent'
					: 'bg-none'} "
			>
				<Icon
					icon="arcticons:letter-uppercase-square-p"
					width="1.5rem"
					height="1.5rem"
					class="hidden sm:block mr-1.5"
				/>
				<p>Utility Model</p>
			</a>
		</div>
		<Label style="color: darkred" class={showPatentError ? 'block' : 'hidden'}>Select one</Label>
</div>
		<div class="flex flex-col space-y-1.5">
			<Label for="title"
				>Title of Invention
				<Button
					on:click={() => Reset('Title of Invention', 'title')}
					variant="ghost"
					class="{showTitleReset ? 'inline' : 'hidden'} text-blue-500">Reset</Button
				>
			</Label>
			<Input id="title" placeholder="Title of invention" bind:value={title} class="min-h-20" />
			<Label style="color: darkred" class={showTitleError ? 'block' : 'hidden'}
				>Title is required</Label
			>
		</div>
		<div class="flex flex-col space-y-1.5">
			<Label for="abstract"
				>Patent Abstract
				<Button
					on:click={() => Reset('Patent Abstract', 'abstract')}
					variant="ghost"
					class="{showAbstractReset ? 'inline' : 'hidden'} text-blue-500">Reset</Button
				>
			</Label>
			<Textarea
				class="min-h-[130px]"
				id="abstract"
				placeholder="Patent Abstract"
				bind:value={abstract}
			/>
			<Label style="color: darkred" class={showAbstactError ? 'block' : 'hidden'}
				>Abstract is required</Label
			>
		</div>
	</form>
</div>

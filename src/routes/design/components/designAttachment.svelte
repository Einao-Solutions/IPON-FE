<script lang="ts">
	import { designForm, currentStep } from '$lib/utils/design';
	import { get } from 'svelte/store';

	const initial = get(designForm).attachments as any;

	let powerOfAttorney: File | null = initial?.powerOfAttorney ?? null;
	let designRepresentation: File | null = initial?.designRepresentation ?? null;
	let priorityDocument: File | null = initial?.priorityDocument ?? null;
	let noveltyStatement: File | null = initial?.noveltyStatement ?? null;
	let otherDocuments: File[] = initial?.otherDocuments ?? [];

	let errors = {
		powerOfAttorney: '',
		designRepresentation: '',
		priorityDocument: '',
		otherDocuments: ''
	};

	function updateStore() {
		designForm.update((form: any) => {
			form.attachments = {
				powerOfAttorney,
				designRepresentation,
				priorityDocument,
				noveltyStatement,
				otherDocuments
			};
			return form;
		});
	}

	function handleFileChange(event: Event, field: 'powerOfAttorney' | 'designRepresentation' | 'priorityDocument' | 'noveltyStatement') {
		const target = event.target as HTMLInputElement | null;
		const file = target?.files?.[0] ?? null;
		if (field === 'powerOfAttorney') powerOfAttorney = file;
		if (field === 'designRepresentation') designRepresentation = file;
		if (field === 'priorityDocument') priorityDocument = file;
		if (field === 'noveltyStatement') noveltyStatement = file;
		updateStore();
	}

	function handleOtherFilesChange(event: Event) {
		const target = event.target as HTMLInputElement | null;
		const files = target?.files ? Array.from(target.files) : [];
		otherDocuments = files;
		updateStore();
	}

	function validateAttachments() {
		const newErrors = {
			powerOfAttorney: '',
			designRepresentation: '',
			priorityDocument: '',
			otherDocuments: ''
		};

		// Always required
		newErrors.powerOfAttorney = powerOfAttorney ? '' : 'Power of Attorney is required';
		newErrors.designRepresentation = designRepresentation
			? ''
			: 'Design Representation is required';

		// Priority document required only if any priority information exists
		const snapshot: any = get(designForm);
		const priorities: any[] = Array.isArray(snapshot?.priorities) ? snapshot.priorities : [];
		const hasPriority = priorities.some(
			(p) => p?.applicationNumber || p?.country || p?.date
		);
		if (hasPriority && !priorityDocument) {
			newErrors.priorityDocument =
				'Priority Document is required when priority information is provided';
		}

		// Optional: enforce max 4 other documents
		if (otherDocuments.length > 4) {
			newErrors.otherDocuments = 'You can upload up to 4 other documents';
		}

		errors = newErrors;
		return Object.values(newErrors).every((v) => !v);
	}

	function handleNext() {
		const isValid = validateAttachments();
		updateStore();
		if (!isValid) {
			return;
		}
		currentStep.update((n) => n + 1);
	}

	function handleBack() {
		updateStore();
		currentStep.update((n) => (n > 0 ? n - 1 : 0));
	}
</script>

<div class="space-y-6">
	<h2 class="text-2xl font-semibold">Attachments</h2>

	<div class="border p-4 rounded-md space-y-4">
		<div>
			<label class="block text-sm font-medium mb-1">Power of Attorney (required)</label>
			<input type="file" class="input" on:change={(event) => handleFileChange(event, 'powerOfAttorney')} />
			{#if powerOfAttorney}
				<div class="flex items-center mt-1 text-sm text-gray-700">
					<span class="mr-2">{powerOfAttorney.name}</span>
					<button type="button" class="text-red-500 hover:underline" on:click={() => { powerOfAttorney = null; updateStore(); }}>Remove</button>
				</div>
			{/if}
			{#if errors.powerOfAttorney}
				<p class="error">{errors.powerOfAttorney}</p>
			{/if}
		</div>

		<div>
			<label class="block text-sm font-medium mb-1">Design Representation (required)</label>
			<input type="file" class="input" on:change={(event) => handleFileChange(event, 'designRepresentation')} />
			{#if designRepresentation}
				<div class="flex items-center mt-1 text-sm text-gray-700">
					<span class="mr-2">{designRepresentation.name}</span>
					<button type="button" class="text-red-500 hover:underline" on:click={() => { designRepresentation = null; updateStore(); }}>Remove</button>
				</div>
			{/if}
			{#if errors.designRepresentation}
				<p class="error">{errors.designRepresentation}</p>
			{/if}
		</div>

		<div>
			<label class="block text-sm font-medium mb-1">Priority Document (required if priority provided)</label>
			<input type="file" class="input" on:change={(event) => handleFileChange(event, 'priorityDocument')} />
			{#if priorityDocument}
				<div class="flex items-center mt-1 text-sm text-gray-700">
					<span class="mr-2">{priorityDocument.name}</span>
					<button type="button" class="text-red-500 hover:underline" on:click={() => { priorityDocument = null; updateStore(); }}>Remove</button>
				</div>
			{/if}
			{#if errors.priorityDocument}
				<p class="error">{errors.priorityDocument}</p>
			{/if}
		</div>

		<div>
			<label class="block text-sm font-medium mb-1">Novelty Statement (optional)</label>
			<input type="file" class="input" on:change={(event) => handleFileChange(event, 'noveltyStatement')} />
			{#if noveltyStatement}
				<div class="flex items-center mt-1 text-sm text-gray-700">
					<span class="mr-2">{noveltyStatement.name}</span>
					<button type="button" class="text-red-500 hover:underline" on:click={() => { noveltyStatement = null; updateStore(); }}>Remove</button>
				</div>
			{/if}
		</div>

		<div>
			<label class="block text-sm font-medium mb-1">Other Documents (up to 4)</label>
			<input type="file" multiple class="input" on:change={handleOtherFilesChange} />
			{#if otherDocuments.length}
				<ul class="mt-1 text-sm text-gray-700">
					{#each otherDocuments as doc, i}
						<li class="flex items-center mb-1">
							<span class="mr-2">{doc.name}</span>
							<button type="button" class="text-red-500 hover:underline" on:click={() => { otherDocuments = otherDocuments.filter((_, idx) => idx !== i); updateStore(); }}>Remove</button>
						</li>
					{/each}
				</ul>
			{/if}
			{#if errors.otherDocuments}
				<p class="error">{errors.otherDocuments}</p>
			{/if}
		</div>
	</div>

	<div class="flex justify-between">
		<button type="button" class="btn-black" on:click={handleBack}>
			Back
		</button>
		<button
			type="button"
			class="px-4 py-2 bg-green-600 text-white rounded-lg"
			on:click={handleNext}
		>
			Next
		</button>
	</div>
</div>

<style>
	.input {
		@apply p-2 border rounded-md w-full;
	}
	.btn-black {
		@apply bg-black text-white px-6 py-2 rounded-md hover:opacity-90;
	}
	.error {
		@apply text-red-600 text-sm mt-1;
	}
</style>


<script lang="ts">
	import { designForm, currentStep } from '$lib/utils/design';
	import { get } from 'svelte/store';

	const initial = get(designForm).attachments as any;

	let powerOfAttorney: File | null = initial?.powerOfAttorney ?? null;
	let designRepresentation: File | null = initial?.designRepresentation ?? null;
	let priorityDocument: File | null = initial?.priorityDocument ?? null;
	let otherDocuments: File[] = initial?.otherDocuments ?? [];

	function updateStore() {
		designForm.update((form: any) => {
			form.attachments = {
				powerOfAttorney,
				designRepresentation,
				priorityDocument,
				otherDocuments
			};
			return form;
		});
	}

	function handleFileChange(event: Event, field: 'powerOfAttorney' | 'designRepresentation' | 'priorityDocument') {
		const target = event.target as HTMLInputElement | null;
		const file = target?.files?.[0] ?? null;
		if (field === 'powerOfAttorney') powerOfAttorney = file;
		if (field === 'designRepresentation') designRepresentation = file;
		if (field === 'priorityDocument') priorityDocument = file;
		updateStore();
	}

	function handleOtherFilesChange(event: Event) {
		const target = event.target as HTMLInputElement | null;
		const files = target?.files ? Array.from(target.files) : [];
		otherDocuments = files;
		updateStore();
	}

	function handleNext() {
		updateStore();
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
		</div>

		<div>
			<label class="block text-sm font-medium mb-1">Design Representation (required)</label>
			<input type="file" class="input" on:change={(event) => handleFileChange(event, 'designRepresentation')} />
		</div>

		<div>
			<label class="block text-sm font-medium mb-1">Priority Document (required if priority provided)</label>
			<input type="file" class="input" on:change={(event) => handleFileChange(event, 'priorityDocument')} />
		</div>

		<div>
			<label class="block text-sm font-medium mb-1">Other Documents (up to 4)</label>
			<input type="file" multiple class="input" on:change={handleOtherFilesChange} />
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
</style>


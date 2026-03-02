<script lang="ts">
	import { designForm, currentStep } from '$lib/utils/design';
	import { get } from 'svelte/store';
	import { countriesMap } from '$lib/constants';

	type DesignPriorityEntry = {
		applicationNumber: string;
		country: string;
		date: string;
	};

	const initialPriorities = (get(designForm).priorities as any[]) ?? [];

	let localPriorityInfo: DesignPriorityEntry[] = initialPriorities.length
		? initialPriorities.map((p) => ({
				applicationNumber: p.applicationNumber ?? '',
				country: p.country ?? '',
				date: p.date ?? ''
			}))
		: [
				{
					applicationNumber: '',
					country: '',
					date: ''
				}
			];

	let errors = localPriorityInfo.map(() => ({
		applicationNumber: '',
		country: '',
		date: ''
	}));

	// Per-entry dropdown/search state
	let perPriorityFilteredCountries: string[][] = localPriorityInfo.map(() => []);
	let perPriorityCountrySearch: string[] = localPriorityInfo.map(() => '');
	let showPriorityCountryDropdowns: boolean[] = localPriorityInfo.map(() => false);

	function getCountryNames(): string[] {
		const map = countriesMap as Record<string, string>;
		return Object.values(map);
	}

	function updateStore() {
		designForm.update((form: any) => {
			form.priorities = localPriorityInfo.map((p) => ({
				applicationNumber: p.applicationNumber,
				country: p.country,
				date: p.date
			}));
			return form;
		});
	}

	function validate() {
		let valid = true;
		errors = localPriorityInfo.map((entry) => {
			const entryErrors = {
				applicationNumber: entry.applicationNumber ? '' : 'Application Number is required.',
				country: entry.country ? '' : 'Country is required.',
				date: entry.date ? '' : 'Date is required.'
			};
			if (entryErrors.applicationNumber || entryErrors.country || entryErrors.date) valid = false;
			return entryErrors;
		});
		return valid;
	}

	function handleNext() {
		// Show validation errors but always move forward like other design steps
		validate();
		updateStore();
		currentStep.update((n) => n + 1);
	}

	function handleBack() {
		updateStore();
		currentStep.update((n) => (n > 0 ? n - 1 : 0));
	}

	function addPriorityInfo() {
		localPriorityInfo = [
			...localPriorityInfo,
			{
				applicationNumber: '',
				country: '',
				date: ''
			}
		];
		errors = [...errors, { applicationNumber: '', country: '', date: '' }];
		perPriorityFilteredCountries = [...perPriorityFilteredCountries, []];
		perPriorityCountrySearch = [...perPriorityCountrySearch, ''];
		showPriorityCountryDropdowns = [...showPriorityCountryDropdowns, false];
		updateStore();
	}

	function removePriorityInfo(index: number) {
		localPriorityInfo = localPriorityInfo.filter((_, i) => i !== index);
		errors = errors.filter((_, i) => i !== index);
		perPriorityFilteredCountries = perPriorityFilteredCountries.filter((_, i) => i !== index);
		perPriorityCountrySearch = perPriorityCountrySearch.filter((_, i) => i !== index);
		showPriorityCountryDropdowns = showPriorityCountryDropdowns.filter((_, i) => i !== index);
		updateStore();
	}

	function onCountryInput(index: number, input: string) {
		perPriorityCountrySearch[index] = input;
		const list = getCountryNames();
		perPriorityFilteredCountries[index] = list.filter((n) =>
			n.toLowerCase().includes(input.toLowerCase())
		);
		showPriorityCountryDropdowns = showPriorityCountryDropdowns.map((_, i) => i === index);
	}

	function handleCountryInputEvent(index: number, event: Event) {
		const target = event.target as HTMLInputElement | null;
		const value = target?.value ?? '';
		onCountryInput(index, value);
	}

	function onCountryFocus(index: number) {
		if (!perPriorityCountrySearch[index]) perPriorityFilteredCountries[index] = getCountryNames();
		showPriorityCountryDropdowns = showPriorityCountryDropdowns.map((_, i) => i === index);
	}

	function selectCountryForEntry(index: number, countryName: string) {
		localPriorityInfo[index].country = countryName;
		perPriorityCountrySearch[index] = countryName;
		perPriorityFilteredCountries[index] = [];
		showPriorityCountryDropdowns[index] = false;
		updateStore();
	}
</script>

<div class="space-y-6">
	<h2 class="text-2xl font-semibold">Priority Information</h2>

	{#each localPriorityInfo as info, index}
		<div class="border p-4 rounded-md mb-4 space-y-4">
			<h3 class="text-sm font-medium mb-2">Priority Information {index + 1}</h3>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium mb-2">Application Number</label>
					<input
						type="text"
						class="input"
						placeholder="Application Number"
						bind:value={localPriorityInfo[index].applicationNumber}
						on:input={updateStore}
					/>
					{#if errors[index].applicationNumber}
						<div class="error">{errors[index].applicationNumber}</div>
					{/if}
				</div>

				<div>
					<label class="block text-sm mb-2 font-medium">Country</label>

					<div class="relative">
						<input
							type="text"
							class="input"
							placeholder="Search Country..."
							bind:value={localPriorityInfo[index].country}
							on:focus={() => onCountryFocus(index)}
							on:input={(event) => handleCountryInputEvent(index, event)}
							on:blur={() =>
								setTimeout(() => {
									perPriorityFilteredCountries[index] = [];
									showPriorityCountryDropdowns[index] = false;
								}, 200)}
						/>
						<span
							class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
							>▼</span
						>

						{#if showPriorityCountryDropdowns[index] && perPriorityFilteredCountries[index]?.length}
							<ul class="absolute left-0 right-0 bg-white border mt-1 max-h-60 overflow-y-auto z-50 rounded-md shadow">
								{#each perPriorityFilteredCountries[index] as c}
									<li
										class="p-2 hover:bg-gray-100 cursor-pointer"
										on:mousedown={() => selectCountryForEntry(index, c)}
									>
										{c}
									</li>
								{/each}
							</ul>
						{/if}
					</div>

					{#if errors[index].country}
						<div class="error">{errors[index].country}</div>
					{/if}
				</div>
			</div>

			<div>
				<label class="block mb-2 text-sm font-medium">Date</label>
				<input
					type="date"
					class="input"
					bind:value={localPriorityInfo[index].date}
					on:input={updateStore}
				/>
				{#if errors[index]?.date}
					<div class="error">{errors[index].date}</div>
				{/if}
			</div>

			{#if localPriorityInfo.length > 1}
				<div class="text-right">
					<button
						class="rounded-lg bg-red-100 text-red-600 hover:bg-red-600 hover:text-red-200 px-4 py-1 text-sm font-medium transition shadow-sm border border-red-200"
						on:click={() => removePriorityInfo(index)}
					>
						Remove
					</button>
				</div>
			{/if}
		</div>
	{/each}

	<button class="btn-black" on:click={addPriorityInfo}>
		+ Add  Priority Info
	</button>

	<div class="flex justify-between pt-6">
		<button class="btn-black" on:click={handleBack}>Back</button>
		<button class="px-4 py-2 bg-green-600 text-white rounded-lg" on:click={handleNext}>
			Next
		</button>
	</div>
</div>

<style>
	.input {
		@apply p-3 border rounded-md w-full;
	}

	.btn-black {
		@apply bg-black text-white px-6 py-2 rounded-md hover:bg-neutral-800;
	}

	.error {
		@apply text-sm text-red-500 mt-1;
	}
</style>


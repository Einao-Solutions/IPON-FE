<script lang="ts">
	import { designForm, currentStep } from '$lib/utils/design';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import { countriesMap } from '$lib/constants';
	import { countryDialingCodes } from '$lib/utils/patent';

	type Creator = {
		name: string;
		country: string; // nationality
		state: string;
		city: string;
		phone: string; // raw phone (without prefix)
		phonePrefix: string;
		email: string;
		address: string;
	};

	const initialCreators = (get(designForm).creators as any[]) ?? [];

	let creators: Creator[] = initialCreators.length
		? initialCreators.map((c) => ({
				name: c.name ?? '',
				country: c.nationality ?? '',
				state: c.state ?? '',
				city: c.city ?? '',
				phone: c.phone ?? '',
				phonePrefix: '',
				email: c.email ?? '',
				address: c.address ?? ''
			}))
		: [
				{
					name: '',
					country: '',
					state: '',
					city: '',
					phone: '',
					phonePrefix: '',
					email: '',
					address: ''
				}
			];

	// Per-creator dropdown/search state
	let perCreatorStates: string[][] = creators.map(() => []);
	let perCreatorFilteredStates: string[][] = creators.map(() => []);
	let perCreatorCountrySearch: string[] = creators.map(() => '');
	let perCreatorStateSearch: string[] = creators.map(() => '');
	let showCountryDropdowns: boolean[] = creators.map(() => false);
	let showStateDropdowns: boolean[] = creators.map(() => false);

	let filteredCountries: string[] = [];

	let errors = creators.map(() => ({
		name: '',
		country: '',
		state: '',
		city: '',
		phone: '',
		email: '',
		address: ''
	}));

	// Country list from countriesMap (design side)
	function getCountryNames(): string[] {
		const map = countriesMap as Record<string, string>;
		return Object.values(map);
	}

	onMount(() => {
		filteredCountries = getCountryNames();

		creators.forEach((c, i) => {
			if (c.country) {
				const dial = countryDialingCodes[c.country];
				creators[i].phonePrefix = dial ?? '';
				fetchStatesForCreator(i, c.country);
			}
		});
	});

	function updateStore() {
		designForm.update((form: any) => {
			form.creators = creators.map((c) => ({
				name: c.name,
				email: c.email,
				phone: `${c.phonePrefix}${c.phone}`.trim(),
				nationality: c.country,
				state: c.state,
				address: c.address,
				city: c.city
			}));
			return form;
		});
	}

	// Country search / select
	function onCountryInput(index: number, input: string) {
		perCreatorCountrySearch[index] = input;
		const list = getCountryNames();
		filteredCountries = list.filter((name) => name.toLowerCase().includes(input.toLowerCase()));
	}

	function handleCountryInputEvent(index: number, event: Event) {
		const target = event.target as HTMLInputElement | null;
		const value = target?.value ?? '';
		onCountryInput(index, value);
	}

	async function fetchStatesForCreator(index: number, countryName: string) {
		if (!countryName) {
			perCreatorStates[index] = [];
			perCreatorFilteredStates[index] = [];
			return;
		}
		try {
			const res = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ country: countryName })
			});
			const json = await res.json();
			const stateArr = json.data?.states ?? json.states ?? [];
			const normalized = stateArr
				.map((s: any) => (typeof s === 'string' ? s : s.name ?? s.state ?? ''))
				.filter(Boolean);
			perCreatorStates[index] = normalized;
			perCreatorFilteredStates[index] = normalized;
		} catch (err) {
			console.error('Failed to fetch states for', countryName, err);
			perCreatorStates[index] = [];
			perCreatorFilteredStates[index] = [];
		}
	}

	async function selectCountry(countryName: string, index: number) {
		creators[index].country = countryName;
		creators[index].state = '';
		perCreatorStateSearch[index] = '';
		perCreatorStates[index] = [];
		perCreatorFilteredStates[index] = [];

		const dialCode = countryDialingCodes[countryName];
		creators[index].phonePrefix = dialCode ?? '';
		creators[index].phone = '';

		updateStore();
		await fetchStatesForCreator(index, countryName);
	}

	// State search / select
	function onStateInput(index: number, input: string) {
		perCreatorStateSearch[index] = input;
		const list = perCreatorStates[index] ?? [];
		perCreatorFilteredStates[index] = list.filter((s) =>
			s.toLowerCase().includes(input.toLowerCase())
		);
	}

	function handleStateInputEvent(index: number, event: Event) {
		const target = event.target as HTMLInputElement | null;
		const value = target?.value ?? '';
		onStateInput(index, value);
	}

	function selectState(stateName: string, index: number) {
		creators[index].state = stateName;
		perCreatorStateSearch[index] = stateName;
		updateStore();
	}

	function addCreator() {
		creators = [
			...creators,
			{
				name: '',
				country: '',
				state: '',
				city: '',
				phone: '',
				phonePrefix: '',
				email: '',
				address: ''
			}
		];
		perCreatorStates = [...perCreatorStates, []];
		perCreatorFilteredStates = [...perCreatorFilteredStates, []];
		perCreatorCountrySearch = [...perCreatorCountrySearch, ''];
		perCreatorStateSearch = [...perCreatorStateSearch, ''];
		showCountryDropdowns = [...showCountryDropdowns, false];
		showStateDropdowns = [...showStateDropdowns, false];
		errors = [
			...errors,
			{ name: '', country: '', state: '', city: '', phone: '', email: '', address: '' }
		];
		updateStore();
	}

	function removeCreator(index: number) {
		if (creators.length <= 1) return;
		creators = creators.filter((_, i) => i !== index);
		perCreatorStates = perCreatorStates.filter((_, i) => i !== index);
		perCreatorFilteredStates = perCreatorFilteredStates.filter((_, i) => i !== index);
		perCreatorCountrySearch = perCreatorCountrySearch.filter((_, i) => i !== index);
		perCreatorStateSearch = perCreatorStateSearch.filter((_, i) => i !== index);
		showCountryDropdowns = showCountryDropdowns.filter((_, i) => i !== index);
		showStateDropdowns = showStateDropdowns.filter((_, i) => i !== index);
		errors = errors.filter((_, i) => i !== index);
		updateStore();
	}

	function validateCreators() {
		let isValid = true;
		errors = creators.map((c) => {
			const e = {
				name: c.name.trim() ? '' : 'Name is required',
				country: c.country ? '' : 'Nationality is required',
				state: c.state.trim() ? '' : 'State is required',
				city: c.city.trim() ? '' : 'City is required',
				phone: /^\+?\d{7,15}$/.test(c.phone.trim()) ? '' : 'Valid phone number is required',
				email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()) ? '' : 'Valid email is required',
				address: c.address.trim() ? '' : 'Address is required'
			};
			if (Object.values(e).some((v) => v)) isValid = false;
			return e;
		});
		return isValid;
	}

	function handleNext() {
		// Run validation to show errors but always move forward
		validateCreators();
		updateStore();
		currentStep.update((n) => n + 1);
	}

	function handleBack() {
		updateStore();
		currentStep.update((n) => (n > 0 ? n - 1 : 0));
	}
</script>

<div class="space-y-6">
	<h2 class="text-2xl font-semibold">Creator Information</h2>

	{#each creators as creator, index}
		<div class="border p-4 rounded-md space-y-4 relative">
			<div class="text-sm font-semibold">Creator {index + 1}</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium mb-1">Name</label>
					<input
						placeholder="Name"
						class="input"
						bind:value={creator.name}
						on:input={updateStore}
					/>
					{#if errors[index]?.name}
						<div class="text-red-500 text-sm mt-1">{errors[index].name}</div>
					{/if}
				</div>

				<!-- Country dropdown -->
				<div class="relative">
					<label class="block text-sm font-medium mb-1">Nationality</label>
					<div class="relative">
						<input
							type="text"
							class="input pr-8"
							placeholder="Search Nationality..."
							on:focus={() => {
								showCountryDropdowns[index] = true;
								if (!perCreatorCountrySearch[index]) filteredCountries = getCountryNames();
							}}
							on:input={(event) => handleCountryInputEvent(index, event)}
							on:blur={() => setTimeout(() => (showCountryDropdowns[index] = false), 200)}
							bind:value={creator.country}
						/>
						<span
							class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
							>▼</span
						>
					</div>

					{#if showCountryDropdowns[index] && filteredCountries.length}
						<ul class="absolute bg-white border w-full mt-1 max-h-60 overflow-y-auto z-10 rounded-md shadow">
							{#each filteredCountries as c}
								<li
									class="p-2 hover:bg-gray-100 cursor-pointer"
									on:mousedown={() => {
										// mousedown so it fires before blur
										selectCountry(c, index);
										perCreatorCountrySearch[index] = c;
										showCountryDropdowns[index] = false;
									}}
								>
									{c}
								</li>
							{/each}
						</ul>
					{/if}
					{#if errors[index]?.country}
						<div class="text-red-500 text-sm mt-1">{errors[index].country}</div>
					{/if}
				</div>

				<!-- State dropdown -->
				<div class="relative">
					<label class="block text-sm font-medium mb-1">State</label>
					<div class="relative">
						<input
							type="text"
							class="input pr-8"
							placeholder="Search State..."
							on:focus={() => {
								showStateDropdowns[index] = true;
								if (!perCreatorStateSearch[index])
									perCreatorFilteredStates[index] = perCreatorStates[index] ?? [];
							}}
							on:input={(event) => handleStateInputEvent(index, event)}
							on:blur={() => setTimeout(() => (showStateDropdowns[index] = false), 200)}
							bind:value={creator.state}
						/>
						<span
							class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
							>▼</span
						>
					</div>

					{#if showStateDropdowns[index] && perCreatorFilteredStates[index]?.length}
						<ul class="absolute bg-white border w-full mt-1 max-h-60 overflow-y-auto z-10 rounded-md shadow">
							{#each perCreatorFilteredStates[index] as s}
								<li
									class="p-2 hover:bg-gray-100 cursor-pointer"
									on:mousedown={() => {
										selectState(s, index);
										perCreatorStateSearch[index] = s;
										showStateDropdowns[index] = false;
									}}
								>
									{s}
								</li>
							{/each}
						</ul>
					{/if}
					{#if errors[index]?.state}
						<div class="text-red-500 text-sm mt-1">{errors[index].state}</div>
					{/if}
				</div>

				<div>
					<label class="block text-sm font-medium mb-1">City</label>
					<input
						placeholder="City"
						class="input"
						bind:value={creator.city}
						on:input={updateStore}
					/>
					{#if errors[index]?.city}
						<div class="text-red-500 text-sm mt-1">{errors[index].city}</div>
					{/if}
				</div>

				<!-- Phone -->
				<div class="form-group">
					<label class="block text-sm font-medium mb-1" for="phone-{index}">Phone</label>
					<div class="flex w-full">
						<input
							id="phone-{index}-prefix"
							readonly
							tabindex="-1"
							bind:value={creator.phonePrefix}
							class="p-3 border rounded-l-md w-20 bg-gray-100 text-gray-700"
						/>

						<input
							id="phone-{index}"
							type="tel"
							bind:value={creator.phone}
							on:input={updateStore}
							placeholder="Enter phone number"
							class="input rounded-l-none"
						/>
					</div>

					{#if errors[index]?.phone}
						<p class="text-red-500 text-sm mt-1">{errors[index].phone}</p>
					{/if}
				</div>

				<div>
					<label class="block text-sm font-medium mb-1">Email</label>
					<input
						placeholder="Email"
						class="input"
						bind:value={creator.email}
						on:input={updateStore}
					/>
					{#if errors[index]?.email}
						<div class="text-red-500 text-sm mt-1">{errors[index].email}</div>
					{/if}
				</div>

				<div class="col-span-2">
					<label class="block text-sm font-medium mb-1">Address</label>
					<textarea
						placeholder="Address"
						class="input h-24"
						bind:value={creator.address}
						on:input={updateStore}
					/>
					{#if errors[index]?.address}
						<div class="text-red-500 text-sm mt-1">{errors[index].address}</div>
					{/if}
				</div>
			</div>

			{#if creators.length > 1}
				<button
					type="button"
					class="rounded-lg bg-red-100 text-red-600 hover:bg-red-600 hover:text-red-200 px-4 py-1 text-sm font-medium transition shadow-sm border border-red-200 absolute top-2 right-2"
					on:click={() => removeCreator(index)}
				>
					Remove
				</button>
			{/if}
		</div>
	{/each}

	<div class="flex justify-end">
		<button type="button" class="btn-black" on:click={addCreator}>
			+ Add Creator
		</button>
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
		@apply p-3 border rounded-md w-full;
	}
	.btn-black {
		@apply bg-black text-white px-6 py-2 rounded-md hover:opacity-90;
	}
</style>


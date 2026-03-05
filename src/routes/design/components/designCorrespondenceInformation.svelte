<script lang="ts">
	import { designForm, currentStep } from '$lib/utils/design';
	import { get } from 'svelte/store';

	const initial = get(designForm).correspondence as any;

	let name: string = initial?.name ?? '';
	let email: string = initial?.email ?? '';
	let phone: string = initial?.phone ?? '';
	let nationality: string = initial?.nationality ?? '';
	let state: string = initial?.state ?? '';
	const states = [
		'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
		'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
		'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
		'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
		'Yobe', 'Zamfara'
	];
	let address: string = initial?.address ?? '';

	let errors = {
		name: '',
		email: '',
		phone: '',
		nationality: '',
		state: '',
		address: ''
	};

	function updateStore() {
		designForm.update((form: any) => {
			form.correspondence = { name, email, phone, nationality, state, address };
			return form;
		});
	}

	function validateCorrespondence() {
		const newErrors = {
			name: '',
			email: '',
			phone: '',
			nationality: '',
			state: '',
			address: ''
		};

		newErrors.name = name.trim() ? '' : 'Name is required';
		newErrors.nationality = nationality.trim() ? '' : 'Nationality is required';
		newErrors.state = state.trim() ? '' : 'State is required';
		newErrors.address = address.trim() ? '' : 'Address is required';

		newErrors.phone = /^\+?\d{7,15}$/.test(phone.trim())
			? ''
			: 'Valid phone number is required';

		newErrors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
			? ''
			: 'Valid email is required';

		errors = newErrors;
		return Object.values(newErrors).every((v) => !v);
	}

	function handleNext() {
		const isValid = validateCorrespondence();
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
	<h2 class="text-2xl font-semibold">Correspondence Information</h2>

	<div class="border p-4 rounded-md space-y-4">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium mb-1">Name</label>
				<input
					class="input"
					placeholder="Name"
					bind:value={name}
					on:input={updateStore}
				/>
				{#if errors.name}
					<p class="error">{errors.name}</p>
				{/if}
			</div>

			<div>
				<label class="block text-sm font-medium mb-1">Email</label>
				<input
					class="input"
					placeholder="Email"
					bind:value={email}
					on:input={updateStore}
				/>
				{#if errors.email}
					<p class="error">{errors.email}</p>
				{/if}
			</div>

			<div>
				<label class="block text-sm font-medium mb-1">Phone</label>
				<input
					class="input"
					placeholder="Phone"
					bind:value={phone}
					on:input={updateStore}
				/>
				{#if errors.phone}
					<p class="error">{errors.phone}</p>
				{/if}
			</div>

			<div>
				<label class="block text-sm font-medium mb-1">Nationality</label>
				<input
					class="input"
					placeholder="Nationality"
					bind:value={nationality}
					on:input={updateStore}
				/>
				{#if errors.nationality}
					<p class="error">{errors.nationality}</p>
				{/if}
			</div>

			<div>
				<label class="block text-sm font-medium mb-1">State</label>
					<select
						class="input"
						bind:value={state}
						on:change={updateStore}
					>
						<option value="">Select State</option>
						{#each states as s}
							<option value={s}>{s}</option>
						{/each}
					</select>
					{#if errors.state}
						<p class="error">{errors.state}</p>
					{/if}
			</div>

			<div class="col-span-2">
				<label class="block text-sm font-medium mb-1">Address</label>
				<textarea
					class="input h-24"
					placeholder="Address"
					bind:value={address}
					on:input={updateStore}
				/>
				{#if errors.address}
					<p class="error">{errors.address}</p>
				{/if}
			</div>
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
		@apply p-3 border rounded-md w-full;
	}
	.btn-black {
		@apply bg-black text-white px-6 py-2 rounded-md hover:opacity-90;
	}
	.error {
		@apply text-red-600 text-sm mt-1;
	}
</style>


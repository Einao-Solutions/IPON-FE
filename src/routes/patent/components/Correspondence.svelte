<script lang="ts">
  import { patentForm, goToNextStep, goToPreviousStep, countries, countryDialingCodes } from '$lib/utils/patent';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';

  let form = get(patentForm);
  let correspondence = form.correspondence || {
    name: '',
    nationality: '',
    state: '',
    email: '',
    phonePrefix: '',
    phone: '',
    address: ''
  };

  let errors: {
    name?: string;
    nationality?: string;
    state?: string;
    email?: string;
    phone?: string;
    address?: string;
  } = {};
  
  let countrySearch = '';
  let showStateDropdown = false;
  let perStates: string[] = [];
  let filteredStates: string[] = [];
  let stateSearch = '';

  // if there's already a saved nationality, prefetch its states (but don't show dropdowns)
  onMount(() => {
    // force default nationality to Nigeria
    correspondence.nationality = 'Nigeria';
    countrySearch = 'Nigeria';

    // set Nigeria's dialing code
    correspondence.phonePrefix = countryDialingCodes['Nigeria'] ?? '+234';

    // immediately fetch Nigerian states
    fetchStatesForCountry('Nigeria');
  });

  function updateStore() {
    //const fullPhone = `${correspondence.phonePrefix}${correspondence.phone}`;
    patentForm.update((form) => {
      form.correspondence = {
        ...correspondence,
        phone: correspondence.phone,
        phonePrefix: correspondence.phonePrefix, // keep prefix in store
      };
      return form;
    });
  }

  function validate() {
    errors = {};

    if (!correspondence.name?.trim()) {
      errors.name = 'Name is required';
    }

    if (!correspondence.nationality?.trim()) {
      errors.nationality = 'Nationality is required';
    }

    if (!correspondence.state?.trim()) {
      errors.state = 'State is required';
    }

    if (!correspondence.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correspondence.email)) {
      errors.email = 'Invalid email format';
    }

    const fullPhone = `${correspondence.phonePrefix}${correspondence.phone}`;
    if (!correspondence.phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!fullPhone.startsWith(correspondence.phonePrefix)) {
      errors.phone = `Phone number must start with ${correspondence.phonePrefix}`;
    } else if (!/^\+?\d{7,15}$/.test(fullPhone)) {
      errors.phone = 'Valid Phone number is required';
    }

    if (!correspondence.address?.trim()) {
      errors.address = 'Address is required';
    }

    return Object.keys(errors).length === 0;
  }

  function handleNext() {
    if (validate()) {
      updateStore();
      goToNextStep();
    }
  }

  function handleBack() {
    updateStore();
    goToPreviousStep();
  }

  // States
  async function fetchStatesForCountry(countryName: string) {
    if (!countryName) return;
    try {
      const res = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName })
      });
      const json = await res.json();
      const stateArr = json.data?.states ?? json.states ?? [];
      perStates = stateArr.map((s: any) => (typeof s === 'string' ? s : s.name ?? s.state ?? '')).filter(Boolean);
      filteredStates = perStates;
    } catch (err) {
      console.error('Failed to fetch states for', countryName, err);
      perStates = [];
      filteredStates = [];
    }
  }

  function onStateFocus() {
    if (!stateSearch) filteredStates = perStates;
    showStateDropdown = true;
  }

  function onStateInput(input: string) {
    stateSearch = input;
    const list = perStates ?? [];
    filteredStates = list.filter(s => s.toLowerCase().includes(input.toLowerCase()));
    showStateDropdown = true;
  }

  function selectState(name: string) {
    correspondence.state = name;
    stateSearch = name;
    filteredStates = [];
    showStateDropdown = false;
    updateStore();
  }
</script>

<div class="space-y-6">
  <h2 class="text-2xl font-semibold">Correspondence Information</h2>

  <div class="border p-4 rounded-lg space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block mb-2 text-sm font-medium">Name</label>
        <input placeholder="Name" bind:value={correspondence.name} class="input" on:input={updateStore} />
        {#if errors.name}
          <p class="error">{errors.name}</p>
        {/if}
      </div>

      <!-- Nationality (searchable) -->
      <div>
        <label class="block mb-2 text-sm font-medium">Nationality</label>
        <div class="relative">

          <input
            type="text"
            class="input bg-gray-100 text-gray-700"
            value="Nigeria"
            readonly
          />
        </div>
        {#if errors.nationality}
          <p class="error">{errors.nationality}</p>
        {/if}
      </div>

      <!-- State (searchable, populated for selected country) -->
      <div>
        <label class="block mb-2 text-sm font-medium">State</label>
        <div class="relative">
          <input
            type="text"
            class="input"
            placeholder="Search State..."
            bind:value={correspondence.state}
            on:focus={onStateFocus}
            on:input={(e) => onStateInput(e.target.value)}
            on:blur={() => setTimeout(() => { filteredStates = []; showStateDropdown = false; }, 200)}
          />
          <span class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>

          {#if showStateDropdown && filteredStates.length}
            <ul class="absolute left-0 right-0 bg-white border mt-1 max-h-60 overflow-y-auto z-50 rounded-md shadow">
              {#each filteredStates as s}
                <li
                  class="p-2 hover:bg-gray-100 cursor-pointer"
                  on:mousedown={() => selectState(s)}
                >
                  {s}
                </li>
              {/each}
            </ul>
          {/if}
        </div>

        {#if errors.state}
          <p class="error">{errors.state}</p>
        {/if}
      </div>

      <div>
        <label class="block mb-2 text-sm font-medium">Email</label>
        <input placeholder="Email" bind:value={correspondence.email} class="input" on:input={updateStore} />
        {#if errors.email}
          <p class="error">{errors.email}</p>
        {/if}
      </div>

      <div class="form-group">
        <label class="block mb-2 text-sm font-medium">Phone</label>
        <div class="flex w-full">
          <input
           class="p-3 border rounded-l-md w-20 bg-gray-100 text-gray-700"
            bind:value={correspondence.phonePrefix}
            readonly
            tabindex="-1"
          />
          <input
            class="input w-3/4"
            bind:value={correspondence.phone}
            placeholder="Enter phone number"
            on:input={updateStore}
          />
        </div>
        {#if errors.phone}
          <p class="error">{errors.phone}</p>
        {/if}
      </div>
    </div>

    <div>
      <label class="block mb-2 text-sm font-medium">Address</label>
      <textarea
        placeholder="Address"
        bind:value={correspondence.address}
        class="input w-full h-24"
        on:input={updateStore}
      ></textarea>
      {#if errors.address}
        <p class="error">{errors.address}</p>
      {/if}
    </div>
  </div>

  <div class="flex justify-between pt-4">
    <button type="button" class="btn-black" on:click={handleBack}>
      Back
    </button>
    <button type="button" class="px-4 py-2 bg-green-600 text-white rounded-lg" on:click={handleNext}>
      Next
    </button>
  </div>
</div>

<style>
  .input {
    @apply p-3 border rounded-md w-full;
  }

  .btn-black {
    @apply bg-black text-white px-6 py-2 rounded-md;
  }

  .error {
    @apply text-red-500 text-sm mt-1;
  }
</style>

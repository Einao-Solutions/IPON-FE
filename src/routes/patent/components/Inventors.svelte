
<script lang="ts">
  import { patentForm, goToNextStep, goToPreviousStep, countries, countryDialingCodes } from '$lib/utils/patent';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
	import { INVALID } from 'zod';

  // per-inventor state arrays and filters
  let perInventorStates: string[][] = [];
  let perInventorFilteredStates: string[][] = [];
  let perInventorCountrySearch: string[] = [];
  let perInventorStateSearch: string[] = [];

  let filteredCountries: string[] = [];

  // helpers
  function getCountryNames(): string[] {
    const storeVal = get(countries);
    const list: any[] = Array.isArray(storeVal) ? storeVal : storeVal?.data ?? [];
    return list.map((c: any) => (typeof c === 'string' ? c : c.name ?? c.country ?? '')).filter(Boolean);
  }

  // initial inventors
  let inventors = get(patentForm).inventors?.length
    ? get(patentForm).inventors
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

  // init per-inventor arrays
  perInventorStates = inventors.map(() => []);
  perInventorFilteredStates = inventors.map(() => []);
  perInventorCountrySearch = inventors.map(() => '');
  perInventorStateSearch = inventors.map(() => []);
  let showCountryDropdowns = inventors.map(() => false);
  let showStateDropdowns = inventors.map(() => false);

  let errors = inventors.map(() => ({
    name: '',
    country: '',
    state: '',
    city: '',
    phone: '',
    email: '',
    address: ''
  }));

  // ensure countries snapshot available on mount
  onMount(() => {
    filteredCountries = getCountryNames();
    // if inventors already had a country, fetch states for them
    inventors.forEach((inv, i) => {
      if (inv.country) fetchStatesForInventor(i, inv.country);
    });
  });

  // Country search per-inventor
  function onCountryInput(index: number, input: string) {
    perInventorCountrySearch[index] = input;
    const list = getCountryNames();
    filteredCountries = list.filter((name: string) => name.toLowerCase().includes(input.toLowerCase()));
  }

  async function fetchStatesForInventor(index: number, countryName: string) {
    if (!countryName) {
      perInventorStates[index] = [];
      perInventorFilteredStates[index] = [];
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
      const normalized = stateArr.map((s: any) => (typeof s === 'string' ? s : s.name ?? s.state ?? '')).filter(Boolean);
      perInventorStates[index] = normalized;
      perInventorFilteredStates[index] = normalized;
    } catch (err) {
      console.error('Failed to fetch states for', countryName, err);
      perInventorStates[index] = [];
      perInventorFilteredStates[index] = [];
    }
  }

  // When a country is selected for an inventor
  async function selectCountry(c: string, index: number) {
    inventors[index].country = c;
    inventors[index].state = '';
    perInventorStateSearch[index] = '';
    perInventorStates[index] = [];
    perInventorFilteredStates[index] = [];

    const dialCode = countryDialingCodes[c];
    inventors[index].phonePrefix = dialCode ?? '';
    inventors[index].phone = '';

    updateStore();
    await fetchStatesForInventor(index, c);
  }

  // State search per-inventor
  function onStateInput(index: number, input: string) {
    perInventorStateSearch[index] = input;
    const list = perInventorStates[index] ?? [];
    perInventorFilteredStates[index] = list.filter((s) => s.toLowerCase().includes(input.toLowerCase()));
  }

  function selectState(s: string, index: number) {
    inventors[index].state = s;
    updateStore();
  }

  function updateStore() {
    patentForm.update((form) => {
      form.inventors = inventors.map(inventors => ({
        ...inventors,
        phone: inventors.phone, // store raw phone
        phonePrefix: inventors.phonePrefix // store prefix separately
      }));
      return form;
    });
  }

  function validateInventors() {
    let isValid = true;
    errors = inventors.map((inv) => {
      const e = {
        name: inv.name.trim() ? '' : 'Name is required',
        country: inv.country ? '' : 'Nationality is required',
        state: inv.state.trim() ? '' : 'State is required',
        city: inv.city.trim() ? '' : 'City is required',
        phone: /^\+?\d{7,15}$/.test(inv.phone.trim()) ? '' : 'Valid phone number is required',
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inv.email.trim()) ? '' : 'Valid email is required',
        address: inv.address.trim() ? '' : 'Address is required'
      };
      if (Object.values(e).some((v) => v)) isValid = false;
      return e;
    });
    return isValid;
  }

  function handleNext() {
    if (!validateInventors()) return;
    updateStore();
    goToNextStep();
  }

  function handleBack() {
    updateStore();
    goToPreviousStep();
  }

  function addInventor() {
    inventors = [
      ...inventors,
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
    perInventorStates = [...perInventorStates, []];
    perInventorFilteredStates = [...perInventorFilteredStates, []];
    perInventorCountrySearch = [...perInventorCountrySearch, ''];
    perInventorStateSearch = [...perInventorStateSearch, ''];
    showCountryDropdowns = [...showCountryDropdowns, false];
    showStateDropdowns = [...showStateDropdowns, false];
    errors = [...errors, { name: '', country: '', state: '', city: '', phone: '', email: '', address: '' }];
    updateStore();
  }

  function removeInventor(index: number) {
    if (inventors.length > 1) {
      inventors = inventors.filter((_, i) => i !== index);
      perInventorStates = perInventorStates.filter((_, i) => i !== index);
      perInventorFilteredStates = perInventorFilteredStates.filter((_, i) => i !== index);
      perInventorCountrySearch = perInventorCountrySearch.filter((_, i) => i !== index);
      perInventorStateSearch = perInventorStateSearch.filter((_, i) => i !== index);
      showCountryDropdowns = showCountryDropdowns.filter((_, i) => i !== index);
      showStateDropdowns = showStateDropdowns.filter((_, i) => i !== index);
      errors = errors.filter((_, i) => i !== index);
      updateStore();
    }
  }
</script>

<div class="space-y-6">
  <h2 class="text-2xl font-semibold">Inventor Information</h2>

  {#each inventors as inventor, index}
    <div class="border p-4 rounded-md space-y-4 relative">
      <div class="text-sm font-semibold">Inventor {index + 1}</div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Name</label>
          <input placeholder="Name" class="input" bind:value={inventor.name} on:input={updateStore} />
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
                if (!perInventorCountrySearch[index]) filteredCountries = getCountryNames();
              }}
              on:input={(e) => onCountryInput(index, e.target.value)}
              on:blur={() => setTimeout(() => (showCountryDropdowns[index] = false), 200)}
              bind:value={inventor.country}
            />
            <span class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
          </div>

          {#if showCountryDropdowns[index] && filteredCountries.length}
            <ul class="absolute bg-white border w-full mt-1 max-h-60 overflow-y-auto z-10 rounded-md shadow">
              {#each filteredCountries as c}
                <li
                  class="p-2 hover:bg-gray-100 cursor-pointer"
                  on:mousedown={() => {
                    // mousedown so it fires before blur
                    selectCountry(c, index);
                    perInventorCountrySearch[index] = c;
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
                if (!perInventorStateSearch[index]) perInventorFilteredStates[index] = perInventorStates[index] ?? [];
              }}
              on:input={(e) => onStateInput(index, e.target.value)}
              on:blur={() => setTimeout(() => (showStateDropdowns[index] = false), 200)}
              bind:value={inventor.state}
            />
            <span class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
          </div>

          {#if showStateDropdowns[index] && perInventorFilteredStates[index]?.length}
            <ul class="absolute bg-white border w-full mt-1 max-h-60 overflow-y-auto z-10 rounded-md shadow">
              {#each perInventorFilteredStates[index] as s}
                <li
                  class="p-2 hover:bg-gray-100 cursor-pointer"
                  on:mousedown={() => {
                    selectState(s, index);
                    perInventorStateSearch[index] = s;
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
          <input placeholder="City" class="input" bind:value={inventor.city} on:input={updateStore} />
          {#if errors[index]?.city}
            <div class="text-red-500 text-sm mt-1">{errors[index].city}</div>
          {/if}
        </div>

        <!-- Phone -->
        <div class="form-group">
          <label class="block text-sm font-medium mb-1" for="phone-{index}">Phone</label>
          <div class="flex w-full">
            <!-- readonly prefix (auto-filled) -->
            <input
              id="phone-{index}-prefix"
              readonly
              tabindex="-1"
              bind:value={inventor.phonePrefix}
              class="p-3 border rounded-l-md w-20 bg-gray-100 text-gray-700"
            />

            <!-- phone number input (editable) -->
            <input
              id="phone-{index}"
              type="tel"
              bind:value={inventor.phone}
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
          <input placeholder="Email" class="input" bind:value={inventor.email} on:input={updateStore} />
          {#if errors[index]?.email}
            <div class="text-red-500 text-sm mt-1">{errors[index].email}</div>
          {/if}
        </div>

        <div class="col-span-2">
          <label class="block text-sm font-medium mb-1">Address</label>
          <textarea placeholder="Address" class="input h-24" bind:value={inventor.address} on:input={updateStore} />
          {#if errors[index]?.address}
            <div class="text-red-500 text-sm mt-1">{errors[index].address}</div>
          {/if}
        </div>
      </div>

      {#if inventors.length > 1}
        <button
          type="button"
          class="rounded-lg bg-red-100 text-red-600 hover:bg-red-600 hover:text-red-200 px-4 py-1 text-sm font-medium transition shadow-sm border border-red-200 absolute top-2 right-2"
          on:click={() => removeInventor(index)}
        >
          Remove
        </button>
      {/if}
    </div>
  {/each}

  <div class="flex justify-end">
    <button type="button" class="btn-black" on:click={addInventor}>
      + Add Inventor
    </button>
  </div>

  <div class="flex justify-between">
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
    @apply bg-black text-white px-6 py-2 rounded-md hover:opacity-90;
  }
</style>

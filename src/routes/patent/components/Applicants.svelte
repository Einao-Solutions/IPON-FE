<script lang="ts">
  import { patentForm, goToNextStep, goToPreviousStep, countries, countryDialingCodes } from '$lib/utils/patent';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
	import { Phone } from 'lucide-svelte';

  // Applicants local snapshot (keeps two-way flow simple)
  let applicants = get(patentForm).applicantsInfo.length
    ? get(patentForm).applicantsInfo
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

  // UI state per-applicant
  let showCountryDropdowns = applicants.map(() => false);
  let showStateDropdowns = applicants.map(() => false);
  let perApplicantStates: string[][] = applicants.map(() => []); // states list per applicant
  let perApplicantFilteredStates: string[][] = applicants.map(() => []);
  let perApplicantCountrySearch = applicants.map(() => ''); // FIXED: array per applicant
  let perApplicantStateSearch = applicants.map(() => '');

  // shared filtered countries (strings)
  let filteredCountries: string[] = [];

  // validation errors
  let errors = applicants.map(() => ({
    name: '',
    country: '',
    state: '',
    city: '',
    phone: '',
    email: '',
    address: ''
  }));

  let basicCountry = get(patentForm).basicInfo?.country ?? '';
  patentForm.subscribe((form) => {
  basicCountry = form.basicInfo?.country ?? '';
  // Always set the first applicant's country to match
  if (applicants.length > 0) {
    applicants[0].country = basicCountry;
    if (basicCountry) {
      fetchStatesForApplicant(0, basicCountry);
      const dialCode = countryDialingCodes[basicCountry];
      applicants[0].phonePrefix = dialCode ?? '';
    }
  }
  });

  // normalize countries store into name strings (safe)
  function getCountryNames(): string[] {
    const storeVal: any = get(countries);
    const list: any[] = Array.isArray(storeVal)
      ? storeVal
      : Array.isArray(storeVal?.data)
      ? storeVal.data
      : [];
    return list.map((c: any) => (typeof c === 'string' ? c : c.name ?? c.country ?? '')).filter(Boolean);
  }

  // Ensure snapshot on mount
  onMount(() => {
    filteredCountries = getCountryNames();

    if (basicCountry) {
      applicants[0].country = basicCountry;
      fetchStatesForApplicant(0, basicCountry);
      const dialCode = countryDialingCodes[basicCountry];
      applicants[0].phonePrefix = dialCode ?? '';
    }

    // if applicants already have countries, fetch their states
    applicants.forEach((a, i) => {
      if (a.country) fetchStatesForApplicant(i, a.country);
    });
  });

  function updateStore() {
    patentForm.update((form) => {
      form.applicantsInfo = applicants.map((applicant, i) => ({
        ...applicant,
        country: i === 0 ? basicCountry : applicant.country,
        phone: applicant.phone, // store raw phone
        phonePrefix: applicant.phonePrefix // store prefix separately
      }));
      return form;
    });
  }

  // Country search / select
  function onCountryInput(index: number, input: string) {
    perApplicantCountrySearch[index] = input;
    const list = getCountryNames();
    filteredCountries = list.filter((name) => name.toLowerCase().includes(input.toLowerCase()));
  }

  async function fetchStatesForApplicant(index: number, countryName: string) {
    if (!countryName) {
      perApplicantStates[index] = [];
      perApplicantFilteredStates[index] = [];
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
      perApplicantStates[index] = normalized;
      perApplicantFilteredStates[index] = normalized;
    } catch (err) {
      console.error('Failed to fetch states for', countryName, err);
      perApplicantStates[index] = [];
      perApplicantFilteredStates[index] = [];
    }
  }

  async function selectCountry(index: number, countryName: string) {
    applicants[index].country = countryName;
    applicants[index].state = ''; // reset state
    perApplicantStateSearch[index] = '';
    perApplicantStates[index] = [];
    perApplicantFilteredStates[index] = [];
    perApplicantCountrySearch[index] = countryName;

      // <-- ADD THIS: set prefix and reset the typed phone part
    const dialCode = countryDialingCodes[countryName];
    applicants[index].phonePrefix = dialCode ?? '';
    applicants[index].phone = '';

    updateStore();
    await fetchStatesForApplicant(index, countryName);
  }

  // State search / select (per applicant)
  function onStateInput(index: number, input: string) {
    perApplicantStateSearch[index] = input;
    const list = perApplicantStates[index] ?? [];
    perApplicantFilteredStates[index] = list.filter((s) => s.toLowerCase().includes(input.toLowerCase()));
  }

  function selectState(index: number, stateName: string) {
    applicants[index].state = stateName;
    perApplicantStateSearch[index] = stateName;
    updateStore();
  }

  // Add / remove applicants (keep per-applicant arrays in sync)
  function addApplicant() {
    applicants = [
      ...applicants,
      { name: '', country: '', state: '', city: '', phone: '', phonePrefix:'', email: '', address: '' }
    ];
    showCountryDropdowns = [...showCountryDropdowns, false];
    showStateDropdowns = [...showStateDropdowns, false];
    perApplicantStates = [...perApplicantStates, []];
    perApplicantFilteredStates = [...perApplicantFilteredStates, []];
    perApplicantCountrySearch = [...perApplicantCountrySearch, ''];
    perApplicantStateSearch = [...perApplicantStateSearch, ''];
    errors = [...errors, { name: '', country: '', state: '', city: '', phone: '', email: '', address: '' }];
    updateStore();
  }

  function removeApplicant(index: number) {
    if (applicants.length <= 1) return;
    applicants = applicants.filter((_, i) => i !== index);
    showCountryDropdowns = showCountryDropdowns.filter((_, i) => i !== index);
    showStateDropdowns = showStateDropdowns.filter((_, i) => i !== index);
    perApplicantStates = perApplicantStates.filter((_, i) => i !== index);
    perApplicantFilteredStates = perApplicantFilteredStates.filter((_, i) => i !== index);
    perApplicantCountrySearch = perApplicantCountrySearch.filter((_, i) => i !== index);
    perApplicantStateSearch = perApplicantStateSearch.filter((_, i) => i !== index);
    errors = errors.filter((_, i) => i !== index);
    updateStore();
  }

  // Validation + navigation
  function validateApplicants() {
    let isValid = true;
    errors = applicants.map((a) => {
      const e = {
        name: a.name.trim() ? '' : 'Name is required',
        country: a.country ? '' : 'Nationality is required',
        state: a.state.trim() ? '' : 'State is required',
        city: a.city.trim() ? '' : 'City is required',
        phone: /^\+?\d{7,15}$/.test(a.phone.trim()) ? '' : 'Valid phone number is required',
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim()) ? '' : 'Valid email is required',
        address: a.address.trim() ? '' : 'Address is required'
      };
      if (Object.values(e).some((v) => v)) isValid = false;
      return e;
    });
    return isValid;
  }

  function handleNext() {
    if (!validateApplicants()) return;
    updateStore();
    goToNextStep();
  }

  function handleBack() {
    updateStore();
    goToPreviousStep();
  }
</script>

<div class="space-y-6">
  <h2 class="text-2xl font-semibold">Applicant Information</h2>

  {#each applicants as applicant, index}
    <div class="border p-4 rounded-lg space-y-3 relative">
      <h3 class="text-sm font-semibold">Applicant {index + 1}</h3>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Name</label>
          <input placeholder="Name" bind:value={applicant.name} class="input" on:input={updateStore} />
          {#if errors[index]?.name}
            <p class="error">{errors[index].name}</p>
          {/if}
        </div>

        <!-- Nationality -->
        <div class="relative">
          <label class="block text-sm font-medium mb-1">Nationality</label>
          <div class="relative">
            {#if index === 0}
              <!-- First applicant is tied to Patent Info nationality -->
              <input
                type="text"
                class="input bg-gray-100 text-gray-700"
                readonly
                bind:value={basicCountry}
              />
            {:else}
              <!-- Other applicants can choose -->
              <input
                type="text"
                class="input"
                placeholder="Search Nationality..."
                on:focus={() => {
                  showCountryDropdowns[index] = true;
                  if (!perApplicantCountrySearch[index]) filteredCountries = getCountryNames();
                }}
                on:input={(e) => onCountryInput(index, e.target.value)}
                on:blur={() => setTimeout(() => (showCountryDropdowns[index] = false), 200)}
                bind:value={applicant.country}
              />
              <span class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
            {/if}
          </div>

          {#if errors[index]?.country}
            <p class="error">{errors[index].country}</p>
          {/if}

          {#if index !== 0 && showCountryDropdowns[index] && filteredCountries.length}
            <ul class="absolute bg-white border w-full mt-1 max-h-60 overflow-y-auto z-10 rounded-md shadow">
              {#each filteredCountries as c}
                <li
                  class="p-2 hover:bg-gray-100 cursor-pointer"
                  on:mousedown={() => {
                    selectCountry(index, c);
                    perApplicantCountrySearch[index] = c;
                    showCountryDropdowns[index] = false;
                  }}
                >
                  {c}
                </li>
              {/each}
            </ul>
          {/if}
        </div>

        <div class="relative">
          <label class="block text-sm font-medium mb-1">State</label>
          <div class="relative">
            <input
              type="text"
              class="input"
              placeholder="Search state..."
              on:focus={() => {
                showStateDropdowns[index] = true;
                if (!perApplicantStateSearch[index]) perApplicantFilteredStates[index] = perApplicantStates[index] ?? [];
              }}
              on:input={(e) => onStateInput(index, e.target.value)}
              on:blur={() => setTimeout(() => (showStateDropdowns[index] = false), 200)}
              bind:value={applicant.state}
            />
            <span class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
          </div>

          {#if showStateDropdowns[index] && perApplicantFilteredStates[index]?.length}
            <ul class="absolute bg-white border w-full mt-1 max-h-60 overflow-y-auto z-10 rounded-md shadow">
              {#each perApplicantFilteredStates[index] as s}
                <li
                  class="p-2 hover:bg-gray-100 cursor-pointer"
                  on:mousedown={() => {
                    perApplicantStateSearch[index] = s;
                    applicant.state = s;
                    selectState(index, s);
                    showStateDropdowns[index] = false;
                  }}
                >
                  {s}
                </li>
              {/each}
            </ul>
          {/if}
          {#if errors[index]?.state} <p class="error">{errors[index].state} </p> {/if}
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">City</label>
          <input placeholder="City" bind:value={applicant.city} class="input" on:input={updateStore} />
          {#if errors[index]?.city} <p class="error">{errors[index].city}</p> {/if}
        </div>

        <!-- Phone -->
        <div class="form-group">
          <label class="block text-sm font-medium mb-1" for="phone-{index}">Phone</label>
          <div class="flex w-full">
            <input id="phone-{index}-prefix" readonly tabindex="-1" bind:value={applicant.phonePrefix} class="p-3 border rounded-l-md w-20 bg-gray-100 text-gray-700"/>
            <input id="phone-{index}" type="tel" bind:value={applicant.phone} on:input={updateStore} placeholder="Enter phone number" class="input rounded-l-none"/>
          </div>
          {#if errors[index]?.phone} <p class="error">{errors[index].phone}</p> {/if}
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input placeholder="Email" bind:value={applicant.email} class="input" on:input={updateStore}/>
          {#if errors[index]?.email} <p class="error">{errors[index].email}</p> {/if}
        </div>

        <div class="col-span-2">
          <label class="block text-sm font-medium mb-1">Address</label>
          <textarea placeholder="Address" bind:value={applicant.address} class="input h-24" on:input={updateStore}/>
          {#if errors[index]?.address} <p class="error">{errors[index].address} </p>{/if}
        </div>
      </div>

      {#if applicants.length > 1}
        <button type="button" on:click={() => removeApplicant(index)} class="rounded-lg bg-red-100 text-red-600 hover:bg-red-600 hover:text-red-200 px-4 py-1 text-sm font-medium transition shadow-sm border border-red-200 absolute top-2 right-2">Remove</button>
      {/if}
    </div>
  {/each}

  <div class="flex justify-end">
    <button type="button" class="btn-black" on:click={addApplicant}> + Add Applicant</button>
  </div>
  <div class="flex justify-between">
    <button type="button" class="btn-black" on:click={handleBack}>Back</button>
    <button type="button" class="px-4 py-2 bg-green-600 text-white rounded-lg" on:click={handleNext}>Next</button>
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

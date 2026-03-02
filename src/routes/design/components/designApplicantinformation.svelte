<script lang="ts">
  import { applicantDesignDescription } from '$lib/helpers';
  import { designForm, currentStep } from '$lib/utils/design';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { countriesMap } from '$lib/constants';
  import { countryDialingCodes } from '$lib/utils/patent';

  type Applicant = {
    name: string;
    country: string; // nationality
    state: string;
    city: string;
    phone: string; // raw phone (without prefix)
    phonePrefix: string;
    email: string;
    address: string;
  };

  // Initialize from designForm, mapping nationality -> country
  const initialDesignApplicants = (get(designForm).applicants as any[]) ?? [];

  let applicants: Applicant[] = initialDesignApplicants.length
    ? initialDesignApplicants.map((a) => {
        const country = a.nationality ?? '';
        const combinedPhone: string = a.phone ?? '';
        const detectedPrefix = country ? countryDialingCodes[country] ?? '' : '';

        let phonePrefix = detectedPrefix;
        let phone = combinedPhone;

        // If stored phone already includes the country prefix (e.g. +234...),
        // strip it out so only the local part appears in the phone input.
        if (detectedPrefix && combinedPhone.startsWith(detectedPrefix)) {
          phone = combinedPhone.slice(detectedPrefix.length);
        }

        return {
          name: a.name ?? '',
          country,
          state: a.state ?? '',
          city: a.city ?? '',
          phone,
          phonePrefix,
          email: a.email ?? '',
          address: a.address ?? ''
        } as Applicant;
      })
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

  // UI state per applicant (same pattern as patent Applicants)
  let showCountryDropdowns = applicants.map(() => false);
  let showStateDropdowns = applicants.map(() => false);
  let perApplicantStates: string[][] = applicants.map(() => []);
  let perApplicantFilteredStates: string[][] = applicants.map(() => []);
  let perApplicantCountrySearch = applicants.map(() => '');
  let perApplicantStateSearch = applicants.map(() => '');

  // shared filtered countries
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

  // normalize countries into name strings using countriesMap
  function getCountryNames(): string[] {
    const map = countriesMap as Record<string, string>;
    return Object.values(map);
  }

  // Ensure snapshot on mount
  onMount(() => {
    filteredCountries = getCountryNames();

    // Default first applicant nationality based on Design Information's file origin
    const snapshot: any = get(designForm);
    const origin = snapshot?.designInformation?.fileOrigin;

    if (origin === 'Local' && applicants[0]) {
      if (!applicants[0].country) {
        applicants[0].country = 'Nigeria';
      }
    }

    // if applicants already have countries, set prefixes and fetch their states
    applicants.forEach((a, i) => {
      if (a.country) {
        const dial = countryDialingCodes[a.country];
        applicants[i].phonePrefix = dial ?? '';

        // If stored phone includes the prefix (e.g. +234...), strip it so the input is blank/local
        if (dial && applicants[i].phone && applicants[i].phone.startsWith(dial)) {
          applicants[i].phone = applicants[i].phone.slice(dial.length);
        }

        fetchStatesForApplicant(i, a.country);
      }
    });

    updateStore();
  });

  function updateStore() {
    designForm.update((form: any) => {
      form.applicants = applicants.map((a) => ({
        name: a.name,
        email: a.email,
        // store combined phone (prefix + number) for design payload
        phone: `${a.phonePrefix}${a.phone}`.trim(),
        nationality: a.country,
        state: a.state,
        address: a.address,
        city: a.city
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

  // Helpers to safely read input values from DOM events (no TS syntax in markup)
  function handleCountryInputEvent(index: number, event: Event) {
    const target = event.target as HTMLInputElement | null;
    const value = target?.value ?? '';
    onCountryInput(index, value);
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
      const normalized = stateArr
        .map((s: any) => (typeof s === 'string' ? s : s.name ?? s.state ?? ''))
        .filter(Boolean);
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
    applicants[index].state = '';
    perApplicantStateSearch[index] = '';
    perApplicantStates[index] = [];
    perApplicantFilteredStates[index] = [];
    perApplicantCountrySearch[index] = countryName;

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
    perApplicantFilteredStates[index] = list.filter((s) =>
      s.toLowerCase().includes(input.toLowerCase())
    );
  }

  function handleStateInputEvent(index: number, event: Event) {
    const target = event.target as HTMLInputElement | null;
    const value = target?.value ?? '';
    onStateInput(index, value);
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
    showCountryDropdowns = [...showCountryDropdowns, false];
    showStateDropdowns = [...showStateDropdowns, false];
    perApplicantStates = [...perApplicantStates, []];
    perApplicantFilteredStates = [...perApplicantFilteredStates, []];
    perApplicantCountrySearch = [...perApplicantCountrySearch, ''];
    perApplicantStateSearch = [...perApplicantStateSearch, ''];
    errors = [
      ...errors,
      { name: '', country: '', state: '', city: '', phone: '', email: '', address: '' }
    ];
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

  // Validation + navigation (mirrors patent Applicants)
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
    // Run validation and only move to the next step if all applicants are valid
    const isValid = validateApplicants();
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

<div class="max-w-4xl mx-auto">
  <div class="rounded-lg shadow bg-white p-6 mb-6">
    <h2 class="text-2xl font-bold mb-6 text-green-700">
      Applicant Information
      <span class="ml-2 text-base font-normal text-gray-600">
        ({applicantDesignDescription})
      </span>
    </h2>

    <div class="space-y-6">
      {#each applicants as applicant, index}
        <div class="border p-4 rounded-lg space-y-3 relative">
          <h3 class="text-sm font-semibold">Applicant {index + 1}</h3>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Name</label>
              <input
                placeholder="Name"
                bind:value={applicant.name}
                class="input"
                on:input={updateStore}
              />
              {#if errors[index]?.name}
                <p class="error">{errors[index].name}</p>
              {/if}
            </div>

            <!-- Nationality -->
            <div class="relative">
              <label class="block text-sm font-medium mb-1">Nationality</label>
              <div class="relative">
                <input
                  type="text"
                  class="input"
                  placeholder="Search Nationality..."
                  on:focus={() => {
                    showCountryDropdowns[index] = true;
                    if (!perApplicantCountrySearch[index]) filteredCountries = getCountryNames();
                  }}
                  on:input={(event) => handleCountryInputEvent(index, event)}
                  on:blur={() => setTimeout(() => (showCountryDropdowns[index] = false), 200)}
                  bind:value={applicant.country}
                />
                <span
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  >▼</span
                >
              </div>

              {#if errors[index]?.country}
                <p class="error">{errors[index].country}</p>
              {/if}

              {#if showCountryDropdowns[index] && filteredCountries.length}
                <ul
                  class="absolute bg-white border w-full mt-1 max-h-60 overflow-y-auto z-10 rounded-md shadow"
                >
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
                    if (!perApplicantStateSearch[index])
                      perApplicantFilteredStates[index] = perApplicantStates[index] ?? [];
                  }}
                  on:input={(event) => handleStateInputEvent(index, event)}
                  on:blur={() => setTimeout(() => (showStateDropdowns[index] = false), 200)}
                  bind:value={applicant.state}
                />
                <span
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  >▼</span
                >
              </div>

              {#if showStateDropdowns[index] && perApplicantFilteredStates[index]?.length}
                <ul
                  class="absolute bg-white border w-full mt-1 max-h-60 overflow-y-auto z-10 rounded-md shadow"
                >
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
              {#if errors[index]?.state}
                <p class="error">{errors[index].state}</p>
              {/if}
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">City</label>
              <input
                placeholder="City"
                bind:value={applicant.city}
                class="input"
                on:input={updateStore}
              />
              {#if errors[index]?.city}
                <p class="error">{errors[index].city}</p>
              {/if}
            </div>

            <!-- Phone -->
            <div class="form-group">
              <label class="block text-sm font-medium mb-1" for={`phone-${index}`}>
                Phone
              </label>
              <div class="flex w-full">
                <input
                  id={`phone-${index}-prefix`}
                  readonly
                  tabindex="-1"
                  bind:value={applicant.phonePrefix}
                  class="p-3 border rounded-l-md w-20 bg-gray-100 text-gray-700"
                />
                <input
                  id={`phone-${index}`}
                  type="tel"
                  bind:value={applicant.phone}
                  on:input={updateStore}
                  placeholder="Enter phone number"
                  class="input rounded-l-none"
                />
              </div>
              {#if errors[index]?.phone}
                <p class="error">{errors[index].phone}</p>
              {/if}
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Email</label>
              <input
                placeholder="Email"
                bind:value={applicant.email}
                class="input"
                on:input={updateStore}
              />
              {#if errors[index]?.email}
                <p class="error">{errors[index].email}</p>
              {/if}
            </div>

            <div class="col-span-2">
              <label class="block text-sm font-medium mb-1">Address</label>
              <textarea
                placeholder="Address"
                bind:value={applicant.address}
                class="input h-24"
                on:input={updateStore}
              />
              {#if errors[index]?.address}
                <p class="error">{errors[index].address}</p>
              {/if}
            </div>
          </div>

          {#if applicants.length > 1}
            <button
              type="button"
              on:click={() => removeApplicant(index)}
              class="rounded-lg bg-red-100 text-red-600 hover:bg-red-600 hover:text-red-200 px-4 py-1 text-sm font-medium transition shadow-sm border border-red-200 absolute top-2 right-2"
            >
              Remove
            </button>
          {/if}
        </div>
      {/each}

      <div class="flex justify-end">
        <button type="button" class="btn-black" on:click={addApplicant}>
          + Add Applicant
        </button>
      </div>
      <div class="flex justify-between">
        <button type="button" class="btn-black" on:click={handleBack}>Back</button>
        <button
          type="button"
          class="px-4 py-2 bg-green-600 text-white rounded-lg"
          on:click={handleNext}
        >
          Next
        </button>
      </div>
    </div>
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

<script lang="ts">
  import { countriesMap } from '$lib/constants';
  import { patentForm, goToNextStep, countryDialingCodes } from '$lib/utils/patent';
  import { get } from 'svelte/store';
  import { nonConventionalDescription, conventionalDescription, pctDescription } from '$lib/helpers';

  const form = patentForm;
  const filingOriginOptions = ['Local', 'Foreign'];
  const conventionOptions =
  {
    Local: ['Non-Conventional'],
    Foreign: ['Conventional', 'PCT', 'Non-Conventional']
  };
  const applicationTypes = ['Patent', 'Utility Model', 'Business Method'];

  $: filingOrigin = $form.basicInfo.filingOrigin;
  $: isForeign = filingOrigin === 'Foreign';
  $: country = $form.basicInfo.country;
  $: conventionTypeOptions = conventionOptions[filingOrigin];

  let errors = {
    filingOrigin: '',
    country: '',
    conventionType: '',
    applicationType: '',
    title: '',
    abstract: ''
  };

  let touched = {
    country: false,
    conventionType: false,
    applicationType: false,
    title: false,
    abstract: false
  };

  let hoveredIndex: number | null = null;
  let showCountryDropdown = false;
  let countrySearch = '';

  function getLocalCountries() {
    return Object.keys(countryDialingCodes)
      .map(c => c.trim())
      .filter(c => c.toLowerCase() !== 'nigeria');
  }

  // start with filtered list (Nigeria removed locally)
  let filteredCountries = getLocalCountries();

  function onCountryInput(e) {
    countrySearch = e.target.value;
    const q = countrySearch.trim().toLowerCase();

    // filter from local list (Nigeria already removed)
    filteredCountries = getLocalCountries().filter(c =>
      c.toLowerCase().includes(q)
    );

    updateField('country', e.target.value);
  }

    function validateCountry() {
    const isValid = getLocalCountries().some(
      c => c.toLowerCase() === $form.basicInfo.country?.trim().toLowerCase()
    );
    if (!isValid) {
      updateField('country', '');
      countrySearch = '';
    }
  }

  function getDescription(option: string): string {
    if (option === 'Conventional') return conventionalDescription;
    if (option === 'Non-Conventional') return nonConventionalDescription;
    if (option === 'PCT') return pctDescription;
    return '';
  }

  function updateField(field: string, value: string) {
    form.update((data) => {
      data.basicInfo[field] = value;
      if (field === 'filingOrigin') {
        data.basicInfo.conventionType = 'Local' === value ? 'Non-Conventional' : '';
        data.basicInfo.country = value === 'Local' ? 'Nigeria' : '';
      }
      return data;
    });
    errors[field] = '';
  }

  function validateFields() {
    const data = get(form).basicInfo;
    let valid = true;

    errors = {
      filingOrigin: '',
      country: '',
      conventionType: '',
      applicationType: '',
      title: '',
      abstract: ''
    };

    if (!data.filingOrigin) {
      errors.filingOrigin = 'Filing origin is required';
      valid = false;
    }

    if (isForeign && !data.country) {
      errors.country = 'Country is required for foreign applications';
      valid = false;
    }

    if (!data.conventionType) {
      errors.conventionType = 'Please select a patent type';
      valid = false;
    }

    if (!data.applicationType) {
      errors.applicationType = 'Please select an application type';
      valid = false;
    }

    if (!data.title?.trim()) {
      errors.title = 'Title is required';
      valid = false;
    }

    if (!data.abstract?.trim()) {
      errors.abstract = 'Abstract is required';
      valid = false;
    }

    return valid;
  }

  function handleNext() {
    const isValid = validateFields();
    Object.keys(touched).forEach((key) => (touched[key] = true));

    if (!isValid) return;

    const data = get(form).basicInfo;

    goToNextStep();
  }

</script>

<div class="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-md space-y-6">
  <h2 class="text-2xl font-semibold text-gray-800">Patent Information</h2>
  <!-- Filing Origin -->
<div>
  <label class="block font-medium mb-2">Filing Origin</label>
  <div class="flex space-x-4">
    {#each filingOriginOptions as option}
      <button
        type="button"
        class="px-4 py-2 rounded-md border text-sm font-medium 
          transition-colors duration-200
          {option === $form.basicInfo.filingOrigin 
            ? 'bg-black text-white' 
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}"
        on:click={() => updateField('filingOrigin', option)}
      >
        {option}
      </button>
    {/each}
  </div>
</div>

<div class="max-w-md relative">
  <label class="block font-medium mb-1">Nationality</label>
  <div class="relative">
    <input
      type="text"
      class="input w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2
        {touched.country && !$form.basicInfo.country && isForeign
          ? 'border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:ring-black'}"
      placeholder="Search Nationality..."
      disabled={!isForeign}
      bind:value={$form.basicInfo.country}
      on:focus={() => {
        showCountryDropdown = true;
        if (!countrySearch) filteredCountries = getLocalCountries();
      }}
      on:input={onCountryInput}
      on:blur={() => {
        setTimeout(() => (showCountryDropdown = false), 200);
        validateCountry();
      }}
    />
    {#if isForeign}
      <span class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
    {/if}
  </div>

  {#if touched.country && !$form.basicInfo.country && isForeign}
    <p class="text-red-500 text-sm mt-1">Country is required for foreign filings.</p>
  {/if}

  {#if showCountryDropdown}
    <ul class="absolute bg-white border w-full mt-1 max-h-60 overflow-y-auto z-10 rounded-md shadow">
      {#if filteredCountries.length}
        {#each filteredCountries as c}
          <li
            class="p-2 hover:bg-gray-100 cursor-pointer"
            on:mousedown={() => {
              updateField('country', c);
              countrySearch = c;
              showCountryDropdown = false;
            }}
          >
            {c}
          </li>
        {/each}
      {:else}
        <li class="p-2 text-sm text-gray-500">No results</li>
      {/if}
    </ul>
  {/if}
</div>

  <!-- Patent Type (Custom Dropdown) -->
  <div>
    <label class="block font-medium mb-2">Patent Type</label>
    <div class="border rounded-lg divide-y">
      {#each conventionTypeOptions as option, index}
        <div
          class="px-4 py-2 hover:bg-white cursor-pointer transition relative bg-white"
          on:mouseenter={() => hoveredIndex = index}
          on:mouseleave={() => hoveredIndex = null}
          on:click={() => updateField('conventionType', option)}
        >
          <div class="flex justify-between items-center">
            <span>{option}</span>
            {#if $form.basicInfo.conventionType === option}
              <span class="text-green-600 text-2xl">✓</span>
            {/if}
          </div>
          {#if hoveredIndex === index}
            <div class="bg-gray-100 mt-2 rounded p-2">
              <div class="text-xs text-black ">Description:</div>
              <div class="text-sm text-gray-700">{getDescription(option)}</div>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    {#if touched.conventionType && !$form.basicInfo.conventionType && isForeign}
      <p class="text-red-500 text-sm mt-1">
        patent type is required for foreign filings.
      </p>
    {/if}
  </div>

<!-- Application Type -->
<div>
  <label class="block font-medium mb-2">Application Type</label>
  <select
    class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2
      {touched.applicationType && !$form.basicInfo.applicationType 
        ? 'border-red-500 focus:ring-red-500' 
        : 'border-gray-300 focus:ring-black'}"
    bind:value={$form.basicInfo.applicationType}
    on:change={(e) => updateField('applicationType', e.target.value)}
    on:blur={() => (touched.applicationType = true)}
  >
    <option value="" disabled selected>Select application type</option>
    {#each applicationTypes as type}
      <option value={type}>{type}</option>
    {/each}
  </select>
  {#if touched.applicationType && !$form.basicInfo.applicationType}
    <p class="text-red-500 text-sm mt-1">Application type is required.</p>
  {/if}
</div>

<!-- Title -->
<div>
  <label class="block font-medium mb-2">Title of Invention</label>
  <input
    type="text"
    class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2
      {touched.title && !$form.basicInfo.title 
        ? 'border-red-500 focus:ring-red-500' 
        : 'border-gray-300 focus:ring-black'}"
    bind:value={$form.basicInfo.title}
    on:input={(e) => updateField('title', e.target.value)}
    on:blur={() => (touched.title = true)}
    placeholder="e.g. Improved Solar Cell"
  />
  {#if touched.title && !$form.basicInfo.title}
    <p class="text-red-500 text-sm mt-1">Title is required.</p>
  {/if}
</div>

<!-- Abstract -->
<div>
  <label class="block font-medium mb-2">Patent Abstract</label>
  <textarea
    rows="4"
    class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2
      {touched.abstract && !$form.basicInfo.abstract 
        ? 'border-red-500 focus:ring-red-500' 
        : 'border-gray-300 focus:ring-black'}"
    bind:value={$form.basicInfo.abstract}
    on:input={(e) => {
      let words = e.target.value.trim().split(/\s+/);
      if (words.length > 500) {
        words = words.slice(0, 500);
        e.target.value = words.join(" ");
      }
      updateField('abstract', e.target.value);
    }}
    on:blur={() => (touched.abstract = true)}
    placeholder="A brief summary of your invention..."
  />

    <!-- Word count -->
  <p class="text-sm mt-1 text-gray-500">
    {($form.basicInfo.abstract?.trim().split(/\s+/).filter(Boolean).length) || 0} / 500 words
  </p>

  {#if touched.abstract && !$form.basicInfo.abstract}
    <p class="text-red-500 text-sm mt-1">Abstract is required.</p>
  {/if}
</div>

<!-- Next Button -->
<div class="pt-4">
  <button
    type="button"
    on:click={handleNext}
    class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition justify-end w-full md:w-auto"
  >
    Next
  </button>
</div>
</div>

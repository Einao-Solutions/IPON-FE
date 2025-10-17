<script lang="ts">
  import { patentForm, goToNextStep, goToPreviousStep, countries } from '$lib/utils/patent';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';

  let localPriorityInfo = get(patentForm).priorityInfo.length
    ? [...get(patentForm).priorityInfo]
    : [
        {
          number: '',
          Country: '',
          Date: ''
        }
      ];

  let errors = localPriorityInfo.map(() => ({
    number: '',
    Country: '',
    Date: ''
  }));

  // per-entry arrays (start empty so dropdowns don't show on load)
  let perPriorityFilteredCountries: string[][] = localPriorityInfo.map(() => []);
  let perPriorityCountrySearch: string[] = localPriorityInfo.map(() => '');
  let showPriorityCountryDropdowns: boolean[] = localPriorityInfo.map(() => false);

  // helper: safe country names extractor
  function getCountryNames(): string[] {
    const storeVal: any = get(countries);
    const list: any[] = Array.isArray(storeVal) ? storeVal : Array.isArray(storeVal?.data) ? storeVal.data : [];
    return list.map((c: any) => (typeof c === 'string' ? c : c.name ?? c.country ?? '')).filter(Boolean);
  }

  onMount(() => {
    // intentionally do NOT prefill perPriorityFilteredCountries so dropdowns stay hidden until focus/typing
  });

  function updateStore() {
    patentForm.update(form => {
      form.priorityInfo = [...localPriorityInfo];
      return form;
    });
  }

  // function validate() {
  //   let valid = true;
  //   errors = localPriorityInfo.map(entry => {
  //     const entryErrors = {
  //       number: entry.number ? '' : 'Application Number is required.',
  //       Country: entry.Country ? '' : 'Country is required.',
  //       Date: entry.Date ? '' : 'Date is required.'
  //     };
  //     if (entryErrors.number || entryErrors.Country || entryErrors.Date) valid = false;
  //     return entryErrors;
  //   });
  //   return valid;
  // }

  function handleNext() {
   // if (!validate()) return;
    updateStore();
    goToNextStep();
  }

  function handleBack() {
    updateStore();
    goToPreviousStep();
  }

  function addPriorityInfo() {
    localPriorityInfo = [
      ...localPriorityInfo,
      {
        number: '',
        Country: '',
        Date: ''
      }
    ];
    errors.push({ number: '', Country: '', Date: '' });
    perPriorityFilteredCountries = [...perPriorityFilteredCountries, []];
    perPriorityCountrySearch = [...perPriorityCountrySearch, ''];
    showPriorityCountryDropdowns = [...showPriorityCountryDropdowns, false];
    updateStore();
  }

  function removePriorityInfo(index: number) {
    if (localPriorityInfo.length > 1) {
      localPriorityInfo = localPriorityInfo.filter((_, i) => i !== index);
      errors = errors.filter((_, i) => i !== index);
      perPriorityFilteredCountries = perPriorityFilteredCountries.filter((_, i) => i !== index);
      perPriorityCountrySearch = perPriorityCountrySearch.filter((_, i) => i !== index);
      showPriorityCountryDropdowns = showPriorityCountryDropdowns.filter((_, i) => i !== index);
      updateStore();
    }
  }

  // When user types in the country input for row `index`
  function onCountryInput(index: number, input: string) {
    perPriorityCountrySearch[index] = input;
    const list = getCountryNames();
    perPriorityFilteredCountries[index] = list.filter(n => n.toLowerCase().includes(input.toLowerCase()));
    // ensure only this row's dropdown is shown
    showPriorityCountryDropdowns = showPriorityCountryDropdowns.map((_, i) => i === index);
  }

  // When input is focused for row `index`
  function onCountryFocus(index: number) {
    // populate this row's filtered list with all countries if search is empty
    if (!perPriorityCountrySearch[index]) perPriorityFilteredCountries[index] = getCountryNames();
    // ensure only this row's dropdown is shown
    showPriorityCountryDropdowns = showPriorityCountryDropdowns.map((_, i) => i === index);
  }

  // When a country is selected from the list for row `index`
  function selectCountryForEntry(index: number, countryName: string) {
    localPriorityInfo[index].Country = countryName;
    perPriorityCountrySearch[index] = countryName;
    // hide only this row's suggestions
    perPriorityFilteredCountries[index] = [];
    showPriorityCountryDropdowns[index] = false;
    updateStore();
  }
</script>

<div class="space-y-6">
  <h2 class="text-2xl font-semibold">Additional Priority Information</h2>

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
            bind:value={localPriorityInfo[index].number}
            on:input={() => updateStore()}
          />
          <!-- {#if errors[index].number}
            <div class="error">{errors[index].number}</div>
          {/if} -->
        </div>

        <div>
          <label class="block text-sm mb-2 font-medium">Country</label>

          <!-- wrapper is relative so dropdown stays under this input -->
          <div class="relative">
            <input
              type="text"
              class="input"
              placeholder="Search Country..."
              bind:value={localPriorityInfo[index].Country}
              on:focus={() => onCountryFocus(index)}
              on:input={(e) => onCountryInput(index, e.target.value)}
              on:blur={() => setTimeout(() => { perPriorityFilteredCountries[index] = []; showPriorityCountryDropdowns[index] = false; }, 200)}
            />
            <span class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>

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

          <!-- {#if errors[index].Country}
            <div class="error">{errors[index].Country}</div>
          {/if} -->
        </div>
      </div>

      <!-- Date -->
      <div>
        <label class="block mb-2 text-sm font-medium">Date</label>
        <input
          type="date"
          class="input"
          bind:value={localPriorityInfo[index].Date}
          on:input={() => updateStore()}
        />
        <!-- {#if errors[index]?.Date}
          <div class="error">{errors[index].Date}</div>
        {/if} -->
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

  <button class="btn-black" on:click={addPriorityInfo}>+ Add Priority Info</button>

  <div class="flex justify-between pt-6">
    <button class="btn-black" on:click={handleBack}>Back</button>
    <button class="px-4 py-2 bg-green-600 text-white rounded-lg" on:click={handleNext}>Next</button>
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

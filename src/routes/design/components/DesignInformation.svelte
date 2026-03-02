
<script lang="ts">
import { designForm, currentStep } from '$lib/utils/design';
import { get } from 'svelte/store';

let form = get(designForm);

function updateField(field: string, value: string) {
  form.designInformation[field] = value;
  designForm.update(f => ({ ...f, designInformation: { ...f.designInformation, [field]: value } }));
}

function handleFileOriginChange(value: string) {
  // Update the design information as before
  updateField('fileOrigin', value);

  // Also default the first applicant's nationality based on origin
  designForm.update((f: any) => {
    if (!Array.isArray(f.applicants) || f.applicants.length === 0) {
      f.applicants = [
        {
          name: '',
          email: '',
          phone: '',
          nationality: '',
          state: '',
          address: ''
        }
      ];
    }

    if (value === 'Local') {
      f.applicants[0].nationality = 'Nigeria';
    } else if (value === 'Foreign') {
      // Clear so user can choose any nationality
      f.applicants[0].nationality = '';
    }

    return f;
  });
}
</script>

<div class="max-w-3xl mx-auto">
  <div class="rounded-lg shadow bg-white p-6 mb-6">
    <h2 class="text-2xl font-bold mb-6 text-green-700">Design Information</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block mb-1 font-medium"> File Origin</label>
        <select
          class="w-full border rounded px-3 py-2"
          bind:value={form.designInformation.fileOrigin}
          on:change={e => handleFileOriginChange(e.target.value)}
        >
          <option value="">Select Origin</option>
          <option value="Local">Local</option>
          <option value="Foreign">Foreign</option>
        </select>
      </div>
      <div>
        <label class="block mb-1 font-medium"> Application Type</label>
        <select class="w-full border rounded px-3 py-2" bind:value={form.designInformation.applicationType} on:change={e => updateField('applicationType', e.target.value)}>
          <option value="">Select Type</option>
          <option value="Textile">Textile</option>
          <option value="Non-Textile">Non-Textile</option>
        </select>
        {#if form.designInformation.applicationType === 'Non-Textile'}
          <div class="mt-4">
            <label class="block mb-1 font-medium"> Representation Type</label>
            <select class="w-full border rounded px-3 py-2" bind:value={form.designInformation.nonTextileType} on:change={e => updateField('nonTextileType', e.target.value)}>
              <option value="">Select Representation Type</option>
              <option value="Label">Label</option>
              <option value="Container">Container</option>
              <option value="Others">Others</option>
              <option value="Sachets">Sachets</option>
            </select>
          </div>
        {/if}
      </div>
      <div class="md:col-span-2">
        <label class="block mb-1 font-medium"> Title of Industrial Design</label>
        <input class="w-full border rounded px-3 py-2" type="text" bind:value={form.designInformation.title} on:input={e => updateField('title', e.target.value)} placeholder="Enter title" />
      </div>
      <div class="md:col-span-2">
        <label class="block mb-1 font-medium"> Statement of Novelty</label>
        <textarea class="w-full border rounded px-3 py-2 min-h-[80px]" bind:value={form.designInformation.statementOfNovelty} on:input={e => updateField('statementOfNovelty', e.target.value)} placeholder="Enter statement of novelty"></textarea>
      </div>
    </div>
    <div class="flex justify-between mt-8">
      <button
        class="bg-black hover:bg-gray-400 text-white font-semibold px-6 py-2 rounded shadow"
        on:click={() => $currentStep--}
      >
        Back
      </button>
      <button
        class="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded shadow"
        on:click={() => $currentStep++}
      >
        Next
      </button>
    </div>
  </div>
</div>

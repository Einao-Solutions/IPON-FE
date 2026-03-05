
<script lang="ts">
  import { designForm, currentStep } from '$lib/utils/design';
  import { get } from 'svelte/store';

  let form = get(designForm);

  // Simple validation error state for this step
  let errors = {
    fileOrigin: '',
    applicationType: '',
    nonTextileType: '',
    title: '',
    statementOfNovelty: ''
  };

  function countWords(text: string): number {
    if (!text) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }

  function updateField(field: string, value: string) {
    form.designInformation[field] = value;
    designForm.update((f) => ({
      ...f,
      designInformation: { ...f.designInformation, [field]: value }
    }));
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

  function validateDesignInformation() {
    const newErrors = {
      fileOrigin: '',
      applicationType: '',
      nonTextileType: '',
      title: '',
      statementOfNovelty: ''
    };

    if (!form.designInformation.fileOrigin) {
      newErrors.fileOrigin = 'File origin is required';
    }

    if (!form.designInformation.applicationType) {
      newErrors.applicationType = 'Application type is required';
    }

    if (
      form.designInformation.applicationType === 'Non-Textile' &&
      !form.designInformation.nonTextileType
    ) {
      newErrors.nonTextileType = 'Representation type is required';
    }

    if (!form.designInformation.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!form.designInformation.statementOfNovelty?.trim()) {
      newErrors.statementOfNovelty = 'Statement of novelty is required';
    } else {
      const words = countWords(form.designInformation.statementOfNovelty);
      if (words > 250) {
        newErrors.statementOfNovelty = 'Statement of novelty must not exceed 250 words';
      }
    }

    errors = newErrors;
    return Object.values(newErrors).every((v) => !v);
  }

  function handleNext() {
    if (!validateDesignInformation()) {
      return;
    }
    currentStep.update((n) => n + 1);
  }
</script>

<div class="max-w-3xl mx-auto">
  <h2 class="text-2xl font-semibold mb-6">Design Information</h2>
  <div class="rounded-lg shadow bg-white p-6 mb-6">
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
        {#if errors.fileOrigin}
          <p class="text-red-600 text-sm mt-1">{errors.fileOrigin}</p>
        {/if}
      </div>
      <div>
        <label class="block mb-1 font-medium"> Application Type</label>
        <select class="w-full border rounded px-3 py-2" bind:value={form.designInformation.applicationType} on:change={e => updateField('applicationType', e.target.value)}>
          <option value="">Select Type</option>
          <option value="Textile">Textile</option>
          <option value="Non-Textile">Non-Textile</option>
        </select>
        {#if errors.applicationType}
          <p class="text-red-600 text-sm mt-1">{errors.applicationType}</p>
        {/if}
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
            {#if errors.nonTextileType}
              <p class="text-red-600 text-sm mt-1">{errors.nonTextileType}</p>
            {/if}
          </div>
        {/if}
      </div>
      <div class="md:col-span-2">
        <label class="block mb-1 font-medium"> Title of Industrial Design</label>
        <input class="w-full border rounded px-3 py-2" type="text" bind:value={form.designInformation.title} on:input={e => updateField('title', e.target.value)} placeholder="Enter title" />
        {#if errors.title}
          <p class="text-red-600 text-sm mt-1">{errors.title}</p>
        {/if}
      </div>
      <div class="md:col-span-2">
        <label class="block mb-1 font-medium"> Statement of Novelty</label>
        <p class="text-gray-500 text-xs mb-1">Must not exceed 250 words.</p>
        <textarea class="w-full border rounded px-3 py-2 min-h-[80px]" bind:value={form.designInformation.statementOfNovelty} on:input={e => updateField('statementOfNovelty', e.target.value)} placeholder="Enter statement of novelty"></textarea>
        {#if errors.statementOfNovelty}
          <p class="text-red-600 text-sm mt-1">{errors.statementOfNovelty}</p>
        {/if}
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
        on:click={handleNext}
      >
        Next
      </button>
    </div>
  </div>
</div>

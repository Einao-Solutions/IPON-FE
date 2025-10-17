<script lang="ts">
  import { patentForm, goToNextStep, goToPreviousStep } from '$lib/utils/patent';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';

  // Field configuration (requirements + file types)
  const fieldConfig: Record<
    string,
    { label: string; required: boolean; accept: string | null }
  > = {
    poa: {
      label: 'Power of Attorney (POA) (.pdf)',
      required: true,
      accept: '.pdf'
    },
    cs: {
      label: 'Claims and Specifications (CS) (.pdf)',
      required: true,
      accept: '.pdf'
    },
    drawings: {
      label: 'Patent Drawing (.pdf, .jpeg, .jpg, .png)',
      required: false,
      accept: '.pdf,.jpeg,.jpg,.png'
    },
    others: {
      label: 'Other Supporting Documents (All file types)',
      required: false,
      accept: null // all file types allowed
    },
    priorityDocument: {
      label: 'Priority Documents (.pdf)',
      required: true,
      accept: '.pdf'
    },
    pct: {
      label: 'PCT Documents (.pdf)',
      required: true,
      accept: '.pdf'
    }
  };

  let attachments: Record<string, File[]> = {
    poa: [],
    cs: [],
    drawings: [],
    others: [],
    priorityDocument: [],
    pct: []
  };

  let errors: Record<string, string | null> = {};
  let showPctField = false;
  let renderedKeys: string[] = [];

  onMount(() => {
    const form = get(patentForm);
    attachments = { ...attachments, ...form.attachments };

    showPctField =
      form.basicInfo?.filingOrigin === 'Foreign' &&
      form.basicInfo?.conventionType === 'PCT';

    // renderedKeys = showPctField
    //   ? Object.keys(fieldConfig)
    //   : Object.keys(fieldConfig).filter((k) => k !== 'pct');
      renderedKeys = Object.keys(fieldConfig).filter((k) => {
        if (k === 'pct') {
          return showPctField;
        }
        if (k === 'priorityDocument') {
          return (
            form.basicInfo?.conventionType === 'PCT' ||
            form.basicInfo?.conventionType === 'Conventional'
          );
        }
        return true;
      });
  });

  // $: {
  //   const basic = get(patentForm).basicInfo;
  //   const nowPct =
  //     basic?.filingOrigin === 'Foreign' && basic?.conventionType === 'PCT';
  //   if (nowPct !== showPctField) {
  //     showPctField = nowPct;
  //     renderedKeys = showPctField
  //       ? Object.keys(fieldConfig)
  //       : Object.keys(fieldConfig).filter((k) => k !== 'pct');
  //   }
  // }

  $: {
        const basic = get(patentForm).basicInfo;
        const nowPct =
          basic?.filingOrigin === 'Foreign' && basic?.conventionType === 'PCT';

        showPctField = nowPct;

        // Only show priorityDocument if conventionType is PCT or Conventional
        renderedKeys = Object.keys(fieldConfig).filter((k) => {
          if (k === 'pct') {
            return showPctField;
          }
          if (k === 'priorityDocument') {
            return (
              basic?.conventionType === 'PCT' ||
              basic?.conventionType === 'Conventional'
            );
          }
          return true;
        });
      }

  function validate() {
    errors = {};
    for (const key of renderedKeys) {
      const config = fieldConfig[key];
      if (config.required && (!attachments[key] || attachments[key].length === 0)) {
        errors[key] = 'This file is required';
      } else {
        errors[key] = null;
      }
    }
    return Object.values(errors).every((e) => e === null);
  }

  function handleFileChange(key: string, files: FileList | null) {
    if (!files) return;

    const config = fieldConfig[key];
    const allowedExtensions = config.accept
      ? config.accept.split(',').map((ext) => ext.trim().toLowerCase())
      : null;

    const newFiles: File[] = [];
    for (const file of Array.from(files)) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions || allowedExtensions.includes(ext)) {
        newFiles.push(file);
      } else {
        errors[key] = `Invalid file type. Allowed: ${config.accept}`;
      }
    }

    if (newFiles.length > 0) {
       attachments[key] = [...attachments[key], ...newFiles];
      patentForm.update((f) => {
        f.attachments[key] = attachments[key];
        return f;
      });
    }
  }

  function removeFile(key: string, index: number) {
  attachments[key].splice(index, 1);
  attachments[key] = [...attachments[key]]; // trigger reactivity
  patentForm.update((f) => {
    f.attachments[key] = attachments[key];   // update only this key
    return f;
  });     
  }


  function handleNext() {
    if (validate()) {
      patentForm.update((f) => {
        f.attachments = attachments;
        return f;
      });
      goToNextStep();
    }
  }

  function handleBack() {
    goToPreviousStep();
  }
</script>

<div class="space-y-6">
  <h2 class="text-2xl font-semibold">Attachments</h2>

  <div class="grid md:grid-cols-2 gap-6">
    {#each renderedKeys as key}
      <div class="space-y-2">
        <label class="block font-medium">
          {fieldConfig[key].label}
          {#if fieldConfig[key].required}
            <span class="text-red-500">*</span>
          {/if}
        </label>

        <input
          type="file"
          multiple
          accept={fieldConfig[key].accept || ''}
          on:change={(e) => handleFileChange(key, e.target.files)}
          class="input bg-white"
        />

        {#if attachments[key]?.length > 0}
          <ul class="text-sm text-gray-600 space-y-1 mt-1">
            {#each attachments[key] as file, i}
              <li class="flex justify-between items-center">
                <span>{file.name}</span>
                <button
                  type="button"
                  class="text-red-500 hover:text-red-700 font-bold"
                  on:click={() => removeFile(key, i)}
                >
                  ✕
                </button>
              </li>
            {/each}
          </ul>
        {/if}

        {#if errors[key]}
          <p class="error">{errors[key]}</p>
        {/if}
      </div>
    {/each}
  </div>

  <div class="flex justify-between pt-6">
    <button type="button" class="btn-black" on:click={handleBack}>Back</button>
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

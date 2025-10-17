<script lang="ts">
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { baseURL } from '$lib/helpers';
  import { toast } from 'svelte-french-toast';
  import { Button } from '$lib/components/ui/button';
  import { loggedInUser } from '$lib/store';

  let fileId = '';
  let isLoading = false;
  let showForm = false;
  let filing: any = null;
  let originalFiling: any = null;
  let showSuccessModal = false;
  let showFailureModal = false;
  let userName = '';
  let notFoundMessage = '';

  // Filing country dropdown options
  let filingCountries: string[] = [];
  
  // track errors per section
  let sectionErrors: Record<string, boolean> = {
    applicants: false,
    inventors: false,
    firstPriorityInfo: false,
  };

  // Backend enums
  const PatentApplicationTypes = [
    { value: 0, label: 'Patent' },
    { value: 1, label: 'Business Method' },
    { value: 2, label: 'Utility Model' }
  ];

  const FilingOrigins = [
    { value: 'Local', label: 'Local' },
    { value: 'Foreign', label: 'Foreign' }
  ];

  loggedInUser.subscribe((user) => {
    userName = user?.name ?? '';
  });

  // Fetch countries
  const fetchCountries = async () => {
    try {
      const res = await fetch('https://countriesnow.space/api/v0.1/countries/positions');
      const data = await res.json();
      filingCountries = data.data.map((c: any) => c.name);
    } catch (err) {
      console.error('Error fetching countries:', err);
    }
  };
  fetchCountries();

  // Fetch filing by file number
  const fetchFiling = async () => {
    if (!fileId.trim()) return;
    isLoading = true;
    showForm = false;
    notFoundMessage = '';

    try {
      const res = await fetch(
        `${baseURL}/api/files/GetAllFileDetails?fileNumber=${encodeURIComponent(fileId)}`
      );
      if (!res.ok) throw new Error('Filing not found');

      const data = await res.json();
      filing = Array.isArray(data) ? data[0] : data;
      originalFiling = JSON.parse(JSON.stringify(filing));

      if (!filing) throw new Error('No filing data found');

      if (!Array.isArray(filing.firstPriorityInfo) || filing.firstPriorityInfo.length === 0) {
        filing.firstPriorityInfo = [
          { id: crypto.randomUUID(), country: '',number: '', date: '' }
        ];
      }

      // Force correspondence nationality to Nigeria
      if (filing.correspondence) {
        filing.correspondence.nationality = 'Nigeria';
      }

      // File type check
      if (filing.type === 0) {
        toast.success('This is a Patent File');
        showForm = true;
      } else if (filing.type === 1) {
        showFailureModal = true;
        notFoundMessage = 'This is a Design File, please search for a Patent File.';
      } else if (filing.type === 2) {
        showFailureModal = true;
        notFoundMessage = 'This is a Trademark File, please search for a Patent File.';
      } else {
        showFailureModal = true;
        notFoundMessage = 'Invalid or unrecognized file type.';
      }
    } catch (err) {
      showFailureModal = true;
      notFoundMessage = 'File number does not exist.';
    } finally {
      isLoading = false;
    }
  };

// Save changes (PATCH only modified fields)
const saveChanges = async () => {
  try {
    isLoading = true;
    filing.updatedBy = userName;

    const payload: Record<string, any> = { fileId };

    for (const key in filing) {
      if (JSON.stringify(filing[key]) !== JSON.stringify(originalFiling[key])) {
        payload[key] = filing[key];
      }
    }

    // ✅ normalize correspondence nationality
    if (payload.correspondence) {
        payload.correspondence = {
          ...payload.correspondence,
          Nationality: payload.correspondence.nationality
        };
        delete payload.correspondence.nationality;

        // backend also expects this flat field
        payload.CorrespondenceNationality = payload.correspondence.Nationality;
     }


    const res = await fetch(`${baseURL}/api/files/updatepatentfiles`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Update failed');

    showSuccessModal = true;
    setTimeout(() => goto('/home/dashboard'), 2500);
  } catch (err) {
    console.error('Error updating file:', err);
    showFailureModal = true;
    notFoundMessage = 'Update failed. Please try again.';
  } finally {
    isLoading = false;
  }
};

function checkSectionErrors() {
  sectionErrors.applicants = !!document.querySelector("details#applicants :invalid");
  sectionErrors.inventors = !!document.querySelector("details#inventors :invalid");
  sectionErrors.firstPriorityInfo = !!document.querySelector("details#firstPriorityInfo :invalid");

   // Auto-open all sections with errors
  Object.entries(sectionErrors).forEach(([key, hasError]) => {
    const details = document.querySelector(`details#${key}`);
    if (details) details.open = hasError;
  });
}


const handleSubmit = (event: Event) => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;

  checkSectionErrors();

  if (!form.checkValidity()) {
    toast.error('Please fix errors in the highlighted sections.');
    const firstInvalid = form.querySelector(':invalid') as HTMLElement;

    if (firstInvalid) {
      const parentDetails = firstInvalid.closest('details');
      if (parentDetails) parentDetails.open = true;
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      form.reportValidity();
    }
    return;
  }

  // ✅ form is valid → proceed with saveChanges
  saveChanges();
};

</script>

<style>
  .form-input {
    @apply w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black;
  }
  .form-label {
    @apply block text-sm font-medium mb-1;
  }
  .form-section {
    @apply border p-3 rounded space-y-2 bg-gray-50;
  }

  .form-input:invalid {
    border-color: red;
  }
  .form-input:invalid:focus {
    outline: none;
    box-shadow: 0 0 0 2px red;
  }

</style>

<!-- UI -->
<div class="p-6">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-xl font-bold">Update Patent Information</h1>
    <button
      on:click={() => goto('/home/dashboard')}
      class="border rounded p-2 text-white bg-black hover:bg-gray-600 transition-colors"
    >
      Back
    </button>
  </div>

  <!-- File ID search -->
  <div class="flex gap-2 mb-4">
    <input
      class="form-input flex-1"
      bind:value={fileId}
      placeholder="Enter File Number"
      on:keydown={(e) => e.key === 'Enter' && fetchFiling()}
    />
    <Button on:click={fetchFiling} disabled={isLoading}>Fetch</Button>
  </div>

  {#if isLoading}
    <p>Loading...</p>
  {:else if showForm && filing}
    <form class="space-y-6" on:submit={handleSubmit}>
      <!-- Filing Origin -->
      <div>
        <label class="form-label">Filing Origin</label>
        <select class="form-input" bind:value={filing.fileOrigin} required>
          {#each FilingOrigins as origin}
            <option value={origin.value}>{origin.label}</option>
          {/each}
        </select>
      </div>

      <!-- Filing Country -->
      <div>
        <label class="form-label">Filing Country</label>
        <select class="form-input" bind:value={filing.filingCountry} required>
          <option value="">Select country</option>
          {#each filingCountries as country}
            <option value={country}>{country}</option>
          {/each}
        </select>
      </div>

      <!-- Patent Application Type -->
      <div>
        <label class="form-label">Patent Application Type</label>
        <select class="form-input" bind:value={filing.patentApplicationType} required>
          {#each PatentApplicationTypes as type}
            <option value={type.value}>{type.label}</option>
          {/each}
        </select>
      </div>

      <!-- Applicants -->
     <details id="applicants" class="border rounded p-3 mb-4" open={sectionErrors.applicants}>
        <summary class="cursor-pointer">
          Applicants 
          {#if sectionErrors.applicants}
            <span class="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded flex items-center gap-1">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="red" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Error
            </span>
          {/if}
        </summary>
        <div class="grid gap-6 mt-2 mb-5">
          {#each filing.applicants as applicant, index (applicant.id)}
            <div class="form-section">
              <h1 class="form-label mb-2 font-bold">Applicant {index + 1}</h1>
              <label class="form-label">Nationality</label>
              <input class="form-input" bind:value={applicant.country} readonly />
              <label class="form-label">Address</label>
              <input class="form-input" bind:value={applicant.address} readonly />
              <label class="form-label">State</label>
              <input class="form-input" bind:value={applicant.state} placeholder="State" required />
            </div>
          {/each}
        </div>
      </details>
       {#if sectionErrors.applicants}
          <span class="text-red-500 text-sm ml-2">⚠ Error</span>
       {/if}

      <!-- Inventors -->
      <details id="inventors" class="border rounded p-3 mb-4" open={sectionErrors.inventors}>
        <summary class="cursor-pointer">
          Inventors
          {#if sectionErrors.inventors}
            <span class="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded flex items-center gap-1">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="red" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Error
            </span>
          {/if}
        </summary>
        <div class="grid gap-6 mt-2 mb-5">
          {#each filing.inventors as inventor, index (inventor.id)}
            <div class="form-section">
              <h1 class="form-label font-bold">Inventor {index + 1}</h1>
              <label class="form-label">Nationality</label>
              <input class="form-input" bind:value={inventor.country} readonly />
              <label class="form-label">Address</label>
              <input class="form-input" bind:value={inventor.address} readonly />
              <label class="form-label">State</label>
              <input class="form-input" bind:value={inventor.state} placeholder="State" required />
            </div>
          {/each}
        </div>
      </details>

      <!-- Correspondence -->
      <div>
        <label class="form-label">Correspondence Nationality</label>
        <input class="form-input" bind:value={filing.correspondence.nationality} readonly required />
      </div>

      {#if filing.fileOrigin === "Foreign" && (filing.patentType === 0 || filing.patentType === 2)}
      <details id="firstPriorityInfo" class="border rounded p-3 mb-4" open={sectionErrors.firstPriorityInfo}>
        <summary class="cursor-pointer">
              First Priority Information

        </summary>
        <div class="grid gap-6 mt-2 mb-5">
          {#each filing.firstPriorityInfo as fpi, index (fpi.id)}
            <div class="form-section">
              <h1 class="form-label font-bold">First Priority Information {index + 1}</h1>

              <label class="form-label">Nationality</label>
              <input class="form-input" bind:value={fpi.country} placeholder="country" required />

              <label class="form-label">Application Number</label>
              <input class="form-input" bind:value={fpi.number} placeholder="application number" required/>

              <label class="form-label">Date</label>
              <input class="form-input" type="date" bind:value={fpi.date} required />
            </div>
          {/each}
        </div>
      </details>
      {/if}

      <!-- Save -->  
      <Button type="submit" disabled={isLoading}>Save Changes</Button>
    </form>
  {/if}

  {#if showSuccessModal}
  <div transition:fade class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div class="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center max-w-sm">
      <!-- Green Good Mark Icon -->
      <svg class="mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#22c55e"/>
        <path d="M7 13.5L10.5 17L17 10.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h3 class="text-xl font-semibold text-green-700">Update Successful</h3>
      <p class="mt-2 text-gray-700 text-center">The Patent file was updated successfully.</p>
    </div>
  </div>
{/if}

  <!-- Failure Modal -->
  {#if showFailureModal}
    <div transition:fade class="fixed inset-0 flex items-center justify-center bg-black/50">
      <div class="bg-white p-6 rounded shadow-lg max-w-sm">
        <h3 class="text-lg font-semibold">Please Note</h3>
        <p class="mt-2">{notFoundMessage}</p>
        <div class="mt-4 flex justify-end">
          <Button on:click={() => (showFailureModal = false)}>OK</Button>
        </div>
      </div>
    </div>

    {@html (() => {
      setTimeout(() => (showFailureModal = false), 4000);
      return '';
    })()}
  {/if}
</div>

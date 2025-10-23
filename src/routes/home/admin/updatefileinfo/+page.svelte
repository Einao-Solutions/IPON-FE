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
  let showSuccessModal = false;
  let showFailureModal = false;
  let userName = '';
  let notFoundMessage = '';


  loggedInUser.subscribe((user) => {
    userName = user?.name ?? '';
  });

    function ensureArrays(obj: any) {
    if (!obj) return obj;
    obj.applicants = Array.isArray(obj.applicants) ? obj.applicants : [];
    obj.revisions = Array.isArray(obj.revisions) ? obj.revisions : [];
    obj.inventors = Array.isArray(obj.inventors) ? obj.inventors : [];
    obj.priorityInfo = Array.isArray(obj.priorityInfo) ? obj.priorityInfo : [];
    obj.designCreators = Array.isArray(obj.designCreators) ? obj.designCreators : [];
    obj.attachments = Array.isArray(obj.attachments) ? obj.attachments : [];
    obj.registered_Users = Array.isArray(obj.registered_Users) ? obj.registered_Users : [];
    obj.registeredUsers = Array.isArray(obj.registeredUsers) ? obj.registeredUsers : [];
    obj.assignees = Array.isArray(obj.assignees) ? obj.assignees : [];
    obj.postRegApplications = Array.isArray(obj.postRegApplications) ? obj.postRegApplications : [];
    // Add more fields as needed
    return obj;
  }

  const fetchFiling = async () => {
    if (!fileId.trim()) return;
    isLoading = true;
    showForm = false;
    notFoundMessage = '';

    try {
      const res = await fetch(`${baseURL}/api/files/GetAllFileDetails?fileNumber=${encodeURIComponent(fileId)}`);
      if (!res.ok) throw new Error('Filing not found');

      const data = await res.json();
     // console.log('RAW DATA:', data);

      // ✅ Fix: Assign properly whether array or single object
      filing = Array.isArray(data) ? data[0] : data;
      if (!filing) throw new Error('No filing data found');

      filing = ensureArrays(filing); // <-- Normalize arrays here
      showForm = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      notFoundMessage = 'No file found for this file number.';
    } finally {
      isLoading = false;
    }
  };

  const saveChanges = async () => {
    try {
      isLoading = true;
      filing.updatedBy = userName;
      const res = await fetch(`${baseURL}/api/files/update-filing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filing),
      });

      if (!res.ok) throw new Error('Update failed');

      showSuccessModal = true;

      setTimeout(() => {
        goto('/home/admin');
      }, 2500); // Wait 1.5 seconds before navigating

    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      showFailureModal = true;
      console.error('Error updating file:', message);
    } finally {
      isLoading = false;
    }
  };

</script>

<div class="space-y-4 p-4">

  <div class="flex items-center justify-between mb-4">

    <h1 class="text-xl font-bold">Update File Information</h1>

    <button
      on:click={() => goto('/home/admin')}
      class="border rounded p-2  text-white bg-black hover:bg-gray-600 transition-colors"
      >
        Back
    </button>
  </div>

  <form
    class="flex gap-2"
    on:submit|preventDefault={fetchFiling}
  >
    <input
      class="border rounded p-2 w-full"
      bind:value={fileId}
      placeholder="Enter File ID"
      on:input={() => notFoundMessage = ''}
    />
    <Button type="submit">Search</Button>
  </form>


  {#if notFoundMessage && !isLoading}
	<p class="text-red-500 text-sm mt-2">{notFoundMessage}</p>
  {/if}


  {#if isLoading}
    <div class="animate-spin rounded-full h-6 w-6 border-4 border-blue-500 border-t-transparent mx-auto my-4"></div>
  {/if}

  {#if showForm && filing}
    <div in:fade>
      
      <!-- PATENT FILES (fileType = 0) -->
      {#if filing.type === 0}
        <!-- Patent Information Section -->
        <details class="border rounded p-3 mb-4 open">
          <summary class="font-normal cursor-pointer">Patent Information</summary>
          <div class="grid gap-2 mt-2">
            <label>Filing Origin</label>
            <select class="input" bind:value={filing.filingOrigin}>
              <option value="">Select Filing Origin</option>
              <option value="Local">Local</option>
              <option value="Foreign">Foreign</option>
            </select>

            <label>Filing Country</label>
            <input class="input" bind:value={filing.filingCountry} placeholder="Filing Country" />

            <label>Patent Type</label>
            <select class="input" bind:value={filing.patentType}>
              <option value="">Select Patent Type</option>
              <option value="Patent">Patent</option>
              <option value="Utility_Model">Utility Model</option>
              <option value="Business_Method">Business Method</option>
            </select>

            <label>Patent Application Type</label>
            <select class="input" bind:value={filing.patentApplicationType}>
              <option value="">Select Application Type</option>
              <option value="Patent">Patent</option>
              <option value="Business_Method">Business Method</option>
              <option value="Utility_Model">Utility Model</option>
            </select>

            <label>Title of Invention</label>
            <input class="input" bind:value={filing.titleOfInvention} placeholder="Title of Invention" />

            <label>Patent Abstract</label>
            <textarea class="input" bind:value={filing.patentAbstract} placeholder="Patent Abstract" />
          </div>
        </details>
      {/if}

      <!-- DESIGN FILES (fileType = 1) -->
      {#if filing.type === 1}
        <!-- Design Information Section -->
        <details class="border rounded p-3 mb-4 open">
          <summary class="font-normal cursor-pointer">Design Information</summary>
          <div class="grid gap-2 mt-2">
            <label>Design Type</label>
            <select class="input" bind:value={filing.designType}>
              <option value="">Select Design Type</option>
              <option value="Textile">Textile</option>
              <option value="NonTextile">None</option>
            </select>

            <label>Title of Design</label>
            <input class="input" bind:value={filing.titleOfDesign} placeholder="Enter Design Title" />

            <label>Statement of Novelty</label>
            <textarea class="input" rows="3" bind:value={filing.statementOfNovelty} placeholder="Enter novelty statement" />
          </div>
        </details>
      {/if}

      <!-- TRADEMARK FILES (fileType = 2) -->
      {#if filing.type === 2}
        <!-- Trademark Information Section -->
        <details class="border rounded p-3 mb-4 open">
          <summary class="font-normal cursor-pointer">Trademark Information</summary>
          <div class="grid gap-2 mt-2">
            <label>Trademark Class (1-45)</label>
            <input class="input" type="number" min="1" max="45" bind:value={filing.trademarkClass} placeholder="Trademark Class (1-45)" />

            <label>Trademark Type</label>
            <select class="input" bind:value={filing.trademarkType}>
              <option value="">Select Trademark Type</option>
              <option value={0}>Local</option>
              <option value={1}>Foreign</option>
            </select>

            <label>Logo Description</label>
            <select class="input" bind:value={filing.trademarkLogo}>
              <option value="">Select Logo Description</option>
              <option value={0}>Device</option>
              <option value={1}>Word Mark</option>
              <option value={2}>Word and Device</option>
            </select>

            <label>Claims and Disclaimer</label>
            <textarea class="input" bind:value={filing.trademarkDisclaimer} placeholder="Claims and Disclaimer" />

            <label>Title of Trademark</label>
            <input class="input" bind:value={filing.titleOfTradeMark} placeholder="Title of Trademark" />

            <label>Trademark Class Description</label>
            <textarea class="input" bind:value={filing.trademarkClassDescription} placeholder="Trademark Class Description" />
          </div>
        </details>
      {/if}

      <!-- Correspondence Section -->
      <details class="border rounded p-3 mb-4 open">
        <summary class="font-normal cursor-pointer">Correspondence Info</summary>
        <div class="grid gap-2 mt-2">
          <label>Name</label>
          <input class="input" bind:value={filing.correspondence.name} placeholder="Name" />

          <label>Address</label>
          <input class="input" bind:value={filing.correspondence.address} placeholder="Address" />

          <label>Email</label>
          <input class="input" bind:value={filing.correspondence.email} placeholder="Email" />

          <label>Phone</label>
          <input class="input" bind:value={filing.correspondence.phone} placeholder="Phone" />

          <label>State</label>
          <input class="input" bind:value={filing.correspondence.state} placeholder="State" />
        </div>
      </details>

      <!-- Applicants (Common for all file types) -->
      <details class="border rounded p-3 mb-4 open">
        <summary class="font-normal cursor-pointer">Applicants</summary>
        <div class="grid gap-4 mt-2">
          {#each filing.applicants as applicant, index (applicant.id)}
            <div class="border p-3 rounded space-y-2 bg-gray-50">
              <!-- Applicant heading with spacing -->
              <div class="mb-2">
                <label class="block text-base font-normal text-gray-700">Applicant {index + 1}</label>
              </div>

              <!-- Input fields -->
              <div class="grid gap-2">
                <label class="block text-sm">Name</label>
                <input class="input" bind:value={applicant.name} placeholder="Name" />

                <label class="block text-sm">Nationality</label>
                <input class="input" bind:value={applicant.nationality} placeholder="Nationality" />

                <label class="block text-sm">State</label>
                <input class="input" bind:value={applicant.state} placeholder="State" />

                <label class="block text-sm">City</label>
                <input class="input" bind:value={applicant.city} placeholder="City" />

                <label class="block text-sm">Phone</label>
                <input class="input" bind:value={applicant.phone} placeholder="Phone" />

                <label class="block text-sm">Email</label>
                <input class="input" bind:value={applicant.email} placeholder="Email" />

                <label class="block text-sm">Address</label>
                <input class="input" bind:value={applicant.address} placeholder="Address" />
              </div>
            </div>
          {/each}
        </div>
      </details>
        <!-- </div>
      </details> -->

      <!-- ATTACHMENTS SECTIONS -->
      <!-- Patent Attachments (Only for Patents) -->
      {#if filing.type === 0}
        <details class="border rounded p-3 mb-4 open">
          <summary class="font-normal cursor-pointer">Attachments (Patent)</summary>
          <div class="grid gap-4 mt-2">
            <p class="text-sm text-gray-600">POA, CS, Patent Drawing, Other Supporting Documents</p>
            {#each filing.attachments as attachment, index (attachment.name)}
              <div class="border p-3 rounded space-y-2 bg-gray-50">
                <label class="text-sm font-normal">Attachment {index + 1}</label>
                <input class="input" bind:value={attachment.name} placeholder="Attachment Name (POA, CS, Patent Drawing, etc.)" />
                
                {#each attachment.url as link, linkIndex}
                  <div class="flex items-center gap-2">
                    <input class="input" bind:value={attachment.url[linkIndex]} placeholder="Attachment URL" />
                  </div>
                {/each}
              </div>
            {/each}
          </div>
        </details>
      {/if}

      <!-- Trademark Attachments (Only for Trademarks) -->
      {#if filing.type === 2}
        <details class="border rounded p-3 mb-4 open">
          <summary class="font-normal cursor-pointer">Attachments (Trademark)</summary>
          <div class="grid gap-4 mt-2">
            <p class="text-sm text-gray-600">POA, Proposed Trademark Representation, Supporting Document 1, Supporting Document 2</p>
            {#each filing.attachments as attachment, index (attachment.name)}
              <div class="border p-3 rounded space-y-2 bg-gray-50">
                <label class="text-sm font-normal">Attachment {index + 1}</label>
                <input class="input" bind:value={attachment.name} placeholder="Attachment Name (POA, Trademark Rep, Supporting Doc, etc.)" />
                
                {#each attachment.url as link, linkIndex}
                  <div class="flex items-center gap-2">
                    <input class="input" bind:value={attachment.url[linkIndex]} placeholder="Attachment URL" />
                  </div>
                {/each}
              </div>
            {/each}
          </div>
        </details>
      {/if}

      <!-- Attachments Section -->
      <details class="border rounded p-3 mb-4 open">
        <summary class="font-normal cursor-pointer">Attachments</summary>
        <div class="grid gap-4 mt-2">
          {#each filing.attachments as attachment, index (attachment.name)}
            <div class="border p-3 rounded space-y-2 bg-gray-50">
              <label class="text-sm font-normal">Attachment {index + 1}</label>
              <input class="input" bind:value={attachment.name} placeholder="Attachment Name" />
              
              {#each attachment.url as link, linkIndex}
                <div class="flex items-center gap-2">
                  <input class="input" bind:value={attachment.url[linkIndex]} placeholder="Attachment URL" />
                 
                </div>
              {/each}

            </div>
          {/each}
        </div>
      </details>
  
      <!-- Save Changes Button -->  
      <Button class="mt-4" on:click={saveChanges}>Save</Button>
    </div>
  {/if}
</div>

  {#if showSuccessModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded shadow-md text-center w-full max-w-sm">
      <h2 class="text-xl font-semibold text-green-600">Success!</h2>
      <p class="mt-2">File updated successfully.</p>
      <button
        class="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        on:click={() => showSuccessModal = false}
      >
        Close
      </button>
    </div>
  </div>
  {/if}

  {#if showFailureModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded shadow-md text-center w-full max-w-sm">
      <h2 class="text-xl font-semibold text-red-600">Update Failed</h2>
      <p class="mt-2">Something went wrong. Please try again.</p>
      <button
        class="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        on:click={() => showFailureModal = false}
      >
        Close
      </button>
    </div>
  </div>
{/if}


<style>
  .input {
    border: 1px solid #ccc;
    border-radius: 0.375rem;
    padding: 0.5rem;
    width: 100%;
  }

  details > summary {
    outline: none;
  }

  details[open] > summary {
    font-weight: bold;
  }
</style>

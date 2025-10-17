<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { baseURL, ApplicationStatuses, PatentTypes } from '$lib/helpers';
  import { DesignTypes } from '$lib/designutils';
  import { filesToAttachment } from "$lib/utils/patent";

  let fileId: string = "";
  let loading = false;
  let errorModal: string | null = null;
  let fileData: any = null;
  let newUploads: Record<string, File[]> = {};
  let successModal: string | null = null;

  // Attachment field config
  const fieldConfig: Record<string, { label: string; accept: string | null }> = {
    poa: { label: 'Power of Attorney (POA) (.pdf)', accept: '.pdf' },
    cs: { label: 'Claims and Specifications (CS) (.pdf)', accept: '.pdf' },
    drawings: { label: 'Patent Drawing (.pdf, .jpeg, .jpg, .png)', accept: '.pdf,.jpeg,.jpg,.png' },
    others: { label: 'Other Supporting Documents (All file types)', accept: null },
    priorityDocument: { label: 'Priority Documents (.pdf)', accept: '.pdf' },
    pct: { label: 'PCT Documents (.pdf)', accept: '.pdf' },

     // Design fields
    statementOfNovelty: { label: 'Statement of Novelty (.pdf)', accept: '.pdf' },
    designDrawings: { label: 'Design Drawings (.pdf, .jpeg, .jpg, .png)', accept: '.pdf,.jpeg,.jpg,.png' },
    designPriorityDocument: { label: 'Priority Documents (.pdf)', accept: '.pdf' },
    noveltyStatement: { label: 'Novelty Statement (pdf and jpeg or jpg)', accept: '.pdf,.jpeg,.jpg' }
  };

  // Dynamically rendered keys based on patent type
  let renderedKeys: string[] = [];

  function getPatentTypeLabel(value: number) {
    switch (value) {
      case PatentTypes.Non_Conventional: return 'Non-Conventional';
      case PatentTypes.Conventional: return 'Conventional';
      case PatentTypes.PCT: return 'PCT';
      default: return value;
    }
  }
  function getDesignTypeLabel(value: number) {
    return DesignTypes[value] ?? value;
  }
  function getFileStatusLabel(value: number) {
    return ApplicationStatuses[value] ?? value;
  }

  // async function searchFile() {
  //   if (!fileId) return;
  //   loading = true;
  //   errorModal = null;
  //   fileData = null;
  //   try {
  //     const res = await fetch(`${baseURL}/api/files/${encodeURIComponent(fileId)}/getattachments`);
  //     if (!res.ok) {
  //       const err = await res.json();
  //       errorModal = err.message || "File not found.";
  //       return;
  //     }
  //     const data = await res.json();
  //     if (data.fileType != 0 && data.fileType != 1) {
  //       errorModal = "File not found or not a Patent or Design file.";
  //       return;
  //     }

  //     if (data.fileType === 0 && (data.fileStatus === ApplicationStatuses.Active || data.fileStatus === ApplicationStatuses.Expired)) {
  //       errorModal = "The update attachment module does not work for Patent files with Active and InActive status.";
  //       return;
  //     }else if (data.fileType === 1) {       
  //       // Design file logic
  //       if (data.fileStatus === ApplicationStatuses.Active || data.fileStatus === ApplicationStatuses.Expired) {
  //         errorModal = "The update attachment module does not work for Design files with Active and Expired status.";
  //         return;
  //       }
  //       fileData = data;
  //       newUploads = {};
  //       renderedKeys = [
  //         'statementOfNovelty',
  //         'designDrawings',
  //         'designPriorityDocument',
  //         'noveltyStatement'
  //       ];
  //     }

  //     fileData = data;
  //     newUploads = {};
  //     // Set renderedKeys based on patent type number
  //     if (typeof fileData.patentType === 'number') {
  //       if (fileData.patentType === PatentTypes.Non_Conventional) {
  //         renderedKeys = ['poa', 'cs', 'drawings', 'others'];
  //       } else if (fileData.patentType === PatentTypes.Conventional) {
  //         renderedKeys = ['poa', 'cs', 'drawings', 'others', 'priorityDocument'];
  //       } else if (fileData.patentType === PatentTypes.PCT) {
  //         renderedKeys = ['poa', 'cs', 'drawings', 'others', 'priorityDocument', 'pct'];
  //       } else {
  //         renderedKeys = [];
  //       }
  //     } else {
  //       renderedKeys = [];
  //     }
  //   } catch (err) {
  //     errorModal = "Error fetching file.";
  //   } finally {
  //     loading = false;
  //   }
  // }

  // ...existing code...
async function searchFile() {
  if (!fileId) return;
  loading = true;
  errorModal = null;
  fileData = null;
  try {
    const res = await fetch(`${baseURL}/api/files/${encodeURIComponent(fileId)}/getattachments`);
    if (!res.ok) {
      const err = await res.json();
      errorModal = err.message || "File not found.";
      return;
    }
    const data = await res.json();
    if (data.fileType != 0 && data.fileType != 1) {
      errorModal = "File not found or not a Patent or Design file.";
      return;
    }

    // Patent file logic
    if (data.fileType === 0) {
      if (data.fileStatus === ApplicationStatuses.Active || data.fileStatus === ApplicationStatuses.Expired) {
        errorModal = "The update attachment module does not work for Patent files with Active and InActive status.";
        return;
      }
      fileData = data;
      newUploads = {};
      // Set renderedKeys based on patent type number
      if (typeof data.patentType === 'number') {
        if (data.patentType === PatentTypes.Non_Conventional) {
          renderedKeys = ['poa', 'cs', 'drawings', 'others'];
        } else if (data.patentType === PatentTypes.Conventional) {
          renderedKeys = ['poa', 'cs', 'drawings', 'others', 'priorityDocument'];
        } else if (data.patentType === PatentTypes.PCT) {
          renderedKeys = ['poa', 'cs', 'drawings', 'others', 'priorityDocument', 'pct'];
        } else {
          renderedKeys = [];
        }
      } else {
        renderedKeys = [];
      }
    }
    // Design file logic
    else if (data.fileType === 1) {
      if (data.fileStatus === ApplicationStatuses.Active || data.fileStatus === ApplicationStatuses.Expired) {
        errorModal = "The update attachment module does not work for Design files with Active and Expired status.";
        return;
      }
      fileData = data;
      newUploads = {};
      renderedKeys = [
        'statementOfNovelty',
        'designDrawings',
        'designPriorityDocument',
        'noveltyStatement'
      ];
    }
  } catch (err) {
    errorModal = "Error fetching file.";
  } finally {
    loading = false;
  }
}


  function handleFileChange(name: string, event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      newUploads[name] = [...(newUploads[name] || []), ...Array.from(target.files)];
    }
  }

  function removeFile(name: string, idx: number) {
    if (newUploads[name]) {
      newUploads[name].splice(idx, 1);
      newUploads[name] = [...newUploads[name]];
    }
  }

  async function submitAttachments() {
    if (!fileData) return;
    let formattedAttachments: any[] = [];
    for (const [name, files] of Object.entries(newUploads)) {
      if (files.length > 0) {
        const converted = await filesToAttachment(name, files);
        formattedAttachments = [...formattedAttachments, ...converted];
      }
    }
    if (formattedAttachments.length === 0) {
      errorModal = "Please upload at least one attachment.";
      return;
    }
    try {
      const res = await fetch(`${baseURL}/api/files/${encodeURIComponent(fileData.fileId)}/updateattachments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachments: formattedAttachments })
      });
      if (!res.ok) {
        const err = await res.json();
        errorModal = err.message || "Failed to update attachments.";
        return;
      }
      successModal = "Attachments updated successfully!";
      await searchFile();
    } catch (err) {
      errorModal = "Error submitting attachments.";
    }
  }
</script>

<div class="min-h-screen bg-gray-100 p-6">
  <!-- Header -->

  <h3 class="text-xl font-bold text-center text-gray-800 mb-6">Update File Attachments</h3>
  <div class="p-4 flex items-center space-x-2 border-b bg-gray-50">
    <button class="px-3 py-1 text-white bg-black rounded" on:click={() => (goto('/home/dashboard'))}>
      Back
    </button>
    <input
      type="text"
      placeholder="Please input your file number"
      bind:value={fileId}
      class="flex-1 border p-2 rounded"
      on:keydown={(e) => e.key === "Enter" && searchFile()}
    />
    <button on:click={searchFile} class="px-4 py-2 bg-black text-white rounded shadow" disabled={loading}>
      {loading ? "Searching..." : "Search"}
    </button>
  </div>

  <!-- Error Modal -->
  {#if errorModal}
    <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div class="bg-white p-6 rounded shadow-lg w-96">
        <h2 class="text-lg font-bold mb-2">Notice</h2>
        <p>{errorModal}</p>
        <button class="mt-4 px-4 py-2 bg-red-600 text-white rounded" on:click={() => (errorModal = null)}>
          Close
        </button>
      </div>
    </div>
  {/if}

  <!-- Success Modal -->
  {#if successModal}
    <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div class="bg-white p-6 rounded shadow-lg w-96 text-center">
        <h2 class="text-lg font-bold mb-2 text-green-700">Update Successful 🎉</h2>
        <p>{successModal}</p>
        <button
          class="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          on:click={() => (successModal = null)}
        >
          Close
        </button>
      </div>
    </div>
  {/if}

  <!-- File Details -->
  {#if fileData}
    <div class="space-y-6">
      <!-- Patent/Design details -->
      <div class="grid gap-6">
        {#if fileData.fileType === 0}
          <div class="border p-6 rounded-xl shadow bg-white">
            <h2 class="font-bold text-xl mb-4 text-gray-700">Patent File Details</h2>
            <p><b>File Number:</b> {fileData.fileId}</p>
            <p><b>Patent Type:</b> {getPatentTypeLabel(fileData.patentType)}</p>
            <p><b>Title of Invention:</b> {fileData.titleOfInvention}</p>
            <p><b>File Status:</b> {getFileStatusLabel(fileData.fileStatus)}</p>
            <p><b>File Origin:</b> {fileData.fileOrigin}</p>
            <p><b>Applicant Name:</b> {fileData.applicant?.name}</p>
          </div>
        {/if}
        {#if fileData.fileType === 1}
          <div class="border p-6 rounded-xl shadow bg-white">
            <h2 class="font-bold text-xl mb-4 text-gray-700">Design File Details</h2>
            <p><b>File Number:</b> {fileData.fileId}</p>
            <p><b>Design Type:</b> {getDesignTypeLabel(fileData.designType)}</p>
            <p><b>Title of Design:</b> {fileData.titleOfDesign}</p>
            <p><b>File Status:</b> {getFileStatusLabel(fileData.fileStatus)}</p>
            <p><b>Statement of Novelty:</b> {fileData.statementOfNovelty}</p>
            <p><b>Applicant Name:</b> {fileData.applicant?.name}</p>
          </div>
        {/if}
      </div>

      <!-- Attachments: Conditionally rendered -->
      <div class="border p-6 rounded-xl shadow bg-white">
        <h2 class="font-bold text-xl mb-4 text-gray-700">Submit Attachments</h2>
        {#each renderedKeys as name}
          <div class="mb-6">
            <p class="font-semibold text-gray-800">{fieldConfig[name].label}</p>
            <input
              type="file"
              multiple
              class="mt-2"
              accept={fieldConfig[name].accept || ''}
              on:change={(e) => handleFileChange(name, e)}
            />
            {#if newUploads[name]}
              <ul class="list-disc ml-6 mt-2 text-sm text-gray-600">
                {#each newUploads[name] as f, i}
                  <li class="flex justify-between items-center">
                    <span>{f.name}</span>
                    <button
                      type="button"
                      class="ml-2 text-red-500 hover:text-red-700 font-bold"
                      on:click={() => removeFile(name, i)}
                    >
                      ✕
                    </button>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Submit button centered -->
      <div class="flex">
        <button
          class="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          on:click={submitAttachments}
        >
          Submit Update
        </button>
      </div>
    </div>
  {/if}
</div>
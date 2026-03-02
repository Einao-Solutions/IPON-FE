<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import Icon from "@iconify/svelte";
  import { toast } from "svelte-sonner";
  import { baseURL } from "$lib/helpers";

  // Props
  export let open = false;
  export let fileId = "";
  export let applicationId = "";
  export let status: number | null = null;

  // Component state
  let amendmentDetails: any = null;
  let loading = false;
  let error: string | null = null;
  let comment = "";
  let submitting = false;

  $: isReadOnly = status === 10 || status === 11;

  // Reactive statement to fetch data when dialog opens
  $: if (open && fileId && !amendmentDetails) {
    fetchAmendmentDetails();
  }

  // Reset state when dialog closes
  $: if (!open) {
    resetState();
  }

  async function fetchAmendmentDetails() {
    loading = true;
    error = null;
    amendmentDetails = null;
    
    try {
      const response = await fetch(
        `${baseURL}/api/files/GetPatentAmendmentDetails?fileId=${encodeURIComponent(fileId)}&appId=${encodeURIComponent(applicationId)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch amendment details");
      }
      
      const data = await response.json();
      amendmentDetails = data.data;
    } catch (e) {
      const err = e as Error;
      error = err.message || "Error loading amendment details";
    } finally {
      loading = false;
    }
  }

  async function handleAmendmentDecision(approve: boolean) {
    submitting = true;
    try {
      const response = await fetch(
        `${baseURL}/api/files/amendment-decision`, 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: fileId,
            appId: applicationId,
            approve: approve,
            reason: comment,
          }),
        }
      );
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to submit decision");
      
      const successMessage = approve 
        ? "Patent amendment has been successfully approved." 
        : "Patent amendment has been successfully rejected.";
      toast.success(successMessage);
      open = false;
      
      // Reload page after 3 seconds
      setTimeout(() => {
        location.reload();
      }, 3000);
    } catch (e) {
      const err = e as Error;
      error = err.message || "Error submitting decision";
      toast.error(error);
    } finally {
      submitting = false;
    }
  }

  function resetState() {
    amendmentDetails = null;
    loading = false;
    error = null;
    comment = "";
    submitting = false;
  }

  function closeDialog() {
    open = false;
  }

  function getPatentTypeLabel(type: number): string {
    switch (type) {
      case 0: return 'Conventional';
      case 1: return 'Non-Conventional';
      case 2: return 'PCT';
      default: return 'Unknown';
    }
  }

  function getApplicationTypeLabel(type: number): string {
    switch (type) {
      case 0: return 'Patent';
      case 1: return 'Business Method';
      case 2: return 'Utility Model';
      default: return 'Unknown';
    }
  }

  function getAmendmentTypeLabel(type: string): string {
    switch (type) {
      case 'ApplicantName': return 'Applicant Name Change';
      case 'ApplicantAddress': return 'Applicant Address Change';
      case 'FileTitle': return 'Title of Invention Change';
      case 'EditInventors': return 'Inventor Changes';
      case 'PriorityInfo': return 'Priority Information Changes';
      case 'CorrespondenceInformation': return 'Correspondence Information Change';
      case 'AddOrRemoveApplicant': return 'Add/Remove Applicant';
      default: return type;
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    class="w-11/12 max-w-5xl mx-auto my-8 max-h-[90vh] rounded-xl shadow-lg bg-white border border-gray-200 flex flex-col"
  >
    <Dialog.Header class="flex-shrink-0">
      <Dialog.Title class="text-2xl font-bold">
        Patent Amendment Details
      </Dialog.Title>
      <Dialog.Description>
        Review and process patent amendment details.
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex-1 overflow-auto p-4">
      {#if loading}
        <div class="flex items-center gap-2 text-gray-600 py-8 justify-center">
          <Icon
            icon="line-md:loading-loop"
            width="2em"
            height="2em"
            class="animate-spin"
          />
          <span>Loading amendment details...</span>
        </div>
      {:else if error}
        <div class="text-red-500 py-8 flex items-center gap-2 justify-center">
          {error}
        </div>
      {:else if amendmentDetails}
        <div class="space-y-6">
          <!-- File Information -->
          <div class="bg-gray-100 rounded-lg p-4">
            <h3 class="font-semibold text-lg mb-3">File Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label class="font-semibold text-sm text-gray-700">File Number:</Label>
                <p class="mt-1 p-2 bg-white rounded border">
                  {amendmentDetails.fileId || "N/A"}
                </p>
              </div>
              <div>
                <Label class="font-semibold text-sm text-gray-700">Filing Date:</Label>
                <p class="mt-1 p-2 bg-white rounded border">
                  {amendmentDetails.filingDate || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <!-- Changes Section -->
          {#if amendmentDetails.changes}
            <div class="bg-gray-100 rounded-lg p-4">
              <h3 class="font-semibold text-lg mb-4">{getAmendmentTypeLabel(amendmentDetails.amendmentType)}</h3>
              
              {#if amendmentDetails.amendmentType === 'ApplicantName'}
                <!-- Applicant Name Changes -->
                <div class="space-y-4">
                  {#if amendmentDetails.changes.oldNames && amendmentDetails.changes.newNames}
                    {#each amendmentDetails.changes.oldNames as oldName, index}
                      <div>
                        <div class="font-semibold text-sm text-gray-700 mb-3">Applicant {index + 1}:</div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div class="border rounded-lg p-4 bg-red-50">
                            <h3 class="font-semibold mb-3 flex items-center gap-2">
                              <Icon icon="mdi:account-minus" class="text-red-600" />
                              Old Details
                            </h3>
                            <div class="text-sm">
                              {oldName}
                            </div>
                          </div>
                          <div class="border rounded-lg p-4 bg-green-50">
                            <h3 class="font-semibold mb-3 flex items-center gap-2">
                              <Icon icon="mdi:account-plus" class="text-green-600" />
                              New Details
                            </h3>
                            <div class="text-sm">
                              {amendmentDetails.changes.newNames[index] || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    {/each}
                  {/if}
                </div>
              {:else if amendmentDetails.amendmentType === 'ApplicantAddress'}
                <!-- Applicant Address Changes -->
                <div class="space-y-4">
                  {#if amendmentDetails.changes.oldAddressData && amendmentDetails.changes.newAddressData}
                    {#each amendmentDetails.changes.oldAddressData.Addresses as _, index}
                      <div>
                        <div class="font-semibold text-sm text-gray-700 mb-3">Applicant {index + 1}:</div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div class="border rounded-lg p-4 bg-red-50">
                            <h3 class="font-semibold mb-3 flex items-center gap-2">
                              <Icon icon="mdi:map-marker-minus" class="text-red-600" />
                              Old Details
                            </h3>
                            <div class="space-y-2 text-sm">
                              <div><strong>Address:</strong> {amendmentDetails.changes.oldAddressData.Addresses[index] || "N/A"}</div>
                              <div><strong>City:</strong> {amendmentDetails.changes.oldAddressData.Cities[index] || "N/A"}</div>
                              <div><strong>State:</strong> {amendmentDetails.changes.oldAddressData.States[index] || "N/A"}</div>
                              <div><strong>Country:</strong> {amendmentDetails.changes.oldAddressData.Nationalities[index] || "N/A"}</div>
                              <div><strong>Email:</strong> {amendmentDetails.changes.oldAddressData.Emails[index] || "N/A"}</div>
                              <div><strong>Phone:</strong> {amendmentDetails.changes.oldAddressData.Phones[index] || "N/A"}</div>
                            </div>
                          </div>
                          <div class="border rounded-lg p-4 bg-green-50">
                            <h3 class="font-semibold mb-3 flex items-center gap-2">
                              <Icon icon="mdi:map-marker-plus" class="text-green-600" />
                              New Details
                            </h3>
                            <div class="space-y-2 text-sm">
                              <div><strong>Address:</strong> {amendmentDetails.changes.newAddressData.Addresses[index] || "N/A"}</div>
                              <div><strong>City:</strong> {amendmentDetails.changes.newAddressData.Cities[index] || "N/A"}</div>
                              <div><strong>State:</strong> {amendmentDetails.changes.newAddressData.States[index] || "N/A"}</div>
                              <div><strong>Country:</strong> {amendmentDetails.changes.newAddressData.Nationalities[index] || "N/A"}</div>
                              <div><strong>Email:</strong> {amendmentDetails.changes.newAddressData.Emails[index] || "N/A"}</div>
                              <div><strong>Phone:</strong> {amendmentDetails.changes.newAddressData.Phones[index] || "N/A"}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    {/each}
                  {/if}
                </div>
              {:else if amendmentDetails.amendmentType === 'FileTitle'}
                <!-- File Title and Abstract Changes -->
                <div class="space-y-4">
                  {#if amendmentDetails.changes.oldTitleData && amendmentDetails.changes.newTitleData}
                    <!-- Title Change -->
                    <div>
                      <div class="font-semibold text-sm text-gray-700 mb-3">Title Change:</div>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="border rounded-lg p-4 bg-red-50">
                          <h3 class="font-semibold mb-3 flex items-center gap-2">
                            <Icon icon="mdi:text-box-minus" class="text-red-600" />
                            Old Details
                          </h3>
                          <div class="text-sm">
                            {amendmentDetails.changes.oldTitleData.Title || "N/A"}
                          </div>
                        </div>
                        <div class="border rounded-lg p-4 bg-green-50">
                          <h3 class="font-semibold mb-3 flex items-center gap-2">
                            <Icon icon="mdi:text-box-plus" class="text-green-600" />
                            New Details
                          </h3>
                          <div class="text-sm">
                            {amendmentDetails.changes.newTitleData.Title || "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Abstract Change -->
                    <div>
                      <div class="font-semibold text-sm text-gray-700 mb-3">Abstract Change:</div>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="border rounded-lg p-4 bg-red-50">
                          <h3 class="font-semibold mb-3 flex items-center gap-2">
                            <Icon icon="mdi:file-document-minus" class="text-red-600" />
                            Old Details
                          </h3>
                          <div class="text-sm whitespace-pre-wrap">
                            {amendmentDetails.changes.oldTitleData.Abstract || "N/A"}
                          </div>
                        </div>
                        <div class="border rounded-lg p-4 bg-green-50">
                          <h3 class="font-semibold mb-3 flex items-center gap-2">
                            <Icon icon="mdi:file-document-plus" class="text-green-600" />
                            New Details
                          </h3>
                          <div class="text-sm whitespace-pre-wrap">
                            {amendmentDetails.changes.newTitleData.Abstract || "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Application Type Change -->
                    {#if amendmentDetails.changes.oldTitleData.ApplicationType || amendmentDetails.changes.newTitleData.ApplicationType}
                      <div>
                        <div class="font-semibold text-sm text-gray-700 mb-3">Application Type Change:</div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div class="border rounded-lg p-4 bg-red-50">
                            <h3 class="font-semibold mb-3 flex items-center gap-2">
                              <Icon icon="mdi:tag-minus" class="text-red-600" />
                              Old Details
                            </h3>
                            <div class="text-sm">
                              {amendmentDetails.changes.oldTitleData.ApplicationType || "N/A"}
                            </div>
                          </div>
                          <div class="border rounded-lg p-4 bg-green-50">
                            <h3 class="font-semibold mb-3 flex items-center gap-2">
                              <Icon icon="mdi:tag-plus" class="text-green-600" />
                              New Details
                            </h3>
                            <div class="text-sm">
                              {amendmentDetails.changes.newTitleData.ApplicationType || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    {/if}
                  {/if}
                </div>
              {:else if amendmentDetails.amendmentType === 'AddOrRemoveApplicant' || amendmentDetails.amendmentType === 'AddAndRemoveApplicant'}
                <!-- Add/Remove Applicant Changes -->
                <div class="space-y-4">
                  {#if amendmentDetails.changes.newApplicantData}
                    
                    <!-- Edited Applicants -->
                    {#if amendmentDetails.changes.newApplicantData.EditedApplicants && amendmentDetails.changes.newApplicantData.EditedApplicants.length > 0}
                      <div>
                        <div class="font-semibold text-sm text-gray-700 mb-3">Edited Applicants:</div>
                        <div class="space-y-4">
                          {#each amendmentDetails.changes.newApplicantData.EditedApplicants as editedApplicant, index}
                            {@const oldApplicant = amendmentDetails.changes.oldApplicants?.find(a => a.id === editedApplicant.id)}
                            <div>
                              <div class="text-sm text-gray-600 mb-2 font-medium">Applicant {index + 1}:</div>
                              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="border rounded-lg p-4 bg-red-50">
                                  <h3 class="font-semibold mb-3 flex items-center gap-2">
                                    <Icon icon="mdi:account-minus" class="text-red-600" />
                                    Old Details
                                  </h3>
                                  <div class="space-y-2 text-sm">
                                    <div><strong>Name:</strong> {oldApplicant?.name || "N/A"}</div>
                                    <div><strong>Email:</strong> {oldApplicant?.email || "N/A"}</div>
                                    <div><strong>Phone:</strong> {oldApplicant?.phone || "N/A"}</div>
                                    <div><strong>Address:</strong> {oldApplicant?.address || "N/A"}</div>
                                    <div><strong>City:</strong> {oldApplicant?.city || "N/A"}</div>
                                    <div><strong>State:</strong> {oldApplicant?.state || "N/A"}</div>
                                    <div><strong>Country:</strong> {oldApplicant?.country || "N/A"}</div>
                                  </div>
                                </div>
                                <div class="border rounded-lg p-4 bg-green-50">
                                  <h3 class="font-semibold mb-3 flex items-center gap-2">
                                    <Icon icon="mdi:account-plus" class="text-green-600" />
                                    New Details
                                  </h3>
                                  <div class="space-y-2 text-sm">
                                    <div><strong>Name:</strong> {editedApplicant.Name || "N/A"}</div>
                                    <div><strong>Email:</strong> {editedApplicant.Email || "N/A"}</div>
                                    <div><strong>Phone:</strong> {editedApplicant.Phone || "N/A"}</div>
                                    <div><strong>Address:</strong> {editedApplicant.Address || "N/A"}</div>
                                    <div><strong>City:</strong> {editedApplicant.city || "N/A"}</div>
                                    <div><strong>State:</strong> {editedApplicant.State || "N/A"}</div>
                                    <div><strong>Country:</strong> {editedApplicant.country || "N/A"}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/if}
                    
                    <!-- Removed Applicants -->
                    {#if amendmentDetails.changes.newApplicantData.RemoveIds && amendmentDetails.changes.newApplicantData.RemoveIds.length > 0}
                      <div class="border rounded-lg p-4 bg-red-50">
                        <h3 class="font-semibold mb-3 flex items-center gap-2">
                          <Icon icon="mdi:account-minus" class="text-red-600" />
                          Removed Applicants
                        </h3>
                        <div class="space-y-3">
                          {#each amendmentDetails.changes.newApplicantData.RemoveIds as removedId}
                            {@const removedApplicant = amendmentDetails.changes.oldApplicants?.find(a => a.id === removedId)}
                            {#if removedApplicant}
                              <div class="p-3 bg-white rounded border text-sm space-y-1">
                                <div><strong>Name:</strong> {removedApplicant.name}</div>
                                <div><strong>Email:</strong> {removedApplicant.email || "N/A"}</div>
                                <div><strong>Phone:</strong> {removedApplicant.phone || "N/A"}</div>
                                <div><strong>Address:</strong> {removedApplicant.address || "N/A"}</div>
                                <div><strong>Country:</strong> {removedApplicant.country || "N/A"}</div>
                              </div>
                            {/if}
                          {/each}
                        </div>
                      </div>
                    {/if}
                    
                    <!-- New Applicants -->
                    {#if amendmentDetails.changes.newApplicantData.NewApplicants && amendmentDetails.changes.newApplicantData.NewApplicants.length > 0}
                      <div class="border rounded-lg p-4 bg-green-50">
                        <h3 class="font-semibold mb-3 flex items-center gap-2">
                          <Icon icon="mdi:account-plus" class="text-green-600" />
                          Added Applicants
                        </h3>
                        <div class="space-y-3">
                          {#each amendmentDetails.changes.newApplicantData.NewApplicants as newApplicant}
                            <div class="p-3 bg-white rounded border text-sm space-y-1">
                              <div><strong>Name:</strong> {newApplicant.Name}</div>
                              <div><strong>Email:</strong> {newApplicant.Email || "N/A"}</div>
                              <div><strong>Phone:</strong> {newApplicant.Phone || "N/A"}</div>
                              <div><strong>Address:</strong> {newApplicant.Address || "N/A"}</div>
                              <div><strong>City:</strong> {newApplicant.city || "N/A"}</div>
                              <div><strong>State:</strong> {newApplicant.State || "N/A"}</div>
                              <div><strong>Country:</strong> {newApplicant.country || "N/A"}</div>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  {/if}
                </div>
              {:else if amendmentDetails.amendmentType === 'EditInventors'}
                <!-- Inventor Changes -->
                <div class="space-y-4">
                  {#if amendmentDetails.changes.oldInventors && amendmentDetails.changes.newInventors}
                    {@const oldInventors = amendmentDetails.changes.oldInventors}
                    {@const newInventors = amendmentDetails.changes.newInventors}
                    {@const editedInventors = newInventors.filter(n => n.id && oldInventors.some(o => o.id === n.id))}
                    {@const removedInventors = oldInventors.filter(o => !newInventors.some(n => n.id === o.id))}
                    {@const addedInventors = newInventors.filter(n => !n.id || !oldInventors.some(o => o.id === n.id))}
                    
                    <!-- Edited Inventors -->
                    {#if editedInventors.length > 0}
                      <div>
                        <div class="font-semibold text-sm text-gray-700 mb-3">Edited Inventors:</div>
                        <div class="space-y-4">
                          {#each editedInventors as newInventor, index}
                            {@const oldInventor = oldInventors.find(o => o.id === newInventor.id)}
                            <div>
                              <div class="text-sm text-gray-600 mb-2 font-medium">Inventor {index + 1}:</div>
                              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="border rounded-lg p-4 bg-red-50">
                                  <h3 class="font-semibold mb-3 flex items-center gap-2">
                                    <Icon icon="mdi:lightbulb-minus" class="text-red-600" />
                                    Old Details
                                  </h3>
                                  <div class="space-y-2 text-sm">
                                    <div><strong>Name:</strong> {oldInventor?.name || "N/A"}</div>
                                    <div><strong>Email:</strong> {oldInventor?.email || "N/A"}</div>
                                    <div><strong>Phone:</strong> {oldInventor?.phone || "N/A"}</div>
                                    <div><strong>Address:</strong> {oldInventor?.address || "N/A"}</div>
                                    <div><strong>City:</strong> {oldInventor?.city || "N/A"}</div>
                                    <div><strong>State:</strong> {oldInventor?.state || "N/A"}</div>
                                    <div><strong>Country:</strong> {oldInventor?.country || "N/A"}</div>
                                  </div>
                                </div>
                                <div class="border rounded-lg p-4 bg-green-50">
                                  <h3 class="font-semibold mb-3 flex items-center gap-2">
                                    <Icon icon="mdi:lightbulb-plus" class="text-green-600" />
                                    New Details
                                  </h3>
                                  <div class="space-y-2 text-sm">
                                    <div><strong>Name:</strong> {newInventor.name || "N/A"}</div>
                                    <div><strong>Email:</strong> {newInventor.email || "N/A"}</div>
                                    <div><strong>Phone:</strong> {newInventor.phone || "N/A"}</div>
                                    <div><strong>Address:</strong> {newInventor.address || "N/A"}</div>
                                    <div><strong>City:</strong> {newInventor.city || "N/A"}</div>
                                    <div><strong>State:</strong> {newInventor.state || "N/A"}</div>
                                    <div><strong>Country:</strong> {newInventor.country || "N/A"}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/if}
                    
                    <!-- Removed Inventors -->
                    {#if removedInventors.length > 0}
                      <div class="border rounded-lg p-4 bg-red-50">
                        <h3 class="font-semibold mb-3 flex items-center gap-2">
                          <Icon icon="mdi:lightbulb-minus" class="text-red-600" />
                          Removed Inventors
                        </h3>
                        <div class="space-y-3">
                          {#each removedInventors as inventor}
                            <div class="p-3 bg-white rounded border text-sm space-y-1">
                              <div><strong>Name:</strong> {inventor.name}</div>
                              <div><strong>Email:</strong> {inventor.email || "N/A"}</div>
                              <div><strong>Phone:</strong> {inventor.phone || "N/A"}</div>
                              <div><strong>Address:</strong> {inventor.address || "N/A"}</div>
                              <div><strong>Country:</strong> {inventor.country || "N/A"}</div>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/if}
                    
                    <!-- Added Inventors -->
                    {#if addedInventors.length > 0}
                      <div class="border rounded-lg p-4 bg-green-50">
                        <h3 class="font-semibold mb-3 flex items-center gap-2">
                          <Icon icon="mdi:lightbulb-plus" class="text-green-600" />
                          Added Inventors
                        </h3>
                        <div class="space-y-3">
                          {#each addedInventors as inventor}
                            <div class="p-3 bg-white rounded border text-sm space-y-1">
                              <div><strong>Name:</strong> {inventor.name}</div>
                              <div><strong>Email:</strong> {inventor.email || "N/A"}</div>
                              <div><strong>Phone:</strong> {inventor.phone || "N/A"}</div>
                              <div><strong>Address:</strong> {inventor.address || "N/A"}</div>
                              <div><strong>City:</strong> {inventor.city || "N/A"}</div>
                              <div><strong>State:</strong> {inventor.state || "N/A"}</div>
                              <div><strong>Country:</strong> {inventor.country || "N/A"}</div>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  {/if}
                </div>
              {:else if amendmentDetails.amendmentType === 'PriorityInfo'}
                <!-- Priority Information Changes -->
                <div class="space-y-4">
                  {#if amendmentDetails.changes.oldPriorityData && amendmentDetails.changes.newPriorityData}
                    
                    <!-- First Priority Information -->
                    {#if amendmentDetails.changes.oldPriorityData.FirstPriorityInfo?.length > 0 || amendmentDetails.changes.newPriorityData.FirstPriorityInfo?.length > 0}
                      <div>
                        <div class="font-semibold text-sm text-gray-700 mb-3">First Priority Information:</div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div class="border rounded-lg p-4 bg-red-50">
                            <h3 class="font-semibold mb-3 flex items-center gap-2">
                              <Icon icon="mdi:flag-minus" class="text-red-600" />
                              Old Details
                            </h3>
                            <div class="space-y-3">
                              {#if amendmentDetails.changes.oldPriorityData.FirstPriorityInfo?.length > 0}
                                {#each amendmentDetails.changes.oldPriorityData.FirstPriorityInfo as priority}
                                  <div class="p-3 bg-white rounded border text-sm space-y-1">
                                    <div><strong>Number:</strong> {priority.number || "N/A"}</div>
                                    <div><strong>Date:</strong> {priority.Date || "N/A"}</div>
                                    <div><strong>Country:</strong> {priority.Country || "N/A"}</div>
                                  </div>
                                {/each}
                              {:else}
                                <div class="text-sm text-gray-500">No first priority information</div>
                              {/if}
                            </div>
                          </div>
                          <div class="border rounded-lg p-4 bg-green-50">
                            <h3 class="font-semibold mb-3 flex items-center gap-2">
                              <Icon icon="mdi:flag-plus" class="text-green-600" />
                              New Details
                            </h3>
                            <div class="space-y-3">
                              {#if amendmentDetails.changes.newPriorityData.FirstPriorityInfo?.length > 0}
                                {#each amendmentDetails.changes.newPriorityData.FirstPriorityInfo as priority}
                                  <div class="p-3 bg-white rounded border text-sm space-y-1">
                                    <div><strong>Number:</strong> {priority.number || "N/A"}</div>
                                    <div><strong>Date:</strong> {priority.Date || "N/A"}</div>
                                    <div><strong>Country:</strong> {priority.Country || "N/A"}</div>
                                  </div>
                                {/each}
                              {:else}
                                <div class="text-sm text-gray-500">No first priority information</div>
                              {/if}
                            </div>
                          </div>
                        </div>
                      </div>
                    {/if}

                    <!-- Priority Information List -->
                    {#if amendmentDetails.changes.oldPriorityData.PriorityInfo?.length > 0 || amendmentDetails.changes.newPriorityData.PriorityInfo?.length > 0}
                      <div>
                        <div class="font-semibold text-sm text-gray-700 mb-3">Priority Information List:</div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div class="border rounded-lg p-4 bg-red-50">
                            <h3 class="font-semibold mb-3 flex items-center gap-2">
                              <Icon icon="mdi:flag-minus" class="text-red-600" />
                              Old Details
                            </h3>
                            <div class="space-y-3">
                              {#if amendmentDetails.changes.oldPriorityData.PriorityInfo?.length > 0}
                                {#each amendmentDetails.changes.oldPriorityData.PriorityInfo as priority, index}
                                  <div class="p-3 bg-white rounded border text-sm">
                                    <div class="font-medium text-gray-700 mb-2">Priority {index + 1}</div>
                                    <div class="space-y-1">
                                      <div><strong>Number:</strong> {priority.number || "N/A"}</div>
                                      <div><strong>Date:</strong> {priority.Date || "N/A"}</div>
                                      <div><strong>Country:</strong> {priority.Country || "N/A"}</div>
                                    </div>
                                  </div>
                                {/each}
                              {:else}
                                <div class="text-sm text-gray-500">No priority information</div>
                              {/if}
                            </div>
                          </div>
                          <div class="border rounded-lg p-4 bg-green-50">
                            <h3 class="font-semibold mb-3 flex items-center gap-2">
                              <Icon icon="mdi:flag-plus" class="text-green-600" />
                              New Details
                            </h3>
                            <div class="space-y-3">
                              {#if amendmentDetails.changes.newPriorityData.PriorityInfo?.length > 0}
                                {#each amendmentDetails.changes.newPriorityData.PriorityInfo as priority, index}
                                  <div class="p-3 bg-white rounded border text-sm">
                                    <div class="font-medium text-gray-700 mb-2">Priority {index + 1}</div>
                                    <div class="space-y-1">
                                      <div><strong>Number:</strong> {priority.number || "N/A"}</div>
                                      <div><strong>Date:</strong> {priority.Date || "N/A"}</div>
                                      <div><strong>Country:</strong> {priority.Country || "N/A"}</div>
                                    </div>
                                  </div>
                                {/each}
                              {:else}
                                <div class="text-sm text-gray-500">No priority information</div>
                              {/if}
                            </div>
                          </div>
                        </div>
                      </div>
                    {/if}
                  {/if}
                </div>
              {:else if amendmentDetails.amendmentType === 'CorrespondenceInformation'}
                <!-- Correspondence Information Changes -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="border rounded-lg p-4 bg-red-50">
                    <h3 class="font-semibold mb-3 flex items-center gap-2">
                      <Icon icon="mdi:email-minus" class="text-red-600" />
                      Old Details
                    </h3>
                    <div class="space-y-2 text-sm">
                      {#if amendmentDetails.changes.oldCorrespondence}
                        <div><strong>Name:</strong> {amendmentDetails.changes.oldCorrespondence.Name || "N/A"}</div>
                        <div><strong>Email:</strong> {amendmentDetails.changes.oldCorrespondence.Email || "N/A"}</div>
                        <div><strong>Phone:</strong> {amendmentDetails.changes.oldCorrespondence.Phone || "N/A"}</div>
                        <div><strong>Address:</strong> {amendmentDetails.changes.oldCorrespondence.Address || "N/A"}</div>
                        <div><strong>State:</strong> {amendmentDetails.changes.oldCorrespondence.State || "N/A"}</div>
                        <div><strong>Nationality:</strong> {amendmentDetails.changes.oldCorrespondence.Nationality || "N/A"}</div>
                      {:else}
                        N/A
                      {/if}
                    </div>
                  </div>
                  <div class="border rounded-lg p-4 bg-green-50">
                    <h3 class="font-semibold mb-3 flex items-center gap-2">
                      <Icon icon="mdi:email-plus" class="text-green-600" />
                      New Details
                    </h3>
                    <div class="space-y-2 text-sm">
                      {#if amendmentDetails.changes.newCorrespondence}
                        <div><strong>Name:</strong> {amendmentDetails.changes.newCorrespondence.Name || "N/A"}</div>
                        <div><strong>Email:</strong> {amendmentDetails.changes.newCorrespondence.Email || "N/A"}</div>
                        <div><strong>Phone:</strong> {amendmentDetails.changes.newCorrespondence.Phone || "N/A"}</div>
                        <div><strong>Address:</strong> {amendmentDetails.changes.newCorrespondence.Address || "N/A"}</div>
                        <div><strong>State:</strong> {amendmentDetails.changes.newCorrespondence.State || "N/A"}</div>
                        <div><strong>Nationality:</strong> {amendmentDetails.changes.newCorrespondence.Nationality || "N/A"}</div>
                      {:else}
                        N/A
                      {/if}
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/if}

          <!-- Comment Section -->
          <div class="mb-4">
            <Label for="decision-comment" class="block font-medium mb-1">
              Decision Comment: {#if !isReadOnly}<span class="text-red-500">*</span>{/if}
            </Label>
            <Textarea
              id="decision-comment"
              bind:value={comment}
              rows={3}
              class="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200"
              placeholder="Enter your review comment and decision reason..."
              required
              disabled={isReadOnly}
            />
            {#if isReadOnly}
              <p class="text-sm text-gray-500 mt-1">This amendment has already been processed.</p>
            {/if}
          </div>

          <!-- Action Buttons -->
          {#if !isReadOnly}
          <div class="flex gap-4 mt-4 justify-end">
            <Button
              class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded shadow disabled:opacity-50 transition"
              on:click={() => handleAmendmentDecision(true)}
              disabled={submitting || !comment.trim()}
            >
              {#if submitting}
                <Icon
                  icon="line-md:loading-loop"
                  width="1.2em"
                  height="1.2em"
                  class="inline mr-1 animate-spin"
                />
              {/if}
              Approve Amendment
            </Button>
            <Button
              class="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded shadow disabled:opacity-50 transition"
              on:click={() => handleAmendmentDecision(false)}
              disabled={submitting || !comment.trim()}
            >
              {#if submitting}
                <Icon
                  icon="line-md:loading-loop"
                  width="1.2em"
                  height="1.2em"
                  class="inline mr-1 animate-spin"
                />
              {/if}
              Reject Amendment
            </Button>
          </div>
          {/if}
        </div>
      {/if}
    </div>

    <Dialog.Footer class="flex-shrink-0 mt-4 flex justify-end px-4 pb-4 border-t bg-gray-50">
      <Button on:click={closeDialog} variant="outline">
        Close
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

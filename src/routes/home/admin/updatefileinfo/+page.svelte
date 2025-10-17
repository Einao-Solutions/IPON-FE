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
      // // ...existing code...
      // const validPatentTypes = ["Patent", "Business_Method", "Utility_Model"];
      // if (
      //   filing.patentApplicationType &&
      //   !validPatentTypes.includes(filing.patentApplicationType)
      // ) {
      //   filing.patentApplicationType = null;
      // }
      // // ...existing code...
      filing.updatedBy = userName;
      const res = await fetch(`${baseURL}/api/files/update-filing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filing),
      });

      if (!res.ok) throw new Error('Update failed');
    
      //toast.success('File updated successfully');

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
      <!-- File Metadata Section -->
      <details class="border rounded p-3 mb-4 open">
        <summary class="font-normal cursor-pointer">File Metadata</summary>
        <div class="grid gap-2 mt-2">
          <label>Last Request Date</label>
          <input class="input" bind:value={filing.lastRequestDate} placeholder="Last Request Date" />

          <label>Creator Account</label>
          <input class="input" bind:value={filing.creatorAccount} placeholder="Creator Account" />

          <label>File Status</label>
          <input class="input" bind:value={filing.fileStatus} placeholder="File Status" />

          <label>Date Created</label>
          <input class="input" bind:value={filing.dateCreated} placeholder="Date Created" />

          <label>Type</label>
          <input class="input" bind:value={filing.type} placeholder="Type" />

          <label>Title of Invention</label>
          <input class="input" bind:value={filing.titleOfInvention} placeholder="Title of Invention" />

          <label>Patent Abstract</label>
          <textarea class="input" bind:value={filing.patentAbstract} placeholder="Patent Abstract" />
        </div>
      </details>

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

      <!-- Last Request Date -->
      <details class="border rounded p-3 mb-4 open">
        <summary class="font-normal cursor-pointer">Last Request</summary>
        <div class="grid gap-2 mt-2">
          <label class="text-sm font-medium">Last Request Date</label>
          <input class="input" type="date" bind:value={filing.lastRequest} />
        </div>
      </details>

      <!-- Applicants -->
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

                <label class="block text-sm">Country</label>
                <input class="input" bind:value={applicant.country} placeholder="Country" />

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


      <!-- Patent Application Type -->
      <details class="border rounded p-3 mb-4 open">
        <summary class="font-normal cursor-pointer">Patent Application Type</summary>
        <div class="grid gap-2 mt-2">
          <label class="text-sm font-medium">Select Type</label>
          <select class="input" bind:value={filing.patentApplicationType}>
            <option value={null} disabled selected>Select...</option>
            <option value="Patent">Patent</option>
            <option value="Business_Method">Business_Method</option>
            <option value="Utility_Model">Utility_Model</option>
          </select>
        </div>
      </details>

      <!-- Revisions -->
      <details class="border rounded p-3 mb-4 open">
        <summary class="font-normal cursor-pointer">Revisions</summary>
        <div class="grid gap-4 mt-2">
          {#each filing.revisions as revision, index (revision.id)}
            <div class="border p-3 rounded space-y-2 bg-gray-50">
              <label class="text-sm font-normal">Revision {index + 1}</label>
              <input class="input" bind:value={revision.description} placeholder="Description" />
              <input class="input" type="date" bind:value={revision.date} placeholder="Date" />
              <!-- <Button variant="destructive" on:click={() => filing.revisions.splice(index, 1)}>Remove</Button> -->
            </div>
          {/each}
        </div>
      </details>

      <!-- Patent Type -->
      <details class="border rounded p-3 mb-4 open">
        <summary class="font-normal cursor-pointer">Patent Type</summary>
        <div class="grid gap-2 mt-2">
          <label class="text-sm font-medium">Select Type</label>
          <select class="input" bind:value={filing.patentType}>
            <option value={null} disabled selected>Select...</option>
            <option value="Patent">Patent</option>
            <option value="Design">Design</option>
            <option value="TradeMark">TradeMark</option>
          </select>
        </div>
      </details>

      <!-- Inventors -->
      <details class="border rounded p-3 mb-4 open">
        <summary class="font-normal cursor-pointer">Inventors</summary>
        <div class="grid gap-4 mt-2">
          {#each filing.inventors as inventor, index (inventor.id)}
            <div class="border p-3 rounded space-y-2 bg-gray-50">
              <label class="text-sm font-normal">Inventor {index + 1}</label>
              <input class="input" bind:value={inventor.name} placeholder="Name" />
              <input class="input" bind:value={inventor.country} placeholder="Country" />
              <input class="input" bind:value={inventor.city} placeholder="City" />
              <input class="input" bind:value={inventor.phone} placeholder="Phone" />
              <input class="input" bind:value={inventor.email} placeholder="Email" />
              <input class="input" bind:value={inventor.address} placeholder="Address" />
            </div>
          {/each}
        </div>
      </details>

      <!-- Priority Info -->
      <details class="border rounded p-3 mb-4 open">
        <summary class="font-normal cursor-pointer">Priority Info</summary>
        <div class="grid gap-4 mt-2">
          {#each filing.priorityInfo as priority, index (priority.id)}
            <div class="border p-3 rounded space-y-2 bg-gray-50">
              <label class="text-sm font-normal">Priority {index + 1}</label>
              <input class="input" bind:value={priority.country} placeholder="Country" />
              <input class="input" bind:value={priority.filingNumber} placeholder="Filing Number" />
              <input class="input" type="date" bind:value={priority.filingDate} placeholder="Filing Date" />
            </div>
          {/each}
        </div>
      </details>

  
      <details class="border rounded p-3 mb-4 open">
        <summary class="font-normal cursor-pointer">Design Type</summary>
        <div class="grid gap-2 mt-2">
          <label class="text-sm font-medium">Select Design Type</label>
          <select class="input" bind:value={filing.designType}>
            <option value={null} disabled selected>Select...</option>
            <option value="Textile">Textile</option>
            <option value="NonTextile">NonTextile</option>
          </select>
        </div>
      </details>

      <!-- Title of Design -->
      <details class="border rounded p-3 mb-4 open">
        <summary class="font-normal cursor-pointer">Title of Design</summary>
        <div class="grid gap-2 mt-2">
          <label class="text-sm font-medium">Title</label>
          <input class="input" bind:value={filing.titleOfDesign} placeholder="Enter Design Title" />
        </div>
      </details>

      <!-- Statement of Novelty -->
      <details class="border rounded p-3 mb-4 open">
        <summary class="font-normal cursor-pointer">Statement of Novelty</summary>
        <div class="grid gap-2 mt-2">
          <label class="text-sm font-medium">Novelty Statement</label>
          <textarea class="input" rows="3" bind:value={filing.statementOfNovelty} placeholder="Enter novelty statement" />
        </div>
      </details>

      <!-- Design Creators -->
      <details class="border rounded p-3 mb-4 open">
        <summary class="font-normal cursor-pointer">Design Creators</summary>
        <div class="grid gap-4 mt-2">
          {#each filing.designCreators as creator, index (creator.id)}
            <div class="border p-3 rounded space-y-2 bg-gray-50">
              <label class="text-sm font-normal">Creator {index + 1}</label>
              <input class="input" bind:value={creator.name} placeholder="Name" />
              <input class="input" bind:value={creator.country} placeholder="Country" />
              <input class="input" bind:value={creator.city} placeholder="City" />
              <input class="input" bind:value={creator.phone} placeholder="Phone" />
              <input class="input" bind:value={creator.email} placeholder="Email" />
              <input class="input" bind:value={creator.address} placeholder="Address" />
              <!-- <Button variant="destructive" on:click={() => filing.designCreators.splice(index, 1)}>Remove</Button> -->
            </div>
          {/each}
        </div>
      </details>

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

      <!-- Field Status Section -->
      <details class="border rounded p-3 mb-4 open">
        <summary class="font-normal cursor-pointer">Field Status</summary>
        <div class="grid gap-4 mt-2">
          {#each Object.entries(filing.fieldStatus) as [key, value], index (key)}
            <div class="grid gap-2">
              <label class="text-sm font-normal">{key}</label>
              <select class="input" bind:value={filing.fieldStatus[key]}>
                <option disabled value="">Select Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="AwaitingPayment">Awaiting Payment</option>
                <option value="AwaitingSearch">Awaiting Search</option>
                <option value="AwaitingExaminer">Awaiting Examiner</option>
                <option value="RejectedByExaminer">Rejected By Examiner</option>
                <option value="Re_conduct">Re-conduct</option>
                <option value="FormalityFail">Formality Fail</option>
                <option value="KivSearch">KIV Search</option>
                <option value="KivExaminer">KIV Examiner</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="None">None</option>
                <option value="AutoApproved">Auto Approved</option>
                <option value="Publication">Publication</option>
                <option value="Opposition">Opposition</option>
                <option value="AwaitingResponse">Awaiting Response</option>
                <option value="AwaitingOppositionStaff">Awaiting Opposition Staff</option>
                <option value="AwaitingResolution">Awaiting Resolution</option>
                <option value="Resolved">Resolved</option>
                <option value="AwaitingCertification">Awaiting Certification</option>
                <option value="AwaitingConfirmation">Awaiting Confirmation</option>
                <option value="AwaitingSave">Awaiting Save</option>
                <option value="AwaitingCertificateConfirmation">Awaiting Certificate Confirmation</option>
                <option value="Withdrawn">Withdrawn</option>
                <option value="AwaitingCertificatePayment">Awaiting Certificate Payment</option>
                <option value="AwaitingRecordalProcess">Awaiting Recordal Process</option>
              </select>
            </div>
          {/each}
        </div>
      </details>

        <!-- Application History Section -->
        <!-- <details class="border rounded p-3 mb-4 open">
          <summary class="font-normal cursor-pointer">Application History</summary>
          <div class="space-y-4 mt-2">
            {#each filing.applicationHistory as history (history.id)}
              <div class="border p-3 rounded bg-gray-50 space-y-2">
                <label class="block text-sm font-medium">Application Type</label>
                <input class="input" bind:value={history.applicationType} />

                <label class="block text-sm font-medium">Current Status</label>
                <input class="input" bind:value={history.currentStatus} />

                <label class="block text-sm font-medium">Expiry Date</label>
                <input class="input" type="date" bind:value={history.expiryDate} />

                <label class="block text-sm font-medium">Payment ID</label>
                <input class="input" bind:value={history.paymentId} />

                <label class="block text-sm font-medium">Certificate Payment ID</label>
                <input class="input" bind:value={history.certificatePaymentId} />

                <label class="block text-sm font-medium">Application Date</label>
                <input class="input" type="datetime-local" bind:value={history.applicationDate} />

                <label class="block text-sm font-medium">License Type</label>
                <input class="input" bind:value={history.licenseType} />

                <label class="block text-sm font-medium">Old Value</label>
                <textarea class="input" bind:value={history.oldValue} />

                <label class="block text-sm font-medium">New Value</label>
                <textarea class="input" bind:value={history.newValue} />

                <label class="block text-sm font-medium">Field To Change</label>
                <input class="input" bind:value={history.fieldToChange} />

              
                <div>
                  <label class="block text-sm font-medium">Status History</label>
                  <ul class="list-disc list-inside text-sm">
                    {#each history.statusHistory as status}
                      <li>
                        <span class="font-normal">{status.date}</span> – {status.message} (by {status.user})
                      </li>
                    {/each}
                  </ul>
                </div>

                 
                <div>
                  <label class="block text-sm font-medium">Application Letters</label>
                  <div class="flex flex-wrap gap-2">
                    {#each history.applicationLetters as letter}
                      <span class="bg-gray-200 px-2 py-1 rounded text-xs">{letter}</span>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </details> -->

      <!-- Trademark Info Section -->
      <details class="border rounded p-3 mb-4 open">
        <summary class="font-normal cursor-pointer">Trademark Info</summary>
        <div class="grid gap-2 mt-2">
          <label>
            Title of Trademark
            <input class="input" bind:value={filing.titleOfTradeMark} placeholder="Title of Trademark" />
          </label>

          <label>
            Trademark Class
            <input class="input" type="number" bind:value={filing.trademarkClass} placeholder="Trademark Class" />
          </label>

          <label>
            Trademark Class Description
            <textarea class="input" bind:value={filing.trademarkClassDescription} placeholder="Trademark Class Description" />
          </label>

          <label>
            Trademark Logo
            <select class="input" bind:value={filing.trademarkLogo}>
              <option value={0}>Device</option>
              <option value={1}>WordMark</option>
              <option value={2}>Word and Device</option>
            </select>
          </label>

          <label>
            Trademark Type
            <select class="input" bind:value={filing.trademarkType}>
              <option value={0}>Local</option>
              <option value={1}>Foreign</option>
            </select>
          </label>

          <label>
            Trademark Disclaimer
            <input class="input" bind:value={filing.trademarkDisclaimer} placeholder="Trademark Disclaimer" />
          </label>

          <label>
            RTM Number
            <input class="input" bind:value={filing.rtmNumber} placeholder="RTM Number" />
          </label>

          <label>
            Comment
            <textarea class="input" bind:value={filing.comment} placeholder="Comment" />
          </label>
        </div>
      </details>

      <!-- Registered Users -->
      <details class="border rounded p-3 mb-4">
        <summary class="font-normal cursor-pointer">Registered Users</summary>
        {#each filing.registered_Users as user, i}
          <div class="grid gap-2 mb-3 p-2 border rounded">
            <label>Name <input class="input" bind:value={user.name} /></label>
            <label>Address <input class="input" bind:value={user.address} /></label>
            <label>Email <input class="input" bind:value={user.email} /></label>
            <label>Phone <input class="input" bind:value={user.phone} /></label>
            <label>Nationality <input class="input" bind:value={user.nationality} /></label>
            <label>Is Approved
              <select class="input" bind:value={user.isApproved}>
                <option value={true}>Yes</option>
                <option value={false}>No</option>
              </select>
            </label>
          </div>
        {/each}
      </details>

      <!-- RegisteredUsers -->
      <details class="border rounded p-3 mb-4">
        <summary class="font-normal cursor-pointer">Registered Users (Alt)</summary>
        {#each filing.registeredUsers as user, i}
          <div class="grid gap-2 mb-3 p-2 border rounded">
            <label>Name <input class="input" bind:value={user.name} /></label>
            <label>Address <input class="input" bind:value={user.address} /></label>
            <label>Email <input class="input" bind:value={user.email} /></label>
            <label>Phone <input class="input" bind:value={user.phone} /></label>
            <label>Nationality <input class="input" bind:value={user.nationality} /></label>
            <label>Is Approved
              <select class="input" bind:value={user.isApproved}>
                <option value={true}>Yes</option>
                <option value={false}>No</option>
              </select>
            </label>
          </div>
        {/each}
      </details>

      <!-- Assignees -->
      <details class="border rounded p-3 mb-4">
        <summary class="font-normal cursor-pointer">Assignees</summary>
        {#each filing.assignees as assign, i}
          <div class="grid gap-2 mb-3 p-2 border rounded">
            <label>Name <input class="input" bind:value={assign.name} /></label>
            <label>Address <input class="input" bind:value={assign.address} /></label>
            <label>Email <input class="input" bind:value={assign.email} /></label>
            <label>Phone <input class="input" bind:value={assign.phone} /></label>
            <label>Nationality <input class="input" bind:value={assign.nationality} /></label>
            <label>RRR <input class="input" bind:value={assign.rrr} /></label>
            <label>Authorization Letter URL <input class="input" bind:value={assign.authorizationLetterUrl} /></label>
            <label>Assignment Deed URL <input class="input" bind:value={assign.assignmentDeedUrl} /></label>
            <label>Is Approved
              <select class="input" bind:value={assign.isApproved}>
                <option value={true}>Yes</option>
                <option value={false}>No</option>
              </select>
            </label>
          </div>
        {/each}
      </details>

      <!-- Post Registration Applications -->
      <details class="border rounded p-3 mb-4">
        <summary class="font-normal cursor-pointer">Post Registration Applications</summary>
        {#each filing.postRegApplications as post, i}
          <div class="grid gap-2 mb-3 p-2 border rounded">
            <label>Recordal Type <input class="input" bind:value={post.recordalType} /></label>
            <label>File Number <input class="input" bind:value={post.fileNumber} /></label>
            <label>Filing Date <input class="input" bind:value={post.filingDate} type="date" /></label>
            <label>Date Treated <input class="input" bind:value={post.dateTreated} type="date" /></label>
            <label>Reason <input class="input" bind:value={post.reason} /></label>
            <label>Name <input class="input" bind:value={post.name} /></label>
            <label>Email <input class="input" bind:value={post.email} /></label>
            <label>Date of Recordal <input class="input" bind:value={post.dateOfRecordal} type="date" /></label>
            <label>Address <input class="input" bind:value={post.address} /></label>
            <label>Phone <input class="input" bind:value={post.phone} /></label>
            <label>Nationality <input class="input" bind:value={post.nationality} /></label>
            <label>Document URL <input class="input" bind:value={post.documentUrl} /></label>
            <label>Document2 URL <input class="input" bind:value={post.document2Url} /></label>
            <label>Receipt URL <input class="input" bind:value={post.receiptUrl} /></label>
            <label>Certificate URL <input class="input" bind:value={post.certificateUrl} /></label>
            <label>Rejection URL <input class="input" bind:value={post.rejectionUrl} /></label>
            <label>Acknowledgement URL <input class="input" bind:value={post.acknowledgementUrl} /></label>
            <label>Message <textarea class="input" bind:value={post.message} /></label>
            <label>RRR <input class="input" bind:value={post.rrr} /></label>
          </div>
        {/each}
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

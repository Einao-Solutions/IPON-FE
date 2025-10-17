<script lang="ts">
  import { get } from 'svelte/store';
  import { patentForm, goToStep, filesToAttachment } from '$lib/utils/patent';
  import Section from './Section.svelte';
  import { goto } from '$app/navigation';
  import { baseURL, FormApplicationTypes, FilingType, ApplicationStatuses, type PatentData, type Inventor,
     type Applicant } from '$lib/helpers';
  import { applicationData, appattachmentsData } from '$lib/store';

  //let error = '';
  let sectionErrors: Record<string, string> = {};

  function validateForm() {
  const form = get(patentForm);
  sectionErrors = {};

  //const isLocal = form.basicInfo.filingOrigin === 'Local';
  const isForeign = form.basicInfo.filingOrigin === 'Foreign';
  const isConventionalOrPCT =
    form.basicInfo.conventionType === 'Conventional' ||
    form.basicInfo.conventionType === 'PCT';
  const isNonConventional = form.basicInfo.conventionType === 'Non-Conventional';

  // 1. Basic Info (always visible)
  if (
    !form.basicInfo?.applicationType ||
    !form.basicInfo.title ||
    !form.basicInfo.abstract ||
    !form.basicInfo.filingOrigin ||
    !form.basicInfo.country ||
    !form.basicInfo.conventionType
  ) {
    sectionErrors.basicInfo =
      'Please fill all fields in the Patent Information section.';
  } else if (
    isForeign &&
    !['Conventional', 'Non-Conventional', 'PCT'].includes(
      form.basicInfo.conventionType
    )
  ) {
    sectionErrors.basicInfo =
      'Please select a valid Convention Type in Basic Info.';
  }
  // 2. Applicants (always visible)
  if (
    !form.applicantsInfo.length ||
    form.applicantsInfo.some(
      (a) =>
        !a.name ||
        !a.country ||
        !a.state ||
        !a.city ||
        !a.phone ||
        !a.email ||
        !a.address
    )
  ) {
    sectionErrors.applicants =
      'Please fill all fields in the Applicants Information section.';
  }

  // 3. Inventors (always visible)
  if (
    !form.inventors.length ||
    form.inventors.some(
      (i) =>
        !i.name ||
        !i.country ||
        !i.state ||
        !i.city ||
        !i.phone ||
        !i.email ||
        !i.address
    )
  ) {
    sectionErrors.inventors = 'Please fill all fields in the Inventors Information section.';
  }

    // 4. First Priority Information (if applicable)
  if (isForeign && isConventionalOrPCT && showFirstPriorityInfo) {
    if (form.firstPriorityInfo.some((p) => !p.number || !p.Country || !p.Date)) {
      sectionErrors.firstPriority =
        'Please fill all fields in the First Priority Information Section.';
    }
  }

  const c = form.correspondence;
  if (
    !c.name ||
    !c.email ||
    !c.phone ||
    !c.address ||
    !c.state ||
    !c.nationality ||
    !c.phonePrefix
  ) {
    sectionErrors.correspondence =
      'Please fill all fields in the Correspondence Information Section.';
  }


  const att = form.attachments;
  if (!att.cs || att.cs.length === 0 || !att.poa || att.poa.length === 0) {
    sectionErrors.attachments =
      'Please provide all the necessary attachments for the application.';
  }

  return Object.keys(sectionErrors).length === 0;
}

async function submitForm() {
	try {
    let data : PatentData;
		const form = get(patentForm);
    var cookieUser = document.cookie
			.split(';')
			.find((x) => x.startsWith('user=') || x.startsWith(' user='));
		var user = cookieUser.trimStart();
		user = user.slice(5);
		const pp = JSON.parse(decodeURIComponent(user));

	//	Validation check
    if (!validateForm()) return;

    const poa = await filesToAttachment("poa", form.attachments.poa);
    const cs = await filesToAttachment("cs", form.attachments.cs);
    const drawings = await filesToAttachment("drawings", form.attachments.drawings);
    const others = await filesToAttachment("others", form.attachments.others);
    const pct = await filesToAttachment("pct", form.attachments.pct);
    const priorityDocument = await filesToAttachment("priorityDocument", form.attachments.priorityDocument);
    
    const formattedAttachments = [
      ...poa,
      ...cs,
      ...drawings,
      ...priorityDocument,
      ...others,
      ...pct
   ];

		// Prepare data object
		data = {
			type: FilingType.Patent,
			fileStatus: ApplicationStatuses.AwaitingPayment,
			formApplicationType: FormApplicationTypes.NewApplication,
      filingCountry: form.basicInfo?.country,
      fileOrigin: form.basicInfo?.filingOrigin,
			inventors: (form.inventors as Omit<Inventor, 'id'>[]).map((inv) => ({
        id: crypto.randomUUID(),
        ...inv,
         phone: `${inv.phonePrefix}${inv.phone}`
      })) || [],
      patentType: form.basicInfo?.conventionType === 'Conventional'
      ? 0
      : form.basicInfo?.conventionType === 'Non-Conventional'
      ? 1
      : form.basicInfo?.conventionType === 'PCT'
      ? 2
      : null,
			patentBaseType: form.basicInfo?.filingOrigin,

			priorityInfo: (form.priorityInfo || []).map((p) => ({
        id: crypto.randomUUID(),
        number: p.number,
        country: p.Country,
        date: p.Date
      })),

      firstPriorityInfo: (form.firstPriorityInfo || []).map((p) => ({
        id: crypto.randomUUID(),
        number: p.number,
        country: p.Country,
        date: p.Date
      })),

			patentApplicationType:
      form.basicInfo?.applicationType === 'Patent'
        ? 0
        : form.basicInfo?.applicationType === 'Utility Model'
        ? 1
        : form.basicInfo?.applicationType === 'Business Method'
        ? 2
        : null,
			patentAbstract: form.basicInfo?.abstract,
			titleOfInvention: form.basicInfo?.title,
			correspondence: {
        id: crypto.randomUUID(),
        name: form.correspondence.name,
        state: form.correspondence.state,
        address: form.correspondence.address,
        email: form.correspondence.email,
        phone: `${form.correspondence.phonePrefix}${form.correspondence.phone}`,
        nationality: form.correspondence.nationality
      },

			applicants: (form.applicantsInfo as Omit<Applicant, 'id'>[]).map((app) => ({
          id: crypto.randomUUID(),
          ...app,
          phone: `${app.phonePrefix}${app.phone}`
        })),
			creatorAccount: pp?.id
		};
    
		const result = await fetch(`${baseURL}/api/files/createNew`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				file: JSON.stringify(data),
				attachments: formattedAttachments
			})
		});

		const res = await result.json();

		if (res) {
			appattachmentsData.set([{ name: '', data: [] }]); // Clear file uploads
			applicationData.set(res); // Store result for use in payment
			await goto('/payment?type=newapplication');
		} else {
			alert('Submission failed. Please try again.');
		}
	} catch (err) {
		console.error('Error submitting patent form:', err);
		alert('An unexpected error occurred.');
	}
}

$: isLocal = get(patentForm).basicInfo.filingOrigin === 'Local';

$: showFirstPriorityInfo =
    !isLocal &&
    get(patentForm).basicInfo.filingOrigin === 'Foreign' &&
    ['Conventional', 'PCT'].includes(get(patentForm).basicInfo.conventionType);

$: showPriorityInfo = !isLocal; // only show if NOT Local

$: showPctInfoInAttachments =
    get(patentForm).basicInfo.filingOrigin === 'Foreign' &&
    get(patentForm).basicInfo.conventionType === 'PCT';
    
$: showPriorityDocumentInAttachments =
    ['Conventional', 'PCT'].includes(get(patentForm).basicInfo.conventionType) &&
    get(patentForm).basicInfo.filingOrigin === 'Foreign';
</script>

<div class="max-w-4xl mx-auto px-4">
<h1 class="text-2xl font-bold text-gray-900 mb-6">Summary of Patent Application</h1>

<Section title="1. Patent Information" step={0}>
  <p><strong>Application Type:</strong> {get(patentForm).basicInfo.applicationType}</p>
  <p><strong>Filing Origin:</strong> {get(patentForm).basicInfo.filingOrigin}</p>
  <p><strong>Nationality:</strong> {get(patentForm).basicInfo.country}</p>
  {#if get(patentForm).basicInfo.filingOrigin === 'Local'}
    <p><strong>Patent Type:</strong> {get(patentForm).basicInfo.conventionType}</p>
  {/if}
  {#if get(patentForm).basicInfo.filingOrigin === 'Foreign'}
    <p><strong>Patent Type:</strong> {get(patentForm).basicInfo.conventionType}</p>
  {/if}
  <p><strong>Title:</strong> {get(patentForm).basicInfo.title}</p>
  <p><strong>Abstract:</strong> {get(patentForm).basicInfo.abstract}</p>
  {#if sectionErrors.basicInfo}<p class="text-red-600">{sectionErrors.basicInfo}</p>{/if}
</Section>

<Section title="2. Applicants" step={1}>
  {#each get(patentForm).applicantsInfo as a, i}
    <div class="mb-3">
      <p><strong>{i + 1}.</strong> <strong>Name:</strong> {a.name}</p>
      <p><strong>Country:</strong>  {a.country}</p>
      <p><strong>State:</strong>  {a.state}</p> 
      <p><strong>City:</strong> {a.city}</p>
      <p><strong>Phone:</strong> {a.phonePrefix}{a.phone}</p>
      <p><strong>Email:</strong> {a.email}</p>
      <p><strong>Address:</strong> {a.address}</p>
    </div>
  {/each}
  {#if sectionErrors.applicants}<p class="text-red-600">{sectionErrors.applicants}</p>{/if}
</Section>

<Section title="3. Inventors" step={2}>
  {#each get(patentForm).inventors as inv, i}
    <div class="mb-3">
      <p><strong>{i + 1}.</strong> <strong>Name:</strong> {inv.name}</p>
      <p><strong>Country:</strong>  {inv.country}</p>
      <p><strong>State:</strong>  {inv.state}</p> 
      <p><strong>City:</strong> {inv.city}</p>
      <p><strong>Phone:</strong> {inv.phonePrefix}{inv.phone}</p>
      <p><strong>Email:</strong> {inv.email}</p>
      <p><strong>Address:</strong> {inv.address}</p>
    </div>
  {/each}
  {#if sectionErrors.inventors}<p class="text-red-600">{sectionErrors.inventors}</p>{/if}
</Section>

{#if showFirstPriorityInfo}
  <Section title="4. First Priority Information" step={3}>
    {#each get(patentForm).firstPriorityInfo as p, i}
      <div class="mb-2">
        <p><strong>{i + 1}.</strong> {p.number} || {p.Country} || {p.Date}</p>
      </div>
    {/each}
      {#if sectionErrors.firstPriority}
        <p class="text-red-600">{sectionErrors.firstPriority}</p>
      {/if}
  </Section>
{/if}

{#if showFirstPriorityInfo}
  <Section
    title={showFirstPriorityInfo ? "5. Additional Priority Information" : "4. Additional Priority Information"}
    step={showFirstPriorityInfo ? 4 : 3}
  >
    {#each get(patentForm).priorityInfo as p, i}
      <div class="mb-2">
        <p><strong>{i + 1}.</strong> {p.number} || {p.Country} || {p.Date}</p>
      </div>
    {/each}
  </Section>
{/if}

<Section
  title={ showFirstPriorityInfo  ? "6. Correspondence"  : isLocal? "4. Correspondence"       : "4. Correspondence"}
  step={ showFirstPriorityInfo ? 5 : isLocal ? 3: 4 }>
  <p><strong>Name:</strong> {get(patentForm).correspondence.name}</p>
  <p><strong>Email:</strong> {get(patentForm).correspondence.email}</p>
  <p><strong>Phone:</strong> {get(patentForm).correspondence.phonePrefix}{get(patentForm).correspondence.phone}</p>
  <p><strong>Address:</strong> {get(patentForm).correspondence.address}</p>
  <p><strong>State:</strong> {get(patentForm).correspondence.state}</p>
  <p><strong>Nationality:</strong> {get(patentForm).correspondence.nationality}</p>
    {#if sectionErrors.correspondence}
      <p class="text-red-600">{sectionErrors.correspondence}</p>
    {/if}
</Section>

<!-- <Section
  title={ showFirstPriorityInfo    ? "7. Attachments" : isLocal      ? "5. Attachments"      : "5. Attachments"}
  step={    showFirstPriorityInfo      ? 6     : isLocal? 4: 5}>
  {#each Object.entries(get(patentForm).attachments) as [key, files]}
    {#if key !== 'pct' || showPctInfoInAttachments}
    <div class="mb-3">
      <div class="font-bold capitalize">{key}</div>
      <ul class="list-disc ml-5">
        {#each files as file}
          <li>{file.name ?? 'No file name'}</li>
        {/each}
      </ul>
    </div>
    {/if}
  {/each}
    {#if sectionErrors.attachments}
      <p class="text-red-600">{sectionErrors.attachments}</p>
    {/if}
</Section> -->
<Section
  title={ showFirstPriorityInfo    ? "7. Attachments" : isLocal      ? "5. Attachments"      : "5. Attachments"}
  step={    showFirstPriorityInfo      ? 6     : isLocal? 4: 5}>
  {#each Object.entries(get(patentForm).attachments) as [key, files]}
    {#if key === 'priorityDocument'}
      {#if showPriorityDocumentInAttachments}
        <div class="mb-3">
          <div class="font-bold capitalize">{key}</div>
          <ul class="list-disc ml-5">
            {#each files as file}
              <li>{file.name ?? 'No file name'}</li>
            {/each}
          </ul>
        </div>
      {/if}
    {:else if key === 'pct'}
      {#if showPctInfoInAttachments}
        <div class="mb-3">
          <div class="font-bold capitalize">{key}</div>
          <ul class="list-disc ml-5">
            {#each files as file}
              <li>{file.name ?? 'No file name'}</li>
            {/each}
          </ul>
        </div>
      {/if}
    {:else}
      <div class="mb-3">
        <div class="font-bold capitalize">{key}</div>
        <ul class="list-disc ml-5">
          {#each files as file}
            <li>{file.name ?? 'No file name'}</li>
          {/each}
        </ul>
      </div>
    {/if}
  {/each}
  {#if sectionErrors.attachments}
    <p class="text-red-600">{sectionErrors.attachments}</p>
  {/if}
</Section>

<div class="flex justify-between mt-6">
<button
  class="px-4 py-2 bg-gray-800 text-white rounded-lg"
  on:click={() => goToStep( showFirstPriorityInfo ? 6 : isLocal ? 4 : 5)}>
    Back
  </button>

  <button
    class="px-4 py-2 bg-green-600 text-white rounded-lg"
    on:click={submitForm}
  >
    Proceed to Pay
  </button>
</div>
</div>

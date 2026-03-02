<script lang="ts">
import { designForm, currentStep } from '$lib/utils/design';

let form = $designForm;

// Subscribe to store for live updates
$:
  form = $designForm;

let submitError = '';

function goBack() {
  $currentStep--;
}

function countWords(text: string): number {
  if (!text) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function validateBeforeSubmit() {
  submitError = '';

  const info = form.designInformation ?? {};

  if (!info.fileOrigin || !info.applicationType || !info.title?.trim() || !info.statementOfNovelty?.trim()) {
    submitError = 'Please complete all required Design Information fields.';
    return false;
  }

  if (info.applicationType === 'Non-Textile' && !info.nonTextileType) {
    submitError = 'Please select a Representation Type in Design Information.';
    return false;
  }

  if (countWords(info.statementOfNovelty) > 250) {
    submitError = 'Statement of Novelty must not exceed 250 words.';
    return false;
  }

  const applicants: any[] = Array.isArray(form.applicants) ? form.applicants : [];
  if (!applicants.length) {
    submitError = 'Please provide at least one Applicant.';
    return false;
  }

  const invalidApplicant = applicants.find((a) => {
    if (!a) return true;
    const nameValid = !!a.name?.trim();
    const nationalityValid = !!a.nationality;
    const stateValid = !!a.state?.trim();
    const cityValid = !!a.city?.trim();
    const addressValid = !!a.address?.trim();
    const phoneValid = /^\+?\d{7,15}$/.test((a.phone ?? '').trim());
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((a.email ?? '').trim());
    return !(
      nameValid &&
      nationalityValid &&
      stateValid &&
      cityValid &&
      addressValid &&
      phoneValid &&
      emailValid
    );
  });

  if (invalidApplicant) {
    submitError = 'Please complete all required Applicant fields.';
    return false;
  }

  const creators: any[] = Array.isArray(form.creators) ? form.creators : [];
  if (!creators.length) {
    submitError = 'Please provide at least one Creator.';
    return false;
  }

  const invalidCreator = creators.find((c) => {
    if (!c) return true;
    const nameValid = !!c.name?.trim();
    const nationalityValid = !!c.nationality;
    const stateValid = !!c.state?.trim();
    const cityValid = !!c.city?.trim();
    const addressValid = !!c.address?.trim();
    const phoneValid = /^\+?\d{7,15}$/.test((c.phone ?? '').trim());
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((c.email ?? '').trim());
    return !(
      nameValid &&
      nationalityValid &&
      stateValid &&
      cityValid &&
      addressValid &&
      phoneValid &&
      emailValid
    );
  });

  if (invalidCreator) {
    submitError = 'Please complete all required Creator fields.';
    return false;
  }

  const corr = form.correspondence ?? {};
  const corrNameValid = !!corr.name?.trim();
  const corrNationalityValid = !!corr.nationality?.trim();
  const corrStateValid = !!corr.state?.trim();
  const corrAddressValid = !!corr.address?.trim();
  const corrPhoneValid = /^\+?\d{7,15}$/.test((corr.phone ?? '').trim());
  const corrEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((corr.email ?? '').trim());

  if (
    !(
      corrNameValid &&
      corrNationalityValid &&
      corrStateValid &&
      corrAddressValid &&
      corrPhoneValid &&
      corrEmailValid
    )
  ) {
    submitError = 'Please complete all required Correspondence Information fields.';
    return false;
  }

  const attachments = form.attachments ?? {};
  const powerOfAttorney = attachments.powerOfAttorney ?? null;
  const designRepresentation = attachments.designRepresentation ?? null;
  const priorityDocument = attachments.priorityDocument ?? null;
  const otherDocuments: any[] = Array.isArray(attachments.otherDocuments)
    ? attachments.otherDocuments
    : [];

  if (!powerOfAttorney || !designRepresentation) {
    submitError = 'Please upload the required attachments (Power of Attorney and Design Representation).';
    return false;
  }

  const priorities: any[] = Array.isArray(form.priorities) ? form.priorities : [];
  const hasPriority = priorities.some((p) => p?.applicationNumber || p?.country || p?.date);
  if (hasPriority && !priorityDocument) {
    submitError = 'Priority Document is required because priority information was provided.';
    return false;
  }

  if (otherDocuments.length > 4) {
    submitError = 'You can upload up to 4 other documents.';
    return false;
  }

  return true;
}

function submit() {
  if (!validateBeforeSubmit()) {
    return;
  }
  // Implement submission logic here
  alert('Submitted!');
}
</script>

<div class="space-y-6">
  <h2 class="text-xl font-semibold mb-4">Review & Submit</h2>
  <div class="border rounded-lg p-4 mb-4 bg-gray-50">
    <h3 class="font-bold mb-2">Design Information</h3>
    <div class="mb-2">Title: {form.designInformation.title}</div>
    <div class="mb-2">Type: {form.designInformation.applicationType}</div>
    <div class="mb-2">Origin: {form.designInformation.fileOrigin}</div>
    <div class="mb-2">Statement of Novelty: {form.designInformation.statementOfNovelty}</div>
  </div>
  <div class="border rounded-lg p-4 mb-4 bg-gray-50">
    <h3 class="font-bold mb-2">Applicants</h3>
    {#each form.applicants as applicant, i}
      <div class="mb-2">
        <div class="font-semibold">Applicant {i + 1}</div>
        <div>Name: {applicant.name}</div>
        <div>Email: {applicant.email}</div>
        <div>Phone: {applicant.phone}</div>
        <div>Nationality: {applicant.nationality}</div>
        <div>State: {applicant.state}</div>
        <!-- <div>City: {applicant.city}</div> -->
        <div>Address: {applicant.address}</div>
      </div>
    {/each}
  </div>
  <div class="border rounded-lg p-4 mb-4 bg-gray-50">
    <h3 class="font-bold mb-2">Creators</h3>
    {#each form.creators as creator, i}
      <div class="mb-2">
        <div class="font-semibold">Creator {i + 1}</div>
        <div>Name: {creator.name}</div>
        <div>Email: {creator.email}</div>
        <div>Phone: {creator.phone}</div>
        <div>Nationality: {creator.nationality}</div>
        <div>State: {creator.state}</div>
        <!-- <div>City: {creator.city}</div> -->
        <div>Address: {creator.address}</div>
      </div>
    {/each}
  </div>
  <div class="border rounded-lg p-4 mb-4 bg-gray-50">
    <h3 class="font-bold mb-2">Priority Information</h3>
    {#if form.priorities && form.priorities.length}
      {#each form.priorities as priority, i}
        <div class="mb-2">
          <div class="font-semibold">Priority {i + 1}</div>
          <div>Country: {priority.country}</div>
          <div>Number: {priority.applicationNumber}</div>
          <div>Date: {priority.date}</div>
        </div>
      {/each}
    {:else}
      <div>No priority information provided.</div>
    {/if}
  </div>
  <div class="border rounded-lg p-4 mb-4 bg-gray-50">
    <h3 class="font-bold mb-2">Correspondence Information</h3>
    {#if form.correspondence}
      <div>Name: {form.correspondence.name}</div>
      <div>Email: {form.correspondence.email}</div>
      <div>Phone: {form.correspondence.phone}</div>
      <div>Nationality: {form.correspondence.nationality}</div>
      <div>State: {form.correspondence.state}</div>
      <div>Address: {form.correspondence.address}</div>
    {:else}
      <div>No correspondence information provided.</div>
    {/if}
  </div>
  {#if submitError}
    <p class="text-red-600 text-sm mt-2">{submitError}</p>
  {/if}
  <div class="flex justify-between mt-8">
    <button
    class="bg-black hover:bg-green-700 text-white font-semibold px-6 py-2 rounded shadow"
      on:click={goBack}
    >
      Back
    </button>
    <button
      class="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded shadow"
      on:click={submit}
    >
      Submit
    </button>
  </div>
</div>

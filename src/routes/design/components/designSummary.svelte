<script lang="ts">
import { goto } from '$app/navigation';
import Section from './Section.svelte';
import { designForm, currentStep } from '$lib/utils/design';
import { applicationData, loggedInUser } from '$lib/store';
import { ApplicationStatuses, baseURL, FilingType, FormApplicationTypes, arrayBufferToBase64, toByteArray } from '$lib/helpers';

let form = $designForm;

// Subscribe to store for live updates
$:
  form = $designForm;

let submitError = '';
let isSubmitting = false;

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

async function submit() {
  if (!validateBeforeSubmit()) {
    return;
  }

  if (!$loggedInUser) {
    submitError = 'You must be logged in to submit this application.';
    return;
  }

  isSubmitting = true;
  submitError = '';

  try {
    const info = form.designInformation ?? {};

    const designTypeValue = info.applicationType === 'Textile' ? 0 : 1; // 0 = Textile, 1 = Non-Textile

    const mappedApplicants = (form.applicants ?? []).map((a: any) => ({
      name: a.name,
      country: a.nationality,
      address: a.address,
      phone: a.phone,
      email: a.email,
    }));

    const mappedCreators = (form.creators ?? []).map((c: any) => ({
      name: c.name,
      country: c.nationality,
      address: c.address,
      phone: c.phone,
      email: c.email,
    }));

    const corr = form.correspondence ?? {};

    const data: any = {
      type: FilingType.Design,
      fileStatus: ApplicationStatuses.AwaitingPayment,
      formApplicationType: FormApplicationTypes.NewApplication,
      designCreators: mappedCreators,
      designType: designTypeValue,
      statementOfNovelty: info.statementOfNovelty,
      titleOfDesign: info.title,
      correspondence: {
        id: crypto.randomUUID(),
        name: corr.name,
        address: corr.address,
        email: corr.email,
        phone: corr.phone,
        state: corr.state,
      },
      applicants: mappedApplicants,
      attachments: [],
      creatorAccount: $loggedInUser?.creatorId ?? null,
    };

    const attachmentsLists: any[] = [];
    const atts = form.attachments ?? {};

    if (atts.powerOfAttorney) {
      const file = atts.powerOfAttorney as File;
      const bytes = await toByteArray(file);
      attachmentsLists.push({
        fileName: file.name,
        Name: 'form2',
        contentType: file.type,
        data: arrayBufferToBase64((bytes as Uint8Array).buffer),
      });
    }

    if (atts.designRepresentation) {
      const file = atts.designRepresentation as File;
      const bytes = await toByteArray(file);
      attachmentsLists.push({
        fileName: file.name,
        Name: 'design1',
        contentType: file.type,
        data: arrayBufferToBase64((bytes as Uint8Array).buffer),
      });
    }

    if (atts.priorityDocument) {
      const file = atts.priorityDocument as File;
      const bytes = await toByteArray(file);
      attachmentsLists.push({
        fileName: file.name,
        Name: 'pdoc',
        contentType: file.type,
        data: arrayBufferToBase64((bytes as Uint8Array).buffer),
      });
    }

    if (Array.isArray(atts.otherDocuments)) {
      for (const file of atts.otherDocuments as File[]) {
        const bytes = await toByteArray(file);
        attachmentsLists.push({
          fileName: file.name,
          Name: 'any',
          contentType: file.type,
          data: arrayBufferToBase64((bytes as Uint8Array).buffer),
        });
      }
    }

    const payload = {
      file: JSON.stringify(data),
      attachments: attachmentsLists,
    };

    const result = await fetch(`${baseURL}/api/files/createNew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!result.ok) {
      submitError = 'Submission failed. Please try again.';
      return;
    }

    const res = await result.json();

    if (res) {
      applicationData.set(res);
      await goto('/payment?type=newapplication');
    } else {
      submitError = 'Submission failed. Please try again.';
    }
  } catch (err) {
    console.error('Error submitting design application:', err);
    submitError = 'An unexpected error occurred.';
  } finally {
    isSubmitting = false;
  }
}
</script>



<div class="max-w-4xl mx-auto px-4">
  <h2 class="text-2xl font-bold text-gray-900 mb-6">Review & Submit</h2>
  <Section title="Design Information" step={0}>
    <p><strong>Title:</strong> {form.designInformation.title}</p>
    <p><strong>Type:</strong> {form.designInformation.applicationType}</p>
    <p><strong>Origin:</strong> {form.designInformation.fileOrigin}</p>
    <p><strong>Statement of Novelty:</strong> {form.designInformation.statementOfNovelty}</p>
  </Section>
  <Section title="Applicants" step={1}>
    {#each form.applicants as applicant, i}
      <div class="mb-2">
        <p class="font-semibold">Applicant {i + 1}</p>
        <p><strong>Name:</strong> {applicant.name}</p>
        <p><strong>Email:</strong> {applicant.email}</p>
        <p><strong>Phone:</strong> {applicant.phone}</p>
        <p><strong>Nationality:</strong> {applicant.nationality}</p>
        <p><strong>State:</strong> {applicant.state}</p>
        <p><strong>City:</strong> {applicant.city}</p>
        <p><strong>Address:</strong> {applicant.address}</p>
      </div>
    {/each}
  </Section>
  <Section title="Creators" step={2}>
    {#each form.creators as creator, i}
      <div class="mb-2">
        <p class="font-semibold">Creator {i + 1}</p>
        <p><strong>Name:</strong> {creator.name}</p>
        <p><strong>Email:</strong> {creator.email}</p>
        <p><strong>Phone:</strong> {creator.phone}</p>
        <p><strong>Nationality:</strong> {creator.nationality}</p>
        <p><strong>State:</strong> {creator.state}</p>
        <p><strong>City:</strong> {creator.city}</p>
        <p><strong>Address:</strong> {creator.address}</p>
      </div>
    {/each}
  </Section>
  <Section title="Priority Information" step={3}>
    {#if form.priorities && form.priorities.length}
      {#each form.priorities as priority, i}
        <div class="mb-2">
          <p class="font-semibold">Priority {i + 1}</p>
          <p><strong>Country:</strong> {priority.country}</p>
          <p><strong>Number:</strong> {priority.applicationNumber}</p>
          <p><strong>Date:</strong> {priority.date}</p>
        </div>
      {/each}
    {:else}
      <p>No priority information provided.</p>
    {/if}
  </Section>
  <Section title="Correspondence Information" step={4}>
    {#if form.correspondence}
      <p><strong>Name:</strong> {form.correspondence.name}</p>
      <p><strong>Email:</strong> {form.correspondence.email}</p>
      <p><strong>Phone:</strong> {form.correspondence.phone}</p>
      <p><strong>Nationality:</strong> {form.correspondence.nationality}</p>
      <p><strong>State:</strong> {form.correspondence.state}</p>
      <p><strong>Address:</strong> {form.correspondence.address}</p>
    {:else}
      <p>No correspondence information provided.</p>
    {/if}
  </Section>

  <Section title="Attachments" step={5}>
    <div class="mb-2">
      <div class="font-bold">Power of Attorney</div>
      <ul class="list-disc ml-5">
        {#if form.attachments && form.attachments.powerOfAttorney}
          <li>{form.attachments.powerOfAttorney.name}</li>
        {:else}
          <li class="text-gray-400">Not provided</li>
        {/if}
      </ul>
    </div>
    <div class="mb-2">
      <div class="font-bold">Design Representation</div>
      <ul class="list-disc ml-5">
        {#if form.attachments && form.attachments.designRepresentation}
          <li>{form.attachments.designRepresentation.name}</li>
        {:else}
          <li class="text-gray-400">Not provided</li>
        {/if}
      </ul>
    </div>
    <div class="mb-2">
      <div class="font-bold">Priority Document</div>
      <ul class="list-disc ml-5">
        {#if form.attachments && form.attachments.priorityDocument}
          <li>{form.attachments.priorityDocument.name}</li>
        {:else}
          <li class="text-gray-400">Not provided</li>
        {/if}
      </ul>
    </div>
    <div class="mb-2">
      <div class="font-bold">Other Documents</div>
      <ul class="list-disc ml-5">
        {#if form.attachments && form.attachments.otherDocuments && form.attachments.otherDocuments.length}
          {#each form.attachments.otherDocuments as file}
            <li>{file.name}</li>
          {/each}
        {:else}
          <li class="text-gray-400">Not provided</li>
        {/if}
      </ul>
    </div>
  </Section>
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

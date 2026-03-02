<script lang="ts">
import { designForm } from '$lib/utils/design';
import { currentStep } from '$lib/utils/design';
import { get } from 'svelte/store';

let form = $designForm;

// Subscribe to store for live updates
$:
  form = $designForm;

function goBack() {
  $currentStep--;
}

function submit() {
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
  <div class="flex justify-between mt-8">
    <button
      class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-6 py-2 rounded shadow"
      on:click={goBack}
    >
      Previous
    </button>
    <button
      class="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded shadow"
      on:click={submit}
    >
      Submit
    </button>
  </div>
</div>

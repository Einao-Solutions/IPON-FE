<script lang="ts">
// filepath: c:\Users\User\Desktop\einaonewfrontend\patentdesignfront\src\routes\home\file-withdrawal\withdrawalform\+page.svelte
import { goto } from '$app/navigation';
import { onMount } from 'svelte';
import { baseURL } from '$lib/helpers';
import { filesToAttachment } from "$lib/utils/patent";

let fileNumber = '';
let fileType = '';
let withdrawalLetterFiles: File[] = [];
let supportingDocsFiles: File[] = [];
let isSubmitting = false;
let error: string | null = null;
let success: string | null = null;

onMount(() => {
    const url = new URL(window.location.href);
    fileNumber = url.searchParams.get('fileNumber') ?? '';
    fileType = url.searchParams.get('fileType') ?? '';
});

function handleWithdrawalLetterChange(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
        withdrawalLetterFiles = [...withdrawalLetterFiles, ...Array.from(files)];
    }
}

function handleSupportingDocsChange(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
        supportingDocsFiles = [...supportingDocsFiles, ...Array.from(files)];
    }
}

function removeWithdrawalLetterFile(idx: number) {
    withdrawalLetterFiles = withdrawalLetterFiles.filter((_, i) => i !== idx);
}

function removeSupportingDocsFile(idx: number) {
    supportingDocsFiles = supportingDocsFiles.filter((_, i) => i !== idx);
}

async function handleSubmit() {
    error = null;
    success = null;
    if (!fileNumber || !fileType || withdrawalLetterFiles.length === 0 || supportingDocsFiles.length === 0) {
        error = 'All fields are required. Please upload both the withdrawal letter and supporting documents.';
        return;
    }
    isSubmitting = true;
    try {
        // Get cost for withdrawal process
        const response = await fetch(
            `${baseURL}/api/files/GetFileWithdrawalCost?fileId=${encodeURIComponent(fileNumber)}&fileType=${fileType}`,
            { method: 'GET' }
        );

        if (!response.ok) {
            error = 'Failed to get payment details.';
            isSubmitting = false;
            return;
        }
        const data = await response.json();
        const cost = data?.amount;
        const paymentId = data?.rrr;

        console.log('cost is', cost);
        console.log('paymentId is', paymentId);

        if (cost && paymentId) {
            // Convert files to attachment structure
            console.log('cost is', cost);
            console.log('paymentId is', paymentId);
            const withdrawalLetterAttachments = await filesToAttachment("withdrawal_letter", withdrawalLetterFiles);
            const supportingDocsAttachments = await filesToAttachment("supporting_documents", supportingDocsFiles);

            // Save to sessionStorage
            sessionStorage.setItem('withdrawal_fileNumber', fileNumber);
            sessionStorage.setItem('withdrawal_fileType', fileType);
            sessionStorage.setItem('withdrawal_cost', cost);
            sessionStorage.setItem('withdrawal_rrr', paymentId);
            sessionStorage.setItem('withdrawal_withdrawalLetter', JSON.stringify(withdrawalLetterAttachments));
            sessionStorage.setItem('withdrawal_supportingDocs', JSON.stringify(supportingDocsAttachments));

            await goto(`/payment?type=filewithdrawal&rrr=${paymentId}&amount=${cost}&fileNumber=${encodeURIComponent(fileNumber)}`);
        } else {
            error = 'Could not retrieve payment details.';
        }
    } catch (e) {
        error = 'An error occurred while submitting.';
    } finally {
        isSubmitting = false;
    }
}
</script>

<div class="max-w-lg mx-auto mt-12 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
    <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">File Withdrawal Request Form</h2>
    <div class="mb-4 flex justify-start">
        <button
            type="button"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center gap-2"
            on:click={() => goto('/home/file-withdrawal/search/')}
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Search
        </button>
    </div>
    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1" for="fileNumber">
                File Number <span class="text-red-500">*</span>
            </label>
            <input
                id="fileNumber"
                type="text"
                class="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={fileNumber}
                readonly
                required
            />
        </div>
        <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1" for="withdrawalLetter">
                Withdrawal Letter <span class="text-red-500">*</span>
            </label>
            <input
                id="withdrawalLetter"
                type="file"
                accept=".pdf"
                multiple
                required
                class="block w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                on:change={handleWithdrawalLetterChange}
            />
            <div class="text-xs text-red-600 mt-1">
                Upload your withdrawal letter in PDF format.
            </div>
            {#if withdrawalLetterFiles.length > 0}
                <ul class="mt-2 text-xs text-gray-600 list-disc list-inside">
                    {#each withdrawalLetterFiles as file, idx}
                        <li class="flex items-center justify-between">
                            <span>{file.name}</span>
                            <button
                                type="button"
                                class="ml-2 text-red-600 hover:text-red-800 text-xs"
                                on:click={() => removeWithdrawalLetterFile(idx)}
                                aria-label="Remove file"
                            >
                                Remove
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
        <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1" for="supportingDocs">
                Supporting Documents <span class="text-red-500">*</span>
            </label>
            <input
                id="supportingDocs"
                type="file"
                accept=".pdf,.jpeg,.jpg"
                multiple
                required
                class="block w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                on:change={handleSupportingDocsChange}
            />
            <div class="text-xs text-red-600 mt-1">
                Upload any other supporting documents in PDF or JPEG format.
            </div>
            {#if supportingDocsFiles.length > 0}
                <ul class="mt-2 text-xs text-gray-600 list-disc list-inside">
                    {#each supportingDocsFiles as file, idx}
                        <li class="flex items-center justify-between">
                            <span>{file.name}</span>
                            <button
                                type="button"
                                class="ml-2 text-red-600 hover:text-red-800 text-xs"
                                on:click={() => removeSupportingDocsFile(idx)}
                                aria-label="Remove file"
                            >
                                Remove
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
        {#if error}
            <div class="mb-2 text-red-600 text-sm text-center">{error}</div>
        {/if}
        {#if success}
            <div class="mb-2 text-green-600 text-sm text-center">{success}</div>
        {/if}
        <div class="flex">
            <button
                type="submit"
                class="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold text-base hover:bg-red-700 transition"
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
        </div>
    </form>
</div>
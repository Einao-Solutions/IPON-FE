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
let submitState: 'idle' | 'loading' | 'success' = 'idle';
let error: string | null = null;
let success: string | null = null;

function normalizeFileType(value: string | null | undefined): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.toLowerCase();

    if (['patent', '0', 'patent application'].includes(normalized)) return '0';
    if (['design', '1', 'design application'].includes(normalized)) return '1';
    if (['trademark', 'trade mark', 'trade-mark', 'trademark application', 'tm', '2'].includes(normalized)) return '2';
    if (/^\d+$/.test(trimmed)) return trimmed;

    return trimmed;
}

function getFileTypeVariants(value: string | null | undefined): string[] {
    const normalized = normalizeFileType(value);
    const variants = new Set<string>();

    if (normalized === '0') {
        variants.add('0');
        variants.add('Patent');
        variants.add('patent');
    } else if (normalized === '1') {
        variants.add('1');
        variants.add('Design');
        variants.add('design');
    } else if (normalized === '2') {
        variants.add('2');
        variants.add('TradeMark');
        variants.add('Trademark');
        variants.add('trademark');
        variants.add('trade mark');
        variants.add('trade-mark');
    } else if (value) {
        const lower = value.trim().toLowerCase();
        variants.add(value.trim());

        if (['trademark', 'trade mark', 'trade-mark', 'tm', 'trademark application'].includes(lower)) {
            variants.add('TradeMark');
            variants.add('Trademark');
            variants.add('trademark');
            variants.add('2');
        }
    }

    return Array.from(variants);
}

async function fetchWithdrawalCost(fileNumber: string, normalizedFileType: string) {
    const candidates = getFileTypeVariants(normalizedFileType);

    for (const candidate of candidates) {
        try {
            const response = await fetch(
                `${baseURL}/api/files/GetFileWithdrawalCost?fileId=${encodeURIComponent(fileNumber)}&fileType=${encodeURIComponent(candidate)}`,
                { method: 'GET' }
            );

            if (!response.ok) {
                continue;
            }

            const data = await response.json();
            const cost = data?.amount;
            const paymentId = data?.rrr;
            if (cost && paymentId) {
                return { data, cost, paymentId, fileType: candidate };
            }
        } catch {
            // try next candidate
        }
    }

    return null;
}

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsDataURL(file);
    });
}

onMount(() => {
    const url = new URL(window.location.href);
    fileNumber = url.searchParams.get('fileNumber') ?? '';
    fileType = normalizeFileType(url.searchParams.get('fileType')) ?? '';
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

    const normalizedFileType = normalizeFileType(fileType);
    if (!fileNumber || !normalizedFileType || withdrawalLetterFiles.length === 0 || supportingDocsFiles.length === 0) {
        error = 'All fields are required. Please upload both the withdrawal letter and supporting documents.';
        return;
    }

    isSubmitting = true;
    submitState = 'loading';
    try {
        const costResponse = await fetchWithdrawalCost(fileNumber, normalizedFileType);
        if (!costResponse) {
            error = 'Failed to get payment details.';
            return;
        }

        const { data, cost, paymentId, fileType: acceptedFileType } = costResponse;

        const withdrawalRequestData = {
            ...data,
            fileId: fileNumber,
            fileType: acceptedFileType,
            applicantName: data?.applicantName || '',
            amount: String(cost),
            rrr: paymentId,
            withdrawalLetter: await Promise.all(
                withdrawalLetterFiles.map(async (file) => ({
                    name: file.name,
                    type: file.type,
                    dataUrl: await fileToDataUrl(file),
                })),
            ),
            supportingDocuments: await Promise.all(
                supportingDocsFiles.map(async (file) => ({
                    name: file.name,
                    type: file.type,
                    dataUrl: await fileToDataUrl(file),
                })),
            ),
        };

        sessionStorage.setItem('withdrawalData', JSON.stringify({
            ...data,
            fileId: fileNumber,
            fileType: acceptedFileType,
            applicantName: data?.applicantName || '',
            amount: String(cost),
            rrr: paymentId,
        }));
        sessionStorage.setItem('withdrawalPaymentData', JSON.stringify(withdrawalRequestData));

        submitState = 'success';
        await goto(`/payment?type=filewithdrawal&rrr=${encodeURIComponent(paymentId)}&amount=${encodeURIComponent(cost)}&fileNumber=${encodeURIComponent(fileNumber)}`);
    } catch (e) {
        const message = e instanceof Error ? e.message : 'An error occurred while submitting.';
        error = message;
        submitState = 'idle';
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
            <div class="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm text-center">{error}</div>
        {/if}
        {#if success}
            <div class="mb-3 flex items-center justify-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-3 text-sm font-medium text-green-800 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 111.414-1.414L8.5 11.586l6.793-6.793a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span>{success}</span>
            </div>
        {/if}
        <div class="flex">
            <button
                type="submit"
                class="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold text-base hover:bg-red-700 transition disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting || submitState === 'success'}
            >
                {submitState === 'loading' ? 'Submitting...' : submitState === 'success' ? 'Submitted' : 'Submit'}
            </button>
        </div>
    </form>
</div>
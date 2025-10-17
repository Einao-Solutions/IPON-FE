<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { baseURL } from '$lib/helpers';
    import { filesToAttachment } from "$lib/utils/patent";

    let fileNumber = '';
    let publicationDate = '';
    let proofFiles: File[] = [];
    let isSubmitting = false;
    let error: string | null = null;
    let success: string | null = null;

    onMount(() => {
        const url = new URL(window.location.href);
        fileNumber = url.searchParams.get('fileNumber') ?? '';
    });

    function detectFileType(fileId: string): number {
        if (/TM/i.test(fileId)) return 2;      // TradeMark
        if (/PT/i.test(fileId)) return 0;      // Patent
        if (/DS/i.test(fileId) || /DES/i.test(fileId)) return 1; // Design (adjust as needed)
        return 2; // Default to TradeMark if unsure
    }

    const fileType = detectFileType(fileNumber);

    function handleFileChange(event: Event) {
        const files = (event.target as HTMLInputElement).files;
        if (files) {
            // Add new files to the existing array
            proofFiles = [...proofFiles, ...Array.from(files)];
        }
    }

    function removeProofFile(idx: number) {
        proofFiles = proofFiles.filter((_, i) => i !== idx);
    }

    async function handleSubmit() {
        error = null;
        success = null;
        if (!fileNumber || !publicationDate || proofFiles.length === 0) {
            error = 'All fields are required. Please fill in all fields and upload your proof of publication.';
            return;
        }
        isSubmitting = true;
        try {
            // Only send GET request with query params, no body!
            const response = await fetch(
                `${baseURL}/api/files/GetPublicationStatusUpdateCost?fileId=${encodeURIComponent(fileNumber)}&fileType=${fileType}`,
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

            if (cost && paymentId) {
                // Use filesToAttachment to convert files to correct structure
                // The name for all should be "publication"
                const attachments = await filesToAttachment("publication", proofFiles);

                sessionStorage.setItem('publicationstatusupdate_fileNumber', fileNumber);
                sessionStorage.setItem('publicationstatusupdate_publicationDate', publicationDate);
                sessionStorage.setItem('publicationstatusupdate_cost', cost);
                sessionStorage.setItem('publicationstatusupdate_rrr', paymentId);
                sessionStorage.setItem('publicationstatusupdate_attachments', JSON.stringify(attachments));

                await goto(`/payment?type=publicationstatusupdate&rrr=${paymentId}&amount=${cost}&fileNumber=${encodeURIComponent(fileNumber)}`);
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
    <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">Publication Status Update Request Form</h2>
    <!-- Back Button -->
    <div class="mb-4 flex justify-start">
        <button
            type="button"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center gap-2"
            on:click={() => goto('/home/publications/publicationstatusupdate/search/')}
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Search
        </button>
    </div>
    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <label class="block text-sm font-semibold text-gray-700 mb-1" for="publicationDate">
                    Publication Date <span class="text-red-500">*</span>
                </label>
                <input
                    id="publicationDate"
                    type="date"
                    class="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    bind:value={publicationDate}
                    required
                />
            </div>
        </div>
        <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1" for="proof">
                Proof of Publication <span class="text-red-500">*</span>
            </label>
            <input
                id="proof"
                type="file"
                accept=".pdf,.jpeg,.jpg"
                multiple
                required
                class="block w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                on:change={handleFileChange}
            />
            <div class="text-xs text-red-600 mt-1">
                Upload one or more proofs of publication in PDF or JPEG format.
            </div>
            {#if proofFiles.length > 0}
                <ul class="mt-2 text-xs text-gray-600 list-disc list-inside">
                    {#each proofFiles as file, idx}
                        <li class="flex items-center justify-between">
                            <span>{file.name}</span>
                            <button
                                type="button"
                                class="ml-2 text-red-600 hover:text-red-800 text-xs"
                                on:click={() => removeProofFile(idx)}
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
                class="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold text-base hover:bg-green-700 transition"
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
        </div>
    </form>
</div>
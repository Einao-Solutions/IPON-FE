<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { baseURL } from '$lib/helpers';
    import { fade, fly } from 'svelte/transition';

    let isLoading = true;
    let error: string | null = null;
    let success: string | null = null;
    let checkVisible = false;
    let messageVisible = false;
    let subMessageVisible = false;

    onMount(async () => {
        try {
            const fileNumber = sessionStorage.getItem('publicationstatusupdate_fileNumber');
            const publicationDate = sessionStorage.getItem('publicationstatusupdate_publicationDate');
            const attachmentsRaw = sessionStorage.getItem('publicationstatusupdate_attachments');
            const rrr = sessionStorage.getItem('publicationstatusupdate_rrr');
            const attachments: string[] = attachmentsRaw ? JSON.parse(attachmentsRaw) : [];

            if (!fileNumber || !publicationDate || !attachments.length) {
                error = "Missing data for publication status update.";
                isLoading = false;
                return;
            }

            const dto = {
                fileId: fileNumber,
                PublicationDate: publicationDate,
                AttachmentFiles: attachments,
                PaymentRRR: rrr
            };

            const response = await fetch(`${baseURL}/api/files/PublicationStatusUpdate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dto)
            });

            if (!response.ok) {
                error = "Failed to update publication status.";
            } else {
                success = "Publication date and attachments updated successfully.";
                // Optionally clear sessionStorage here
                sessionStorage.removeItem('publicationstatusupdate_fileNumber');
                sessionStorage.removeItem('publicationstatusupdate_publicationDate');
                sessionStorage.removeItem('publicationstatusupdate_attachments');
                sessionStorage.removeItem('publicationstatusupdate_cost');
                sessionStorage.removeItem('publicationstatusupdate_rrr');
            }
        } catch (e) {
            error = "An error occurred while updating publication status.";
        } finally {
            isLoading = false;
            setTimeout(() => { checkVisible = true; }, 300);
            setTimeout(() => { messageVisible = true; }, 1000);
            setTimeout(() => { subMessageVisible = true; }, 1800);
        }
    });
</script>

<main class="flex justify-center items-center min-h-screen bg-gray-50">
    <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
        {#if isLoading}
            <div class="text-center text-gray-600">Finalizing your publication status update...</div>
        {:else if error}
            <div class="text-center text-red-600 font-semibold">{error}</div>
            <div class="mt-4 text-center">
                <button class="px-4 py-2 bg-blue-600 text-white rounded" on:click={() => goto('/home/dashboard')}>
                    Go to Dashboard
                </button>
            </div>
        {:else if success}
            <div class="h-32 w-32 mx-auto mb-6 relative">
                {#if checkVisible}
                    <div
                        class="h-full w-full bg-green-50 rounded-full flex justify-center items-center"
                        in:fade={{ duration: 400 }}
                    >
                        <svg class="w-16 h-16 text-green-500" viewBox="0 0 24 24">
                            <path
                                class="checkmark-path"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="3"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M5 13l4 4L19 7"
                            >
                            </path>
                        </svg>
                    </div>
                {/if}
            </div>
            {#if messageVisible}
                <h1 class="text-3xl font-bold text-gray-900 mt-2 mb-4" in:fly={{ y: 20, duration: 500 }}>
                    Publication Status Update Successful
                </h1>
            {/if}
            {#if subMessageVisible}
                <p
                    class="text-base font-medium text-gray-600 mb-8 max-w-xs mx-auto"
                    in:fly={{ y: 15, duration: 500 }}
                >
                    YOUR PUBLICATION STATUS UPDATE HAS BEEN RECEIVED AND IS RECEIVING DUE ATTENTION. PLEASE USE THE PRINT DOCUMENTS MODULE ON THE DASHBOARD TO GET YOUR DOCUMENTS.
                </p>
                <div class="mt-4" in:fade={{ duration: 300, delay: 300 }}>
                    <button
                        class="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200"
                        on:click={() => goto('/home/dashboard')}
                    >
                        Return to Dashboard
                    </button>
                </div>
            {/if}
        {/if}
    </div>
</main>

<style>
    /* SVG checkmark animation */
    .checkmark-path {
        stroke-dasharray: 80;
        stroke-dashoffset: 80;
        animation: checkmark 0.8s ease-in-out forwards;
    }

    @keyframes checkmark {
        0% {
            stroke-dashoffset: 80;
        }
        100% {
            stroke-dashoffset: 0;
        }
    }
</style>
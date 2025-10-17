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
        const fileNumber = sessionStorage.getItem('withdrawal_fileNumber');
        const rrr = sessionStorage.getItem('withdrawal_rrr');
        const withdrawalLetterRaw = sessionStorage.getItem('withdrawal_withdrawalLetter');
        const supportingDocsRaw = sessionStorage.getItem('withdrawal_supportingDocs');

        const withdrawalLetter = withdrawalLetterRaw ? JSON.parse(withdrawalLetterRaw) : [];
        const supportingDocs = supportingDocsRaw ? JSON.parse(supportingDocsRaw) : [];

        if (!fileNumber || !rrr || !withdrawalLetter.length || !supportingDocs.length) {
            error = "Missing data for withdrawal request.";
            isLoading = false;
            return;
        }

        const dto = {
            FileId: fileNumber,
            PaymentRRR: rrr,
            WithdrawalDate: new Date().toISOString(),
            WithdrawalRequestDate: new Date().toISOString(),
            WithdrawalLetter: withdrawalLetter,
            WithdrawalSupportingDocuments: supportingDocs
        };

        const response = await fetch(`${baseURL}/api/files/withdrawal-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto)
        });

        if (!response.ok) {
            error = "Failed to submit withdrawal request.";
        } else {
            success = "Withdrawal request submitted successfully.";
            // Optionally clear sessionStorage here
            sessionStorage.removeItem('withdrawal_fileNumber');
            sessionStorage.removeItem('withdrawal_cost');
            sessionStorage.removeItem('withdrawal_rrr');
            sessionStorage.removeItem('withdrawal_withdrawalLetter');
            sessionStorage.removeItem('withdrawal_supportingDocs');
        }
    } catch (e) {
        error = "An error occurred while submitting withdrawal request.";
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
            <div class="text-center text-gray-600">Finalizing your withdrawal request...</div>
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
                    Withdrawal Request Successful
                </h1>
            {/if}
            {#if subMessageVisible}
                <p
                    class="text-base font-medium text-gray-600 mb-8 max-w-xs mx-auto"
                    in:fly={{ y: 15, duration: 500 }}
                >
                    YOUR WITHDRAWAL REQUEST HAS BEEN RECEIVED AND IS RECEIVING DUE ATTENTION. PLEASE USE THE PRINT DOCUMENTS MODULE ON THE DASHBOARD TO GET YOUR DOCUMENTS.
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
    .checkmark-path {
        stroke-dasharray: 80;
        stroke-dashoffset: 80;
        animation: checkmark 0.8s ease-in-out forwards;
    }
    @keyframes checkmark {
        0% { stroke-dashoffset: 80; }
        100% { stroke-dashoffset: 0; }
    }
</style>
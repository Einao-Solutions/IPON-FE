<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { baseURL } from '$lib/helpers';
import { fade, fly } from 'svelte/transition';
import { loggedInUser } from '$lib/store';
import { get } from 'svelte/store';

let isLoading = true;
let error: string | null = null;
let success: string | null = null;
let checkVisible = false;
let messageVisible = false;
let subMessageVisible = false;

onMount(async () => {
    // Auth check
    const user = get(loggedInUser);
    if (!user || !user.id) {
        goto('/auth');
        return;
    }

    try {
        const sessionData = sessionStorage.getItem('withdrawalPaymentData');
        const paymentData = sessionData ? JSON.parse(sessionData) : null;
        const fileNumber = paymentData?.fileId || sessionStorage.getItem('withdrawal_fileNumber');
        const rrr = paymentData?.rrr || sessionStorage.getItem('withdrawal_rrr');
        const fileType = paymentData?.fileType || sessionStorage.getItem('withdrawal_fileType');
        const withdrawalLetterRaw = paymentData?.withdrawalLetter || [];
        const supportingDocsRaw = paymentData?.supportingDocuments || [];

        if (!fileNumber || !rrr || !withdrawalLetterRaw.length || !supportingDocsRaw.length) {
            error = "Missing data for withdrawal request.";
            isLoading = false;
            return;
        }

        const toFile = async (item: { name: string; type: string; dataUrl: string }) => {
            const response = await fetch(item.dataUrl);
            const blob = await response.blob();
            return new File([blob], item.name, { type: item.type || 'application/pdf' });
        };

        const withdrawalLetter = await toFile(withdrawalLetterRaw[0]);
        const supportingDocs = await Promise.all(
            supportingDocsRaw.map((item: { name: string; type: string; dataUrl: string }) => toFile(item)),
        );

        const requestForm = new FormData();
        requestForm.append('FileId', fileNumber);
        requestForm.append('FileType', String(fileType ?? '2'));
        requestForm.append('PaymentRRR', rrr);
        requestForm.append('WithdrawalLetter', withdrawalLetter);
        supportingDocs.forEach((file) => {
            requestForm.append('SupportingDocuments', file);
        });

        const response = await fetch(`${baseURL}/api/files/WithdrawalRequest`, {
            method: 'POST',
            body: requestForm,
        });

        if (!response.ok) {
            error = "Failed to submit withdrawal request.";
        } else {
            success = "Withdrawal request submitted successfully.";
            sessionStorage.removeItem('withdrawalPaymentData');
            sessionStorage.removeItem('withdrawalData');
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
                        class="bg-green-800 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200"
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
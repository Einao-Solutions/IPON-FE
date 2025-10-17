<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { Toaster } from 'svelte-sonner';
    import { Button } from '$lib/components/ui/button/index';
    import * as Table from '$lib/components/ui/table/index';
    import { baseURL } from '$lib/helpers';
    import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
    import * as Dialog from '$lib/components/ui/dialog/index';

    let fileId: string | null = null;
    let fileData: any = null;
    let isLoading = true;
    let error: string | null = null;
    let showConfirmModal = false;
    let rrr: string | null = null;

    onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    fileId = urlParams.get('fileNumber') || sessionStorage.getItem('statussearch_fileId');
    rrr = urlParams.get('rrr');
    if (!fileId) {
        error = 'No file number provided.';
        isLoading = false;
        return;
    }
    try {
        const res = await fetch(`${baseURL}/api/files/GetFileByFileNumber?fileNumber=${encodeURIComponent(fileId)}`);
        if (!res.ok) throw new Error('Could not fetch file details.');
        const data = await res.json();
        if (!data || !data.length) {
            error = 'No result found for this file number.';
        } else {
            fileData = data[0];

            // Only update history after result is displayed
            if (rrr) {
                fetch(`${baseURL}/api/files/AddStatusSearchHistory?fileId=${encodeURIComponent(fileId)}&rrr=${encodeURIComponent(rrr)}`, {
                    method: 'POST'
                });
            }
        }
    } catch (e) {
        error = 'Error fetching file details.';
    }
        isLoading = false;
    });


    function printStatus() {
        window.open(
            `${baseURL}/api/letters/generate?fileId=${fileData?.fileId}&letterType=38`
        );
    }

    function goToDashboard() {
        goto('/home/dashboard');
    }
</script>

<style>
    .custom-table {
        table-layout: fixed;
    }
    .custom-table th, .custom-table td {
        border: 1px solid #d1d5db;
        text-align: center;
        vertical-align: middle;
        padding: 0.75rem 1rem;
    }
    .custom-table th {
        font-weight: bold;
        background: #f9fafb;
        white-space: nowrap;
    }
    .wide-cell {
        min-width: 300px;
        max-width: 350px;
        white-space: normal;
        overflow-wrap: break-word;
    }
</style>

<Toaster />

<!-- Confirmation Modal -->
<Dialog.Root bind:open={showConfirmModal}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Confirm Navigation</Dialog.Title>
        </Dialog.Header>
        <div class="mb-4">
            Please confirm you have downloaded or printed your result before leaving this page.
        </div>
        <div class="flex justify-end gap-2">
            <Button variant="secondary" on:click={() => showConfirmModal = false}>Stay on this page</Button>
            <Button on:click={goToDashboard}>Yes, go to Dashboard</Button>
        </div>
    </Dialog.Content>
</Dialog.Root>

<div class="max-w-6xl mx-auto mt-10 p-6 bg-white rounded shadow">
    <div class="flex justify-between items-center mb-6">
        <Button on:click={() => showConfirmModal = true}>Back to Dashboard</Button>
        <h2 class="text-xl font-bold">Status Search Result</h2>
        <div></div>
    </div>
    {#if isLoading}
        <div class="text-center py-10">Loading...</div>
    {:else if error}
        <div class="text-center text-red-500 py-10">{error}</div>
    {:else if fileData}
        <Table.Root class="custom-table w-full border-collapse">
            <Table.Header>
                <Table.Row>
                    <Table.Head class="font-bold text-center wide-cell">File Number</Table.Head>
                    <Table.Head class="font-bold text-center wide-cell">Title</Table.Head>
                    <Table.Head class="font-bold text-center wide-cell">Applicant Name</Table.Head>
                    <Table.Head class="font-bold text-center wide-cell">File Status</Table.Head>
                    {#if fileData.fileTypes === 2}
                        <Table.Head class="font-bold text-center wide-cell">Class</Table.Head>
                        <Table.Head class="font-bold text-center wide-cell">Representation</Table.Head>
                    {:else if fileData.fileTypes === 1}
                        <Table.Head class="font-bold text-center wide-cell">Design Type</Table.Head>
                        <Table.Head class="font-bold text-center wide-cell">Representation</Table.Head>
                    {:else if fileData.fileTypes === 0}
                        <Table.Head class="font-bold text-center wide-cell">Patent Type</Table.Head>
                        <Table.Head class="font-bold text-center wide-cell">Application Type</Table.Head>
                    {/if}
                    <Table.Head class="font-bold text-center">Print</Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                <Table.Row>
                    <Table.Cell class="text-center wide-cell">{fileData.fileId}</Table.Cell>
                    {#if fileData.fileTypes === 2}
                        <Table.Cell class="text-center wide-cell">{fileData.titleOfTradeMark}</Table.Cell>
                        <Table.Cell class="text-center wide-cell">{fileData.fileApplicant}</Table.Cell>
                        <Table.Cell class="text-center wide-cell">
                            <AppStatusTag value={fileData.fileStatus ?? undefined} />
                        </Table.Cell>
                        <Table.Cell class="text-center wide-cell">{fileData.tradeMarkClass}</Table.Cell>
                        <Table.Cell class="text-center wide-cell">
                            {#if fileData.logoUrl}
                                <img src={fileData.logoUrl} alt="Logo" class="h-12 mx-auto" />
                            {:else}
                                N/A
                            {/if}
                        </Table.Cell>
                    {:else if fileData.fileTypes === 1}
                        <Table.Cell class="text-center wide-cell">{fileData.titleOfDesign}</Table.Cell>
                        <Table.Cell class="text-center wide-cell">{fileData.fileApplicant}</Table.Cell>
                        <Table.Cell class="text-center wide-cell">
                            <AppStatusTag value={fileData.fileStatus ?? undefined} />
                        </Table.Cell>
                        <Table.Cell class="text-center wide-cell">{fileData.designType ?? 'N/A'}</Table.Cell>
                        <Table.Cell class="text-center wide-cell">
                            {#if fileData.logoUrl}
                                <img src={fileData.logoUrl} alt="Logo" class="h-12 mx-auto" />
                            {:else}
                                N/A
                            {/if}
                        </Table.Cell>
                    {:else if fileData.fileTypes === 0}
                        <Table.Cell class="text-center wide-cell">{fileData.titleOfInvention}</Table.Cell>
                        <Table.Cell class="text-center wide-cell">{fileData.fileApplicant}</Table.Cell>
                        <Table.Cell class="text-center wide-cell">
                            <AppStatusTag value={fileData.fileStatus ?? undefined} />
                        </Table.Cell>
                        <Table.Cell class="text-center wide-cell">{fileData.patentType ?? 'N/A'}</Table.Cell>
                        <Table.Cell class="text-center wide-cell">{fileData.patentApplicationType ?? 'N/A'}</Table.Cell>
                    {/if}
                    <Table.Cell class="text-center">
                        <Button on:click={printStatus}>Print</Button>
                    </Table.Cell>
                </Table.Row>
            </Table.Body>
        </Table.Root>
    {/if}
</div>
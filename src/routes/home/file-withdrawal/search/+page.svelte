<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import Icon from '@iconify/svelte';
import { baseURL, FileTypes } from '$lib/helpers';
import * as Table from '$lib/components/ui/table/index';
import { Button } from '$lib/components/ui/button/index';

let isLoading = true;
let error: string | null = null;
let searchParams: { query: string; fileType: string } | null = null;
let results: any[] = [];

let showAlreadyWithdrawnModal = false;
let withdrawnFileInfo: any = null;

onMount(async () => {
    try {
        const storedParams = sessionStorage.getItem('withdrawalSearchParams');
        searchParams = storedParams ? JSON.parse(storedParams) : null;
        if (!searchParams) {
            error = 'Search parameters are missing';
            return;
        }
        const response = await fetch(
            `${baseURL}/api/files/GetFileByFileNumber?fileNumber=${searchParams.query}`
        );
        if (!response.ok) {
            error = 'Failed to fetch file details';
            return;
        }
        results = await response.json();
        if (!results || results.length === 0) {
            error = 'No file found for the provided number';
            return;
        }
    } catch (err) {
        error = 'An error occurred while fetching file details';
    } finally {
        isLoading = false;
    }
});

function goBack() {
    goto('/home/file-withdrawal');
}

function uploadRequest(result: any) {
    // Navigate to upload request page, pass fileId and fileType as query params
    if (result.withdrawalDate || result.withdrawalRequestDate) {
        withdrawnFileInfo = result;
        showAlreadyWithdrawnModal = true;
        return;
    }
    goto(`/home/file-withdrawal/withdrawalform?fileNumber=${encodeURIComponent(result.fileId)}&fileType=${encodeURIComponent(result.fileTypes)}`);
}
</script>

<div class="space-y-4 m-4 p-2">
    <div class="flex items-center justify-between">
        <Button variant="outline" on:click={goBack} class="flex items-center gap-2">
            <Icon icon="lucide:arrow-left" width="1rem" height="1rem" />
            Back
        </Button>
        <h1 class="text-xl font-semibold">File Withdrawal Search Result</h1>
        <div></div>
    </div>

    {#if searchParams}
        <div class="bg-gray-50 p-4 rounded-md mb-4">
            <h2 class="text-sm font-medium text-gray-500 mb-2">Search Criteria</h2>
            <div class="flex flex-wrap gap-4">
                {#if searchParams.query}
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-medium">Search:</span>
                        <span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{searchParams.query}</span>
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    {#if isLoading}
        <div class="flex items-center justify-center p-12">
            <div class="flex flex-col items-center gap-2">
                <Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" />
                <span class="text-sm text-gray-500">Loading results...</span>
            </div>
        </div>
    {:else if error}
        <div class="bg-red-50 text-red-600 p-4 rounded-md text-center">
            <p>{error}</p>
        </div>
    {:else if results.length === 0}
        <div class="bg-yellow-50 p-8 rounded-md text-center">
            <Icon icon="lucide:search-x" width="2rem" height="2rem" class="mx-auto mb-2 text-yellow-600" />
            <h3 class="text-lg font-medium text-gray-800 mb-1">No results found</h3>
            <p class="text-gray-600">Please check your file number and try again.</p>
        </div>
    {:else}
        <div class="bg-white rounded-md shadow overflow-hidden">
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head class="w-16">S/N</Table.Head>
                        <Table.Head>File Number</Table.Head>
                        {#if results[0].fileTypes === FileTypes.Trademark}
                            <Table.Head>Title</Table.Head>
                            <Table.Head>Class</Table.Head>
                            <Table.Head>Representation</Table.Head>
                            <Table.Head>Applicant</Table.Head>
                        {:else if results[0].fileTypes === FileTypes.Patent}
                            <Table.Head>Title of Invention</Table.Head>
                            <Table.Head>File Origin</Table.Head>
                            <Table.Head>Patent Type</Table.Head>
                            <Table.Head>Applicant</Table.Head>
                        {:else if results[0].fileTypes === FileTypes.Design}
                            <Table.Head>Title of Design</Table.Head>
                            <Table.Head>Design Type</Table.Head>
                            <Table.Head>Applicant</Table.Head>
                        {/if}
                        <Table.Head class="w-40"></Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each results as result, index}
                        <Table.Row>
                            <Table.Cell class="font-medium">{index + 1}</Table.Cell>
                            <Table.Cell>{result.fileId}</Table.Cell>
                            {#if result.fileTypes === FileTypes.Trademark}
                                <Table.Cell>{result.titleOfTradeMark}</Table.Cell>
                                <Table.Cell>{result.tradeMarkClass}</Table.Cell>
                                <Table.Cell>
                                    {#if Number(result.tradeMarkLogo) === 0}
                                        Device
                                    {:else if Number(result.tradeMarkLogo) === 1}
                                        Wordmark
                                    {:else if Number(result.tradeMarkLogo) === 2}
                                        Word and Device
                                    {/if}
                                </Table.Cell>
                                <Table.Cell>{result.fileApplicant}</Table.Cell>
                            {:else if result.fileTypes === FileTypes.Patent}
                                <Table.Cell>{result.titleOfInvention}</Table.Cell>
                                <Table.Cell>{result.fileOrigin}</Table.Cell>
                                <Table.Cell>{result.patentType}</Table.Cell>
                                <Table.Cell>{result.fileApplicant}</Table.Cell>
                            {:else if result.fileTypes === FileTypes.Design}
                                <Table.Cell>{result.titleOfDesign}</Table.Cell>
                                <Table.Cell>{result.designType}</Table.Cell>
                                <Table.Cell>{result.fileApplicant}</Table.Cell>
                            {/if}
                            <Table.Cell>
                                <Button
                                  on:click={() => uploadRequest(result)}
                                    class="bg-black text-white hover:bg-red-700"
                                >
                                    Upload Request
                                </Button>
                            </Table.Cell>   
                        </Table.Row>
                    {/each}
                </Table.Body>
            </Table.Root>
        </div>
    {/if}

    {#if showAlreadyWithdrawnModal}
        <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                <div class="flex items-center gap-2 mb-4">
                    <Icon icon="mdi:alert-circle-outline" width="2em" height="2em" class="text-red-600" />
                    <h2 class="text-lg font-semibold text-red-700">THIS FILE HAS UNDERGONE WITHDRAWAL</h2>
                </div>
                <div class="mb-4 text-gray-700">
                    <p>
                        This file (<span class="font-bold">{withdrawnFileInfo.fileId}</span>) has already undergone a withdrawal request.
                    </p>
                    {#if withdrawnFileInfo.withdrawalRequestDate}
                        <p>
                            <span class="font-semibold">WithdrawalRequest Date:</span>
                            {new Date(withdrawnFileInfo.withdrawalRequestDate).toLocaleDateString()}
                        </p>
                    {/if}
                    <!-- {#if withdrawnFileInfo.withdrawalDate}
                        <p>
                            <span class="font-semibold">Withdrawal Date:</span>
                            {new Date(withdrawnFileInfo.withdrawalDate).toLocaleDateString()}
                        </p>
                    {/if} -->
                    <p class="mt-2">
                        If you believe this is an error, please contact support or check the file status for more details.
                    </p>
                </div>
                <div class="flex justify-end">
                    <Button variant="outline" on:click={() => (showAlreadyWithdrawnModal = false)}>
                        <Icon icon="mdi:close" width="1.2em" height="1.2em" class="inline mr-1" />
                        Close
                    </Button>
                </div>
            </div>
        </div>
    {/if}
</div>
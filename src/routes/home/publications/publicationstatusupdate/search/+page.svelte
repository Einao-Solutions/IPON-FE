<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Icon from '@iconify/svelte';
    import { baseURL, ApplicationStatuses, FileTypes } from '$lib/helpers';
    import * as Table from '$lib/components/ui/table/index';
    import { Button } from '$lib/components/ui/button/index';

    let isLoading = true;
    let error: string | null = null;
    let searchParams: { query: string; fileType: string } | null = null;
    let results: any[] = [];
    let isPatent = false;
    let showPublicationModal = false;

    onMount(async () => {
        try {
            const storedParams = sessionStorage.getItem('pubStatusSearchParams');
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
            isPatent = results[0].fileTypes === 0;

            // Check if file status is Publication
            if (results[0].fileStatus !== ApplicationStatuses.Publication && results[0].fileTypes !== FileTypes.Trademark) {
                error = 'This file is not currently at the Publication status. Only Trademark files with status "Publication" can be updated here.';
                results = [];
                return;
            }

            // Check if publicationDate is not null
            if (results[0].publicationDate) {
                showPublicationModal = true;
            }
        } catch (err) {
            error = 'An error occurred while fetching file details';
        } finally {
            isLoading = false;
        }
    });

    function closeModal() {
        goto('/home/publications/publicationstatusupdate');
    }   

    function goBack() {
        goto('/home/publications/publicationstatusupdate');
    }
</script>

<div class="space-y-4 m-4 p-2">
    <div class="flex items-center justify-between">
        <Button variant="outline" on:click={goBack} class="flex items-center gap-2">
            <Icon icon="lucide:arrow-left" width="1rem" height="1rem" />
            Back
        </Button>
        <h1 class="text-xl font-semibold">Publication Status Update Result</h1>
        <div></div>
    </div>

    {#if showPublicationModal}
        <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
                <Icon icon="lucide:check-circle" width="2.5rem" height="2.5rem" class="text-green-500 mx-auto mb-4" />
                <h2 class="text-lg font-semibold mb-2">Publication Completed</h2>
                <p class="mb-6">Publication has been done on this file.</p>
                <Button on:click={closeModal} class="bg-black text-white w-full">OK</Button>
            </div>
        </div>
    {:else}
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
                <p class="text-gray-600">Please ensure that your file is a Trademark and status is 'Publication' to be able to update publication status.</p>
            </div>
        {:else}
            <div class="bg-white rounded-md shadow overflow-hidden">
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.Head class="w-16">S/N</Table.Head>
                            <Table.Head>File Number</Table.Head>
                            <Table.Head>Trademark Title</Table.Head>
                            <Table.Head>Applicant</Table.Head>
                            <Table.Head>Class</Table.Head>
                            <Table.Head>Representation</Table.Head>
                            <Table.Head class="w-40"></Table.Head>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {#each results as result, index}
                            <Table.Row>
                                <Table.Cell class="font-medium">{index + 1}</Table.Cell>
                                <Table.Cell>{result.fileId}</Table.Cell>
                                <Table.Cell>{result.titleOfTradeMark}</Table.Cell>
                                <Table.Cell>{result.fileApplicant}</Table.Cell>
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
                                <Table.Cell>
                                    <Button
                                        on:click={() =>
                                            goto(`/home/publications/publicationstatusupdate/statusupdateform?fileNumber=${encodeURIComponent(result.fileId)}&publicationDate=${encodeURIComponent(result.publicationDate ?? '')}`)
                                        }
                                        class="bg-black text-white hover:bg-gray-800"
                                    >
                                        Proceed
                                    </Button>
                                </Table.Cell>
                            </Table.Row>
                        {/each}
                    </Table.Body>
                </Table.Root>
            </div>
        {/if}
    {/if}
</div>
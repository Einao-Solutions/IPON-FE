<script lang="ts">
    import { goto } from '$app/navigation';
    import { Input } from '$lib/components/ui/input/index';
    import { Button } from '$lib/components/ui/button/index';
    import * as Dialog from "$lib/components/ui/dialog/index"
    import { Toaster, toast } from 'svelte-sonner';
    import Icon from '@iconify/svelte';
    import { baseURL } from '$lib/helpers';

    let showNewSearch = true;
    let search_file_id = '';
    let isSearching = false;

    // Helper to detect file type from file number
    function detectFileType(fileId: string): number {
        if (/TM/i.test(fileId)) return 2;      // TradeMark
        if (/PT/i.test(fileId)) return 0;      // Patent
        if (/DS/i.test(fileId) || /DES/i.test(fileId)) return 1; // Design (adjust as needed)
        return 2; // Default to TradeMark if unsure
    }

    async function handlePayment() {
        if (!search_file_id) {
            toast.error('Please enter a file number.');
            return;
        }
        isSearching = true;
        try {
            const fileType = detectFileType(search_file_id);
            const res = await fetch(`${baseURL}/api/files/GetStatusSearchCost?fileId=${encodeURIComponent(search_file_id)}&fileType=${fileType}`);
            if (!res.ok) throw new Error('Failed to get cost');
            const data = await res.json();
            const cost = data?.amount;
            const paymentId = data?.rrr;
            if (cost && paymentId) {
                // Optionally, save fileId in sessionStorage for later use after payment
                sessionStorage.setItem('statussearch_fileId', search_file_id);
                sessionStorage.setItem('statussearch_applicantName', data?.applicantName ?? '');
                await goto(`/payment?type=statussearch&rrr=${paymentId}&amount=${cost}&fileId=${encodeURIComponent(search_file_id)}`);
            } else {
                toast.error('Could not retrieve payment details.');
            }
        } catch (e) {
            toast.error('Error fetching payment info.');
        }
        isSearching = false;
    }

      //  Watch for dialog close
    $: if (!showNewSearch) {
        goto('/home/dashboard');
    }

</script>

<Toaster />

<Dialog.Root bind:open={showNewSearch} closeOnOutsideClick={false}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>New Application Status Search</Dialog.Title>
        </Dialog.Header>

        <Input bind:value={search_file_id} placeholder="enter file number" />

        <div class="flex gap-2 mt-4">
            <Button on:click={() => goto('/home/dashboard')}>Back</Button>
            <Button on:click={handlePayment} disabled={isSearching}>
                <Icon class={isSearching ? '' : 'hidden'} icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
                Search & Pay
            </Button>
        </div>
    </Dialog.Content>
</Dialog.Root>

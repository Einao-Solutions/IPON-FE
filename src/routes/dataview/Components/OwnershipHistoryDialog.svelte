<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import { FormApplicationTypes, type ApplicationHistoryType } from '$lib/helpers';

	export let open = false;
	export let entries: ApplicationHistoryType[] = [];
	export let closed: () => void = () => {};

	function pick(obj: any, ...keys: string[]): any {
		if (!obj || typeof obj !== 'object') return undefined;
		for (const k of keys) {
			if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
		}
		return undefined;
	}

	function readParty(value: unknown): {
		name: string;
		id: string;
		email: string;
		phone: string;
		address: string;
		state: string;
	} {
		if (!value) {
			return { name: '-', id: '-', email: '-', phone: '-', address: '-', state: '-' };
		}
		if (typeof value === 'string') {
			return { name: value, id: '-', email: '-', phone: '-', address: '-', state: '-' };
		}
		const v: any = value;
		const corr = pick(v, 'correspondence', 'Correspondence') ?? v;
		return {
			name:
				pick(v, 'name', 'Name', 'ownerName', 'OwnerName') ??
				pick(corr, 'name', 'Name') ??
				'-',
			id: pick(v, 'id', 'Id', 'ownerId', 'OwnerId', 'creatorId', 'CreatorId') ?? '-',
			email: pick(corr, 'email', 'Email') ?? '-',
			phone: pick(corr, 'phone', 'Phone') ?? '-',
			address: pick(corr, 'address', 'Address') ?? '-',
			state: pick(corr, 'state', 'State') ?? '-'
		};
	}

	function readPoaUrl(entry: ApplicationHistoryType): string | null {
		const nv: any = entry.newValue;
		if (!nv || typeof nv !== 'object') return null;
		const poa = pick(nv, 'poa', 'Poa', 'powerOfAttorney', 'PowerOfAttorney');
		if (!poa) return null;
		return pick(poa, 'url', 'Url', 'fileUrl', 'FileUrl') ?? null;
	}

	function formatDate(raw: string | null | undefined) {
		if (!raw) return '-';
		const d = new Date(raw);
		if (isNaN(d.getTime())) return raw;
		return d.toLocaleString();
	}

	$: ownershipEntries = (entries ?? [])
		.filter((e) => e.applicationType === FormApplicationTypes.Ownership)
		.slice()
		.sort((a, b) => {
			const da = new Date(a.applicationDate ?? 0).getTime();
			const db = new Date(b.applicationDate ?? 0).getTime();
			return db - da;
		});

	function handleOpenChange(next: boolean) {
		if (!next) closed();
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-4xl">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2 text-xl">
				<Icon icon="lucide:users" width="1.25rem" height="1.25rem" />
				Ownership History
			</Dialog.Title>
			<Dialog.Description>
				Chronological list of agents/owners that have had access to this file.
			</Dialog.Description>
		</Dialog.Header>

		<div class="max-h-[65vh] overflow-y-auto pr-1">
			{#if ownershipEntries.length === 0}
				<div class="py-10 text-center text-sm text-muted-foreground">
					No ownership changes recorded for this file.
				</div>
			{:else}
				<div class="space-y-4">
					{#each ownershipEntries as entry, i (entry.id)}
						{@const oldParty = readParty(entry.oldValue)}
						{@const newParty = readParty(entry.newValue)}
						{@const poaUrl = readPoaUrl(entry)}
						<div class="rounded-lg border p-4 space-y-3 bg-card">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2 text-sm font-medium">
									<span
										class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs"
										>{ownershipEntries.length - i}</span
									>
									<span>Ownership Change</span>
								</div>
								<div class="text-xs text-muted-foreground">
									{formatDate(entry.applicationDate)}
								</div>
							</div>

							<div class="grid gap-3 md:grid-cols-[1fr_auto_1fr] items-stretch">
								<div class="rounded-md border bg-muted/30 p-3">
									<div class="text-xs font-semibold text-muted-foreground mb-2">
										Previous Agent / Owner
									</div>
									<div class="space-y-1 text-sm">
										<div><span class="text-muted-foreground">Name:</span> {oldParty.name}</div>
										<div><span class="text-muted-foreground">ID:</span> {oldParty.id}</div>
										<div><span class="text-muted-foreground">Email:</span> {oldParty.email}</div>
										<div><span class="text-muted-foreground">Phone:</span> {oldParty.phone}</div>
										<div><span class="text-muted-foreground">Address:</span> {oldParty.address}</div>
										<div><span class="text-muted-foreground">State:</span> {oldParty.state}</div>
									</div>
								</div>

								<div class="flex md:flex-col items-center justify-center text-muted-foreground">
									<Icon
										icon="lucide:arrow-right"
										width="1.5rem"
										height="1.5rem"
										class="hidden md:block rotate-0"
									/>
									<Icon
										icon="lucide:arrow-down"
										width="1.5rem"
										height="1.5rem"
										class="md:hidden"
									/>
								</div>

								<div class="rounded-md border bg-green-50 dark:bg-green-950/20 p-3">
									<div class="text-xs font-semibold text-green-700 dark:text-green-500 mb-2">
										New Agent / Owner
									</div>
									<div class="space-y-1 text-sm">
										<div><span class="text-muted-foreground">Name:</span> {newParty.name}</div>
										<div><span class="text-muted-foreground">ID:</span> {newParty.id}</div>
										<div><span class="text-muted-foreground">Email:</span> {newParty.email}</div>
										<div><span class="text-muted-foreground">Phone:</span> {newParty.phone}</div>
										<div><span class="text-muted-foreground">Address:</span> {newParty.address}</div>
										<div><span class="text-muted-foreground">State:</span> {newParty.state}</div>
									</div>
								</div>
							</div>

							{#if poaUrl}
								<div class="pt-1">
									<a
										href={poaUrl}
										target="_blank"
										rel="noopener"
										class="inline-flex items-center gap-1 text-xs text-primary hover:underline"
									>
										<Icon icon="lucide:file-text" width="0.9rem" height="0.9rem" />
										View Power of Attorney
									</a>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="outline" on:click={() => { open = false; closed(); }}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

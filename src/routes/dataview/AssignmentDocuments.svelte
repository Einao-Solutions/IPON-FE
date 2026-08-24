<script lang="ts">
	import { baseURL } from '$lib/helpers';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';

	export let fileId: string;
	export let appId: string;

	type DocumentKind = 'deed' | 'letter';
	type DocumentResponse = Record<string, unknown>;

	let documents: DocumentResponse | null = null;
	let selectedDocument: DocumentKind = 'deed';
	let loading = true;
	let error = '';

	$: deedUrl = getDocumentUrl(documents, [
		'assignmentDeedUrl',
		'deedOfAgreementUrl',
		'deedOfAssignmentUrl',
		'assignmentDeed',
		'deedOfAgreement'
	]);
	$: letterUrl = getDocumentUrl(documents, [
		'authorizationLetterUrl',
		'letterOfAuthorizationUrl',
		'authorizationLetter',
		'letterOfAuthorization'
	]);
	$: selectedUrl = selectedDocument === 'deed' ? deedUrl : letterUrl;

	function getDocumentUrl(data: DocumentResponse | null, keys: string[]): string {
		if (!data) return '';

		for (const key of keys) {
			const value = data[key];
			if (typeof value === 'string' && value.trim()) return normalizeDocumentUrl(value);
			if (value && typeof value === 'object') {
				const nested = value as Record<string, unknown>;
				const nestedUrl = nested.url ?? nested.fileUrl ?? nested.documentUrl;
				if (typeof nestedUrl === 'string' && nestedUrl.trim()) return normalizeDocumentUrl(nestedUrl);
			}
		}

		return '';
	}

	function normalizeDocumentUrl(value: string): string {
		const url = value.trim();
		if (/^(https?:|blob:|data:)/i.test(url)) return url;
		if (url.startsWith('//')) return `https:${url}`;
		return new URL(url, `${baseURL}/`).toString();
	}

	async function fetchDocuments() {
		loading = true;
		error = '';

		try {
			const response = await fetch(
				`${baseURL}/api/files/GetAssignmentApplication?fileId=${encodeURIComponent(fileId)}&appId=${encodeURIComponent(appId)}`
			);
			if (!response.ok) throw new Error(`Failed to fetch documents: ${response.status}`);
			documents = await response.json();
		} catch (reason) {
			error = reason instanceof Error ? reason.message : 'Failed to load documents';
		} finally {
			loading = false;
		}
	}

	$: if (fileId && appId) {
		fetchDocuments();
	}
</script>

{#if loading}
	<div class="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
		<Icon icon="eos-icons:loading" class="mr-2" /> Loading documents...
	</div>
{:else if error}
	<div class="space-y-3 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
		<p>{error}</p>
		<Button variant="outline" on:click={fetchDocuments}>Retry</Button>
	</div>
{:else if !deedUrl && !letterUrl}
	<div class="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800">
		No assignment documents found.
	</div>
{:else}
	<div class="space-y-4">
		<div class="flex flex-wrap gap-2">
			{#if deedUrl}
				<Button variant={selectedDocument === 'deed' ? 'default' : 'outline'} on:click={() => (selectedDocument = 'deed')}>
					<Icon icon="material-symbols:description-outline" class="mr-2" /> Assignment Deed
				</Button>
			{/if}
			{#if letterUrl}
				<Button variant={selectedDocument === 'letter' ? 'default' : 'outline'} on:click={() => (selectedDocument = 'letter')}>
					<Icon icon="material-symbols:mail-outline" class="mr-2" /> Authorization Letter
				</Button>
			{/if}
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<a class="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700" href={selectedUrl} download>
				<Icon icon="material-symbols:download" class="mr-2" /> Download PDF
			</a>
			<a class="text-sm underline" href={selectedUrl} target="_blank" rel="noopener noreferrer">Open in new tab</a>
		</div>

		<div class="h-[600px] overflow-hidden rounded-md border bg-muted">
			<iframe class="h-full w-full" src={selectedUrl} title={selectedDocument === 'deed' ? 'Assignment deed PDF' : 'Authorization letter PDF'}></iframe>
		</div>
	</div>
{/if}
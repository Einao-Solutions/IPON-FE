<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { applicationData, applicationMode, formsData } from '$lib/store';
	import { tradeMarkClassesMap } from '$lib/constants';
	import { type AttachmentType, type Applicant, type CorrespondenceType, GetCountryImageLink } from '$lib/helpers';
	import { mapTrademarkAttToString, mapTradeStringToInt, mapTradeStringToString } from '$lib/designutils';

	interface BasicFormData {
		title: string;
		class: number;
		description: string;
		additionalDescription: string;
		type: number;
		logo: number;
		disclaimer: string;
	}

	let basics: BasicFormData | undefined = undefined;
	let applicants: Applicant[] = [];
	let correspondence: CorrespondenceType | undefined = undefined;
	let isLoading: boolean | undefined = undefined;
	let attachments: AttachmentType[] = [];

	onMount(() => {
		isLoading = true;
		let allData = $formsData;
		basics = (allData?.find(x => x.name === "basic")?.data as BasicFormData) || undefined;
		applicants = (allData?.find(x => x.name === "applicant")?.data as Applicant[]) || [];
		correspondence = (allData?.find(x => x.name === "correspondence")?.data as CorrespondenceType) || undefined;
		attachments = ($formsData?.filter(x => x.name === "attachments")[0]?.data as AttachmentType[]) ?? [];
		if ($applicationMode === 1) {
			// edit mode
			applicants = applicants.length ? applicants : ($applicationData?.applicants as Applicant[] ?? []);
			correspondence = correspondence ?? ($applicationData?.correspondence as CorrespondenceType | undefined);
			attachments = attachments.length ? attachments : ($applicationData?.attachments?.map((val: any) => ({
				type: mapTradeStringToInt(val.name), data: [{
					url: val.url[0],
					fileName: String(mapTradeStringToString(val.name))
				}]
			})) as AttachmentType[] ?? []);
			basics = basics ?? {
				title: ($applicationData as any)?.titleOfTradeMark,
				class: ($applicationData as any)?.trademarkClass,
				description: ($applicationData as any)?.trademarkClassDescription,
				additionalDescription: ($applicationData as any)?.additionalDescription,
				type: ($applicationData as any)?.trademarkType,
				logo: ($applicationData as any)?.trademarkLogo,
				disclaimer: ($applicationData as any)?.trademarkDisclaimer,
			};
		}
		isLoading = false;
	});
</script>


{#if isLoading===true}
	<div class="items-center justify-center flex h-screen">
		<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
	</div>
	{:else if isLoading===false}
<div class="max-w-4xl mx-auto px-4 space-y-6">
	<h1 class="text-2xl font-bold text-gray-900 mb-6">Summary of Trademark Application</h1>

	<!-- Basic Information -->
	<div class="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-3 mb-8">
		<div class="border-b pb-2">
			<h2 class="text-lg font-semibold text-gray-800">1. Trademark Information</h2>
		</div>
		<div class="text-gray-700 text-sm space-y-2">
			<p><strong>Title:</strong> {basics?.title || '—'}</p>
			<p><strong>Class:</strong> Class {basics?.class || '—'}</p>
			<p><strong>Class Description:</strong> {basics?.description || '—'}</p>
			<p><strong>Additional Description:</strong> {basics?.additionalDescription || '—'}</p>
			<p><strong>Type:</strong> {basics?.type !== undefined ? ['Local', 'Foreign'][basics.type] || '—' : '—'}</p>
			<p><strong>Logo Description:</strong> {basics?.logo !== undefined ? ['Device', 'Word Mark', 'Word and Device'][basics.logo] || '—' : '—'}</p>
			<p><strong>Claims and Disclaimer:</strong> {basics?.disclaimer || '—'}</p>
		</div>
	</div>

	<!-- Applicants -->
	<div class="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-3 mb-8">
		<div class="border-b pb-2">
			<h2 class="text-lg font-semibold text-gray-800">2. Applicants Information</h2>
		</div>
		<div class="text-gray-700 text-sm space-y-2">
			{#if applicants.length===0}
				<p class="text-gray-400">No applicants added</p>
			{:else}
				{#each applicants as applicant, i (i)}
					<div class="mb-3">
						<p><strong>{i + 1}.</strong> <strong>Name:</strong> {applicant.name}</p>
						<p class="flex items-center gap-2"><strong>Country:</strong>
							<img src="{GetCountryImageLink(applicant.country)}" width="20" height="15" alt="flag"/>
							{applicant.country}
						</p>
						<p><strong>Phone:</strong> {applicant.phone}</p>
						<p><strong>Email:</strong> {applicant.email}</p>
						<p><strong>Address:</strong> {applicant.address}</p>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Correspondence -->
	<div class="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-3 mb-8">
		<div class="border-b pb-2">
			<h2 class="text-lg font-semibold text-gray-800">3. Correspondence Information</h2>
		</div>
		<div class="text-gray-700 text-sm space-y-2">
			<p><strong>Name:</strong> {correspondence?.name || '—'}</p>
			<p><strong>Address:</strong> {correspondence?.address || '—'}</p>
			<p><strong>Phone:</strong> {correspondence?.phone || '—'}</p>
			<p><strong>Email:</strong> {correspondence?.email || '—'}</p>
			<p><strong>State:</strong> {correspondence?.state || '—'}</p>
		</div>
	</div>

	<!-- Attachments -->
	<div class="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-3 mb-8">
		<div class="border-b pb-2">
			<h2 class="text-lg font-semibold text-gray-800">4. Attachments</h2>
		</div>
		<div class="text-gray-700 text-sm space-y-3">
			{#each attachments.filter(x=>x.type!=null) as attached, i (i)}
				<div class="flex items-center gap-4 border p-3 rounded-lg">
					<p class="font-medium">{mapTrademarkAttToString(attached.type)}</p>
					<p class="line-clamp-1 text-ellipsis text-gray-500 flex-1">{attached.data[0].url}</p>
					<a target="_blank" href="{attached.data[0].url}" class="rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 px-4 py-1 text-sm font-medium transition shadow-sm border border-blue-200">
						View
					</a>
					<Icon icon="simple-line-icons:check" width="1.2rem" height="1.2rem" class="text-green-500" />
				</div>
			{/each}
		</div>
	</div>
</div>
	{/if}
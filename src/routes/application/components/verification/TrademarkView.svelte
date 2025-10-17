<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { applicationData, applicationMode, formsData } from '$lib/store';
	import {Label} from "$lib/components/ui/label";
	import { tradeMarkClasses } from '$lib/constants';
	import * as Table from "$lib/components/ui/table/index"
	import { type AttachmentType, type CorrespondenceType, GetCountryImageLink } from '$lib/helpers';
	import { mapTrademarkAttToString, mapTradeStringToInt, mapTradeStringToString } from '$lib/designutils';
let basics:unknown
	let applicants:[]
	let correspondence:CorrespondenceType
	let isLoading:boolean|undefined=undefined;
	let attachments:AttachmentType[]
	onMount(()=>{
		isLoading=true;
		let allData = $formsData
		basics= allData?.find(x=>x.name==="basic")?.data || undefined
		applicants= allData?.find(x=>x.name==="applicant")?.data || undefined
		correspondence= allData?.find(x=>x.name==="correspondence")?.data || undefined
		attachments = $formsData?.filter(x=>x.name==="attachments")[0]?.data as AttachmentType[]??undefined;
		if ($applicationMode===1){
			// edit mode
			applicants=applicants??$applicationData?.applicants;
			correspondence=correspondence??$applicationData?.correspondence;
			attachments= attachments?? $applicationData?.attachments.map((val)=> ({
				type:mapTradeStringToInt(val.name), data: [
				{
					url: val.url[0],
					fileName: mapTradeStringToString(val.name)
				}
			]}));
			basics = basics?? {
				title: $applicationData.titleOfTradeMark,
				class: $applicationData.trademarkClass,
				description: $applicationData.trademarkClassDescription,
				type: $applicationData.trademarkType,
				logo: $applicationData.trademarkLogo,
				disclaimer: $applicationData.trademarkDisclaimer,
			}
		}
		isLoading=false;
	})
</script>


{#if isLoading===true}
	<div class="items-center justify-center flex h-screen">
		<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
	</div>
	{:else if isLoading===false}
<div class="m-2 space-y-3">
	<div class="border rounded-md p-2">
		<Label for='title'>Trademark Title</Label>
		<p>{basics.title || undefined}</p>
	</div>
	<div class="border rounded-md p-2">
		<Label for='title'>Trademark Class</Label>
		<p>Class {basics.class || undefined}</p>
		<Label for='desc'>Class Descripition</Label>
		<p>{basics.description||undefined}</p>
	</div>
	<div class="border rounded-md p-2">
		<Label for='type'>Trademark Type</Label>
		<p>{['Local', 'Foreign'][basics.type] || undefined}</p>
	</div>
	<div class="border rounded-md p-2">
		<Label for='logo'>Trademark Logo description</Label>
		<p>{['Device', 'Word Mark', 'Word and Device'][basics.logo] || undefined}</p>
	</div>
	<div class="border rounded-md p-2">
		<Label for='disclaimer'>Claims and disclaimer</Label>
		<p>{basics.disclaimer || undefined}</p>
	</div>

	<div class="rounded-md border p-2">
		<Label>Applicants Information</Label>
		<Table.Root >
			{#if applicants.length===0}
				<p>No applicants added</p>
			{:else}
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-1">s/n</Table.Head>
						<Table.Head>Name</Table.Head>
						<Table.Head>Country</Table.Head>
						<Table.Head>Phone</Table.Head>
						<Table.Head>Email</Table.Head>
						<Table.Head>Address</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each applicants as applicant, i (i)}
						<Table.Row>
							<Table.Cell class="w-1">{i+1}</Table.Cell>
							<Table.Cell>{applicant.name}</Table.Cell>
							<Table.Cell >
						<span class="flex gap-2">
						<img src="{GetCountryImageLink(applicant.country)}" width="20" height="15" alt="@flag"/>
							{applicant.country}
						</span>
							</Table.Cell>
							<Table.Cell>{applicant.phone}</Table.Cell>
							<Table.Cell>{applicant.email}</Table.Cell>
							<Table.Cell>{applicant.address}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			{/if}
		</Table.Root>
	</div>
	<div class="rounded-md border p-2">
		<Label>Correspondence Information</Label>
		<div>
			<Label>Name</Label>
			<p>{correspondence?.name}</p>
		</div>
		<div>
			<Label>Address</Label>
			<p>{correspondence?.address}</p>
		</div>
		<div>
			<Label>Number</Label>
			<p>{correspondence?.phone}</p>
		</div>
		<div>
			<Label>Email</Label>
			<p>{correspondence?.email}</p>
		</div>
		<div>
			<Label>State</Label>
			<p>{correspondence?.state}</p>
		</div>
	</div>

	<div class="rounded-md border p-2 m-1">
		<Label>Attachments</Label>
		{#each attachments.filter(x=>x.type!=null) as attached, i (i)}
				<div class="rounded-md border p-1.5 flex gap-4 m-2 items-center justify-start">
					<p>{mapTrademarkAttToString(attached.type)}</p>
					<p class="line-clamp-1 text-ellipsis">{attached.data[0].url}</p>
					<a target="_blank" href="{attached.data[0].url}" class="rounded-md border bg-blue-100 p-2" >
						<Icon icon="ep:view" width="1.2rem" height="1.2rem" />
					</a>
					<Icon icon="simple-line-icons:check" width="1.2rem" height="1.2rem" class="text-green-500 ml-auto" />
				</div>
		{/each}
	</div>
</div>
	{/if}
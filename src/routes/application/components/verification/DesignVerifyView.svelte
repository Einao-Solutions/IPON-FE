<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { applicationData, applicationMode, createdData, formsData } from '$lib/store.js';
	import * as Table from "$lib/components/ui/table";
	import {
		type Applicant,
		ApplicationStatuses,
		type AttachmentType, type BasicDesignType,
		type CorrespondenceType,
		FilingType,
		FormApplicationTypes,
		GetCountryImageLink,
		type Inventor,
		type PatentData
	} from '$lib/helpers';
	import { mapAttToString } from '../../apphelper';
	import { mapDesignAttStringToInt, mapDesignAttToString } from '$lib/designutils';
	let allApplicants:Applicant[]=[];
	let listOfCreators:Inventor[]=[];
	let correspondence:CorrespondenceType= {state:"",email:"",phone:"",address:"",name:"",id:""}
	let allAttachments :AttachmentType[]=[];
	let basicData: BasicDesignType= { title:"", statementOfNovelty:"", designType:0}
	onMount(()=>{
		basicData = $formsData?.filter(x=>x.name==="basic")[0]?.data as BasicDesignType?? undefined;
		allApplicants=$formsData?.filter(x=>x.name==="applicant")[0]?.data as Applicant[]??undefined;
		listOfCreators=$formsData?.filter(x=>x.name==="inventors")[0]?.data as Inventor[]??undefined;
		correspondence=$formsData?.filter(x=>x.name==="correspondence")[0]?.data as CorrespondenceType ?? undefined;
		allAttachments = $formsData?.filter(x=>x.name==="attachments")[0]?.data as AttachmentType[]??undefined;
		if ($applicationMode===1){
			// edit mode
			basicData=basicData?? {
				title: $applicationData.titleOfDesign,
				statementOfNovelty: $applicationData.statementOfNovelty,
				designType: $applicationData.designType,
			}
			allApplicants=allApplicants?? $applicationData.applicants
			listOfCreators=listOfCreators?? $applicationData.designCreators
			correspondence=correspondence?? $applicationData.correspondence
			allAttachments=allAttachments?? $applicationData.attachments.map((val)=>({
				type: mapDesignAttStringToInt(val.name) , data: [{fileName: val.name, url: val.url }],
			}))
		}
		let final:PatentData={
			FormApplicationType:FormApplicationTypes.NewApplication,
			FileStatus:ApplicationStatuses.AwaitingPayment,
			Type:FilingType.Design,
			FileId:"",
			id:"sample_id",
			TitleOfDesign: basicData.title,
			StatementOfNovelty:basicData.statementOfNovelty,
			DesignType: basicData.designType,
			Applicants:[...allApplicants],
			Creators:[...listOfCreators],
			Correspondence:correspondence,
			Attachments:[...allAttachments.map(x=>({name:x.type,  url:x.data.map(y=>y.url)}))],
		}
		createdData.set(final);


	})


</script>
<div class="flex flex-col gap-y-1.5 p-1.5 ">
	<div class="rounded-md border p-2">
		<Label>Title of Design</Label>
		<p>{basicData.title}</p>
	</div>
	<div class="rounded-md border p-2">
		<Label>Statement of Novelty</Label>
		<p>{basicData.statementOfNovelty}</p>
	</div>
	<div class="rounded-md border p-2">
		<Label>Design Type</Label>
		<p>{basicData.designType===0?'Textile':'Non-Textile'}</p>
	</div>
	<div class="rounded-md border p-2">
		<Label>Applicants Information</Label>
		<Table.Root >
			{#if allApplicants.length===0}
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
					{#each allApplicants as applicant, i (i)}
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
		<Label>Design Creators </Label>
		<Table.Root >
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
				{#each listOfCreators as inventor, i (i)}
					<Table.Row>
						<Table.Cell class="w-1">{i+1}</Table.Cell>
						<Table.Cell>{inventor.name}</Table.Cell>
						<Table.Cell >
						<span class="flex gap-2">
						<img src="{GetCountryImageLink(inventor.country)}" width="20" height="15" alt="@flag"/>
							{inventor.country}
						</span>
						</Table.Cell>
						<Table.Cell>{inventor.phone}</Table.Cell>
						<Table.Cell>{inventor.email}</Table.Cell>
						<Table.Cell>{inventor.address}</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
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
		{#each allAttachments.filter(x=>x.type!=null) as attached, i (i)}
			<div class="rounded-md border p-1.5 flex gap-4 m-2 items-center justify-start">
				<p>{mapDesignAttToString(attached.type)}</p>
				<Icon icon="simple-line-icons:check" width="1.2rem" height="1.2rem" class="text-green-500 ml-auto" />
			</div>
			<div class="rounded-md border p-1.5 m-2 space-y-2">
				{#each attached.data as fileN }
						<p class="line-clamp-1 text-ellipsis">{fileN.fileName}</p>
					{/each}
			</div>
		{/each}
	</div>
</div>
<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { MapPatentType } from '$lib/constants';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { applicationData, applicationMode, createdData, formsData } from '$lib/store.js';
	import * as Table from "$lib/components/ui/table";
	import {
		type Applicant,
		ApplicationStatuses,
		type AttachmentType,
		type BasicType,
		type CorrespondenceType,
		FilingType,
		FormApplicationTypes,
		GetCountryImageLink,
		type Inventor,
		type PatentData,
		type Priority
	} from '$lib/helpers';
	import { mapAttToString } from '../../apphelper';
	import { mapPatentAppTypeToString } from '../../../home/components/dashboardutils';
	import { mapDesignAttStringToInt, mapPatentAttToString } from '$lib/designutils';

	let allApplicants:Applicant[]=[];
	let listOfInventors:Inventor[]=[];
	let allPriorities:Priority[]=[];
	let correspondence:CorrespondenceType= {state:"",email:"",phone:"",address:"",name:"",id:""}
	let allAttachments :AttachmentType[]=[];
	let basicData: BasicType= { title:"", abstract:"", patentType:0, id:"", patentApplicationType :0};
	onMount(()=>{
		basicData = $formsData?.filter(x=>x.name==="basic")[0]?.data as BasicType;
		allApplicants=$formsData?.filter(x=>x.name==="applicant")[0]?.data as Applicant[]??[];
		listOfInventors=$formsData?.filter(x=>x.name==="inventors")[0]?.data as Inventor[]??[];
		allPriorities=$formsData?.filter(x=>x.name==="priority")[0]?.data as Priority[]??[];
		correspondence=$formsData?.filter(x=>x.name==="correspondence")[0]?.data as CorrespondenceType;
		allAttachments = $formsData?.filter(x=>x.name==="attachments")[0]?.data as AttachmentType[]??[];
		if ($applicationMode===1){
			// edit mode
			basicData=basicData?? {
				title: $applicationData.titleOfInvention,
				abstract: $applicationData.patentAbstract,
				patentType: $applicationData.patentType,
				patentApplicationType: $applicationData.patentApplicationType
			}
			allApplicants=allApplicants?? $applicationData.applicants
			listOfInventors=listOfInventors?? $applicationData.inventors
			correspondence=correspondence?? $applicationData.correspondence
			allAttachments=allAttachments?? $applicationData.attachments.map((val)=>({
				type: mapDesignAttStringToInt(val.name) , data: [{fileName: val.name, url: val.url }],
			}))
		}
		let final:PatentData={
			formApplicationType:FormApplicationTypes.NewApplication, status:ApplicationStatuses.AwaitingPayment, type:FilingType.Patent,
			fileNumber:"",
			id:"sample_id",
			titleOfInvention: basicData.title, patentAbstract:basicData.abstract,
			patentType: basicData.patentType, patentApplicationType: basicData.patentApplicationType,
			applicants:[...allApplicants],inventors:[...listOfInventors], correspondence:correspondence,
			attachments:[...allAttachments.map(x=>({name:x.type,  url:x.data.map(y=>y.url)}))],
			priorityInfo:[...allPriorities],
		}
		createdData.set(final);
	})
</script>
<div class="flex flex-col gap-y-1.5 p-1.5 ">
	<div class="rounded-md border p-2">
		<Label>Title of Invention</Label>
		<p>{basicData.title}</p>
	</div>
	<div class="rounded-md border p-2">
		<Label>Patent Abstract</Label>
		<p>{basicData.abstract}</p>
	</div>
	<div class="rounded-md border p-2">
		<Label>Patent Type</Label>
		<p>{MapPatentType(basicData.patentType)}</p>
	</div>
	<div class="rounded-md border p-2">
		<Label>Patent Application Type</Label>
		<p>{mapPatentAppTypeToString(basicData.patentApplicationType)}</p>
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
		<Label>Patent Inventors </Label>
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
					{#each listOfInventors as inventor, i (i)}
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

	<div class="rounded-md border p-2">
		<Label>All Priority Information</Label>
		<Table.Root >
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-1">s/n</Table.Head>
						<Table.Head>Number</Table.Head>
						<Table.Head>Country</Table.Head>
						<Table.Head>Date</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each allPriorities as priority, i (i)}
						<Table.Row>
								<Table.Cell class="w-1">{i+1}</Table.Cell>
								<Table.Cell>{priority.number}</Table.Cell>
								<Table.Cell >
						<span class="flex gap-2">
						<img src="{GetCountryImageLink(priority.country)}" width="20" height="15" alt="@flag"/>
							{priority.country}
						</span>
								</Table.Cell>
								<Table.Cell>{priority.date}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
		</Table.Root>
	</div>

	<div class="rounded-md border p-2 m-1">
		<Label>Attachments</Label>
		{#each allAttachments.filter(x=>x.type!=null) as attached, i (i)}
			<div class="rounded-md border p-1.5 flex gap-4 m-2 items-center justify-start">
				<p>{mapPatentAttToString(attached.type)}</p>
				<p class="line-clamp-1 text-ellipsis">{attached.data[0].url}</p>
				<a target="_blank" href="{attached.data[0].url}" class="rounded-md border bg-blue-100 p-2" >
					<Icon icon="ep:view" width="1.2rem" height="1.2rem" />
				</a>
				<Icon icon="simple-line-icons:check" width="1.2rem" height="1.2rem" class="text-green-500 ml-auto" />
			</div>
		{/each}
		<div>
		</div>
	</div>
</div>
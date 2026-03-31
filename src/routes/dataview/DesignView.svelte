<script lang="ts">
	import { type PatentData, FormApplicationTypes, GetCountryImageLink, MapAttachmentToString, ApplicationStatuses } from '$lib/helpers';
	import * as Card from '$lib/components/ui/card'
	import * as Table from '$lib/components/ui/table'
	import * as Dialog from '$lib/components/ui/dialog'
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import { mapPatentAppTypeToString, mapPatentTypeToString } from '../home/components/dashboardutils';
	import { applicationData } from '$lib/store';
	import { afterNavigate } from '$app/navigation';
	import { base } from '$app/paths';
	import { mapDesignTypeToString } from '$lib/designutils';
	let data = $applicationData;

	// Computed license information
	$: licenseInfo = (() => {
		const approvedLicense = data?.applicationHistory?.find(app => 
			app.applicationType === FormApplicationTypes.License && app.currentStatus === ApplicationStatuses.Approved
		);
		
		if (approvedLicense && data?.postRegApplications) {
			const licenseRecordal = data.postRegApplications.find(postApp => 
				postApp.recordalType === "Design License Recordal"
			);
			
			if (licenseRecordal) {
				return {
					licensee: {
						name: licenseRecordal.name || '',
						email: licenseRecordal.email || '',
						phone: licenseRecordal.phone || '',
						nationality: licenseRecordal.nationality || '',
						city: licenseRecordal.city || '',
						state: licenseRecordal.state || '',
						address: licenseRecordal.address || ''
					},
					licenseDate: licenseRecordal.licenseDate || licenseRecordal.dateApproved || '',
					licenseStatus: 'Approved'
				};
			}
		}
		
		return null;
	})();

	// Computed mortgage information
	$: mortgageInfo = (() => {
		const approvedMortgage = data?.applicationHistory?.find(app => 
			app.applicationType === FormApplicationTypes.Mortgage && app.currentStatus === ApplicationStatuses.Approved
		);
		
		if (approvedMortgage && data?.postRegApplications) {
			const mortgageRecordal = data.postRegApplications.find(postApp => 
				postApp.recordalType === "Design Mortgage Recordal"
			);
			
			if (mortgageRecordal) {
				return {
					mortgagee: {
						name: mortgageRecordal.name || '',
						email: mortgageRecordal.email || '',
						phone: mortgageRecordal.phone || '',
						nationality: mortgageRecordal.nationality || '',
						city: mortgageRecordal.city || '',
						state: mortgageRecordal.state || '',
						address: mortgageRecordal.address || ''
					},
					mortgageDate: mortgageRecordal.mortgageDate || mortgageRecordal.dateApproved || '',
					mortgageStatus: 'Approved'
				};
			}
		}
		
		return null;
	})();
	let isImage:boolean=false;
	let showPreview:boolean=false;
	let previewUrl:string|null=null;

	applicationData.subscribe((dt)=>{
		data=dt;
		console.log(data)
	});
	function viewAttachment(attachment: { name:string, url:string })
	{
		console.log('attachment object',attachment)
		previewUrl=attachment.url
		console.log('preview url',previewUrl)
		const extention= previewUrl.slice(previewUrl.lastIndexOf("."), previewUrl.length);
		isImage= extention===".png"||extention===".jpg"||extention===".jpeg"
		showPreview=true;
	}
</script>
<Dialog.Root bind:open={showPreview} >
	<Dialog.Content class="h-full w-3/4">
		{#if isImage}
			<img src={previewUrl} alt="testing">
		{:else }
			<iframe  src={previewUrl} width="95%" height="100%" title="-"></iframe>
		{/if}
	</Dialog.Content>
</Dialog.Root>
<div class="flex flex-col px-1.5 py-1.5 overflow-y-auto gap-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>
				design Title</Card.Title>
		</Card.Header>
		<Card.Content class="w-fit">
			{data?.titleOfDesign}
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title> Statement of Novelty</Card.Title>
		</Card.Header>
		<Card.Content >
			{data?.statementOfNovelty}
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title> Design Type</Card.Title>
		</Card.Header>
		<Card.Content>
			{mapDesignTypeToString(data?.designType)}
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title> Design Applicants</Card.Title>
		</Card.Header>
		<Card.Content class="overflow-x-auto">
			<Table.Root >
				{#if data.applicants.length===0}
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
						{#each data.applicants as applicant, i (i)}
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
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title> Design Creators</Card.Title>
		</Card.Header>
		<Card.Content>
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
					{#each data?.designCreators as inventor, i (i)}
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
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title> Correspondence Information</Card.Title>
		</Card.Header>
		<Card.Content class="grid sm:grid-cols-2 gap-4">
			<div>
				<Label for="name" class="font-bold">Name</Label>
				<p id="name">{data.correspondence.name}</p>
			</div>
			<div>
				<Label for="address" class="font-bold">Address</Label>
				<p id="address">{data.correspondence.address}</p>
			</div>
			<div>
				<Label for="phone" class="font-bold">Number</Label>
				<p id="phone">{data.correspondence.phone}</p>
			</div>
			<div>
				<Label for="email" class="font-bold">Email</Label>
				<p id="phone">{data.correspondence.email}</p>
			</div>
			<div>
				<Label for="state" class="font-bold">State</Label>
				<p id="state">{data.correspondence.state}</p>
			</div>
		</Card.Content>
	</Card.Root>
	<!-- License Information Card -->
	{#if licenseInfo && (licenseInfo.licensee || licenseInfo.licenseDate)}
		<Card.Root>
			<Card.Header>
				<Card.Title>License Information</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if licenseInfo.licensee}
					<div class="grid sm:grid-cols-2 gap-4 mb-4">
						<div>
							<Label class="font-bold">Licensee Name</Label>
							<p>{licenseInfo.licensee.name || "N/A"}</p>
						</div>
						<div>
							<Label class="font-bold">Email</Label>
							<p>{licenseInfo.licensee.email || "N/A"}</p>
						</div>
						<div>
							<Label class="font-bold">Phone</Label>
							<p>{licenseInfo.licensee.phone || "N/A"}</p>
						</div>
						<div>
							<Label class="font-bold">Nationality</Label>
							<p>{licenseInfo.licensee.nationality || "N/A"}</p>
						</div>
						<div>
							<Label class="font-bold">City</Label>
							<p>{licenseInfo.licensee.city || "N/A"}</p>
						</div>
						<div>
							<Label class="font-bold">State</Label>
							<p>{licenseInfo.licensee.state || "N/A"}</p>
						</div>
						<div class="sm:col-span-2">
							<Label class="font-bold">Address</Label>
							<p>{licenseInfo.licensee.address || "N/A"}</p>
						</div>
					</div>
				{/if}
				{#if licenseInfo.licenseDate}
					<div class="border-t pt-4">
						<div class="grid sm:grid-cols-2 gap-4">
							<div>
								<Label class="font-bold">License Date</Label>
								<p>{new Date(licenseInfo.licenseDate).toLocaleDateString()}</p>
							</div>
							{#if licenseInfo.licenseStatus}
								<div>
									<Label class="font-bold">License Status</Label>
									<p>{licenseInfo.licenseStatus}</p>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Mortgage Information Card -->
	{#if mortgageInfo && (mortgageInfo.mortgagee || mortgageInfo.mortgageDate)}
		<Card.Root>
			<Card.Header>
				<Card.Title>Mortgage Information</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if mortgageInfo.mortgagee}
					<div class="grid sm:grid-cols-2 gap-4 mb-4">
						<div>
							<Label class="font-bold">Mortgagee Name</Label>
							<p>{mortgageInfo.mortgagee.name || "N/A"}</p>
						</div>
						<div>
							<Label class="font-bold">Email</Label>
							<p>{mortgageInfo.mortgagee.email || "N/A"}</p>
						</div>
						<div>
							<Label class="font-bold">Phone</Label>
							<p>{mortgageInfo.mortgagee.phone || "N/A"}</p>
						</div>
						<div>
							<Label class="font-bold">Nationality</Label>
							<p>{mortgageInfo.mortgagee.nationality || "N/A"}</p>
						</div>
						<div>
							<Label class="font-bold">City</Label>
							<p>{mortgageInfo.mortgagee.city || "N/A"}</p>
						</div>
						<div>
							<Label class="font-bold">State</Label>
							<p>{mortgageInfo.mortgagee.state || "N/A"}</p>
						</div>
						<div class="sm:col-span-2">
							<Label class="font-bold">Address</Label>
							<p>{mortgageInfo.mortgagee.address || "N/A"}</p>
						</div>
					</div>
				{/if}
				{#if mortgageInfo.mortgageDate}
					<div class="border-t pt-4">
						<div class="grid sm:grid-cols-2 gap-4">
							<div>
								<Label class="font-bold">Mortgage Date</Label>
								<p>{new Date(mortgageInfo.mortgageDate).toLocaleDateString()}</p>
							</div>
							{#if mortgageInfo.mortgageStatus}
								<div>
									<Label class="font-bold">Mortgage Status</Label>
									<p>{mortgageInfo.mortgageStatus}</p>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title> Attachments</Card.Title>
		</Card.Header>
		<Card.Content>
			{#each data.attachments as attachment}
				<div class="rounded-md border gap-6  flex  items-center p-1.5 sm:w-1/2 w-full mb-2 justify-between">
					<p class="grow">{MapAttachmentToString(attachment.name)}</p>
					{#each attachment.url as link }
						<div >
							<Button class="flex-none" on:click={()=>viewAttachment({name:attachment.name,url: link})}>
								<Icon icon="lets-icons:view-alt-light" width="1.2rem" height="1.2rem" />
								<p>{attachment.url.indexOf(link)+1}</p>
							</Button>
							<Button href="{link}" target="_blank" variant="outline">
								<Icon icon="ri:external-link-line" width="1.2rem" height="1.2rem" />
								<p>{attachment.url.indexOf(link)+1}</p>
							</Button>
						</div>
					{/each}
				</div>
			{/each}
		</Card.Content>
	</Card.Root>
</div>
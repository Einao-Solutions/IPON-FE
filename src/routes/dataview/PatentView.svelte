<script lang="ts">
	import { type PatentData, GetCountryImageLink, MapAttachmentToString } from '$lib/helpers';
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
	let data = $applicationData;
	let isImage:boolean=false;
	let showPreview:boolean=false;
	let previewUrl:string|null=null;

	applicationData.subscribe((dt)=>{
		data=dt;
	});
	function viewAttachment(attachment: { name:string, url:string })
	{
		previewUrl=attachment.url
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
	<Card.Title> Patent Title</Card.Title>
	</Card.Header>
	<Card.Content class="w-fit">
		{data.titleOfInvention}
	</Card.Content>
</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title> Patent Abstract</Card.Title>
		</Card.Header>
		<Card.Content >
			{data.patentAbstract}
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title> Patent Type</Card.Title>
		</Card.Header>
		<Card.Content>
			{mapPatentTypeToString(data.patentType)}
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title> Patent Application Type</Card.Title>
		</Card.Header>
		<Card.Content>
			{mapPatentAppTypeToString(data.patentApplicationType)}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title> Patent Applicants</Card.Title>
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
			<Card.Title> Patent Inventors</Card.Title>
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
					{#each data.inventors as inventor, i (i)}
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
	<Card.Root>
		<!-- <Card.Header>
			<Card.Title>
				First Priority Information
			</Card.Title>
		</Card.Header> -->
			{#if data.patentType === 0 || data.patentType === 2}
				<!-- First Priority Information Card -->
				<Card.Root>
					<Card.Header>
						<Card.Title>First Priority Information</Card.Title>
					</Card.Header>
					<Card.Content>
						{#if data.firstPriorityInfo.length === 0}
							<p>No first priority information added</p>
						{:else}
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head class="w-1">s/n</Table.Head>
										<Table.Head>Number</Table.Head>
										<Table.Head>Country</Table.Head>
										<Table.Head>Date</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each data.firstPriorityInfo as priority, i (i)}
										<Table.Row>
											<Table.Cell class="w-1">{i+1}</Table.Cell>
											<Table.Cell>{priority.number}</Table.Cell>
											<Table.Cell>
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
						{/if}
					</Card.Content>
				</Card.Root>
				<!-- Additional Priority Information Card -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Additional Priority Information</Card.Title>
					</Card.Header>
					<Card.Content>
						{#if data.priorityInfo.length === 0}
							<p>No additional priority information added</p>
						{:else}
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head class="w-1">s/n</Table.Head>
										<Table.Head>Number</Table.Head>
										<Table.Head>Country</Table.Head>
										<Table.Head>Date</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each data.priorityInfo as priority, i (i)}
										<Table.Row>
											<Table.Cell class="w-1">{i+1}</Table.Cell>
											<Table.Cell>{priority.number}</Table.Cell>
											<Table.Cell>
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
						{/if}
					</Card.Content>
				</Card.Root>
			{/if}
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title> Attachments</Card.Title>
		</Card.Header>
		<Card.Content>
			{#each data.attachments as attachment}
				<div class="rounded-md border gap-6  flex  items-center p-1.5 sm:w-1/2 w-full mb-2 justify-between">
					<p class="grow">{MapAttachmentToString(attachment.name)}</p>
					{#each attachment.url as link }
						<div>
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
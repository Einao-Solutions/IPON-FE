<script lang="ts">
	import { type PatentData, GetCountryImageLink, MapAttachmentToString } from '$lib/helpers';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import {
		mapPatentAppTypeToString,
		mapPatentTypeToString
	} from '../home/components/dashboardutils';
	import { applicationData } from '$lib/store';
	import { afterNavigate } from '$app/navigation';
	import { base } from '$app/paths';
	import { mapDesignTypeToString } from '$lib/designutils';
	let data = $applicationData;
	let isImage: boolean = false;
	let showPreview: boolean = false;
	let previewUrl: string | null = null;

	applicationData.subscribe((dt) => {
		data = dt;
	});
	function viewAttachment(attachment: { name: string; url: string }) {
		previewUrl = attachment.url;
		const extention = previewUrl.slice(previewUrl.lastIndexOf('.'), previewUrl.length);
		isImage = extention === '.png' || extention === '.jpg' || extention === '.jpeg';
		showPreview = true;
	}
</script>

<Dialog.Root bind:open={showPreview}>
	<Dialog.Content class="h-full w-3/4">
		{#if isImage}
			<img src={previewUrl} alt="testing" />
		{:else}
			<iframe src={previewUrl} width="95%" height="100%" title="-"></iframe>
		{/if}
	</Dialog.Content>
</Dialog.Root>
<div class="flex flex-col px-1.5 py-1.5 overflow-y-auto gap-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>Trademark Title</Card.Title>
		</Card.Header>
		<Card.Content class="w-fit">
			{data?.titleOfTradeMark}
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Trademark Disclaimer</Card.Title>
		</Card.Header>
		<Card.Content>
			{data?.trademarkDisclaimer}
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Trademark class</Card.Title>
		</Card.Header>
		<Card.Content>
			class {data?.trademarkClass}
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Trademark class description</Card.Title>
		</Card.Header>
		<Card.Content>
			{data?.trademarkClassDescription}
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Trademark logo description</Card.Title>
		</Card.Header>
		<Card.Content>
			{['Device', 'Word Mark', 'Word and Device'][data?.trademarkLogo]}
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Trademark Type</Card.Title>
		</Card.Header>
		<Card.Content>
			{['Local', 'Foreign'][data?.trademarkType]}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Trademark Applicants</Card.Title>
		</Card.Header>
		<Card.Content class="overflow-x-auto">
			<Table.Root>
				{#if data.applicants.length === 0}
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
								<Table.Cell class="w-1">{i + 1}</Table.Cell>
								<Table.Cell>{applicant.name}</Table.Cell>
								<Table.Cell>
									<span class="flex gap-2">
										<img
											src={GetCountryImageLink(applicant.country)}
											width="20"
											height="15"
											alt="@flag"
										/>
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
			<Card.Title>Correspondence Information</Card.Title>
		</Card.Header>
		<Card.Content class="grid sm:grid-cols-2 gap-4">
			<div>
				<Label for="name" class="font-bold">Name</Label>
				<p id="name">{data?.correspondence?.name}</p>
			</div>
			<div>
				<Label for="address" class="font-bold">Address</Label>
				<p id="address">{data?.correspondence?.address}</p>
			</div>
			<div>
				<Label for="phone" class="font-bold">Number</Label>
				<p id="phone">{data?.correspondence?.phone}</p>
			</div>
			<div>
				<Label for="email" class="font-bold">Email</Label>
				<p id="phone">{data?.correspondence?.email}</p>
			</div>
			<div>
				<Label for="state" class="font-bold">State</Label>
				<p id="state">{data?.correspondence?.state}</p>
			</div>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Attachments</Card.Title>
		</Card.Header>
		<Card.Content>
			{#each data.attachments as attachment}
				<div
					class="rounded-md border gap-6 flex items-center p-1.5 sm:w-1/2 w-full mb-2 justify-between"
				>
					<p class="grow">{MapAttachmentToString(attachment.name)}</p>
					{#each attachment.url as link}
						<div>
							<Button
								class="flex-none"
								on:click={() => viewAttachment({ name: attachment.name, url: link })}
							>
								<Icon icon="lets-icons:view-alt-light" width="1.2rem" height="1.2rem" />
								<p>{attachment.url.indexOf(link) + 1}</p>
							</Button>
							<Button href={link} target="_blank" variant="outline">
								<Icon icon="ri:external-link-line" width="1.2rem" height="1.2rem" />
								<p>{attachment.url.indexOf(link) + 1}</p>
							</Button>
						</div>
					{/each}
				</div>
			{/each}
		</Card.Content>
	</Card.Root>

	{#if (data?.registeredUsers ?? []).length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title>Registered Users</Card.Title>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-1">s/n</Table.Head>
							<Table.Head>Name</Table.Head>
							<Table.Head>Phone</Table.Head>
							<Table.Head>Email</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.registeredUsers.filter((user) => user.isApproved) as user, i (i)}
							<Table.Row>
								<Table.Cell class="w-1">{i + 1}</Table.Cell>
								<Table.Cell>{user.name}</Table.Cell>
								<Table.Cell>{user.phone}</Table.Cell>
								<Table.Cell>{user.email}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	{/if}
</div>

<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Popover from "$lib/components/ui/popover"
	import * as Command from "$lib/components/ui/command"
	import { Input } from '$lib/components/ui/input';
	import {Label} from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { countriesMap } from '$lib/constants';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import { tick } from 'svelte';
	import { baseURL } from '$lib/helpers';
	import { goto } from '$app/navigation';
	import { appattachmentsData, applicationData, assignmentData, loggedInUser } from '$lib/store';
	import { toast } from 'svelte-sonner';
	import { PatentAttachments } from '$lib/designutils';
	import dayjs from 'dayjs';
	import { isValidPhoneNumber } from 'libphonenumber-js';
	import * as valid from "validator"
	let open: boolean = true;
	export let requiredData:{
		fileId:string
		fileType:number
		applicant:string
		applicantEmail:string
		applicantCountry:string
		applicantAddress:string
		applicantNumber:string
		fileNumber:string
		fileTitle:string
	};
	export let closed: () => void;
	let assignorName: string;
	let assignorAddress:string;
	let assignorCountry:string|undefined=undefined;
	let assignorCountryOpen:boolean=false;
	let assigneeName: string= undefined;
	let isGenerating:boolean=false;
	let assigneeAddress:string;
	let assignmentDate:string;
	let deedOfAggreement:File | null=null;
	let deedOfAgreementUrl:string=""
	let authorizationLetter:File | null=null;
	let authorizationLetterUrl:string="";
	let assigneeCountry:string|undefined=undefined;
	let assigneeCountryOpen:boolean=false;
	function GetCountryImageLink(country:string) {
		let key = Object.keys(countriesMap).find(key => countriesMap[key] === country);
		return `https://flagcdn.com/20x15/${key}.png`;
	}
	function removeAttachment(type:string) {
		if (type=="doa"){
			deedOfAggreement=null;
		}
		if (type=="loa"){
			authorizationLetter=null;
		}
	}
	async function fileChanged(type: string, event: Event | null) {
		const input = event?.target as HTMLInputElement;
		if (input.files) {
			if (input.files.length > 1) {
				removeAttachment(type);
				toast.error('maximum of 1 images', {
					position: 'top-right'
				});
				return;
			}
			for (let i = 0; i < input.files.length; i++) {
				if (input.files[i].size > 5000000) {
					removeAttachment(type);
					toast.error('maximum file size of 5MB exceeded', {
						position: 'top-right'
					});
					return;
				}
			}
			for (let i = 0; i < input.files.length; i++) {
				const fileType = input.files[i].type;
				console.log(fileType)
				if (fileType !== "application/pdf") {
					removeAttachment(type);
					toast.error('unsupported file type, only pdf supported', {
						position: 'top-right'
					});
					return;
				}
				if (type === "loa") {
					authorizationLetter = input.files[i] as File;
				authorizationLetterUrl = URL.createObjectURL(input.files[i]);
				}
				if (type === "doa") {
					deedOfAggreement = input.files[i] as File;
					deedOfAgreementUrl = URL.createObjectURL(input.files[i]);
				}
			}
		}
	}
	function arrayBufferToBase64(buffer) {
		let binary = '';
		const bytes = new Uint8Array(buffer);
		const len = bytes.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return window.btoa(binary);
	}


	function toByteArray(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsArrayBuffer(file);
		}).then((arrayBuffer) => new Uint8Array(arrayBuffer));
	}

	async function generateRRR(){
		if (isGenerating){return;}
		isGenerating=true;
		if (isValidPhoneNumber(requiredData?.applicantNumber??"", "NG")==false || valid.isEmail(requiredData?.applicantEmail??"")==false)
		{
			toast.error("Invalid nigerian phone number or applicant email, please correct the details and try again.",
				{ position: 'top-right' });
			isGenerating=false;
			return;
		}
		if (assigneeName===undefined || assigneeCountry===undefined || assigneeAddress===undefined)
		{
			toast.error("Assignee details invalid", {
				position: 'top-right'
			})
			isGenerating=false;
			return;
		}
		if (deedOfAggreement!=null) {
			let attachmentsLists = [];
			attachmentsLists.push({
				fileName: deedOfAggreement.name,
				Name: "",
				contentType: deedOfAggreement.type,
				data: arrayBufferToBase64(await toByteArray(deedOfAggreement))
			})
			// push and get return;
			const result = await fetch(`${baseURL}/api/files/uploadAttachment`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(attachmentsLists)
				}
			);
			if (result.ok) {
				const res = await result.json();
				deedOfAgreementUrl = res[0]
			}
		}
		if (authorizationLetter!=null) {
			let attachmentsLists = [];
			attachmentsLists.push({
				fileName: authorizationLetter.name,
				Name: "",
				contentType: authorizationLetter.type,
				data: arrayBufferToBase64(await toByteArray(authorizationLetter))
			});
			const resultAuth = await fetch(`${baseURL}/api/files/uploadAttachment`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(attachmentsLists)
				}
			);
			if (resultAuth.ok) {
				const data = await resultAuth.json();
				authorizationLetterUrl = data[0];
			}
		}
			let body= {
			creatorAccount: $loggedInUser.id,
			userName: $loggedInUser.name,
			dateOfAssignment: assignmentDate,
			applicantName: requiredData.applicant,
			applicantEmail: requiredData.applicantEmail,
			applicantNumber: requiredData.applicantNumber,
			assignorName: requiredData.applicant,
			assignorAddress: requiredData.applicantAddress,
			assignorCountry: requiredData.applicantCountry,
			assigneeName: assigneeName,
			assigneeAddress: assigneeAddress,
			assigneeCountry: assigneeCountry,
			fileId: requiredData.fileId,
			type: requiredData.fileType,
			fileNumber: requiredData.fileNumber,
				deedOfAgreementUrl,
				authorizationLetterUrl,
			fileTitle: requiredData.fileTitle,
		};
		var data=await  fetch(`${baseURL}/api/assignment/generate`, {
			method:'POST',
			body: JSON.stringify(body),
			headers:{ 'Content-Type':'application/json' } })
		if (data.ok){
			const result=await data.json()
			applicationData.set(result.data)
			assignmentData.set({
				rrr:result.rrr,
				applicationId:result.id,
				amount:result.cost,
				fileId:requiredData.fileId,
				type:requiredData.fileType,
				applicant:requiredData.applicant,
				fileNumber:requiredData.fileNumber,
				fileTitle:requiredData.fileTitle,
			})
			await goto("/payment?type=assignment")
		}
	}
</script>
<Sheet.Root
	bind:open
	onOpenChange={(val) => {
		if (!val) {
			closed();
		}
	}}
>
	<Sheet.Content class="overflow-y-auto">
		<Sheet.Header>
			<Sheet.Title><div>Assignment form</div></Sheet.Title>
		</Sheet.Header>
		<div>
			<div class="flex flex-col space-y-2 mb-4">
				<Label for="assignmentDate">Select Assignment Date</Label>
				<input id="assignmentDate" type="date" bind:value={assignmentDate} />
			</div>
			<div class="space-y-5">
				<div>
				<p>Applicant number</p>
				<Input bind:value={requiredData.applicantNumber} />
				</div>
				<div>
				<p>Applicant Email</p>
				<Input bind:value={requiredData.applicantEmail} />
				</div>
				<strong>Assignor Details</strong>
				<div>
				<Label for="assignorName">Assignor Name</Label>
				<p id="assignorName">{requiredData.applicant}</p>
				</div>
				<div>
					<Label for="assignorAddress">Assignor Address</Label>
				<p id="assignorAddress">{requiredData.applicantAddress}</p>
				</div>
				<div>
					<Label for="assignorCountry">Assignor Country</Label>
					<p id="assignorCountry">{requiredData.applicantCountry}</p>
				</div>
			</div>
			<div class="space-y-5">
			<strong>Assignee Details</strong>
				<Input bind:value={assigneeName} placeholder="assignee name" />
				<Textarea
					class="min-h-[80px]" bind:value={assigneeAddress} placeholder="assignee address" />
				<Popover.Root open="{assigneeCountryOpen}" let:ids>
					<Popover.Trigger asChild let:builder>
						<Button
							builders={[builder]}
							variant="outline"
							role="combobox"
							aria-expanded={false}
							class="w-[200px] justify-between"
						>
							<img class="{assigneeCountry!==undefined?'block':'hidden'}" src="{GetCountryImageLink(assigneeCountry)}" width="20" height="15" alt="@flag"/>
							{assigneeCountry!==undefined?assigneeCountry:"Select assignee country"}
							<Icon icon="ph:caret-up-down-thin" width="1.2rem" height="1.2rem" class="opacity-50 shrink-0 ml-2" />
						</Button>
					</Popover.Trigger>
					<Popover.Content class="w-[250px] h-[250px] p-0 z-50">
						<Command.Root>
							<Command.Input placeholder="Search countries..." />
							<Command.Empty>No countries found.</Command.Empty>
							<Command.Group class="overflow-y-auto">
								{#each Object.values(countriesMap) as country}
									<Command.Item
										value={country}
										onSelect={(currentValue) => {
											assigneeCountry=currentValue
											tick().then(() => {
												document.getElementById(ids.trigger)?.focus();
											});}}>
										<Icon icon="basil:check-solid"
													class={cn(
                "mr-2 h-4 w-4",
                assigneeCountry !== country && "text-transparent"
              )}
										/>
										{country}
									</Command.Item>
								{/each}
							</Command.Group>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</div>
			<div>
			<p>Upload deed of agreement</p>
				<div class="space-x-3 flex">
			<Input
				id={'doa'}
				accept=".pdf"
				multiple={false}
				type="file"
				on:change={(event) => fileChanged("doa", event)}
			/>
					{#if deedOfAgreementUrl}
						<a target="_blank" href="{deedOfAgreementUrl}" class="rounded-md border bg-blue-100 p-2" >
							<Icon icon="ep:view" width="1.2rem" height="1.2rem" />
						</a>
						{/if}
				</div>
		</div>
			<div>
				<p>Letter of Authorization</p>
				<div class="flex space-x-3">
			<Input
				id={'loa'}
				accept=".pdf"
				multiple={false}
				type="file"
				on:change={(event) => fileChanged("loa", event)}
			/>
					{#if authorizationLetterUrl}
						<a target="_blank" href="{authorizationLetterUrl}" class="rounded-md border bg-blue-100 p-2" >
							<Icon icon="ep:view" width="1.2rem" height="1.2rem" />
						</a>
					{/if}
				</div>
			</div>
			<div class="mt-4 items-center justify-between">
			<Button class="w-full items-center mt-3" on:click={()=>generateRRR()}>
				<Icon class="{isGenerating?'':'hidden'}" icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
				Continue</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

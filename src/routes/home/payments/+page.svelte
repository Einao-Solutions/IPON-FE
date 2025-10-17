<script lang="ts">
	// if User, load user paid things,
	// if Staff,load all paid things
	import { onMount, tick } from 'svelte';
	import { baseURL, decodeUser, UserRoles, UserTypes } from '$lib/helpers';
	import Icon from '@iconify/svelte';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Table from '$lib/components/ui/table';
	import * as Pagination from '$lib/components/ui/pagination';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { appattachmentsData, loggedInUser, otherPaymentAttachment } from '$lib/store';
	import { Label } from '$lib/components/ui/label';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import { ChevronsUpDown } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { Toaster } from '$lib/components/ui/sonner';
	import { PatentAttachments } from '$lib/designutils';
	import { mapDateToStringNoDate, mapDateToString } from '../components/dashboardutils';
	let isPaymentsLoading: boolean = false;
	let allPayments = [];
	let allPaymentHistory = [];
	let selectedPayment=undefined;
	let isPaymentListOpen = false;
	let paymentHistoryLoading = false;
	let isRRRLoading = false;
	onMount(async() => {
		 await decodeUser()
			loadPayments();
			loadPaymentHistory(10, 0);
	});
	let name, email, number, notes;
	let totalHistory = 0;
	let perPage = 10;
	let showResultsPerPage = false;
	const possibleNumbers = [10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 100];
	async function loadPayments() {
		isPaymentsLoading = true;
		allPayments = await (await fetch(`${baseURL}/api/payments/GetAllPayment`)).json();
		isPaymentsLoading = false;
	}

	async function loadPaymentHistory(count: number, skip: number) {
		paymentHistoryLoading = true;
		let url = '';
		if ($loggedInUser!==null) {
			if ($loggedInUser?.roles.some((y)=>[
				UserRoles.StaffMenu,
			].includes(y))) {
				url = `${baseURL}/api/payments/GetOtherPayment?&count=${count}&skip=${skip}`;
			} else {
				url = `${baseURL}/api/payments/GetOtherPayment?userId=${$loggedInUser.id}&count=${count}&skip=${skip}`;
			}
		}
		var data = await (await fetch(url)).json();
		allPaymentHistory = data.data;
		totalHistory = data.count;
		paymentHistoryLoading = false;
	}
	let showForm = false;
	async function makePayment() {
		isRRRLoading = true;
		var data = await (
			await fetch(
				`${baseURL}/api/payments/generate?id=${selectedPayment.id}&name=${name}&email=${email}&number=${number}`,
				{
					method: 'post'
				}
			)
		).json();
		const amountToPay = selectedPayment.total;
		// upload attachment if any
		let gotoUrl = `/payment?type=other&amount=${amountToPay}&rrr=${data}&name=${name}&number=${number}&email=${email}&notes=${notes}&title=${selectedPayment.name}&serviceId=${selectedPayment.id}&&amount=${selectedPayment.amount}&agentName=${$loggedInUser.name}&agentId=${$loggedInUser.id}`;
		if (otherAttachmentTempUrl && $otherPaymentAttachment) {
			var attachmentsLists = []
			attachmentsLists.push({
				fileName: $otherPaymentAttachment?.name,
				Name: $otherPaymentAttachment?.name,
				contentType: $otherPaymentAttachment.type,
				data: arrayBufferToBase64(await toByteArray($otherPaymentAttachment))
			})
			const result = await fetch(`${baseURL}/api/files/uploadAttachment`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(attachmentsLists)
				}
			);
			const res = await result.json();
			if (res) {
				gotoUrl += `&attachmentUrl=${res[0]}`
			}
		}
		isRRRLoading = false;
		goto(gotoUrl);
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
	let newName, newAmount, newServiceFee, newGovernmentFee, creationNotes=""
	let selectedPaymentType
	let showNewForm=false;

	function showNewPaymentForm() {
		newName = "";
		newAmount = "";
		newServiceFee = "";
		newGovernmentFee = "";
		showNewForm = true;
	}
	let isAddingNewPayment =false
	async function addNewPayment() {
		isAddingNewPayment = true;
		let body = {
			name: newName,
			total: newAmount,
			serviceFee: newServiceFee,
			governmentFee: newGovernmentFee,
			notes: creationNotes,
			id: crypto.randomUUID()
		}
		var result = await fetch(`${baseURL}/api/payments/AddPayment`, {
			method: 'POST',
			headers: { 'content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (result.ok) {
			await result.json()
			allPayments.push(body)
			isAddingNewPayment = false;
			toast.success("Successfully added new payment", {
				position: "top-right"
			})
		}
	}

	async function fileChanged(event: Event | null) {
		const input = event?.target as HTMLInputElement;
		if (input.files) {
			if (input.files.length > 1) {
				toast.error('maximum of 1 images', {
					position: 'top-right'
				});
				return;
			}
			for (let i = 0; i < input.files.length; i++) {
				if (input.files[i].size > 5000000) {
					toast.error('maximum file size of 5MB exceeded', {
						position: 'top-right'
					});
					return;
				}
			}

			const file = input.files[0];
			const fileType = file.type;
			console.log(fileType)
			if (['image/jpeg', 'image/png', 'application/pdf'].includes(fileType)==false) {
				toast.error('unsupported file type, only pdf, png and jpg supported', {
					position: 'top-right'
				});
				return;
			}
			otherAttachmentTempUrl = URL.createObjectURL(file);
			otherPaymentAttachment.set(file)
		}
	}
	let otherAttachmentTempUrl:string|undefined = undefined;
	async function updatePayment(selected){
			let body = {
				name: newName,
				total: newAmount,
				serviceFee: newServiceFee,
				governmentFee: newGovernmentFee,
				id: selected.id
			}
		var result = await fetch(`${baseURL}/api/payments/UpdatePayment`, {
			method: 'POST',
			headers: { 'content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (result.ok){
			await result.json()
		}
	}

	let showSelectedPayment=false;
	function showPayment(selected) {
		showSelectedPayment = true;
		selectedPaymentType = selected;
	}
	function fillForm() {
		name = '';
		email = '';
		number = '';
		notes='';
		showForm = true;
	}
	let showMoreSheet = false;
	let selectedMore = {};
	function viewMore(data) {
		selectedMore = data;
		showMoreSheet = true;
	}

	function loadPage(currentPage: number | undefined) {
		if (currentPage === undefined) {
			loadPaymentHistory(perPage, 0);
		} else {
			const skip = currentPage * perPage - perPage;
			const limit = skip + perPage;
			loadPaymentHistory(limit, skip);
		}
	}
</script>

<Toaster />
<Sheet.Root bind:open={showNewForm} >
	<Sheet.Content >
		<div class="p-2 m-2 space-y-4">
			<div>
				<Label>Enter payment Name</Label>
				<Input bind:value={newName} />
			</div>
			<div>
				<Label>Payment total amount</Label>
				<Input bind:value={newAmount} />
			</div>
			<div>
				<Label>Government Fee</Label>
				<Input bind:value={newGovernmentFee} />
			</div>
			<div>
				<Label>Service Fee</Label>
				<Input bind:value={newServiceFee}/>
			</div>
			<div>
				<Label>Additional Notes</Label>
				<Textarea bind:value={creationNotes} placeholder="enter additional notes for agents" />
			</div>
			<Button on:click={()=>addNewPayment()}>
				<Icon
					class="{isAddingNewPayment ? '' : 'hidden'}"
					icon="line-md:loading-loop"
					width="1.2rem"
					height="1.2rem"
				/>
				Add payment</Button>
		</div>
	</Sheet.Content>
</Sheet.Root>
<Sheet.Root bind:open={showMoreSheet}>
	<Sheet.Content class="overflow-y-auto">
		<div class="p-2 m-2 space-y-4">
			<div>
				<Label>Applicant Name</Label>
				<p>{selectedMore.name}</p>
			</div>
			<div>
				<Label>Applicant Email</Label>
				<p>{selectedMore.email}</p>
			</div>
			<div>
				<Label>Phone number</Label>
				<p>{selectedMore.number}</p>
			</div>
			{#if selectedMore.notes}
				<div>
					<Label>Notes</Label>
					<p>{selectedMore.notes}</p>
				</div>
			{/if}
			<div>
				<Label>Amount paid</Label>
				<p>{selectedMore.amount}</p>
			</div>
			<div>
				<Label>Remita Payment ID</Label>
				<p>{selectedMore.rrr}</p>
			</div>
			<div>
				<Label>Payment for</Label>
				<p>{selectedMore.serviceName}</p>
			</div>
			<div>
				<Label>Date</Label>
				<p>{mapDateToString(selectedMore.date)}</p>
			</div>
			<div>
				<Label>Receipt</Label>
				<a href="{selectedMore.receiptUrl}" target="_blank">view</a>
			</div>
			<div>
				<Label>Acknowledgement</Label>
				<a href="{selectedMore.ackUrl}"  target="_blank">view</a>
			</div>
			<div>
				<Label>Agent name</Label>
				<p>{selectedMore.agentName}</p>
			</div>
			{#if selectedMore.attachmentUrl}
				<div>
					<Label>Attachment</Label>
					<a href={selectedMore.attachmentUrl} target="_blank" class="border rounded-md">view</a>
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>

<Sheet.Root bind:open={showForm}>
	<Sheet.Content class="overflow-y-auto">
		<Sheet.Header>
			<Sheet.Title>Applicant Form</Sheet.Title>
			<Sheet.Description>Enter applicant details</Sheet.Description>
		</Sheet.Header>
		<div class="p-2 m-2 space-y-4">
			{#if selectedPayment?.notes}
					<div>
						<p>Application Notes</p>
						<strong>{selectedPayment?.notes}</strong>
					</div>
				{/if}
			<div>
				<Label>Name</Label>
				<Input bind:value={name} placeholder="applicant name" />
			</div>
			<div>
				<Label>Email</Label>
				<Input bind:value={email} placeholder="applicant email" />
			</div>
			<div>
				<Label>Phone number</Label>
				<Input bind:value={number} placeholder="applicant phone number" />
			</div>
			<div>
				<Label>Notes</Label>
				<Textarea bind:value={notes} placeholder="add notes (if any)" />
			</div>
			<div>
				<Label>Attachments (if any)</Label>
				<div class="flex">
				<Input  type="file" accept=".pdf, .png, .jpg, .jpeg" multiple={false}
								on:change={(event) => fileChanged(event)} />
				{#if otherAttachmentTempUrl}
					<a target="_blank" href={otherAttachmentTempUrl} class="rounded-md border bg-blue-100 p-2 w-fit">
						<Icon icon="ep:view" width="1.2rem" height="1.2rem" />
					</a>
				{/if}
				</div>
			</div>
			<Button on:click={() => makePayment()}>
				<Icon
					class="{isRRRLoading ? '' : 'hidden'}"
					icon="line-md:loading-loop"
					width="1.2rem"
					height="1.2rem"
				/>
				Proceed</Button
			>
		</div>
	</Sheet.Content>
</Sheet.Root>
<div>
	{#if isPaymentsLoading}
		<div class="items-center justify-center flex h-screen">
			<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
		</div>
	{:else}
		<div class="space-y-3 border rounded-md p-2 w-fit mb-4">
			<Label>Make new Payment</Label>
			<Popover.Root open={isPaymentListOpen} let:ids>
				<Popover.Trigger asChild let:builder>
					<Button
						builders={[builder]}
						variant="outline"
						role="combobox"
						aria-expanded={false}
						class="w-[250px] justify-between"
					>
						{(selectedPayment!==undefined && selectedPayment?.name !== '') ? selectedPayment?.name : 'Select a payment'}
						<Icon
							icon="ph:caret-up-down-thin"
							width="1.2rem"
							height="1.2rem"
							class="opacity-50 shrink-0 ml-2"
						/>
					</Button>
				</Popover.Trigger>
				<Popover.Content class="w-[250px] h-[250px] p-0 z-50">
					<Command.Root>
						<Command.Input placeholder="Search payments..." />
						<Command.Empty>No payment found.</Command.Empty>
						<Command.Group class="overflow-y-auto">
							{#each allPayments as paymentInfo}
								<Command.Item
									value={paymentInfo.name}
									onSelect={(currentValue) => {
										selectedPayment = paymentInfo;
										tick().then(() => {
											document.getElementById(ids.trigger)?.focus();
										});
									}}
								>
									<Icon
										icon="basil:check-solid"
										class={cn(
											'mr-2 h-4 w-4',
											selectedPayment?.name !== paymentInfo.name && 'text-transparent'
										)}
									/>
									{paymentInfo.name}
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.Root>
				</Popover.Content>
			</Popover.Root>
			<Button on:click={() => fillForm()}>Proceed</Button>
		</div>
	{/if}

	{#if $loggedInUser?.roles.includes(UserRoles.Support)}
		<Button on:click={()=>showNewPaymentForm()}>Add new Payment</Button>
	{/if}

	{#if paymentHistoryLoading}
		<div class="items-center justify-center flex h-screen">
			<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
		</div>
	{:else}
		<DropdownMenu.Root bind:open={showResultsPerPage} let:ids>
			<DropdownMenu.Trigger asChild let:builder>
				<Button builders={[builder]} variant="outline">
					Results per Page ({perPage})
					<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-fit p-1">
				{#each possibleNumbers as rl}
					<DropdownMenu.Item
						on:click={() => {
							perPage = rl;
							loadPage();
						}}
					>
						<span>{rl}</span>
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-1">s/n</Table.Head>
					<Table.Head>Date</Table.Head>
					<Table.Head>payment for</Table.Head>
					<Table.Head>Amount paid</Table.Head>
					<Table.Head>Applicant</Table.Head>
					<Table.Head>Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each allPaymentHistory as paymentHistory, i (i)}
					<Table.Row>
						<Table.Cell>{i + 1}</Table.Cell>
						<Table.Cell>{mapDateToString(paymentHistory.date)}</Table.Cell>
						<Table.Cell>{paymentHistory.serviceName}</Table.Cell>
						<Table.Cell>{paymentHistory.amount}</Table.Cell>
						<Table.Cell>{paymentHistory.name}</Table.Cell>
						<Table.Cell>
							<Button on:click={() => viewMore(paymentHistory)}>More</Button>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>

		<Pagination.Root {totalHistory} {perPage} siblingCount={5} let:pages let:currentPage>
			<Pagination.Content>
				<Pagination.Item>
					<Pagination.PrevButton on:click={() => loadPage(currentPage - 1)}>
						<ChevronLeft class="h-4 w-4" />
						<span class="hidden sm:block">Previous</span>
					</Pagination.PrevButton>
				</Pagination.Item>
				{#each pages as page (page.key)}
					{#if page.type === 'ellipsis'}
						<Pagination.Item>
							<Pagination.Ellipsis />
						</Pagination.Item>
					{:else}
						<Pagination.Item>
							<Pagination.Link
								{page}
								isActive={currentPage === page.value}
								on:click={() => loadPage(page)}
							>
								{page.value}
							</Pagination.Link>
						</Pagination.Item>
					{/if}
				{/each}
				<Pagination.Item>
					<Pagination.NextButton on:click={() => loadPage(currentPage + 1)}>
						<span class="hidden sm:block">Next</span>
						<ChevronRight class="h-4 w-4" />
					</Pagination.NextButton>
				</Pagination.Item>
			</Pagination.Content>
		</Pagination.Root>
	{/if}
</div>

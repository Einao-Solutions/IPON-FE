<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { page } from '$app/stores';
	import { applicationData, DashStats, loggedInUser } from '$lib/store';
	import { baseURL, decodeUser } from '$lib/helpers';
	let code: string;
	let paymentType: string;
	let orderID: string;
	let isStatusUpdating: boolean = true;
	let receiptUrl: string | null;
	let ackUrl: string | null;
	let fileId: string | null;
	let applicationId: string | null;
	let fileType: number | null;
	let userName: string | null;
	let userId: string | null;
	let paymentId: string | null;
	let title: string | null;
	let applicantName: string | null;
	let amount: string | null;
	let patentChangeType: string | null;
	let simulate = false;
	onMount(async () => {
		const url = $page.url;
		await decodeUser()
		orderID = url.searchParams.get('orderID') ?? '231';
		code = url.searchParams.get('statuscode');
		paymentType = url.searchParams.get('paymentType');
		paymentId = url.searchParams.get('rrr');
		title = url.searchParams.get('title');
		patentChangeType = url.searchParams.get('patentChangeType');
		applicantName = url.searchParams.get('applicantName');
		amount = url.searchParams.get('amount');
		applicationId = url.searchParams.get('applicationId');
		fileId = url.searchParams.get('fileId');
		fileType = url.searchParams.get('fileType');
		userId = $loggedInUser.id;
		userName = $loggedInUser.name;
		simulate = url.searchParams.get('simulate') === '1';
		await updateStatus();
	});

	async function updateStatus() {
		isStatusUpdating = true;
		if (paymentType == 'newapplication') {
			const resp = await fetch(`${baseURL}/api/files/NewApplicationPayment`, {
				method: 'POST',
				body: JSON.stringify({
					orderID: orderID,
					beforeStatus: 2,
					afterStatus: 3,
					title: title,
					applicantName: applicantName,
					amount: amount,
					paymentId: paymentId,
					message: 'Payment successful, awaiting search',
					user: userName,
					userId: userId,
					applicationType: 0,
					fileId: fileId,
					applicationId: applicationId,
					fieldToUpdate: null,
					newValue: null,
					simulate: simulate,
					fileType: parseInt(fileType)
				}),
				headers: { 'Content-Type': 'application/json' }
			});
			const result = await resp.json();
			applicationData.set(result);
			// receiptUrl = result.applicationHistory[0].letters.receipt[0];
			// ackUrl = result.applicationHistory[0].letters.acknowledgement[0];
		}
		if (paymentType==='tradecertificate'){
			const resp = await fetch(`${baseURL}/api/files/CertificateValidate?fileId=${fileId}&rrr=${paymentId}&userId=${$loggedInUser.id}&userName=${$loggedInUser.name}`,{
				method:"POST"
			})
			if (resp.ok){
				const result = await resp.json();
				receiptUrl = result.receiptUrl;
				ackUrl = result.ackUrl;
				applicationData.set(result.data);
			}
		}
		if (paymentType === 'renewal' || paymentType === 'batchrenewal' || paymentType === 'dashrenewal') {
			const resp = await fetch(`${baseURL}/api/files/CreateFileRenewal`, {
				method: 'POST',
				body: JSON.stringify({
					orderID: orderID,
					beforeStatus: 2,
					amount: amount,
					afterStatus: 3,
					message: 'Payment successful, awaiting search',
					user: userName,
					applicantName: applicantName,
					userId: userId,
					paymentId: paymentId,
					fileId: fileId,
					title: title,
					fieldToUpdate: null,
					newValue: null,
					simulate: simulate,
					fileType: parseInt(fileType)
				}),
				headers: { 'Content-Type': 'application/json' }
			});
			const result = await resp.json();
			console.log(result);
			applicationData.set(result);
			// receiptUrl = result.applicationHistory.find((x) => x.applicationType === 1).letters.receipt;
		}

		if (paymentType === 'update') {
			const body = {
				orderID: orderID,
				beforeStatus: 2,
				afterStatus: 3,
				title: title,
				applicantName: applicantName,
				amount: amount,
				paymentId: paymentId,
				message: 'Payment successful, awaiting search',
				user: userName,
				userId: userId,
				applicationType: 2,
				fileId: fileId,
				applicationId: applicationId,
				fieldToUpdate: patentChangeType,
				fileType: parseInt(fileType),
				simulate: simulate
			};
			const resp = await fetch(`${baseURL}/api/files/UpdateApplicationStatus`, {
				method: 'POST',
				body: JSON.stringify(body),
				headers: { 'Content-Type': 'application/json' }
			});
			const result = await resp.json();
			applicationData.set(result);
			const curr = (result.applicationHistory as []).find((x) => x.id === applicationId);
			const latestStatus = curr.currentStatus;
			let rvsstring = localStorage.getItem('revisions');
			let rvs = JSON.parse(rvsstring);
			const ind = rvs.data.findIndex((x) => x.id == applicationId);
			rvs.data[ind].status = latestStatus;
			rvs.data[ind].statusHistory = curr.statusHistory;
			localStorage.setItem('revisions', JSON.stringify(rvs));
			// receiptUrl = result.applicationHistory.find((x) => x.id === applicationId).letters.receipt;
		}

		if (paymentType === 'assignment') {
			const url = $page.url;
			const amount = url.searchParams.get('amount');
			const paymentId = url.searchParams.get('rrr');
			let body = {
				newStatus: 3,
				currentStatus: 2,
				reason: 'Payment Successful, awaiting search',
				userName: userName,
				amount: amount,
				applicationId: applicationId,
				paymentId: paymentId,
				userId: userId,
				fileId: fileId,
				simulate: simulate
			};
			const data = await fetch(`${baseURL}/api/assignment/PayAssignment`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (data.ok) {
				const result = await data.json();
				// receiptUrl = result.receipt;
				// ackUrl = result.ack;
			}
		}

		if (paymentType === 'opposition') {
			const url = $page.url;
			const name = url.searchParams.get('name');
			const address = url.searchParams.get('address');
			const email = url.searchParams.get('email');
			const description = url.searchParams.get('description');
			const number = url.searchParams.get('number');
			const amount = url.searchParams.get('amount');
			const fileId = url.searchParams.get('fileId');
			const userName = $loggedInUser.name;
			const userId = $loggedInUser.id;
			let body = {
				newStatus: 16,
				currentStatus:2,
				reason:"payment successful, awaiting counter statement",
				applicationId: applicationId,
				paymentId: paymentId,
				amount,
				userName,
				description,
				userId,
				fileId,
				name,
				address,
				email,
				number,
				simulate:simulate
			};
			const data = await fetch(`${baseURL}/api/opposition/payment`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (data.ok) {
				const result = await data.json();
				// receiptUrl = result.recepitUrl;
				// ackUrl = result.ackUrl;
			}
		}

		if (paymentType === 'oppositionCounter') {
			const url = $page.url;
			const name = url.searchParams.get('name');
			const address = url.searchParams.get('address');
			const email = url.searchParams.get('email');
			const amount = url.searchParams.get('amount');
			const description = url.searchParams.get('description');
			const number = url.searchParams.get('number');
			const fileUrl = url.searchParams.get('fileUrl');
			const userName = $loggedInUser.name;
			const userId = $loggedInUser.id;
			let body = {
				oppositionID: applicationId,
				paymentId,
				userName,
				userId,
				fileUrl,
				name,
				address,
				email,
				amount,
				description,
				number
			};
			const data = await fetch(`${baseURL}/api/opposition/respond`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (data.ok) {
				const result = await data.json();
				receiptUrl = result.responseReceiptUrl;
				ackUrl = result.responseAckUrl;
			}
		}

		if (paymentType === 'oppositionResolution') {
			const url = $page.url;
			const fileUrl = url.searchParams.get('fileUrl');
			const amount = url.searchParams.get('amount');
			const description = url.searchParams.get('description');
			const userName = $loggedInUser.name;
			const userId = $loggedInUser.id;
			let body = {
				oppositionID: applicationId,
				paymentId: paymentId,
				userName,
				userId,
				amount,
				description,
				fileUrl,
			};
			const data = await fetch(`${baseURL}/api/opposition/resolution`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (data.ok) {
				const result = await data.json();
				receiptUrl = result.responseReceiptUrl;
				ackUrl = result.responseAckUrl;
			}
		}
		if (paymentType==="statussearch") {
			const requestId = $page.url.searchParams.get('requestId') ?? undefined;
			await fetch(`${baseURL}/api/files/UpdateStatusRequest?requestId=${requestId}&simulate=${simulate}`, {
				method: 'POST'
			})
			isStatusUpdating = false;
		}

		if (paymentType==="other") {
			const rrr = $page.url.searchParams.get('rrr') ?? undefined;
			const notes = $page.url.searchParams.get('notes') ?? undefined;
			const attachmentUrl = $page.url.searchParams.get('attachmentUrl') ?? undefined;
			const title = $page.url.searchParams.get('title') ?? undefined;
			const serviceId = $page.url.searchParams.get('serviceId') ?? undefined;
			const cost = $page.url.searchParams.get('amount') ?? undefined;
			const agentName = $page.url.searchParams.get('agentName') ?? undefined;
			const agentId = $page.url.searchParams.get('agentId') ?? undefined;
			const name = $page.url.searchParams.get('name') ?? undefined;
			const number = $page.url.searchParams.get('number') ?? undefined;
			const email = $page.url.searchParams.get('email') ?? undefined;
			const id = crypto.randomUUID();
			let body = {
				agentId: agentId,
				agentName: agentName,
				serviceId: serviceId,
				serviceName: title,
				amount: cost,
				rrr: rrr,
				name: name,
				email: email,
				number: number,
				id
			}
			if (notes !== 'undefined') {
				body['notes'] = notes;
			}
			if (attachmentUrl) {
				body.attachmentUrl = attachmentUrl
			}
			const result = await fetch(`${baseURL}/api/payments/SaveOtherPayment`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body),
			});
			const data = await result.json()
			receiptUrl = data.receiptUrl;
			ackUrl = data.ackUrl;
		}
		isStatusUpdating = false;
	}
</script>

<div class="h-screen items-center p-3 justify-center flex-col flex">
	<div class="{isStatusUpdating ? '' : 'hidden'} flex flex-col items-center space-y-20">
		<p class="text-3xl text-green-600">Validating payment and updating status</p>
		<Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
	</div>
	<div class=" {isStatusUpdating ? 'hidden' : ''} space-y-10">
		<p class="text-2xl">Status updated successfully</p>
		<div class="space-y-3 space-x-4 flex flex-col">
<!--			<a class="border rounded-md p-3" target="_blank" href={receiptUrl}>Download receipt</a>-->
<!--			<a-->
<!--				class="border rounded-md p-3 {['newapplication', 'update', 'assignment','opposition','oppositionCounter', 'oppositionResolution', 'other', 'tradecertificate' ].includes(-->
<!--					paymentType-->
<!--				)-->
<!--					? ''-->
<!--					: 'hidden'}"-->
<!--				target="_blank"-->
<!--				href={ackUrl}>Download Acknowledgement</a>-->
			<Button
				on:click={() => {
					DashStats.set(null);
					goto('/home/dashboard/');
				}}>Home</Button
			>
			<Button
				class={paymentType === 'update' ? '' : 'hidden'}
				on:click={() => {
					goto(`/updatesmade?id=${fileId}`);
				}}>Back to Revisions</Button
			>
			<Button
				class={paymentType === 'batchrenewal' ? '' : 'hidden'}
				on:click={() => {
					goto(`/payment?type=batchrenewal`);
				}}>Next Renewal</Button
			>
		</div>
	</div>
	<!--	-->
	<!--		<div class="h-screen w-screen mx-auto my-auto items-center space-y-4">-->
	<!--			<p>Failed to process</p>-->
	<!--			<Button-->
	<!--				on:click={async () => {-->
	<!--					await goto('/home/dashboard/');-->
	<!--				}}>Home</Button-->
	<!--			>-->
	<!--		</div>-->
</div>

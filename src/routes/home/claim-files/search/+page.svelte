<script lang="ts">
	import { Label } from '$lib/components/ui/label/index';
	import * as Table from '$lib/components/ui/table/index';
	import { Button } from '$lib/components/ui/button/index';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import { Input } from '$lib/components/ui/input/index';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { Cell } from '$lib/components/ui/calendar';
	import { applicationData, loggedInUser, metaDataInfo } from '$lib/store';
	// import { mapDateToString } from '../home/components/dashboardutils';
	import { Toaster } from '$lib/components/ui/sonner';
	import { parseLoggedInUser } from '../../../dataview/datahelpers';
	import { goto } from '$app/navigation';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import {
		ApplicationStatuses,
		baseURL,
		FileTypes,
		hasValidCorrespondenceDetails,
		UserRoles,
		type CorrespondenceType
	} from '$lib/helpers';
	import { toast } from 'svelte-sonner';
	import { any } from 'zod';
	$: fileData = $applicationData;

	interface SearchResult {
		title: string;
		class: string | null;
		markType: string; // 1 = Foreign, 0 = Local
		filingDate: string;
		fileNumber: string | null;
	}

	interface PaymentDetails {
		amount: string | number;
		status: string;
		transactionId?: string;
		paymentDate?: string;
		applicantName?: string;
		applicantEmail?: string;
		applicantPhone?: string;
	}

	interface CorrespondenceDetails {
		name: string;
		email: string;
		phone: string;
		nationality: string;
		address: string;
	}

	let results: SearchResult[] = [];
	let isLoading = true;
	let error: string | null = null;
	let searchParams: {
		query: string;
		classId?: number;
		fileType: string;
	} | null = null;
	let fileNumber: string | null = null;
	let title: string;
	let message: string | null;
	let filteredResults: SearchResult[] = [];
	let showCorrespondenceRequest = false;
	let applicantDetails: {
		name: string;
		email: string;
		phone: string;
		fileId: string;
	} | null = null;

	// Dialog state variables
	let showClaimDialog = false;
	let showPaymentDialog = false;
	let paymentId = '';
	let paymentError: string | null = null;
	let selectedResult: SearchResult | null = null;
	let isSubmittingClaim = false;
	let isVerifyingPayment = false;
	let paymentDetails: PaymentDetails | null = null;
	let attachmentFiles: File[] = [];

	// Correspondence details
	let correspondenceDetails: CorrespondenceDetails = {
		name: '',
		email: '',
		phone: '',
		nationality: '',
		address: ''
	};

	let mark = onMount(async () => {
		try {
			// Retrieve search parameters from sessionStorage
			const storedParams = sessionStorage.getItem('searchParams');
			searchParams = storedParams ? JSON.parse(storedParams) : null;
			if (!$loggedInUser) {
				const user = parseLoggedInUser(document.cookie);
				if (!user) {
					console.log('the logged in user');
					await goto('/auth');
				} else {
					loggedInUser.set(user);
				}
			}
			//console.log($loggedInUser.name);
			if (searchParams) {
				// Fetch search results from the backend
				const response = await fetch(
					`${baseURL}/api/migration/GetMarkInfo?regNumber=${searchParams.query}`
				);

				// Get the response text first
				const responseText = await response.text();

				if (response.ok) {
					// Check if response is empty or not JSON
					if (!responseText.trim()) {
						console.warn('Empty response from server');
						results = [];
					} else {
						try {
							results = JSON.parse(responseText);
							// mark = await response.json();

							sessionStorage.setItem('markInfo', JSON.stringify(results));
						} catch (parseError) {
							console.error('Failed to parse JSON response:', parseError);
							console.log('Response text:', responseText);
							error = 'Invalid response format from server';
						}
					}
				} else {
					// Handle error response
					if (!responseText.trim()) {
						error = `Server error: ${response.status} ${response.statusText}`;
					} else {
						try {
							const errorBody = JSON.parse(responseText);
							message = errorBody.message || 'Unknown error occurred';
							error = message;
						} catch (parseError) {
							console.error('Failed to parse error response:', parseError);
							error = `Server error: ${response.status} - ${responseText}`;
						}
					}
				}
			} else {
				error = 'Search parameters are missing';
			}
		} catch (err) {
			console.error('Error fetching search results:', err);
			error = 'An error occurred while fetching search results';
		} finally {
			isLoading = false;
		}
	});

	function goBack() {
		window.history.back();
	}
	function openPaymentDialog(result: SearchResult) {
		selectedResult = result;
		paymentId = '';
		paymentError = null;
		showPaymentDialog = true;
	}

	function closePaymentDialog() {
		showPaymentDialog = false;
		paymentId = '';
		paymentError = null;
		isVerifyingPayment = false;
		paymentDetails = null;
	}
	function openClaimDialog(result: SearchResult) {
		selectedResult = result;
		paymentId = '';
		showClaimDialog = true;
	}

	function closeClaimDialog() {
		showClaimDialog = false;
		selectedResult = null;
		paymentId = '';
		isSubmittingClaim = false;
		paymentDetails = null;
		applicantDetails = null;
		attachmentFiles = [];
		// Reset correspondence details
		correspondenceDetails = {
			name: '',
			email: '',
			phone: '',
			nationality: '',
			address: ''
		};
	}

	async function getPaymentDetails(paymentId: string) {
		if (!paymentId.trim()) {
			paymentError = 'Please enter a valid payment ID';
			return;
		}

		// Clear previous errors
		paymentError = null;
		isVerifyingPayment = true;

		try {
			const response = await fetch(
				`${baseURL}/api/migration/GetPaymentInfo?paymentId=${paymentId}`
			);

			const data = await response.json();

			if (response.ok) {
				// Success case
				const applicant = data.applicants?.[0];
				const applicationHistory = data.applicationHistory?.[0];

				// Success case
				paymentDetails = {
					amount: data.amount,
					status: data.status,
					transactionId: data.transactionId || paymentId,
					paymentDate: data.paymentDate || new Date().toISOString(),
					applicantName: applicant?.name || data.applicantName,
					applicantEmail: applicant?.email || data.applicantEmail,
					applicantPhone: applicant?.phone || data.applicantPhone
				};
				console.log('Payment Details:', paymentDetails);
				// Set applicant details from the response
				applicantDetails = {
					name: applicant?.name || 'N/A',
					email: applicant?.email || 'N/A',
					phone: applicant?.phone || 'N/A',
					fileId: applicationHistory?.id || ''
				};
				console.log('Applicant Details:', applicantDetails);
				// Pre-populate correspondence details with applicant information if available
				if (applicant) {
					correspondenceDetails = {
						name: applicant.name || '',
						email: applicant.email || '',
						phone: applicant.phone || '',
						nationality: applicant.nationality || '',
						address: applicant.address || ''
					};
				}

				// Update session storage
				let markData = JSON.parse(sessionStorage.getItem('markInfo') || '[]') as SearchResult[];
				if (!Array.isArray(markData)) {
					markData = [markData];
				}
				markData = markData.map((m: SearchResult) => {
					if (selectedResult && m.fileNumber === selectedResult.fileNumber) {
						return {
							title: m.title,
							class: m.class,
							markType: m.markType,
							filingDate: m.filingDate,
							fileNumber: m.fileNumber,
							applicant: (data.applicants ?? [applicant]) || null,
							applicationHistory: data.applicationHistory || null
						};
					}
					return m;
				});
				console.log('Updated Mark Data with Payment Details:', markData);
				sessionStorage.setItem('markInfo', JSON.stringify(markData));

				// Success - close payment dialog and open claim dialog
				closePaymentDialog();
				showClaimDialog = true;
			} else {
				// Error case - display the error message from the backend
				paymentError = data.message || `Payment verification failed: ${response.status}`;
			}
		} catch (err) {
			console.error('Error verifying payment:', err);
			// Handle cases where JSON parsing fails or network errors
			if (err instanceof SyntaxError) {
				paymentError = 'Invalid response from server';
			} else {
				paymentError = 'An error occurred while verifying payment';
			}
		} finally {
			isVerifyingPayment = false;
		}
	}

	async function fetchApplicantDetails(applicantId: string) {
		try {
			const response = await fetch(
				`${baseURL}/api/migration/GetApplicantInfo?applicantId=${applicantId}`
			);
			if (response.ok) {
				const data = await response.json();
				applicantDetails = data;
				console.log('Applicant Details:', applicantDetails);
			} else {
				console.error('Failed to fetch applicant details');
			}
		} catch (err) {
			console.error('Error fetching applicant details:', err);
		}
	}

	function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			const newFiles = Array.from(target.files);

			// Validate file sizes (max 10MB per file)
			const maxSize = 10 * 1024 * 1024; // 10MB
			const validFiles = newFiles.filter((file) => {
				if (file.size > maxSize) {
					toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
					return false;
				}
				return true;
			});

			attachmentFiles = [...attachmentFiles, ...validFiles];
		}
	}

	function removeAttachment(index: number) {
		attachmentFiles = attachmentFiles.filter((_, i) => i !== index);
	}

	function validateCorrespondenceDetails(): boolean {
		const required = ['name', 'email', 'phone', 'nationality', 'address'];
		const missingFields = required.filter(
			(field) => !correspondenceDetails[field as keyof CorrespondenceDetails]?.trim()
		);

		if (missingFields.length > 0) {
			toast.error(`Please fill in all correspondence details: ${missingFields.join(', ')}`);
			return false;
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(correspondenceDetails.email)) {
			toast.error('Please enter a valid email address');
			return false;
		}

		return true;
	}

	async function submitClaim() {
		// Validate correspondence details
		if (!validateCorrespondenceDetails()) {
			return;
		}

		isSubmittingClaim = true;

		try {
			const formData = new FormData();

			// Prepare form data for file uploads
			let markData = JSON.parse(sessionStorage.getItem('markInfo') || '[]');
			if (!Array.isArray(markData)) {
				markData = [markData];
			}
			formData.append('markInfo', JSON.stringify(markData));

			if (!markData) {
				toast.error('Mark information is missing. Please try again.');
				isSubmittingClaim = false;
				return;
			}

			// Add correspondence details to form data
			formData.append('correspondenceName', correspondenceDetails.name);
			formData.append('correspondenceEmail', correspondenceDetails.email);
			formData.append('correspondencePhone', correspondenceDetails.phone);
			formData.append('correspondenceNationality', correspondenceDetails.nationality);
			formData.append('correspondenceAddress', correspondenceDetails.address);

			// Add attachment files
			attachmentFiles.forEach((file, index) => {
				formData.append(`attachments`, file);
			});
			if (attachmentFiles.length === 0) {
				toast.error('Please upload at least one supporting document.');
				error = 'Please upload at least one supporting document.';
				isSubmittingClaim = false;
				return;
			}

			const response = await fetch(`${baseURL}/api/migration/ClaimRequest`, {
				method: 'POST',
				body: formData // Using FormData instead of JSON for file uploads
			});

			if (response.ok) {
				const result = await response.json();
				toast.success('Claim submitted successfully!');
				alert('File claim submitted. We will review your submission and get back to you.');
				closeClaimDialog();
				// Optionally refresh the results or navigate to another page
			} else {
				const errorData = await response
					.json()
					.catch(() => ({ message: 'Failed to submit claim' }));
				toast.error(errorData.message || 'Failed to submit claim');
			}
		} catch (err) {
			console.error('Error submitting claim:', err);
			toast.error('An error occurred while submitting the claim');
		} finally {
			isSubmittingClaim = false;
		}
	}
</script>

<div class="space-y-4 m-4 p-2">
	<div class="flex items-center justify-between">
		<Button variant="outline" on:click={goBack} class="flex items-center gap-2">
			<Icon icon="lucide:arrow-left" width="1rem" height="1rem" />
			Back
		</Button>
		<h1 class="text-xl font-semibold">Claim Files Search Results</h1>
		<div></div>
		<!-- Empty div to balance the flexbox -->
	</div>

	{#if searchParams}
		<div class="bg-gray-50 p-4 rounded-md mb-4">
			<h2 class="text-sm font-medium text-gray-500 mb-2">Search Criteria</h2>
			<div class="flex flex-wrap gap-4">
				{#if searchParams.query}
					<div class="flex items-center gap-2">
						<span class="text-sm font-medium">File Number:</span>
						<span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded"
							>{searchParams.query}</span
						>
					</div>
				{/if}
				{#if searchParams.classId}
					<div class="flex items-center gap-2">
						<span class="text-sm font-medium">Class:</span>
						<span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded"
							>{searchParams.classId}</span
						>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if isLoading}
		<div class="flex items-center justify-center p-12">
			<div class="flex flex-col items-center gap-2">
				<Icon icon="line-md:loading-loop" width="2rem" height="2rem" class="text-blue-600" />
				<span class="text-sm text-gray-500">Loading results...</span>
			</div>
		</div>
	{:else if error}
		<div class="bg-red-50 text-red-600 p-4 rounded-md text-center">
			<p>{error}</p>
		</div>
	{:else if results.length === 0}
		<div class="bg-yellow-50 p-8 rounded-md text-center">
			<Icon
				icon="lucide:search-x"
				width="2rem"
				height="2rem"
				class="mx-auto mb-2 text-yellow-600"
			/>
			<h3 class="text-lg font-medium text-gray-800 mb-1">No results found</h3>
			<!-- <p class="text-gray-600">Please ensure that your file status is not 'Active'.</p> -->
		</div>
	{:else}
		<div class="bg-white rounded-md shadow overflow-hidden">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-16">S/N</Table.Head>
						<Table.Head>File Number</Table.Head>
						<Table.Head>File Title</Table.Head>
						<Table.Head class="w-128">File Type</Table.Head>
						<Table.Head class="w-24">Class</Table.Head>
						<!-- <Table.Head class="w-32">Representation</Table.Head> -->
						<Table.Head class="w-16"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each results as result, index}
						<Table.Row>
							<Table.Cell class="font-medium">{index + 1}</Table.Cell>
							<Table.Cell>{result.fileNumber}</Table.Cell>
							<Table.Cell>{result.title}</Table.Cell>
							<Table.Cell>
								{result.markType === 1 ? 'Foreign' : 'Local'}
							</Table.Cell>

							<Table.Cell>{result.class}</Table.Cell>
							<Table.Cell class="w-16">
								<button
									class="px-3 py-2 rounded-2xl bg-blue-600 text-white text-sm font-medium shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
									on:click={() => openPaymentDialog(result)}
								>
									Claim
								</button>
							</Table.Cell></Table.Row
						>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>

<!-- Payment Verification Dialog -->
<Dialog.Root bind:open={showPaymentDialog}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Verify Payment</Dialog.Title>
			<Dialog.Description>
				Enter your payment ID to claim the file: <strong>{selectedResult?.fileNumber}</strong> - {selectedResult?.title}
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<!-- Error Display -->
			{#if paymentError}
				<div
					class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2"
				>
					<Icon icon="lucide:alert-circle" width="1rem" height="1rem" class="text-red-500" />
					<span class="text-sm">{paymentError}</span>
				</div>
			{/if}

			<div class="space-y-2">
				<Label for="payment-id">Payment ID</Label>
				<Input
					id="payment-id"
					type="text"
					placeholder="Enter payment ID"
					bind:value={paymentId}
					disabled={isVerifyingPayment}
					class={paymentError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
				/>
			</div>
			<p class="text-xs text-gray-500 px-4 pb-4 mt-1 italic text-center md:text-left">
				Please ensure to provide the RRR or Payment ID that is NOT an "IPON" number.
			</p>
		</div>

		<Dialog.Footer class="flex justify-end space-x-2">
			<Button variant="outline" on:click={closePaymentDialog} disabled={isVerifyingPayment}>
				Cancel
			</Button>
			<Button
				on:click={() => getPaymentDetails(paymentId)}
				disabled={isVerifyingPayment || !paymentId.trim()}
			>
				{#if isVerifyingPayment}
					<Icon icon="line-md:loading-loop" width="1rem" height="1rem" class="mr-2" />
					Verifying...
				{:else}
					Verify Payment
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Claim Submission Dialog -->
<Dialog.Root bind:open={showClaimDialog}>
	<Dialog.Content class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Submit Claim</Dialog.Title>
			<Dialog.Description>
				Confirm your claim for file: <strong>{selectedResult?.fileNumber}</strong> - {selectedResult?.title}
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6 py-4">
			{#if paymentDetails}
				<div class="bg-green-50 p-4 rounded-md space-y-3">
					<h3 class="text-sm font-medium text-green-800">✓ Payment Details</h3>
					<div class="grid grid-cols-2 gap-4 text-sm text-green-700">
						<div>
							<p class="font-medium">Payment ID</p>
							<p>{paymentDetails.transactionId}</p>
						</div>
						<div>
							<p class="font-medium">Amount</p>
							<p>{paymentDetails.amount}</p>
						</div>
						<div>
							<p class="font-medium">Status</p>
							<p>{paymentDetails.status}</p>
						</div>
						<div>
							<p class="font-medium">Payment Date</p>
							<p>{new Date(paymentDetails.paymentDate).toLocaleDateString()}</p>
						</div>
						{#if paymentDetails.applicantName && paymentDetails.applicantName !== 'N/A'}
							<div class="col-span-2">
								<p class="font-medium">Applicant Name</p>
								<p>{paymentDetails.applicantName}</p>
							</div>
						{/if}
						{#if paymentDetails.applicantEmail && paymentDetails.applicantEmail !== 'N/A'}
							<div>
								<p class="font-medium">Email</p>
								<p>{paymentDetails.applicantEmail}</p>
							</div>
						{/if}
						{#if paymentDetails.applicantPhone && paymentDetails.applicantPhone !== 'N/A'}
							<div>
								<p class="font-medium">Phone</p>
								<p>{paymentDetails.applicantPhone}</p>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			{#if applicantDetails}
				<div class="bg-gray-50 p-4 rounded-md">
					<h3 class="text-sm font-medium text-gray-800 mb-2">Original Applicant Details</h3>
					<div class="text-sm text-gray-700 space-y-1">
						<p><strong>Name:</strong> {applicantDetails.name}</p>
						<p><strong>Email:</strong> {applicantDetails.email}</p>
						<p><strong>Phone:</strong> {applicantDetails.phone}</p>
					</div>
				</div>
			{/if}
			<!-- Correspondence Details Section -->
			<div class="bg-blue-50 p-4 rounded-md space-y-4">
				<h3 class="text-sm font-medium text-blue-800">Correspondence Details</h3>
				<p class="text-xs text-blue-700">
					Please provide contact information for correspondence regarding this file claim.
				</p>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="correspondence-name">Full Name <span class="text-red-500">*</span></Label>
						<Input
							id="correspondence-name"
							type="text"
							placeholder="Enter full name"
							bind:value={correspondenceDetails.name}
							disabled={isSubmittingClaim}
						/>
					</div>

					<div class="space-y-2">
						<Label for="correspondence-email"
							>Email Address <span class="text-red-500">*</span></Label
						>
						<Input
							id="correspondence-email"
							type="email"
							placeholder="Enter email address"
							bind:value={correspondenceDetails.email}
							disabled={isSubmittingClaim}
						/>
					</div>

					<div class="space-y-2">
						<Label for="correspondence-phone"
							>Phone Number <span class="text-red-500">*</span></Label
						>
						<Input
							id="correspondence-phone"
							type="tel"
							placeholder="Enter phone number"
							bind:value={correspondenceDetails.phone}
							disabled={isSubmittingClaim}
						/>
					</div>

					<div class="space-y-2">
						<Label for="correspondence-nationality"
							>Nationality <span class="text-red-500">*</span></Label
						>
						<Input
							id="correspondence-nationality"
							type="text"
							placeholder="Enter nationality"
							bind:value={correspondenceDetails.nationality}
							disabled={isSubmittingClaim}
						/>
					</div>

					<div class="space-y-2 md:col-span-2">
						<Label for="correspondence-address">Address <span class="text-red-500">*</span></Label>
						<Input
							id="correspondence-address"
							type="text"
							placeholder="Enter full address"
							bind:value={correspondenceDetails.address}
							disabled={isSubmittingClaim}
						/>
					</div>
				</div>
			</div>
			<!-- File Upload Section -->
			<div class="space-y-3">
				<Label for="attachments">Supporting Documents <span class="text-red-500">*</span></Label>
				<div class="border-2 border-dashed border-gray-300 rounded-md p-4">
					<input
						id="attachments"
						type="file"
						multiple
						accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
						on:change={handleFileUpload}
						class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
						disabled={isSubmittingClaim}
					/>
					<p class="text-xs text-gray-500 mt-2">
						Upload supporting documents (PDF, DOC, DOCX, JPG, PNG). Max 10MB per file.
					</p>
					<p class="text-sm text-gray-700 font-medium mt-3 mb-1">Acceptable Documents:</p>
					<ul class="list-disc list-inside text-sm text-gray-700 space-y-1 ml-1">
						<li>Trademark Acknowledgement</li>
						<li>Trademark Acceptance</li>
						<li>Publication Page</li>
					</ul>
				</div>

				{#if attachmentFiles.length > 0}
					<div class="space-y-2">
						<p class="text-sm font-medium">Selected Files:</p>
						{#each attachmentFiles as file, index}
							<div class="flex items-center justify-between bg-gray-50 p-2 rounded-md">
								<div class="flex items-center gap-2">
									<Icon icon="lucide:file" width="1rem" height="1rem" class="text-gray-500" />
									<span class="text-sm truncate">{file.name}</span>
									<span class="text-xs text-gray-500"
										>({(file.size / 1024 / 1024).toFixed(2)} MB)</span
									>
								</div>
								<button
									type="button"
									on:click={() => removeAttachment(index)}
									class="text-red-500 hover:text-red-700"
									disabled={isSubmittingClaim}
								>
									<Icon icon="lucide:x" width="1rem" height="1rem" />
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="bg-yellow-50 p-4 rounded-md">
				<p class="text-sm text-yellow-800">
					By clicking "Submit Claim", you confirm that all the information provided is accurate and
					you wish to proceed with claiming this file. All future correspondence regarding this
					claim will be sent to the provided correspondence details.
				</p>
			</div>
		</div>

		<Dialog.Footer class="flex justify-end space-x-2">
			<Button variant="outline" on:click={closeClaimDialog} disabled={isSubmittingClaim}>
				Cancel
			</Button>
			<Button on:click={submitClaim} disabled={isSubmittingClaim}>
				{#if isSubmittingClaim}
					<Icon icon="line-md:loading-loop" width="1rem" height="1rem" class="mr-2" />
					Submitting Claim...
				{:else}
					Submit Claim
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

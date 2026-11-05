import {
	ApplicationStatuses,
	baseURL,
	FormApplicationTypes,
} from '$lib/helpers';
import { authFetch } from './authFetch';
import { normalizeApplicationStatus } from './otherApplications';
import { readRrrFromParams } from './availabilitySearchPayment';

export interface PendingPaymentApplication {
	id: string;
	status: number | string | null | undefined;
	paymentId: string | null | undefined;
	applicationType: number | null | undefined;
	fileId?: string | null;
	title?: string | null;
	oppositionWithdrawal?: boolean;
}

export interface ResumePaymentDetails {
	appId: string;
	rrr: string;
	applicationType: FormApplicationTypes;
	fileId: string | null;
	title: string | null;
	oppositionWithdrawal?: boolean;
}

interface PaymentUser {
	id: string;
	firstName?: string | null;
	lastName?: string | null;
	name?: string | null;
}

const standaloneTypes = new Set<FormApplicationTypes>([
	FormApplicationTypes.AvailabilitySearch,
	FormApplicationTypes.TrademarkJournalRequest,
	FormApplicationTypes.NewOpposition,
	FormApplicationTypes.CounterStatement,
	FormApplicationTypes.StatutoryDeclaration,
	FormApplicationTypes.StatusSearch,
]);

export function isAwaitingApplicationPayment(
	status: PendingPaymentApplication['status'],
): boolean {
	return (
		normalizeApplicationStatus(status) === ApplicationStatuses.AwaitingPayment
	);
}

function paymentParams(details: ResumePaymentDetails): URLSearchParams {
	const params = new URLSearchParams({
		appId: details.appId,
		applicationType: String(details.applicationType),
	});
	if (details.fileId) params.set('fileId', details.fileId);
	if (details.title) params.set('title', details.title);
	if (details.oppositionWithdrawal) params.set('oppositionWithdrawal', '1');
	// Remita may append its query string to the final parameter.
	params.set('rrr', details.rrr);
	return params;
}

export function readResumePaymentDetails(
	params: URLSearchParams,
): ResumePaymentDetails {
	const appId = params.get('appId')?.trim();
	const rrr = readRrrFromParams(params);
	const rawType = params.get('applicationType');
	const applicationType =
		rawType !== null && /^\d+$/.test(rawType) ? Number(rawType) : NaN;
	const fileId = params.get('fileId')?.trim() || null;
	const oppositionWithdrawal = params.get('oppositionWithdrawal');

	if (
		!appId ||
		!rrr ||
		!Object.values(FormApplicationTypes).includes(applicationType) ||
		(oppositionWithdrawal !== null &&
			(oppositionWithdrawal !== '1' ||
				applicationType !== FormApplicationTypes.NewOpposition))
	) {
		throw new Error(
			'Missing or invalid application payment details. Please reopen the application.',
		);
	}
	if (!standaloneTypes.has(applicationType) && !fileId) {
		throw new Error(
			'The application is missing its file identifier. Please open it from the file details.',
		);
	}
	return {
		appId,
		rrr,
		applicationType,
		fileId,
		title: params.get('title'),
		...(oppositionWithdrawal === '1' ? { oppositionWithdrawal: true } : {}),
	};
}

export function getResumePaymentUrl(
	application: PendingPaymentApplication,
): string {
	if (!isAwaitingApplicationPayment(application.status)) {
		throw new Error('This application is not awaiting payment.');
	}
	if (typeof application.id !== 'string' || !application.id.trim()) {
		throw new Error(
			'Missing application identifier. Please reopen the application.',
		);
	}
	if (
		!application.paymentId?.trim() ||
		!/^[A-Za-z0-9-]+$/.test(application.paymentId.trim())
	) {
		throw new Error(
			'No valid Remita reference is available for this application. Please contact support.',
		);
	}
	const params = paymentParams({
		appId: application.id,
		rrr: application.paymentId.trim(),
		applicationType: application.applicationType ?? NaN,
		fileId: application.fileId ?? null,
		title: application.title ?? null,
		oppositionWithdrawal: application.oppositionWithdrawal,
	});
	readResumePaymentDetails(params);
	params.set('type', 'resume');
	return `/payment?${params}`;
}

export function getResumePaymentResponseUrl(
	host: string,
	details: ResumePaymentDetails,
): string {
	return `https://${host}/payment/complete?${paymentParams(details)}`;
}

export function getPaymentApplicationUrl(
	details: ResumePaymentDetails,
): string {
	if (details.oppositionWithdrawal) return '/home/opposition?tab=withdrawal';
	if (details.applicationType === FormApplicationTypes.AvailabilitySearch) {
		return '/home/other-applications?tab=availabilitysearch';
	}
	if (details.applicationType === FormApplicationTypes.NewOpposition) {
		return `/home/other-applications?tab=oppositions&oppositionId=${encodeURIComponent(details.appId)}`;
	}
	if (details.fileId)
		return `/dataview?id=${encodeURIComponent(details.fileId)}`;
	return '/home/other-applications?tab=other';
}

export async function getExistingPaymentCost(
	rrr: string,
	fetcher: typeof fetch = authFetch,
): Promise<string> {
	const response = await fetcher(
		`${baseURL}/api/files/GetRRRCost?rrr=${encodeURIComponent(rrr)}`,
	);
	if (!response.ok)
		throw new Error(
			`Could not load the payment amount (${response.status}). Please try again.`,
		);
	const body = await response.json();
	const amount = body?.cost ?? body?.amount;
	if (
		(typeof amount !== 'number' && typeof amount !== 'string') ||
		String(amount).trim() === '' ||
		!Number.isFinite(Number(amount)) ||
		Number(amount) <= 0
	) {
		throw new Error(
			'No valid outstanding amount was returned for this Remita reference. Please contact support.',
		);
	}
	return String(amount);
}

export async function getExistingPaymentFileNumber(
	fileId: string | null,
	fetcher: typeof fetch = authFetch,
): Promise<string | null> {
	if (!fileId) return null;
	const response = await fetcher(
		`${baseURL}/api/files/${encodeURIComponent(fileId)}`,
	);
	if (!response.ok) {
		throw new Error(
			`Could not load the file number (${response.status}). Please try again.`,
		);
	}
	const file = await response.json();
	if (typeof file?.fileId !== 'string' || !file.fileId.trim()) {
		throw new Error(
			'The file has no registered file number. Please contact support.',
		);
	}
	return file.fileId.trim();
}

export async function confirmResumedPayment(
	details: ResumePaymentDetails,
	user: PaymentUser,
	fetcher: typeof fetch = authFetch,
): Promise<void> {
	if (!user.id)
		throw new Error('Please sign in again to confirm your payment.');

	const check = await fetcher(
		`${baseURL}/api/payments/check?id=${encodeURIComponent(details.rrr)}`,
	);
	if (!check.ok)
		throw new Error(
			`Could not verify the payment (${check.status}). Please try again.`,
		);
	const payment = await check.json();
	if (payment?.status !== '00') {
		throw new Error(
			'Payment is not confirmed yet. If you have paid, wait a moment and retry confirmation.',
		);
	}

	let endpoint: string;
	let body: string | undefined;
	const paymentId = encodeURIComponent(details.rrr);
	switch (details.applicationType) {
		case FormApplicationTypes.AvailabilitySearch:
			endpoint = `/api/files/UpdateAvailabilitySearchPayment?paymentId=${paymentId}`;
			body = JSON.stringify({ appId: details.appId });
			break;
		case FormApplicationTypes.NewOpposition:
			endpoint = details.oppositionWithdrawal
				? `/api/opposition/UpdateOppositionWithdrawalPayment?paymentId=${paymentId}`
				: `/api/opposition/UpdateOppositionPayment?paymentId=${paymentId}`;
			break;
		case FormApplicationTypes.CounterStatement:
			endpoint = `/api/opposition/UpdateCounterStatementPayment?paymentId=${paymentId}`;
			break;
		case FormApplicationTypes.StatutoryDeclaration:
			endpoint = `/api/opposition/UpdateStatutoryDeclarationPayment?paymentId=${paymentId}`;
			break;
		case FormApplicationTypes.StatusSearch:
			endpoint = `/api/files/UpdateStatusRequest?requestId=${encodeURIComponent(details.appId)}&simulate=false`;
			break;
		case FormApplicationTypes.TrademarkJournalRequest:
			endpoint = '/api/publication/UpdateRequestStatus';
			body = JSON.stringify({ AppId: details.appId, UserId: user.id });
			break;
		default: {
			if (!details.fileId)
				throw new Error('Missing application file identifier.');
			// Existing applications must be confirmed, not submitted a second time from saved form data.
			const params = new URLSearchParams({
				fileId: details.fileId,
				applicationId: details.appId,
				userId: user.id,
				userName:
					user.name ||
					[user.firstName, user.lastName].filter(Boolean).join(' '),
				isCertificate: String(
					details.applicationType === FormApplicationTypes.Certification,
				),
			});
			endpoint = `/api/files/ManualUpdate?${params}`;
		}
	}
	const response = await fetcher(`${baseURL}${endpoint}`, {
		method: 'POST',
		...(body ? { headers: { 'Content-Type': 'application/json' }, body } : {}),
	});
	if (!response.ok) {
		throw new Error(
			`Payment could not be recorded (${response.status}). Please retry confirmation or contact support.`,
		);
	}
	const text = await response.text();
	if (
		text &&
		response.headers.get('content-type')?.includes('application/json')
	) {
		const result = JSON.parse(text);
		if (result?.success === false) {
			throw new Error(
				result.message ||
					'Payment could not be recorded. Please contact support.',
			);
		}
	}
}

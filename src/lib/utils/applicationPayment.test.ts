import { describe, expect, it, vi } from 'vitest';
import {
	ApplicationStatuses,
	FileTypes,
	FormApplicationTypes,
} from '$lib/helpers';
import {
	confirmResumedPayment,
	getExistingPaymentCost,
	getExistingPaymentFileNumber,
	getPaymentApplicationUrl,
	getResumePaymentResponseUrl,
	getResumePaymentUrl,
	isAwaitingApplicationPayment,
	readResumePaymentDetails,
	type PendingPaymentApplication,
	type ResumePaymentDetails,
} from './applicationPayment';

const application: PendingPaymentApplication = {
	id: 'application-id',
	status: ApplicationStatuses.AwaitingPayment,
	paymentId: '123456789012',
	applicationType: FormApplicationTypes.NewApplication,
	fileId: 'file-id',
};
const details: ResumePaymentDetails = {
	appId: application.id,
	rrr: application.paymentId!,
	applicationType: FormApplicationTypes.NewApplication,
	fileId: application.fileId!,
	title: null,
};
const user = { id: 'user-id', firstName: 'Test', lastName: 'Applicant' };

describe('resuming application payments', () => {
	it.each([2, '2', 'AwaitingPayment', 'Awaiting Payment'])(
		'accepts awaiting-payment status %s',
		(status) => expect(isAwaitingApplicationPayment(status)).toBe(true),
	);

	it.each([0, 1, 3, 13, null, undefined, 'Approved', 'invalid'])(
		'does not offer completion for status %s',
		(status) => expect(isAwaitingApplicationPayment(status)).toBe(false),
	);

	it.each([FileTypes.Trademark, FileTypes.Patent, FileTypes.Design])(
		'reuses the existing reference and application for IP type %s',
		(fileType) => {
			const url = new URL(
				getResumePaymentUrl({
					...application,
					fileId: `file-${fileType}`,
					title: `${FileTypes[fileType]} payment`,
				}),
				'https://ipon.test',
			);
			expect(url.pathname).toBe('/payment');
			expect(url.searchParams.get('type')).toBe('resume');
			expect(readResumePaymentDetails(url.searchParams)).toEqual({
				...details,
				fileId: `file-${fileType}`,
				title: `${FileTypes[fileType]} payment`,
			});
			expect(url.searchParams.has('amount')).toBe(false);
		},
	);

	it('encodes identifiers and survives Remita appending another query string', () => {
		const responseUrl = new URL(
			getResumePaymentResponseUrl('ipon.test', {
				...details,
				fileId: 'F/TM/123 & 4',
			}),
		);
		expect(responseUrl.pathname).toBe('/payment/complete');
		const parsed = readResumePaymentDetails(
			new URL(`${responseUrl}?RRR=123456789012`).searchParams,
		);
		expect(parsed.fileId).toBe('F/TM/123 & 4');
		expect(parsed.rrr).toBe(details.rrr);
	});

	it('does not require a file for standalone applications', () => {
		for (const applicationType of [
			FormApplicationTypes.AvailabilitySearch,
			FormApplicationTypes.TrademarkJournalRequest,
			FormApplicationTypes.NewOpposition,
			FormApplicationTypes.CounterStatement,
			FormApplicationTypes.StatutoryDeclaration,
			FormApplicationTypes.StatusSearch,
		]) {
			expect(() =>
				getResumePaymentUrl({ ...application, applicationType, fileId: null }),
			).not.toThrow();
		}
	});

	it.each([
		{ paymentId: null },
		{ paymentId: 'undefined', applicationType: null },
		{ paymentId: '123?RRR=456' },
		{ fileId: null },
		{ id: '' },
		{ applicationType: null },
		{ applicationType: 999 },
		{ status: ApplicationStatuses.Approved },
	])('rejects invalid payment details %j', (overrides) => {
		expect(() =>
			getResumePaymentUrl({ ...application, ...overrides }),
		).toThrow();
	});

	it('returns users to the relevant application list or file', () => {
		expect(getPaymentApplicationUrl(details)).toBe('/dataview?id=file-id');
		expect(
			getPaymentApplicationUrl({
				...details,
				applicationType: FormApplicationTypes.NewOpposition,
			}),
		).toContain('tab=oppositions&oppositionId=application-id');
		expect(
			getPaymentApplicationUrl({
				...details,
				fileId: null,
				applicationType: FormApplicationTypes.TrademarkJournalRequest,
			}),
		).toBe('/home/other-applications?tab=other');
	});
});

describe('invoice file numbers', () => {
	it.each(['F/TM/2026/123', 'F/PT/NC/O/2026/456', 'F/DS/2026/789'])(
		'resolves the registered file number %s from the internal ID',
		async (fileNumber) => {
			const fetcher = vi
				.fn<typeof fetch>()
				.mockResolvedValue(
					Response.json({ id: 'internal-file-id', fileId: fileNumber }),
				);
			await expect(
				getExistingPaymentFileNumber('internal-file-id', fetcher),
			).resolves.toBe(fileNumber);
			expect(fetcher).toHaveBeenCalledWith(
				expect.stringContaining('/api/files/internal-file-id'),
			);
		},
	);

	it('encodes the lookup identifier', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValue(Response.json({ fileId: 'F/TM/2026/123' }));
		await getExistingPaymentFileNumber('file/id & value', fetcher);
		expect(fetcher).toHaveBeenCalledWith(
			expect.stringContaining('/api/files/file%2Fid%20%26%20value'),
		);
	});

	it('does not request a file for standalone payments', async () => {
		const fetcher = vi.fn<typeof fetch>();
		await expect(
			getExistingPaymentFileNumber(null, fetcher),
		).resolves.toBeNull();
		expect(fetcher).not.toHaveBeenCalled();
	});

	it.each([
		{},
		{ fileId: null },
		{ fileId: '' },
		{ fileId: ' ' },
		{ fileId: 123 },
	])(
		'does not substitute the internal ID when the registered number is missing: %j',
		async (body) => {
			const fetcher = vi
				.fn<typeof fetch>()
				.mockResolvedValue(Response.json({ id: 'internal-file-id', ...body }));
			await expect(
				getExistingPaymentFileNumber('internal-file-id', fetcher),
			).rejects.toThrow('no registered file number');
		},
	);

	it('surfaces file lookup failures', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValue(new Response(null, { status: 403 }));
		await expect(
			getExistingPaymentFileNumber('internal-file-id', fetcher),
		).rejects.toThrow('(403)');
	});
});

describe('existing RRR amounts', () => {
	it.each([{ cost: 1200 }, { amount: '1200' }])(
		'loads the existing cost from %j',
		async (body) => {
			const fetcher = vi
				.fn<typeof fetch>()
				.mockResolvedValue(Response.json(body));
			await expect(getExistingPaymentCost(details.rrr, fetcher)).resolves.toBe(
				'1200',
			);
			expect(fetcher).toHaveBeenCalledWith(
				expect.stringContaining(`GetRRRCost?rrr=${details.rrr}`),
			);
		},
	);

	it.each([
		{},
		{ cost: null },
		{ cost: '' },
		{ cost: ' ' },
		{ cost: 0 },
		{ cost: -1 },
		{ cost: 'NaN' },
		{ cost: true },
	])('rejects missing or invalid costs %j', async (body) => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValue(Response.json(body));
		await expect(getExistingPaymentCost(details.rrr, fetcher)).rejects.toThrow(
			'valid outstanding amount',
		);
	});

	it('surfaces amount lookup failures', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValue(new Response(null, { status: 403 }));
		await expect(getExistingPaymentCost(details.rrr, fetcher)).rejects.toThrow(
			'(403)',
		);
	});
});

describe('confirming resumed payments', () => {
	it('preserves opposition withdrawal confirmation through the Remita round trip', async () => {
		const url = new URL(
			getResumePaymentUrl({
				...application,
				applicationType: FormApplicationTypes.NewOpposition,
				oppositionWithdrawal: true,
			}),
			'https://ipon.test',
		);
		const withdrawalDetails = readResumePaymentDetails(url.searchParams);
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(Response.json({ status: '00' }))
			.mockResolvedValueOnce(new Response(null, { status: 204 }));
		await confirmResumedPayment(withdrawalDetails, user, fetcher);
		expect(String(fetcher.mock.calls[1][0])).toContain(
			'/api/opposition/UpdateOppositionWithdrawalPayment?',
		);
		expect(getPaymentApplicationUrl(withdrawalDetails)).toBe(
			'/home/opposition?tab=withdrawal',
		);
		const callback = new URL(
			getResumePaymentResponseUrl('ipon.test', withdrawalDetails),
		);
		expect(
			readResumePaymentDetails(callback.searchParams).oppositionWithdrawal,
		).toBe(true);
	});

	function confirmedFetcher() {
		return vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(Response.json({ status: '00' }))
			.mockResolvedValueOnce(new Response(null, { status: 204 }));
	}

	it.each([
		FormApplicationTypes.NewApplication,
		FormApplicationTypes.LicenseRenewal,
		FormApplicationTypes.DataUpdate,
		FormApplicationTypes.Assignment,
		FormApplicationTypes.RegisteredUser,
		FormApplicationTypes.Merger,
		FormApplicationTypes.ChangeOfName,
		FormApplicationTypes.ChangeOfAddress,
		FormApplicationTypes.ClericalUpdate,
		FormApplicationTypes.AppealRequest,
		FormApplicationTypes.PublicationStatusUpdate,
		FormApplicationTypes.WithdrawalRequest,
		FormApplicationTypes.Amendment,
		FormApplicationTypes.Certification,
		FormApplicationTypes.License,
		FormApplicationTypes.Mortgage,
		FormApplicationTypes.CertifiedTrueCopy,
		FormApplicationTypes.Reclassification,
		FormApplicationTypes.Restoration,
		FormApplicationTypes.ChangeOfAgent,
		FormApplicationTypes.OfflineRenewalRequest,
	])(
		'confirms existing file application type %s without recreating it',
		async (applicationType) => {
			const fetcher = confirmedFetcher();
			await confirmResumedPayment(
				{ ...details, applicationType },
				user,
				fetcher,
			);
			expect(fetcher).toHaveBeenCalledTimes(2);
			const url = new URL(String(fetcher.mock.calls[1][0]));
			expect(url.pathname).toBe('/api/files/ManualUpdate');
			expect(url.searchParams.get('applicationId')).toBe(details.appId);
			expect(url.searchParams.get('fileId')).toBe(details.fileId);
			expect(url.searchParams.get('userId')).toBe(user.id);
			expect(url.searchParams.get('userName')).toBe('Test Applicant');
			expect(url.searchParams.get('isCertificate')).toBe(
				String(applicationType === FormApplicationTypes.Certification),
			);
			expect(fetcher.mock.calls[1][1]?.method).toBe('POST');
		},
	);

	it.each([
		[
			FormApplicationTypes.AvailabilitySearch,
			'/api/files/UpdateAvailabilitySearchPayment',
		],
		[
			FormApplicationTypes.NewOpposition,
			'/api/opposition/UpdateOppositionPayment',
		],
		[
			FormApplicationTypes.CounterStatement,
			'/api/opposition/UpdateCounterStatementPayment',
		],
		[
			FormApplicationTypes.StatutoryDeclaration,
			'/api/opposition/UpdateStatutoryDeclarationPayment',
		],
		[FormApplicationTypes.StatusSearch, '/api/files/UpdateStatusRequest'],
		[
			FormApplicationTypes.TrademarkJournalRequest,
			'/api/publication/UpdateRequestStatus',
		],
	] as const)(
		'uses the dedicated confirmation endpoint for type %s',
		async (applicationType, endpoint) => {
			const fetcher = confirmedFetcher();
			await confirmResumedPayment(
				{ ...details, applicationType, fileId: null },
				user,
				fetcher,
			);
			const [input, init] = fetcher.mock.calls[1];
			const url = new URL(String(input));
			expect(url.pathname).toBe(endpoint);
			expect(init?.method).toBe('POST');
			if (applicationType === FormApplicationTypes.TrademarkJournalRequest) {
				expect(JSON.parse(String(init?.body))).toEqual({
					AppId: details.appId,
					UserId: user.id,
				});
			} else if (applicationType === FormApplicationTypes.StatusSearch) {
				expect(url.searchParams.get('requestId')).toBe(details.appId);
				expect(url.searchParams.get('simulate')).toBe('false');
			} else {
				expect(url.searchParams.get('paymentId')).toBe(details.rrr);
			}
		},
	);

	it.each(['01', '02', '021', '099', undefined])(
		'never updates an unconfirmed payment (%s)',
		async (status) => {
			const fetcher = vi
				.fn<typeof fetch>()
				.mockResolvedValue(Response.json({ status }));
			await expect(
				confirmResumedPayment(details, user, fetcher),
			).rejects.toThrow('not confirmed yet');
			expect(fetcher).toHaveBeenCalledTimes(1);
		},
	);

	it.each([401, 403, 500])(
		'surfaces verification HTTP %s without updating',
		async (status) => {
			const fetcher = vi
				.fn<typeof fetch>()
				.mockResolvedValue(new Response(null, { status }));
			await expect(
				confirmResumedPayment(details, user, fetcher),
			).rejects.toThrow(`(${status})`);
			expect(fetcher).toHaveBeenCalledTimes(1);
		},
	);

	it('does not report success when the backend cannot record payment', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(Response.json({ status: '00' }))
			.mockResolvedValueOnce(new Response(null, { status: 500 }));
		await expect(confirmResumedPayment(details, user, fetcher)).rejects.toThrow(
			'could not be recorded',
		);
	});

	it('surfaces an explicit backend failure even with HTTP 200', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(Response.json({ status: '00' }))
			.mockResolvedValueOnce(
				Response.json({ success: false, message: 'Application not updated' }),
			);
		await expect(confirmResumedPayment(details, user, fetcher)).rejects.toThrow(
			'Application not updated',
		);
	});
});

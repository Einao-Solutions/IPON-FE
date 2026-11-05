import { expect, test } from '@playwright/test';

const pendingApplications = [
	{
		id: 'trademark-app',
		applicationType: 0,
		currentStatus: 2,
		paymentId: '111111111111',
		fileId: 'trademark-file',
		title: 'Trademark filing',
	},
	{
		id: 'patent-app',
		applicationType: 5,
		currentStatus: 2,
		paymentId: '222222222222',
		fileId: 'patent-file',
		title: 'Patent assignment',
	},
	{
		id: 'design-app',
		applicationType: 19,
		currentStatus: 2,
		paymentId: '333333333333',
		fileId: 'design-file',
		title: 'Design license',
	},
	{
		id: 'journal-app',
		applicationType: 28,
		currentStatus: 2,
		paymentId: '444444444444',
		title: 'Journal request',
	},
	{
		id: 'paid-app',
		applicationType: 28,
		currentStatus: 13,
		paymentId: '555555555555',
		title: 'Paid journal request',
	},
].map((application) => ({ ...application, applicationDate: '2026-11-04' }));

const registeredFileNumbers: Record<string, string> = {
	'trademark-file': 'F/TM/2026/123',
	'patent-file': 'F/PT/NC/O/2026/456',
	'design-file': 'F/DS/2026/789',
};

test.beforeEach(async ({ context, page, baseURL }) => {
	await context.addCookies([
		{
			name: 'user',
			value: encodeURIComponent(
				JSON.stringify({
					id: 'payment-test-user',
					creatorId: 'payment-test-user',
					firstName: 'Payment',
					lastName: 'Test',
					name: 'Payment Test',
					email: 'payment@example.test',
					userRoles: [0],
					accountType: 0,
				}),
			),
			url: baseURL ?? 'http://localhost:4173',
		},
	]);
	await context.addInitScript(() => {
		localStorage.setItem(
			'cookie_consent',
			JSON.stringify({ value: 'rejected', timestamp: Date.now() }),
		);
	});
	await page.route('**/api/**', async (route) => {
		const url = new URL(route.request().url());
		let body: unknown = {};
		if (url.pathname.endsWith('/GetOtherApplications'))
			body = pendingApplications;
		else if (url.pathname.endsWith('/loadSummary')) {
			body = {
				data: [
					{
						id: 'opposition-app',
						title: 'Opposition',
						status: 2,
						paymentId: '666666666666',
					},
				],
				count: 1,
			};
		} else if (url.pathname.endsWith('/GetRRRCost')) body = { cost: 1200 };
		else if (registeredFileNumbers[url.pathname.split('/').at(-1) ?? '']) {
			const id = url.pathname.split('/').at(-1)!;
			body = { id, fileId: registeredFileNumbers[id] };
		} else if (url.pathname.endsWith('/check'))
			body = { status: '00', amount: 1200 };
		await route.fulfill({
			status: 200,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': '*',
			},
			contentType: 'application/json',
			body: JSON.stringify(body),
		});
	});
});

for (const application of pendingApplications.filter(
	(item) => item.currentStatus === 2,
)) {
	test(`completes ${application.title} with its existing RRR`, async ({
		page,
		baseURL,
	}) => {
		await page.goto(
			`${baseURL ?? 'http://localhost:4173'}/home/other-applications/?tab=other`,
		);
		await page
			.getByRole('row')
			.filter({ hasText: application.paymentId })
			.getByRole('button')
			.click();
		await page
			.getByRole('menuitem', { name: 'Complete Payment', exact: true })
			.click();
		await expect(
			page.getByRole('button', { name: 'Pay with Remita' }),
		).toBeVisible();
		await expect(page.locator('input[name="rrr"]')).toHaveValue(
			application.paymentId,
		);
		const responseUrl = new URL(
			await page.locator('input[name="responseurl"]').inputValue(),
		);
		expect(responseUrl.pathname).toBe('/payment/complete');
		expect(responseUrl.searchParams.get('appId')).toBe(application.id);
		expect(responseUrl.searchParams.get('rrr')).toBe(application.paymentId);
		if ('fileId' in application && application.fileId) {
			await expect(
				page.getByText(registeredFileNumbers[application.fileId], {
					exact: true,
				}),
			).toBeVisible();
			await expect(
				page.getByText(application.fileId, { exact: true }),
			).toHaveCount(0);
			expect(responseUrl.searchParams.get('fileId')).toBe(application.fileId);
		} else {
			await expect(page.getByText('File Number', { exact: true })).toHaveCount(
				0,
			);
		}
		expect(await page.locator('form').getAttribute('action')).toContain(
			'remita.net',
		);
	});
}

test('resolves the file number when reopening an existing payment URL', async ({
	page,
	baseURL,
}) => {
	await page.goto(
		`${baseURL ?? 'http://localhost:4173'}/payment/?type=resume&appId=patent-app&applicationType=5&fileId=patent-file&rrr=222222222222`,
	);
	await expect(
		page.getByText(registeredFileNumbers['patent-file'], { exact: true }),
	).toBeVisible();
	await expect(
		page.getByRole('button', { name: 'Pay with Remita' }),
	).toBeVisible();
	const responseUrl = new URL(
		await page.locator('input[name="responseurl"]').inputValue(),
	);
	expect(responseUrl.searchParams.get('fileId')).toBe('patent-file');
});

test('does not offer Complete Payment for a paid application', async ({
	page,
	baseURL,
}) => {
	await page.goto(
		`${baseURL ?? 'http://localhost:4173'}/home/other-applications/?tab=other`,
	);
	await page
		.getByRole('row')
		.filter({ hasText: '555555555555' })
		.getByRole('button')
		.click();
	await expect(
		page.getByRole('menuitem', { name: 'Journal Request Acknowledgement' }),
	).toBeVisible();
	await expect(
		page.getByRole('menuitem', { name: 'Complete Payment', exact: true }),
	).toHaveCount(0);
});

test('offers payment completion for an unpaid opposition', async ({
	page,
	baseURL,
}) => {
	await page.goto(
		`${baseURL ?? 'http://localhost:4173'}/home/other-applications/?tab=oppositions`,
	);
	await page
		.getByRole('row')
		.filter({ hasText: '666666666666' })
		.getByRole('button')
		.click();
	await page
		.getByRole('menuitem', { name: 'Complete Payment', exact: true })
		.click();
	await expect(page.locator('input[name="rrr"]')).toHaveValue('666666666666');
	await expect(
		page.getByRole('button', { name: 'Pay with Remita' }),
	).toBeVisible();
});

test('preserves authenticated opposition printing after merging payment actions', async ({
	page,
	context,
	baseURL,
}) => {
	await context.addCookies([
		{
			name: 'auth_token',
			value: 'test-payment-print-token',
			url: baseURL ?? 'http://localhost:4173',
		},
	]);
	await page.route('**/api/opposition/loadSummary?*', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			headers: { 'Access-Control-Allow-Origin': '*' },
			body: JSON.stringify({
				data: [
					{
						id: 'paid-opposition',
						title: 'Paid opposition',
						status: 30,
						paymentId: '777777777777',
					},
				],
				count: 1,
			}),
		}),
	);
	await page.route('**/api/letters/generate?*', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/pdf',
			headers: { 'Access-Control-Allow-Origin': '*' },
			body: '%PDF-1.4\n%%EOF',
		}),
	);
	await page.goto(
		`${baseURL ?? 'http://localhost:4173'}/home/other-applications/?tab=oppositions`,
	);
	await page
		.getByRole('row')
		.filter({ hasText: '777777777777' })
		.getByRole('button')
		.click();
	await expect(
		page.getByRole('menuitem', { name: 'Complete Payment', exact: true }),
	).toHaveCount(0);
	const requestPromise = page.waitForRequest(
		(request) => new URL(request.url()).pathname === '/api/letters/generate',
	);
	await page
		.getByRole('menuitem', {
			name: 'Opposition Acknowledgement Letter',
			exact: true,
		})
		.click();
	const request = await requestPromise;
	expect(request.headers().authorization).toBe(
		'Bearer test-payment-print-token',
	);
	const params = new URL(request.url()).searchParams;
	expect(params.get('oppositionId')).toBe('paid-opposition');
	expect(params.get('letterType')).toBe('16');
});

test('preserves opposition withdrawal confirmation when resuming payment', async ({
	page,
	baseURL,
}) => {
	await page.goto(
		`${baseURL ?? 'http://localhost:4173'}/home/opposition/?tab=withdrawal`,
	);
	await page
		.getByRole('row')
		.filter({ hasText: '666666666666' })
		.getByRole('button', { name: 'More payment actions' })
		.click();
	await page
		.getByRole('menuitem', { name: 'Complete Payment', exact: true })
		.click();
	await expect(
		page.getByRole('button', { name: 'Pay with Remita' }),
	).toBeVisible();
	const responseUrl = new URL(
		await page.locator('input[name="responseurl"]').inputValue(),
	);
	expect(responseUrl.searchParams.get('oppositionWithdrawal')).toBe('1');
	expect(responseUrl.searchParams.get('rrr')).toBe('666666666666');
});

test('confirms an existing file application without browser form storage', async ({
	page,
	baseURL,
}) => {
	const update = page.waitForRequest(
		(request) => new URL(request.url()).pathname === '/api/files/ManualUpdate',
	);
	await page.goto(
		`${baseURL ?? 'http://localhost:4173'}/payment/complete/?appId=patent-app&applicationType=5&fileId=patent-file&rrr=222222222222`,
	);
	await expect(
		page.getByRole('heading', { name: 'Payment Successful', exact: true }),
	).toBeVisible();
	const request = await update;
	expect(request.method()).toBe('POST');
	expect(new URL(request.url()).searchParams.get('applicationId')).toBe(
		'patent-app',
	);
	await expect(
		page.getByRole('button', { name: 'View Application' }),
	).toBeVisible();
});

test('keeps unpaid confirmation pending and supports retry after Remita confirms', async ({
	page,
	baseURL,
}) => {
	let confirmed = false;
	let updates = 0;
	await page.route('**/api/payments/check?*', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			headers: { 'Access-Control-Allow-Origin': '*' },
			body: JSON.stringify({ status: confirmed ? '00' : '021' }),
		}),
	);
	await page.route('**/api/files/ManualUpdate?*', (route) => {
		updates++;
		return route.fulfill({
			status: 204,
			headers: { 'Access-Control-Allow-Origin': '*' },
		});
	});
	await page.goto(
		`${baseURL ?? 'http://localhost:4173'}/payment/complete/?appId=design-app&applicationType=19&fileId=design-file&rrr=333333333333`,
	);
	await expect(
		page.getByRole('heading', { name: 'Payment Not Confirmed' }),
	).toBeVisible();
	expect(updates).toBe(0);
	confirmed = true;
	await page.getByRole('button', { name: 'Retry Confirmation' }).click();
	await expect(
		page.getByRole('heading', { name: 'Payment Successful', exact: true }),
	).toBeVisible();
	expect(updates).toBe(1);
});

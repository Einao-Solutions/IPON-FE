import { expect, test, type Page } from '@playwright/test';

const roles = [
	{ id: 1, name: 'Staff' },
	{ id: 21, name: 'SuperAdmin' },
	{ id: 71, name: 'External Reviewer' },
];
const member = {
	id: 'recipient',
	name: 'Mary Member',
	email: 'mary@example.test',
	phoneNumber: '+234123456789',
	isVerified: true,
	userRoles: [1],
};
const actor = {
	id: 'actor',
	name: 'Role Assigner',
	email: 'assigner@example.test',
	assignmentCount: 47,
	lastAssignedAt: '2026-03-01T10:00:00Z',
};
const entry = {
	id: 'history-entry',
	assignedById: actor.id,
	assignedByName: 'Historical Assigner',
	assignedByEmail: 'old-assigner@example.test',
	assignedToId: member.id,
	assignedToName: member.name,
	assignedToEmail: member.email,
	role: 71,
	action: 'Removed',
	occurredAt: '2026-03-01T10:00:00Z',
};

async function setup(page: Page, baseURL: string, userRoles = [21]) {
	await page.context().addCookies([
		{ name: 'auth_token', value: 'test-token', url: baseURL },
		{
			name: 'user',
			value: encodeURIComponent(
				JSON.stringify({
					id: 'super-admin',
					creatorId: 'super-admin',
					firstName: 'Admin',
					lastName: 'Test',
					name: 'Admin Test',
					email: 'admin@example.test',
					userRoles,
					accountType: 2,
				}),
			),
			url: baseURL,
		},
	]);
	await page.context().addInitScript(() => {
		localStorage.setItem(
			'cookie_consent',
			JSON.stringify({ value: 'rejected', timestamp: Date.now() }),
		);
	});
	await page.route('**/api/**', async (route) => {
		const request = route.request();
		const url = new URL(request.url());
		const skip = Number(url.searchParams.get('skip') ?? 0);
		const take = Number(url.searchParams.get('take') ?? 20);
		let body: unknown = {};
		if (url.pathname === '/api/users/roles') body = roles;
		else if (/\/roles\/\d+\/users$/.test(url.pathname)) {
			body = { items: [member], totalCount: 45, skip, take };
		} else if (url.pathname === '/api/users/GetAllUsers')
			body = { users: [member], totalCount: 1 };
		else if (url.pathname === '/api/users/GetUserById') body = member;
		else if (url.pathname === '/api/users/role-assigners')
			body = { items: [actor], totalCount: 47, skip, take };
		else if (url.pathname === '/api/users/role-assignment-history')
			body = { items: [entry], totalCount: 45, skip, take };
		else if (url.pathname.endsWith('/GetNotifications')) body = [];
		else if (url.pathname.endsWith('/UnreadCount')) body = { unreadCount: 0 };
		await route.fulfill({
			status: request.method() === 'OPTIONS' ? 204 : 200,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': '*',
				'Access-Control-Allow-Methods': '*',
			},
			contentType: 'application/json',
			body: request.method() === 'OPTIONS' ? '' : JSON.stringify(body),
		});
	});
	await page.goto(`${baseURL}/home/users`, { waitUntil: 'domcontentloaded' });
}

test('all user views default to 10 and allow server-side page sizes of 20, 50 and 100', async ({
	page,
	baseURL,
}) => {
	const directoryRequests: { skip: number; take: number }[] = [];
	page.on('request', (request) => {
		if (request.method() === 'POST' && request.url().endsWith('/GetAllUsers')) {
			directoryRequests.push(request.postDataJSON());
		}
	});
	await setup(page, baseURL!);
	await expect(
		page.getByRole('button', { name: '10 per page', exact: true }),
	).toBeVisible();
	expect(directoryRequests[0]).toMatchObject({ skip: 0, take: 10 });
	for (const [index, size] of [20, 50, 100].entries()) {
		const previousSize = [10, 20, 50][index];
		await page
			.getByRole('button', { name: `${previousSize} per page`, exact: true })
			.click();
		const changed = page.waitForRequest(
			(request) =>
				request.method() === 'POST' &&
				request.url().endsWith('/GetAllUsers') &&
				request.postDataJSON().take === size,
		);
		await page
			.getByRole('menuitem', { name: String(size), exact: true })
			.click();
		expect((await changed).postDataJSON()).toMatchObject({
			skip: 0,
			take: size,
		});
		await expect(
			page.getByRole('button', { name: `${size} per page`, exact: true }),
		).toBeVisible();
	}

	for (const view of [
		{ button: 'Users by Role', endpoint: '/roles/1/users' },
		{ button: 'Role Assignment Activity', endpoint: '/role-assigners' },
		{ button: 'All Activity', endpoint: '/role-assignment-history' },
	]) {
		const initial = page.waitForRequest((request) => {
			const url = new URL(request.url());
			return (
				url.pathname.endsWith(view.endpoint) &&
				url.searchParams.get('take') === '10'
			);
		});
		await page.getByRole('button', { name: view.button, exact: true }).click();
		expect(new URL((await initial).url()).searchParams.get('skip')).toBe('0');
		const selector = page.getByRole('combobox', {
			name: 'Per page',
			exact: true,
		});
		await expect(selector).toHaveValue('10');
		const secondPage = page.waitForRequest((request) => {
			const url = new URL(request.url());
			return (
				url.pathname.endsWith(view.endpoint) &&
				url.searchParams.get('skip') === '10'
			);
		});
		await page.getByRole('button', { name: 'Page 2', exact: true }).click();
		await secondPage;
		for (const size of [20, 50, 100]) {
			const changed = page.waitForRequest((request) => {
				const url = new URL(request.url());
				return (
					url.pathname.endsWith(view.endpoint) &&
					url.searchParams.get('take') === String(size)
				);
			});
			await selector.selectOption(String(size));
			expect(new URL((await changed).url()).searchParams.get('skip')).toBe('0');
			await expect(selector).toHaveValue(String(size));
		}
	}
});

test('role members use the catalogue, server search, pagination and verification labels', async ({
	page,
	baseURL,
}) => {
	await setup(page, baseURL!);
	await page
		.getByRole('button', { name: 'Users by Role', exact: true })
		.click();
	const section = page.getByRole('region', {
		name: 'Users by Role',
		exact: true,
	});
	await expect(section.getByText('Verified', { exact: true })).toBeVisible();
	await expect(section.getByText(member.phoneNumber)).toBeVisible();
	await expect(section.getByText('Active', { exact: true })).toHaveCount(0);
	await section
		.getByRole('combobox', { name: 'Role', exact: true })
		.selectOption('71');
	await expect(
		section.getByRole('combobox', { name: 'Role', exact: true }),
	).toHaveValue('71');
	const numberedPage = page.waitForRequest((request) => {
		const url = new URL(request.url());
		return (
			url.pathname.endsWith('/roles/71/users') &&
			url.searchParams.get('skip') === '40'
		);
	});
	await section.getByRole('button', { name: 'Page 5', exact: true }).click();
	await numberedPage;
	await expect(
		section.getByText('Page 5 of 5', { exact: false }),
	).toBeVisible();
	await expect(
		section.getByRole('button', { name: 'Page 5', exact: true }),
	).toHaveAttribute('aria-current', 'page');
	await expect(
		section.getByRole('button', { name: 'Next', exact: true }),
	).toBeDisabled();
	await expect(
		section.getByRole('button', { name: 'Page 6', exact: true }),
	).toHaveCount(0);
	const searched = page.waitForRequest((request) => {
		const url = new URL(request.url());
		return (
			url.pathname.endsWith('/roles/71/users') &&
			url.searchParams.get('search') === 'mary & jo'
		);
	});
	await section.getByLabel('Search members').fill('mary & jo');
	const request = await searched;
	expect(new URL(request.url()).searchParams.get('skip')).toBe('0');
	expect(request.headers().authorization).toBe('Bearer test-token');
	await expect(
		section.getByText('Page 1 of 5', { exact: false }),
	).toBeVisible();
	await expect(
		section.getByRole('button', { name: 'Page 1', exact: true }),
	).toHaveAttribute('aria-current', 'page');
	await expect(
		section.getByRole('button', { name: 'Previous', exact: true }),
	).toBeDisabled();
});

test('assigner detail keeps its actor while filtering and paging; all history includes removals', async ({
	page,
	baseURL,
}) => {
	await setup(page, baseURL!);
	await page
		.getByRole('button', { name: 'Role Assignment Activity', exact: true })
		.click();
	const section = page.getByRole('region', {
		name: 'Role Assignment Activity',
		exact: true,
	});
	await expect(
		section.getByRole('cell', { name: '47', exact: true }),
	).toBeVisible();
	const assignerPage = page.waitForRequest((request) => {
		const url = new URL(request.url());
		return (
			url.pathname.endsWith('/role-assigners') &&
			url.searchParams.get('skip') === '10'
		);
	});
	await section.getByRole('button', { name: 'Page 2', exact: true }).click();
	await assignerPage;
	await expect(
		section.getByText('Page 2 of 5', { exact: false }),
	).toBeVisible();
	await section
		.getByRole('button', { name: 'View Activity', exact: true })
		.click();
	await expect(
		section.getByRole('heading', { name: 'Activity by Role Assigner' }),
	).toBeVisible();
	await expect(section.locator('.users-assigner-card')).toContainText(
		actor.email,
	);
	await expect(section.locator('.users-assigner-card')).not.toContainText(
		actor.id,
	);
	await expect(section.getByLabel('Changed by (user ID)')).toHaveCount(0);
	await expect(section.getByLabel('Recipient (user ID)')).toHaveCount(0);
	await expect(
		section.getByRole('cell', { name: 'External Reviewer', exact: true }),
	).toBeVisible();
	await expect(
		section.getByRole('cell', { name: 'Removed', exact: true }),
	).toBeVisible();
	await expect(
		section.getByText('Historical Assigner', { exact: true }),
	).toBeVisible();
	await section.getByLabel('Search activity').fill('mary');
	await section
		.getByRole('combobox', { name: 'Action', exact: true })
		.selectOption('Removed');
	await section
		.getByRole('combobox', { name: 'Role', exact: true })
		.selectOption('71');
	await section
		.getByLabel('From (local time, inclusive)')
		.fill('2026-03-01T00:00');
	await section.getByLabel('From (local time, inclusive)').press('Tab');
	await expect(
		section.getByRole('button', { name: 'Next', exact: true }),
	).toBeEnabled();
	const paged = page.waitForRequest((request) => {
		const url = new URL(request.url());
		return (
			url.pathname.endsWith('/role-assignment-history') &&
			url.searchParams.get('skip') === '10'
		);
	});
	await section.getByRole('button', { name: 'Page 2', exact: true }).click();
	const url = new URL((await paged).url());
	expect(url.searchParams.get('assignedById')).toBe('actor');
	expect(url.searchParams.has('assignedToId')).toBe(false);
	expect(url.searchParams.get('search')).toBe('mary');
	expect(url.searchParams.get('action')).toBe('Removed');
	expect(url.searchParams.get('role')).toBe('71');
	expect(url.searchParams.get('from')).toMatch(/Z$/);
	const all = page.waitForRequest((request) => {
		const requestUrl = new URL(request.url());
		return (
			requestUrl.pathname.endsWith('/role-assignment-history') &&
			!requestUrl.searchParams.has('assignedById')
		);
	});
	await section
		.getByRole('button', { name: 'All Activity', exact: true })
		.click();
	const allUrl = new URL((await all).url());
	expect(allUrl.searchParams.has('assignedToId')).toBe(false);
	await expect(section.getByLabel('Changed by (user ID)')).toHaveCount(0);
	await expect(section.getByLabel('Recipient (user ID)')).toHaveCount(0);
	await section
		.getByLabel('From (local time, inclusive)')
		.fill('2026-04-02T00:00');
	await section
		.getByLabel('To (local time, inclusive)')
		.fill('2026-04-01T00:00');
	await section.getByLabel('To (local time, inclusive)').press('Tab');
	await expect(section.getByRole('alert')).toContainText(
		'Start date must be before or equal to end date',
	);
});

test('role updates preserve failed selections, submit real changes, and refetch members and activity', async ({
	page,
	baseURL,
}) => {
	await setup(page, baseURL!);
	let attempts = 0;
	let membershipReads = 0;
	const updates: unknown[] = [];
	await page.route('**/api/users/roles/1/users?*', async (route) => {
		membershipReads++;
		await route.fulfill({
			json: {
				items: [{ ...member, userRoles: attempts >= 2 ? [1, 71] : [1] }],
				totalCount: 1,
				skip: 0,
				take: 20,
			},
		});
	});
	await page.route('**/api/users/UpdateUserRoles', async (route) => {
		if (route.request().method() === 'OPTIONS') {
			await route.fulfill({
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': '*',
					'Access-Control-Allow-Methods': '*',
				},
			});
			return;
		}
		attempts++;
		updates.push(route.request().postDataJSON());
		await route.fulfill({
			status: attempts === 1 ? 503 : 200,
			headers: { 'Access-Control-Allow-Origin': '*' },
			json:
				attempts === 1
					? { message: 'Audit service temporarily unavailable.' }
					: {},
		});
	});
	await page
		.getByRole('button', { name: 'Users by Role', exact: true })
		.click();
	const section = page.getByRole('region', {
		name: 'Users by Role',
		exact: true,
	});
	await section.getByRole('button', { name: 'View', exact: true }).click();
	const panel = page.getByRole('dialog');
	await expect(
		panel.getByRole('button', { name: 'Update User', exact: true }),
	).toBeDisabled();
	await panel
		.getByRole('button', { name: 'External Reviewer', exact: true })
		.click();
	await panel.getByRole('button', { name: 'Update User', exact: true }).click();
	await expect(panel.getByRole('alert')).toContainText(
		'Audit service temporarily unavailable.',
	);
	await expect(
		panel.getByRole('button', { name: 'External Reviewer', exact: true }),
	).toHaveAttribute('aria-pressed', 'true');
	await panel
		.getByRole('button', { name: 'Retry update', exact: true })
		.click();
	await expect(
		panel.getByRole('button', { name: 'Update User', exact: true }),
	).toBeDisabled();
	expect(updates).toEqual([
		{ userId: 'recipient', addRoles: [71], removeRoles: [] },
		{ userId: 'recipient', addRoles: [71], removeRoles: [] },
	]);
	await panel.getByRole('button', { name: 'Close', exact: true }).click();
	await expect(
		section.getByRole('table').getByText('External Reviewer', { exact: true }),
	).toBeVisible();
	expect(membershipReads).toBe(2);
	await page
		.getByRole('button', { name: 'Role Assignment Activity', exact: true })
		.click();
	await page
		.getByRole('button', { name: 'View Activity', exact: true })
		.click();
	await page
		.getByRole('button', { name: 'Users by Role', exact: true })
		.click();
	await page.getByRole('button', { name: 'View', exact: true }).click();
	await page
		.getByRole('dialog')
		.getByRole('button', { name: 'External Reviewer', exact: true })
		.click();
	await page
		.getByRole('dialog')
		.getByRole('button', { name: 'Update User', exact: true })
		.click();
	await page
		.getByRole('dialog')
		.getByRole('button', { name: 'Close', exact: true })
		.click();
	const historyRead = page.waitForRequest('**/api/users/role-assigners?*');
	await page
		.getByRole('button', { name: 'Role Assignment Activity', exact: true })
		.click();
	await historyRead;
});

test('existing All Users editor uses catalogue IDs and preserves its original roles on update errors', async ({
	page,
	baseURL,
}) => {
	await setup(page, baseURL!);
	await page.route('**/api/users/UpdateUserRoles', async (route) => {
		if (route.request().method() === 'OPTIONS') {
			await route.fulfill({
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': '*',
					'Access-Control-Allow-Methods': '*',
				},
			});
			return;
		}
		await route.fulfill({
			status: 404,
			headers: { 'Access-Control-Allow-Origin': '*' },
			json: {},
		});
	});
	await page.getByRole('button', { name: 'View', exact: true }).click();
	const panel = page.getByRole('dialog');
	await expect(panel).not.toContainText(member.id);
	await expect(panel).toContainText(member.email);
	await panel
		.getByRole('button', { name: 'External Reviewer', exact: true })
		.click();
	await panel.getByRole('button', { name: 'Update User', exact: true }).click();
	await expect(panel.getByRole('alert')).toContainText(
		'recipient no longer exists',
	);
	await expect(
		panel.getByText('External Reviewer', { exact: true }),
	).toHaveCount(1);
	await expect(
		panel.getByRole('button', { name: 'Update User', exact: true }),
	).toBeEnabled();
});

for (const roles of [[0], [1], [17], []]) {
	test(`Users redirects non-SuperAdmin roles ${JSON.stringify(roles)} before fetching users`, async ({
		page,
		baseURL,
	}) => {
		const requests: string[] = [];
		page.on('request', (request) => {
			if (
				new URL(request.url()).pathname.toLowerCase().startsWith('/api/users/')
			) {
				requests.push(request.url());
			}
		});
		await setup(page, baseURL!, roles);
		await expect(page).toHaveURL(/\/home\/dashboard\/?$/);
		await expect(page.locator('.user-management')).toHaveCount(0);
		expect(requests).toEqual([]);
		await page.goto(`${baseURL}/home/users/activity`);
		await expect(page).toHaveURL(/\/home\/dashboard\/?$/);
		expect(requests).toEqual([]);
	});
}

test('signed-out Users requests go to login without fetching users', async ({
	page,
	baseURL,
}) => {
	await setup(page, baseURL!);
	await page.context().clearCookies();
	const requests: string[] = [];
	page.on('request', (request) => {
		if (
			new URL(request.url()).pathname.toLowerCase().startsWith('/api/users/')
		) {
			requests.push(request.url());
		}
	});
	await page.goto(`${baseURL}/home/users`);
	await expect(page).toHaveURL(/\/auth\/?$/);
	await expect(page.locator('.user-management')).toHaveCount(0);
	expect(requests).toEqual([]);
});

test('role member failures offer retry, empty results are explicit, and 403 shows access denied', async ({
	page,
	baseURL,
}) => {
	await setup(page, baseURL!);
	let state: 'network' | 'empty' | 'denied' = 'network';
	await page.route('**/api/users/roles/*/users?*', async (route) => {
		if (state === 'network') {
			await route.abort();
			return;
		}
		await route.fulfill({
			status: state === 'denied' ? 403 : 200,
			headers: { 'Access-Control-Allow-Origin': '*' },
			json: { items: [], totalCount: 0, skip: 0, take: 20 },
		});
	});
	await page
		.getByRole('button', { name: 'Users by Role', exact: true })
		.click();
	const section = page.getByRole('region', {
		name: 'Users by Role',
		exact: true,
	});
	await expect(section.getByRole('alert')).toContainText(
		'Unable to reach the server',
	);
	state = 'empty';
	await section.getByRole('button', { name: 'Retry', exact: true }).click();
	await expect(
		section.getByText('No users match this role and search.'),
	).toBeVisible();
	state = 'denied';
	await section
		.getByRole('combobox', { name: 'Role', exact: true })
		.selectOption('71');
	await expect(section.getByRole('alert')).toContainText(
		'Access denied. SuperAdmin access is required.',
	);
});

test('a save completed after closing its editor refreshes an already open activity query', async ({
	page,
	baseURL,
}) => {
	await setup(page, baseURL!);
	let releaseUpdate!: () => void;
	const updateGate = new Promise<void>((resolve) => {
		releaseUpdate = resolve;
	});
	let updated = false;
	await page.route('**/api/users/UpdateUserRoles', async (route) => {
		if (route.request().method() === 'OPTIONS') {
			await route.fulfill({
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': '*',
					'Access-Control-Allow-Methods': '*',
				},
			});
			return;
		}
		await updateGate;
		await route.fulfill({
			status: 200,
			headers: { 'Access-Control-Allow-Origin': '*' },
			json: {},
		});
	});
	await page.route('**/api/users/role-assigners?*', async (route) => {
		await route.fulfill({
			headers: { 'Access-Control-Allow-Origin': '*' },
			json: {
				items: [{ ...actor, assignmentCount: updated ? 48 : 47 }],
				totalCount: 1,
				skip: 0,
				take: 20,
			},
		});
	});
	await page.getByRole('button', { name: 'View', exact: true }).click();
	const panel = page.getByRole('dialog');
	await panel
		.getByRole('button', { name: 'External Reviewer', exact: true })
		.click();
	const put = page.waitForRequest(
		(request) =>
			request.method() === 'PUT' && request.url().endsWith('/UpdateUserRoles'),
	);
	await panel.getByRole('button', { name: 'Update User', exact: true }).click();
	await put;
	await panel.getByRole('button', { name: 'Close', exact: true }).click();
	await page
		.getByRole('button', { name: 'Role Assignment Activity', exact: true })
		.click();
	const activity = page.getByRole('region', {
		name: 'Role Assignment Activity',
		exact: true,
	});
	await expect(
		activity.getByRole('cell', { name: '47', exact: true }),
	).toBeVisible();
	updated = true;
	const refreshed = page.waitForRequest('**/api/users/role-assigners?*');
	releaseUpdate();
	await refreshed;
	await expect(
		activity.getByRole('cell', { name: '48', exact: true }),
	).toBeVisible();
});

for (const viewport of [
	{ width: 1440, height: 1000 },
	{ width: 390, height: 844 },
]) {
	test(`user management stays aligned at ${viewport.width}px`, async ({
		page,
		baseURL,
	}, testInfo) => {
		await page.setViewportSize(viewport);
		await setup(page, baseURL!);
		await expect(
			page.getByRole('heading', { name: 'User Management', exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole('heading', { name: 'User Directory', exact: true }),
		).toBeVisible();
		const module = page.locator('.user-management');
		const expectWithinViewport = async () => {
			const bounds = await module.boundingBox();
			expect(bounds).not.toBeNull();
			expect(bounds!.x).toBeGreaterThanOrEqual(0);
			expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
			expect(
				await module.evaluate(
					(element) => element.scrollWidth <= element.clientWidth + 1,
				),
			).toBe(true);
		};
		await expectWithinViewport();
		await page.screenshot({
			path: testInfo.outputPath('directory.png'),
			fullPage: true,
		});

		await page
			.getByRole('button', { name: 'Users by Role', exact: true })
			.click();
		await expect(
			page.getByRole('cell', { name: 'Verified', exact: true }),
		).toBeVisible();
		await expectWithinViewport();
		await page.screenshot({
			path: testInfo.outputPath('members.png'),
			fullPage: true,
		});
		await page.getByRole('button', { name: 'View', exact: true }).click();
		const dialog = page.getByRole('dialog');
		await expect(
			dialog.getByRole('button', { name: 'External Reviewer', exact: true }),
		).toBeVisible();
		await expect
			.poll(async () => {
				const bounds = await dialog.boundingBox();
				return (
					bounds !== null &&
					bounds.x >= -1 &&
					bounds.x + bounds.width <= viewport.width + 1
				);
			})
			.toBe(true);
		const dialogFits = await dialog.evaluate(
			(element) => element.scrollWidth <= element.clientWidth + 1,
		);
		expect(dialogFits).toBe(true);
		await page.screenshot({
			path: testInfo.outputPath('editor.png'),
			fullPage: true,
		});
		await dialog.getByRole('button', { name: 'Close', exact: true }).click();

		await page
			.getByRole('button', { name: 'Role Assignment Activity', exact: true })
			.click();
		await expect(
			page.getByRole('button', { name: 'View Activity', exact: true }),
		).toBeVisible();
		await expectWithinViewport();
		await page.screenshot({
			path: testInfo.outputPath('assigners.png'),
			fullPage: true,
		});
		await page
			.getByRole('button', { name: 'View Activity', exact: true })
			.click();
		await expect(
			page.getByRole('cell', { name: 'Removed', exact: true }),
		).toBeVisible();
		await expectWithinViewport();
		await page.screenshot({
			path: testInfo.outputPath('history.png'),
			fullPage: true,
		});
	});
}

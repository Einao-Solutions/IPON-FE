import { expect, test, type Page } from '@playwright/test';

const types = [
	{ id: 0, name: 'Individual' },
	{ id: 1, name: 'Corporate' },
	{ id: 2, name: 'Officer' },
	{ id: 3, name: 'Tech' },
	{ id: 8, name: 'API-defined type' },
];
const member = {
	id: 'recipient',
	name: 'Mary Member',
	email: 'mary@example.test',
	phoneNumber: null,
	isVerified: true,
	userRoles: [1],
};

async function setup(
	page: Page,
	baseURL: string,
	initialType: number | null = null,
	roles = [21],
) {
	const state = {
		accountType: initialType,
		typesStatus: 200,
		readStatus: 200,
		putStatus: 200,
		changed: true,
		commitOnError: false,
		delaySave: false,
		networkFailure: false,
		saves: [] as { accountType: number }[],
		roleUpdates: 0,
		directoryReads: 0,
		memberReads: 0,
		currentReads: 0,
		accountRequests: 0,
	};
	await page.context().addCookies([
		{ name: 'auth_token', value: 'account-test-token', url: baseURL },
		{
			name: 'user',
			value: encodeURIComponent(
				JSON.stringify({
					id: 'admin',
					creatorId: 'admin',
					firstName: 'Admin',
					lastName: 'Test',
					email: 'admin@example.test',
					userRoles: roles,
					accountType: 2,
				}),
			),
			url: baseURL,
		},
	]);
	await page.addInitScript(() => {
		localStorage.setItem(
			'cookie_consent',
			JSON.stringify({ value: 'rejected', timestamp: Date.now() }),
		);
	});
	await page.route('**/api/**', async (route) => {
		const request = route.request();
		if (request.method() === 'OPTIONS') {
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
		const path = new URL(request.url()).pathname;
		let status = 200;
		let body: unknown = {};
		const current = () => ({
			userId: member.id,
			accountType: state.accountType,
			accountTypeName:
				types.find((type) => type.id === state.accountType)?.name ?? null,
		});
		if (path === '/api/users/roles')
			body = [
				{ id: 1, name: 'Staff' },
				{ id: 21, name: 'SuperAdmin' },
			];
		else if (path === '/api/users/GetAllUsers') {
			state.directoryReads++;
			body = { users: [member], totalCount: 1 };
		} else if (path === '/api/users/GetUserById')
			body = { ...member, accountType: state.accountType };
		else if (/\/roles\/\d+\/users$/.test(path)) {
			state.memberReads++;
			body = { items: [member], totalCount: 1, skip: 0, take: 10 };
		} else if (path === '/api/users/account-types') {
			state.accountRequests++;
			status = state.typesStatus;
			body = types;
		} else if (path === '/api/users/recipient/account-type') {
			state.accountRequests++;
			if (request.method() === 'PUT') {
				state.saves.push(request.postDataJSON());
				expect(request.headers().authorization).toBe(
					'Bearer account-test-token',
				);
				expect(request.headers()['content-type']).toBe('application/json');
				if (state.delaySave)
					await new Promise((resolve) => setTimeout(resolve, 1500));
				status = state.putStatus;
				if (status === 200 || state.commitOnError)
					state.accountType = request.postDataJSON().accountType;
				if (status === 409) state.accountType = 3;
				if (state.networkFailure) {
					await route.abort('failed');
					return;
				}
				body = { ...current(), changed: state.changed };
			} else {
				state.currentReads++;
				status = state.readStatus;
				body = current();
			}
		} else if (path.endsWith('/UpdateUserRoles')) state.roleUpdates++;
		else if (path.endsWith('/GetNotifications')) body = [];
		else if (path.endsWith('/UnreadCount')) body = { unreadCount: 0 };
		if (status >= 400)
			body =
				status === 400
					? { errors: { accountType: ['This account type is not permitted.'] } }
					: { message: `Account request failed (${status}).` };
		await route.fulfill({
			status,
			contentType: 'application/json',
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': '*',
				'Access-Control-Allow-Methods': '*',
			},
			body: JSON.stringify(body),
		});
	});
	await page.goto(`${baseURL}/home/users`, { waitUntil: 'domcontentloaded' });
	return state;
}

async function openEditor(page: Page) {
	await page
		.getByRole('row')
		.filter({ hasText: member.email })
		.getByRole('button', { name: /View/ })
		.click();
	const editor = page.getByRole('region', { name: 'Edit account type' });
	await expect(editor).toBeVisible();
	return editor;
}

async function confirmSave(page: Page) {
	const editor = page.getByRole('region', { name: 'Edit account type' });
	await editor
		.getByRole('button', { name: 'Save account type', exact: true })
		.click();
	await page
		.getByRole('alertdialog')
		.getByRole('button', { name: 'Confirm account type change', exact: true })
		.click();
}

test('legacy null, catalogue options, confirmation, zero and role independence', async ({
	page,
	baseURL,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	const state = await setup(page, baseURL!);
	const editor = await openEditor(page);
	const select = editor.getByRole('combobox', {
		name: 'Account type',
		exact: true,
	});
	await expect(editor.getByText('Current account type: Not set')).toBeVisible();
	await expect(select).toHaveValue('');
	await expect
		.poll(async () => {
			const bounds = await editor.boundingBox();
			return bounds ? bounds.x + bounds.width : Infinity;
		})
		.toBeLessThanOrEqual(390);
	await expect(
		select.getByRole('option', { name: 'API-defined type', exact: true }),
	).toHaveCount(1);
	await expect(
		editor.getByRole('button', { name: 'Save account type', exact: true }),
	).toBeDisabled();
	await select.selectOption('0');
	await editor
		.getByRole('button', { name: 'Save account type', exact: true })
		.click();
	const confirmation = page.getByRole('alertdialog');
	await expect(confirmation).toContainText(
		"Change Mary Member's account type from Not set to Individual?",
	);
	await expect(confirmation).toContainText(
		'Existing roles will remain unchanged.',
	);
	expect(state.saves).toHaveLength(0);
	await confirmation
		.getByRole('button', { name: 'Cancel', exact: true })
		.click();
	expect(state.saves).toHaveLength(0);
	state.delaySave = true;
	await confirmSave(page);
	await expect(
		page
			.getByRole('alertdialog')
			.getByRole('button', { name: 'Saving...', exact: true }),
	).toBeDisabled();
	await expect(
		editor.getByText('Current account type: Individual'),
	).toBeVisible();
	await expect(
		editor.getByRole('button', { name: 'Save account type', exact: true }),
	).toBeDisabled();
	expect(state.saves).toEqual([{ accountType: 0 }]);
	expect(state.roleUpdates).toBe(0);
	await expect.poll(() => state.directoryReads).toBe(2);
});

test('role-member details support account updates and successful no-op responses', async ({
	page,
	baseURL,
}) => {
	const state = await setup(page, baseURL!, 1);
	state.changed = false;
	await page
		.getByRole('button', { name: 'Users by Role', exact: true })
		.click();
	const editor = await openEditor(page);
	await expect(
		editor.getByText('Current account type: Corporate'),
	).toBeVisible();
	await expect(
		editor.getByRole('button', { name: 'Save account type', exact: true }),
	).toBeDisabled();
	await editor.getByRole('combobox').selectOption('8');
	await confirmSave(page);
	await expect(
		editor.getByText('Current account type: API-defined type'),
	).toBeVisible();
	await expect(
		page.getByText('Account type is already up to date. No change was made.', {
			exact: true,
		}),
	).toBeVisible();
	await expect.poll(() => state.memberReads).toBe(2);
	expect(state.saves).toEqual([{ accountType: 8 }]);
	expect(state.roleUpdates).toBe(0);
});

test('409 reloads the latest type and requires review and fresh confirmation', async ({
	page,
	baseURL,
}) => {
	const state = await setup(page, baseURL!, 1);
	state.putStatus = 409;
	const editor = await openEditor(page);
	await editor.getByRole('combobox').selectOption('2');
	await confirmSave(page);
	await expect(editor.getByText('Current account type: Tech')).toBeVisible();
	await expect(editor.getByText(/Review the latest value/)).toBeVisible();
	await expect(
		editor.getByRole('button', { name: 'Save account type', exact: true }),
	).toBeDisabled();
	expect(state.currentReads).toBe(2);
	expect(state.saves).toHaveLength(1);
	state.putStatus = 200;
	await editor.getByRole('combobox').selectOption('2');
	await editor
		.getByRole('button', { name: 'Save account type', exact: true })
		.click();
	await expect(page.getByRole('alertdialog')).toContainText(
		'from Tech to Officer',
	);
	await page
		.getByRole('alertdialog')
		.getByRole('button', { name: 'Confirm account type change', exact: true })
		.click();
	await expect(editor.getByText('Current account type: Officer')).toBeVisible();
});

for (const failure of ['server', 'network']) {
	test(`ambiguous ${failure} save cannot be repeated before reloading current state`, async ({
		page,
		baseURL,
	}) => {
		const state = await setup(page, baseURL!, 1);
		state.putStatus = 500;
		state.networkFailure = failure === 'network';
		state.commitOnError = true;
		const editor = await openEditor(page);
		await editor.getByRole('combobox').selectOption('0');
		await confirmSave(page);
		await expect(
			editor.getByText(/The save may have reached the server/),
		).toBeVisible();
		await expect(
			editor.getByRole('button', { name: 'Save account type', exact: true }),
		).toBeDisabled();
		await editor
			.getByRole('button', { name: 'Reload current account type', exact: true })
			.click();
		await expect(
			editor.getByText('Current account type: Individual'),
		).toBeVisible();
		await expect(
			editor.getByRole('button', { name: 'Save account type', exact: true }),
		).toBeDisabled();
		expect(state.currentReads).toBe(2);
		expect(state.saves).toHaveLength(1);
	});
}

test('catalogue loading errors can be retried', async ({ page, baseURL }) => {
	const state = await setup(page, baseURL!);
	state.typesStatus = 500;
	const editor = await openEditor(page);
	await expect(editor.getByRole('alert')).toBeVisible();
	state.typesStatus = 200;
	await editor
		.getByRole('button', { name: 'Retry account type', exact: true })
		.click();
	await expect(editor.getByText('Current account type: Not set')).toBeVisible();
});

for (const status of [400, 403, 404]) {
	test(`save status ${status} is explicit and never calls role update`, async ({
		page,
		baseURL,
	}) => {
		const state = await setup(page, baseURL!, 1);
		state.putStatus = status;
		const editor = await openEditor(page);
		await editor.getByRole('combobox').selectOption('0');
		await confirmSave(page);
		const message =
			status === 400
				? 'This account type is not permitted.'
				: status === 403
					? 'Access denied. SuperAdmin access is required.'
					: 'User not found';
		await expect(editor.getByRole('alert')).toContainText(message);
		if (status !== 400)
			await expect(
				editor.getByRole('button', { name: 'Save account type', exact: true }),
			).toBeDisabled();
		if (status === 404) await expect.poll(() => state.directoryReads).toBe(2);
		expect(state.roleUpdates).toBe(0);
	});
}

test('401 follows existing authentication recovery', async ({
	page,
	baseURL,
}) => {
	const state = await setup(page, baseURL!, 1);
	const editor = await openEditor(page);
	state.putStatus = 401;
	await editor.getByRole('combobox').selectOption('0');
	await confirmSave(page);
	await expect(page).toHaveURL(/\/auth\/?$/);
});

test('non-SuperAdmin cannot open account editing or trigger its API requests', async ({
	page,
	baseURL,
}) => {
	const state = await setup(page, baseURL!, 1, [0]);
	await expect(page).toHaveURL(/\/home\/dashboard\/?$/);
	await expect(
		page.getByRole('region', { name: 'Edit account type' }),
	).toHaveCount(0);
	expect(state.accountRequests).toBe(0);
});

import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context, page, baseURL }) => {
	await context.addCookies([
		{
			name: 'user',
			value: encodeURIComponent(
				JSON.stringify({
					id: 'title-test-user',
					creatorId: 'title-test-user',
					firstName: 'Title',
					lastName: 'Test',
					name: 'Title Test',
					email: 'title@example.test',
					userRoles: [21],
					accountType: 2,
				}),
			),
			url: baseURL!,
		},
	]);
	await context.addInitScript(() => {
		localStorage.setItem(
			'cookie_consent',
			JSON.stringify({ value: 'rejected', timestamp: Date.now() }),
		);
	});
	await page.route('**/api/**', async (route) => {
		const path = new URL(route.request().url()).pathname;
		let body: unknown = {};
		if (path.endsWith('/GetAllUsers')) body = { users: [], totalCount: 0 };
		else if (path.endsWith('/roles') || path.endsWith('/GetNotifications'))
			body = [];
		else if (path.endsWith('/UnreadCount')) body = { unreadCount: 0 };
		await route.fulfill({
			contentType: 'application/json',
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': '*',
			},
			body: JSON.stringify(body),
		});
	});
});

for (const resource of [
	{ path: '/home/resources', title: 'Resources - IPON' },
	{ path: '/home/resources/design', title: 'Design Resources - IPON' },
]) {
	test(`clears ${resource.title} on sidebar navigation and restores it on browser back`, async ({
		page,
		baseURL,
	}) => {
		await page.goto(`${baseURL}${resource.path}`, {
			waitUntil: 'domcontentloaded',
		});
		await expect(page).toHaveTitle(resource.title);
		await page.getByRole('button', { name: 'Users', exact: true }).click();
		await expect(page).toHaveURL(/\/home\/users\/?$/);
		await expect(page).toHaveTitle('IPO Nigeria Portal');
		await page.goBack();
		await expect(page).toHaveTitle(resource.title);
		await page.goForward();
		await expect(page).toHaveTitle('IPO Nigeria Portal');
	});
}

test('preserves explicit titles during query-string and hash navigation', async ({
	page,
	baseURL,
}) => {
	await page.goto(`${baseURL}/home/resources`, {
		waitUntil: 'domcontentloaded',
	});
	await expect(page).toHaveTitle('Resources - IPON');
	for (const suffix of ['?titleTest=1', '?titleTest=1#title-test']) {
		await page.evaluate((suffix) => {
			const link = document.createElement('a');
			link.href = `/home/resources${suffix}`;
			link.textContent = 'Same page';
			document.body.appendChild(link);
			link.click();
			link.remove();
		}, suffix);
		await expect(page).toHaveURL(
			(url) =>
				url.pathname.replace(/\/$/, '') === '/home/resources' &&
				url.search + url.hash === suffix,
		);
		await expect(page).toHaveTitle('Resources - IPON');
	}
});

test('preserves Support Hub title and resets it when leaving for an untitled page', async ({
	page,
	baseURL,
}) => {
	await page.goto(`${baseURL}/home/users`, { waitUntil: 'domcontentloaded' });
	await expect(page).toHaveTitle('IPO Nigeria Portal');
	await page.getByRole('button', { name: 'Support Hub', exact: true }).click();
	await expect(page).toHaveTitle('Update Payment ID - Admin');
	await page.getByRole('button', { name: 'Users', exact: true }).click();
	await expect(page).toHaveTitle('IPO Nigeria Portal');
});

import { expect, test } from '@playwright/test';

for (const role of [0, 21]) {
	test(`single-bar search preserves authorized scope for role ${role}`, async ({
		context,
		page,
		baseURL,
	}) => {
		await context.addCookies([
			{
				name: 'user',
				value: encodeURIComponent(
					JSON.stringify({
						id: 'support-search-user',
						creatorId: 'support-search-user',
						firstName: 'Support',
						lastName: 'Tester',
						email: 'support@example.test',
						userRoles: [role],
						accountType: 0,
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
		const summaries = Array.from({ length: 12 }, (_, index) => ({
			id: `ticket-${index}`,
			ticketId: `ticket-${index}`,
			ticketNumber: `TKT-${index}`,
			fileNumber: index === 11 ? 'TM-2026-123' : null,
			title:
				index === 11 ? 'Payment receipt missing' : `General inquiry ${index}`,
			creator: {
				id: 'support-search-user',
				name: index === 11 ? 'Mary Example' : 'Other Creator',
			},
			status: 1,
			category: 2,
			ticketType: 0,
			resolution: null,
			lastInteraction: `2026-03-${String(index + 1).padStart(2, '0')}T12:00:00Z`,
		}));
		const summaryRequests: Record<string, unknown>[] = [];
		let searchRequests = 0;
		await page.route('**/api/**', async (route) => {
			const path = new URL(route.request().url()).pathname;
			let body: unknown = {};
			if (path.endsWith('/TicketSummaries')) {
				summaryRequests.push(route.request().postDataJSON());
				body = summaries;
			} else if (path.endsWith('/GetStats')) {
				body = {
					total: 12,
					staff: 12,
					user: 0,
					closed: 0,
					inProgress: 0,
					resolved: 0,
					unreadTickets: 0,
				};
			} else if (path.endsWith('/Search')) {
				searchRequests++;
				body = summaries;
			} else if (path.endsWith('/GetNotifications')) body = [];
			else if (path.endsWith('/UnreadCount')) body = { unreadCount: 0 };
			await route.fulfill({
				contentType: 'application/json',
				body: JSON.stringify(body),
			});
		});
		await page.goto(`${baseURL}/home/iposupport`, {
			waitUntil: 'domcontentloaded',
		});
		const filter = page.getByRole('textbox', {
			name: 'Search tickets',
			exact: true,
		});
		await expect(filter).toBeVisible();
		await expect(page.getByRole('textbox')).toHaveCount(1);
		await expect(
			page.getByRole('combobox', { name: 'Search tickets by' }),
		).toHaveCount(0);
		await expect(page.getByRole('table').getByRole('row')).toHaveCount(11);
		await expect(
			page.getByRole('cell', { name: 'Payment receipt missing', exact: true }),
		).toHaveCount(0);
		await page.getByRole('button', { name: 'Page 2', exact: true }).click();
		await expect(
			page.getByRole('cell', { name: 'Payment receipt missing', exact: true }),
		).toBeVisible();

		await expect(filter).toHaveAttribute(
			'placeholder',
			'Search by ticket number, file number, creator name or title',
		);
		await filter.fill('  mArY  ');
		await filter.press('Enter');
		await expect(
			page.getByRole('cell', { name: 'Payment receipt missing', exact: true }),
		).toBeVisible();
		await expect(
			page.getByText('1 matching ticket(s)', { exact: false }),
		).toBeVisible();
		await expect(
			page.getByRole('button', { name: 'Page 2', exact: true }),
		).toHaveCount(0);

		await filter.fill('RECEIPT');
		await page.getByRole('button', { name: 'Search', exact: true }).click();
		await expect(
			page.getByRole('cell', { name: 'Payment receipt missing', exact: true }),
		).toBeVisible();
		await filter.fill('not a matching title');
		await filter.press('Enter');
		await expect(
			page.getByText('0 matching ticket(s)', { exact: false }),
		).toBeVisible();
		await expect(
			page.getByRole('cell', { name: 'Payment receipt missing', exact: true }),
		).toHaveCount(0);
		await page.getByRole('button', { name: 'Clear', exact: true }).click();
		await expect(page.getByRole('table').getByRole('row')).toHaveCount(11);
		await expect(
			page.getByRole('cell', { name: 'General inquiry 0', exact: true }),
		).toBeVisible();
		expect(searchRequests).toBe(0);
		expect(summaryRequests).toHaveLength(1);
		expect(summaryRequests[0]).toMatchObject(
			role === 0
				? { creatorId: 'support-search-user' }
				: {
						creatorId: 'null',
						category: 2,
						raisedByRegistryStaff: false,
						status: 1,
					},
		);
		await filter.fill('TKT-11');
		await filter.press('Enter');
		await expect(
			page.getByText('1 matching ticket(s)', { exact: false }),
		).toBeVisible();
		await expect(
			page.getByRole('cell', { name: 'Payment receipt missing', exact: true }),
		).toBeVisible();
		await filter.fill('TM-2026-123');
		await filter.press('Enter');
		await expect(
			page.getByText('1 matching ticket(s)', { exact: false }),
		).toBeVisible();
		await expect(
			page.getByRole('cell', { name: 'Payment receipt missing', exact: true }),
		).toBeVisible();
		await filter.fill('Outside permitted queue');
		await filter.press('Enter');
		await expect(
			page.getByText('0 matching ticket(s)', { exact: false }),
		).toBeVisible();
		expect(searchRequests).toBe(0);
		expect(summaryRequests).toHaveLength(1);
		await expect(page.getByRole('textbox')).toHaveCount(1);
	});
}

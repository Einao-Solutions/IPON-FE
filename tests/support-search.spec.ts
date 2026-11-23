import { expect, test } from '@playwright/test';

for (const role of [0, 20, 21, 28, 29]) {
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
			category: role === 28 ? 0 : role === 29 ? 1 : 2,
			ticketType: 0,
			resolution: null,
			lastInteraction: `2026-03-${String(index + 1).padStart(2, '0')}T12:00:00Z`,
		}));
		const summaryRequests: Record<string, unknown>[] = [];
		const crossQueueTicket = {
			...summaries[11],
			id: 'cross-queue',
			ticketId: 'cross-queue',
			ticketNumber: 'TKT-CROSS',
			fileNumber: 'TM-CROSS',
			creator: { id: 'different-creator', name: 'Cross Queue Creator' },
			title: 'Closed registry technical issue',
			category: role === 20 || role === 21 ? 0 : 2,
			registryCategory: role === 29 ? 1 : 0,
			raisedByRegistryStaff: true,
			status: 2,
		};
		let searchRequests = 0;
		await page.route('**/api/**', async (route) => {
			const path = new URL(route.request().url()).pathname;
			let body: unknown = {};
			if (path.endsWith('/TicketSummaries')) {
				const filters = route.request().postDataJSON();
				summaryRequests.push(filters);
				const authorized =
					role === 0 ? summaries : [...summaries, crossQueueTicket];
				body = authorized.filter(
					(ticket) =>
						(filters.creatorId === 'null' ||
							filters.creatorId === ticket.creator.id) &&
						(filters.status === undefined ||
							filters.status === ticket.status) &&
						(filters.category === undefined ||
							filters.category === ticket.category),
				);
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
		expect(summaryRequests).toHaveLength(role === 0 ? 1 : 3);
		expect(summaryRequests[0]).toMatchObject(
			role === 0
				? { creatorId: 'support-search-user' }
				: {
						creatorId: 'null',
						category: role === 28 ? 0 : role === 29 ? 1 : 2,
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
		expect(summaryRequests).toHaveLength(role === 0 ? 1 : 4);
		if (role !== 0) {
			await filter.fill('Cross Queue Creator');
			await filter.press('Enter');
			await expect(
				page.getByRole('cell', {
					name: 'Closed registry technical issue',
					exact: true,
				}),
			).toBeVisible();
			const broadRequest = summaryRequests[summaryRequests.length - 1];
			expect(broadRequest).toMatchObject({ creatorId: 'null', startIndex: 0 });
			expect(broadRequest).not.toHaveProperty('status');
			expect(broadRequest).not.toHaveProperty('category');
			expect(broadRequest).not.toHaveProperty('raisedByRegistryStaff');
		}
		await expect(page.getByRole('textbox')).toHaveCount(1);
	});
}

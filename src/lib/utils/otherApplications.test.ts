import { describe, expect, it } from 'vitest';
import { ApplicationStatuses } from '$lib/helpers';
import { getOtherApplicationsUrl, normalizeApplicationStatus } from './otherApplications';

describe('normalizeApplicationStatus', () => {
	it('keeps numeric statuses', () => {
		expect(normalizeApplicationStatus(13)).toBe(ApplicationStatuses.AutoApproved);
		expect(normalizeApplicationStatus(2)).toBe(ApplicationStatuses.AwaitingPayment);
	});

	it('accepts numeric strings', () => {
		expect(normalizeApplicationStatus('13')).toBe(ApplicationStatuses.AutoApproved);
	});

	it('accepts enum names however they are formatted', () => {
		expect(normalizeApplicationStatus('AutoApproved')).toBe(ApplicationStatuses.AutoApproved);
		expect(normalizeApplicationStatus('Auto-Approved')).toBe(ApplicationStatuses.AutoApproved);
		expect(normalizeApplicationStatus('auto approved')).toBe(ApplicationStatuses.AutoApproved);
		expect(normalizeApplicationStatus('AwaitingPayment')).toBe(ApplicationStatuses.AwaitingPayment);
	});

	it('falls back to None for unknown or missing values', () => {
		expect(normalizeApplicationStatus('nonsense')).toBe(ApplicationStatuses.None);
		expect(normalizeApplicationStatus(null)).toBe(ApplicationStatuses.None);
		expect(normalizeApplicationStatus(undefined)).toBe(ApplicationStatuses.None);
	});
});

describe('getOtherApplicationsUrl', () => {
	const baseURL = 'https://api.example.test';

	// The backend decides scope: Tech/Support/SuperAdmin get every account's
	// searches (including their own); everyone else gets only their own.
	it('always sends the signed-in userId and lets the API decide the scope', () => {
		expect(getOtherApplicationsUrl(baseURL, { id: 'staff-id' })).toBe(
			`${baseURL}/api/users/GetOtherApplications?userId=staff-id`
		);
	});

	it('encodes the userId', () => {
		expect(getOtherApplicationsUrl(baseURL, { id: 'user id/123' })).toBe(
			`${baseURL}/api/users/GetOtherApplications?userId=user%20id%2F123`
		);
	});
});

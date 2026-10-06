import { describe, expect, it } from 'vitest';
import { getOtherApplicationsUrl } from './otherApplications';

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

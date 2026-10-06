import { describe, expect, it } from 'vitest';
import { UserRoles } from '$lib/helpers';
import { getOtherApplicationsUrl } from './otherApplications';

describe('getOtherApplicationsUrl', () => {
	const baseURL = 'https://api.example.test';

	it.each([UserRoles.Tech, UserRoles.SuperAdmin])(
		'requests all applications for privileged role %i',
		(role) => {
			expect(
				getOtherApplicationsUrl(baseURL, { id: 'staff-id', userRoles: [role] })
			).toBe(`${baseURL}/api/users/GetOtherApplications`);
		}
	);

	it('limits regular users to their own applications', () => {
		expect(
			getOtherApplicationsUrl(baseURL, {
				id: 'user id/123',
				userRoles: [UserRoles.User]
			})
		).toBe(`${baseURL}/api/users/GetOtherApplications?userId=user%20id%2F123`);
	});
});

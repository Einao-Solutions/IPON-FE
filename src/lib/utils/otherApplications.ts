import { UserRoles } from '$lib/helpers';

interface ApplicationsUser {
	id: string;
	userRoles?: number[];
}

export function getOtherApplicationsUrl(
	baseURL: string,
	currentUser: ApplicationsUser
): string {
	const canViewAllApplications = currentUser.userRoles?.some((role) =>
		[UserRoles.Tech, UserRoles.SuperAdmin].includes(role)
	);
	const endpoint = `${baseURL}/api/users/GetOtherApplications`;

	return canViewAllApplications
		? endpoint
		: `${endpoint}?userId=${encodeURIComponent(currentUser.id)}`;
}

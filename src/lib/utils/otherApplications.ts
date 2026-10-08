interface ApplicationsUser {
	id: string;
}

export function getOtherApplicationsUrl(
	baseURL: string,
	currentUser: ApplicationsUser
): string {
	const endpoint = `${baseURL}/api/users/GetOtherApplications`;
	return `${endpoint}?userId=${encodeURIComponent(currentUser.id)}`;
}

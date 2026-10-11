import { ApplicationStatuses } from '$lib/helpers';

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

const statusByName = new Map<string, ApplicationStatuses>(
	Object.entries(ApplicationStatuses)
		.filter((entry): entry is [string, ApplicationStatuses] => typeof entry[1] === 'number')
		.map(([name, value]) => [name.toLowerCase(), value])
);

// The API may send a status as the enum number, a numeric string ("13") or the enum name
// ("AutoApproved" / "Auto-Approved"); the UI and status filters all work with the number.
export function normalizeApplicationStatus(
	value: number | string | null | undefined
): ApplicationStatuses {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (/^\d+$/.test(trimmed)) return Number(trimmed);
		const byName = statusByName.get(trimmed.replace(/[^A-Za-z0-9]/g, '').toLowerCase());
		if (byName !== undefined) return byName;
	}
	return ApplicationStatuses.None;
}

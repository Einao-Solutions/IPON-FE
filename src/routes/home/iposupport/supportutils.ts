import { TicketCategory, ApplicationType, TicketType, TicketStates } from '$lib/helpers';

export function ticketSystemMessage(message: string): string {
	return /^escalated to (?:developers|dev)\.?$/i.test(message.trim()) ? 'In Progress' : message;
}

export function canReplyToTicket(status: TicketStates, resolvedAt: string | null | undefined, now = Date.now()): boolean {
	if (status === TicketStates.closed) return false;
	if (status !== TicketStates.resolved) return true;
	if (!resolvedAt) return false;
	const resolvedTime = Date.parse(resolvedAt);
	return Number.isFinite(resolvedTime) && now < resolvedTime + 24 * 60 * 60 * 1000;
}

export function ticketReplyStatus(status: TicketStates, isCreator: boolean): TicketStates {
	if (status === TicketStates.inProgress || status === TicketStates.resolved) return TicketStates.inProgress;
	return isCreator ? TicketStates.awaitingStaff : TicketStates.awaitingUser;
}

export function mapTicketStateToString(input: number): string {
	switch (Number(input)) {
		case 0: return 'Awaiting User';
		case 1: return 'Awaiting Staff';
		case 2: return 'Closed';
		case 3: return 'In Progress';
		case 4: return 'Resolved';
		default: return 'Unknown';
	}
}

export function mapCategoryToString(cat: TicketCategory): string {
	switch (cat) {
		case TicketCategory.TrademarkRegistry: return 'Trademark Registry';
		case TicketCategory.PatentDesignRegistry: return 'Patent & Design Registry';
		case TicketCategory.TechnicalSupport: return 'Technical Support';
		default: return 'Unknown';
	}
}

export function mapApplicationTypeToString(at: ApplicationType): string {
	switch (at) {
		case ApplicationType.NewRegistration: return 'New Registration';
		case ApplicationType.ClericalUpdate: return 'Clerical Update';
		case ApplicationType.Opposition: return 'Opposition';
		case ApplicationType.Certificate: return 'Certificate';
		case ApplicationType.Recordals: return 'Recordals';
		case ApplicationType.Withdrawal: return 'Withdrawal';
		case ApplicationType.Appeal: return 'Appeal';
		default: return 'Unknown';
	}
}

export function mapTicketTypeToString(tt: TicketType): string {
	switch (tt) {
		case TicketType.RegistryProcessInquiry: return 'Process Inquiry';
		case TicketType.ApplicationStatus: return 'App Status';
		case TicketType.FollowUp: return 'Follow Up';
		case TicketType.AccountAccess: return 'Account Access';
		case TicketType.PaymentIssue: return 'Payment Issue';
		case TicketType.Others: return 'Others';
		default: return '—';
	}
}

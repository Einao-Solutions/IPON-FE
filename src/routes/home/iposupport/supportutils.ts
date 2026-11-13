import { TicketCategory, ApplicationType, TicketType, TicketStates, UserRoles } from '$lib/helpers';
import type { TicketReadResponse, TicketUnreadState } from '$lib/helpers';

export function isNormalTicketUser(roles: UserRoles[]): boolean {
	return roles.includes(UserRoles.User) && roles.every((role) => role === UserRoles.User);
}

export function ticketHasUnreadActivity(ticket?: TicketUnreadState & { status: number }): boolean {
	return ticket?.status === TicketStates.inProgress && ticket.hasUnreadMessages === true;
}

export function supportSidebarCountConfig(roles: UserRoles[]): { category?: TicketCategory; countKey: 'staff' | 'user' } {
	if (roles.includes(UserRoles.Tech) || roles.includes(UserRoles.SuperAdmin)) return { category: TicketCategory.TechnicalSupport, countKey: 'staff' };
	if (roles.includes(UserRoles.TrademarkSupport)) return { category: TicketCategory.TrademarkRegistry, countKey: 'staff' };
	if (roles.includes(UserRoles.PatentDesignSupport)) return { category: TicketCategory.PatentDesignRegistry, countKey: 'staff' };
	return { countKey: 'user' };
}

export function supportSidebarIncludesUnread(roles: UserRoles[]): boolean {
	return isNormalTicketUser(roles) || roles.includes(UserRoles.Tech);
}

export function supportSidebarTicketCount(roles: UserRoles[], stats: Record<string, number>, inProgressStats?: Record<string, number>): number {
	const baseCount = stats[supportSidebarCountConfig(roles).countKey] ?? 0;
	return baseCount + (supportSidebarIncludesUnread(roles) ? (inProgressStats?.unreadTickets ?? 0) : 0);
}

export function applyTicketReadResponse<Ticket extends TicketUnreadState>(ticket: Ticket, response: TicketReadResponse): Ticket {
	if ((response.latestMessageSequence ?? 0) < (ticket.latestMessageSequence ?? 0)) return ticket;
	return { ...ticket, hasUnreadMessages: response.hasUnreadMessages, unreadCount: response.unreadCount, latestMessageSequence: response.latestMessageSequence };
}

export function orderedTicketMessages<Message extends { messageSequence?: number }>(messages: Message[]): Message[] {
	return [...messages].sort((first, second) => (first.messageSequence ?? 0) - (second.messageSequence ?? 0));
}

export function ticketMessageIsOwn(senderId: string | undefined, viewer?: { id?: string; creatorId?: string } | null): boolean {
	return Boolean(senderId && senderId !== 'system' && (senderId === viewer?.creatorId || senderId === viewer?.id));
}

export function displayedMessageSequence(sequences: number[]): number {
	return sequences.reduce((latest, sequence) => Number.isSafeInteger(sequence) && sequence >= 0 ? Math.max(latest, sequence) : latest, 0);
}

export function ticketStatsQuery(filters: Record<string, unknown>): URLSearchParams {
	const params = new URLSearchParams();
	if (filters.creatorId && filters.creatorId !== 'null') params.set('userId', String(filters.creatorId));
	for (const key of ['category', 'registryCategory', 'raisedByRegistryStaff', 'status', 'isEscalated', 'isEscalatedToDev']) {
		if (filters[key] !== undefined && filters[key] !== null) params.set(key, String(filters[key]));
	}
	return params;
}

export function ticketEscalationMessage(officerName: string, target?: string): string {
	const actor = officerName.trim() || 'A support officer';
	return target
		? `${actor} escalated this ticket to ${target} for further assistance.`
		: `In Progress - ${actor} escalated this ticket.`;
}

export function ticketSystemMessage(message: string): string {
	return /^escalated to (?:developers|dev)\.?$/i.test(message.trim()) ? 'In Progress' : message;
}

export function canViewTicketMessage(message: { senderId: string; message: string }, roles: UserRoles[]): boolean {
	const isDeveloperNotice = message.senderId === 'system' &&
		(/^(?:escalated to (?:developers|dev)\.?|In Progress\s*-\s*.+ escalated this ticket\.)$/i.test(message.message.trim()));
	return !isDeveloperNotice || roles.some((role) => role === UserRoles.Tech || role === UserRoles.SuperAdmin);
}

export function canReplyToTicket(status: TicketStates, resolvedAt: string | null | undefined, now = Date.now()): boolean {
	if (status === TicketStates.closed) return false;
	if (status !== TicketStates.resolved) return true;
	if (!resolvedAt) return false;
	const resolvedTime = Date.parse(resolvedAt);
	return Number.isFinite(resolvedTime) && now < resolvedTime + 24 * 60 * 60 * 1000;
}

export function ticketReplyStatus(status: TicketStates, isCreator: boolean, statusBeforeResolution?: TicketStates | null): TicketStates {
	if (status === TicketStates.inProgress || (status === TicketStates.resolved && statusBeforeResolution === TicketStates.inProgress)) return TicketStates.inProgress;
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

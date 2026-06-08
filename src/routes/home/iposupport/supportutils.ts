import { TicketCategory, ApplicationType, TicketType } from '$lib/helpers';

export function mapTicketStateToString(input: number): string {
	switch (Number(input)) {
		case 0: return 'Awaiting User';
		case 1: return 'Awaiting Staff';
		case 2: return 'Closed';
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

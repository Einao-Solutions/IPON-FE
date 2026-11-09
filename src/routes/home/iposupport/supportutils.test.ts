import { describe, expect, it } from 'vitest';
import { get, writable } from 'svelte/store';
import { createTable } from 'svelte-headless-table';
import { addPagination } from 'svelte-headless-table/plugins';
import { TicketStates, TicketCategory, UserRoles } from '$lib/helpers';
import { canReplyToTicket, mapTicketStateToString, ticketReplyStatus, ticketSystemMessage, ticketEscalationMessage, orderedTicketMessages, displayedMessageSequence, ticketStatsQuery, applyTicketReadResponse, supportSidebarCountConfig, isNormalTicketUser, ticketHasUnreadActivity, supportSidebarIncludesUnread, supportSidebarTicketCount } from './supportutils';

describe('combined sidebar attention counts', () => {
	it('adds unread In Progress tickets to Awaiting User for a normal user', () => {
		expect(supportSidebarTicketCount([UserRoles.User], { user: 2, unreadTickets: 99 }, { unreadTickets: 3 })).toBe(5);
	});

	it('adds unread In Progress tickets to Awaiting Staff for Tech', () => {
		expect(supportSidebarTicketCount([UserRoles.Tech], { staff: 10, user: 2, unreadTickets: 99 }, { unreadTickets: 2 })).toBe(12);
	});

	it('reduces the sidebar total when an In Progress ticket has been read', () => {
		expect(supportSidebarTicketCount([UserRoles.User], { user: 2 }, { unreadTickets: 0 })).toBe(2);
	});

	it.each([UserRoles.TrademarkSupport, UserRoles.PatentDesignSupport, UserRoles.TrademarkStaff, UserRoles.PermSec, UserRoles.SuperAdmin])('keeps the existing status-only count for officer role %s', (role) => {
		expect(supportSidebarIncludesUnread([role])).toBe(false);
		const stats = { user: 2, staff: 4 };
		expect(supportSidebarTicketCount([role], stats, { unreadTickets: 7 })).toBe(stats[supportSidebarCountConfig([role]).countKey]);
		expect(supportSidebarIncludesUnread([UserRoles.User, role])).toBe(false);
	});

	it('retains the base count when optional unread statistics are absent', () => {
		expect(supportSidebarTicketCount([UserRoles.User], { user: 2 })).toBe(2);
	});
});

describe('ticket filter pagination', () => {
	it('shows a smaller filtered queue when its page index is reset', () => {
		const tickets = writable(Array.from({ length: 30 }, (_, index) => ({ id: String(index) })));
		const table = createTable(tickets, { page: addPagination({ initialPageSize: 10 }) });
		const columns = table.createColumns([table.column({ accessor: 'id', header: 'Ticket' })]);
		const view = table.createViewModel(columns);
		view.pluginStates.page.pageIndex.set(2);
		expect(get(view.pageRows)).toHaveLength(10);
		tickets.set([{ id: 'in-progress-ticket' }]);
		expect(get(view.pageRows)).toHaveLength(0);
		view.pluginStates.page.pageIndex.set(0);
		expect(get(view.pageRows)).toHaveLength(1);
	});
});

describe('In Progress-only activity visibility', () => {
	it('recognises normal users but not unauthenticated accounts', () => {
		expect(isNormalTicketUser([UserRoles.User])).toBe(true);
		expect(isNormalTicketUser([])).toBe(false);
	});

	it.each([UserRoles.Tech, UserRoles.SuperAdmin, UserRoles.TrademarkSupport, UserRoles.PatentDesignSupport, UserRoles.TrademarkStaff, UserRoles.PermSec])('does not classify officer role %s as a normal user', (role) => {
		expect(isNormalTicketUser([role])).toBe(false);
		expect(isNormalTicketUser([UserRoles.User, role])).toBe(false);
	});

	it.each([TicketStates.awaitingStaff, TicketStates.awaitingUser, TicketStates.resolved, TicketStates.closed])('hides unread activity on status %s', (status) => {
		expect(ticketHasUnreadActivity({ status, hasUnreadMessages: true, unreadCount: 5 })).toBe(false);
	});

	it('shows unread activity only for unread In Progress tickets', () => {
		expect(ticketHasUnreadActivity({ status: TicketStates.inProgress, hasUnreadMessages: true })).toBe(true);
		expect(ticketHasUnreadActivity({ status: TicketStates.inProgress, hasUnreadMessages: false })).toBe(false);
		expect(ticketHasUnreadActivity()).toBe(false);
	});
});

describe('support sidebar status counts', () => {
	it.each([UserRoles.Tech, UserRoles.SuperAdmin])('counts technical tickets awaiting staff for role %s, not unread tickets', (role) => {
		expect(supportSidebarCountConfig([role])).toEqual({ category: TicketCategory.TechnicalSupport, countKey: 'staff' });
	});

	it('counts trademark registry tickets awaiting staff for trademark support', () => {
		expect(supportSidebarCountConfig([UserRoles.TrademarkSupport])).toEqual({ category: TicketCategory.TrademarkRegistry, countKey: 'staff' });
	});

	it('counts patent/design registry tickets awaiting staff for patent/design support', () => {
		expect(supportSidebarCountConfig([UserRoles.PatentDesignSupport])).toEqual({ category: TicketCategory.PatentDesignRegistry, countKey: 'staff' });
	});

	it.each([UserRoles.User, UserRoles.TrademarkStaff])('counts own tickets awaiting a reply for non-support role %s', (role) => {
		expect(supportSidebarCountConfig([role])).toEqual({ countKey: 'user' });
	});

	it('uses the technical scope for accounts with both tech and registry support roles', () => {
		expect(supportSidebarCountConfig([UserRoles.Tech, UserRoles.TrademarkSupport])).toEqual({ category: TicketCategory.TechnicalSupport, countKey: 'staff' });
	});
});

describe('ticket unread tracking', () => {
	it('keeps a newer concurrent reply unread after acknowledging displayed messages', () => {
		const ticket = { latestMessageSequence: 15, hasUnreadMessages: true, unreadCount: 2, status: TicketStates.inProgress };
		const result = applyTicketReadResponse(ticket, { ticketId: 'ticket', lastReadMessageSequence: 15, latestMessageSequence: 16, hasUnreadMessages: true, unreadCount: 1 });
		expect(result).toEqual({ latestMessageSequence: 16, hasUnreadMessages: true, unreadCount: 1, status: TicketStates.inProgress });
		expect(ticket.unreadCount).toBe(2);
	});

	it('ignores a read response older than the current ticket snapshot', () => {
		const ticket = { latestMessageSequence: 17, hasUnreadMessages: true, unreadCount: 2 };
		expect(applyTicketReadResponse(ticket, { ticketId: 'ticket', lastReadMessageSequence: 15, latestMessageSequence: 16, hasUnreadMessages: false, unreadCount: 0 })).toBe(ticket);
	});

	it('clears a badge only when the backend reports read and preserves lifecycle fields', () => {
		const ticket = { latestMessageSequence: 15, hasUnreadMessages: true, unreadCount: 1, status: TicketStates.resolved, resolvedAt: '2026-10-26T12:00:00Z' };
		expect(applyTicketReadResponse(ticket, { ticketId: 'ticket', lastReadMessageSequence: 15, latestMessageSequence: 15, hasUnreadMessages: false, unreadCount: 0 })).toEqual({ ...ticket, hasUnreadMessages: false, unreadCount: 0 });
	});

	it('orders messages by server sequence without changing the source array', () => {
		const messages = [{ messageSequence: 3 }, { messageSequence: 1 }, { messageSequence: 2 }];
		expect(orderedTicketMessages(messages).map((message) => message.messageSequence)).toEqual([1, 2, 3]);
		expect(messages[0].messageSequence).toBe(3);
	});

	it('acknowledges only valid displayed sequences, not the ticket latest sequence', () => {
		expect(displayedMessageSequence([2, 8, 5])).toBe(8);
		expect(displayedMessageSequence([])).toBe(0);
		expect(displayedMessageSequence([-1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])).toBe(0);
	});

	it('preserves queue/status filters including zero and false in stats requests', () => {
		const query = ticketStatsQuery({ creatorId: 'owner', category: 0, registryCategory: 1, raisedByRegistryStaff: false, status: 3, isEscalated: false, isEscalatedToDev: true, amount: 100 });
		expect(Object.fromEntries(query)).toEqual({ userId: 'owner', category: '0', registryCategory: '1', raisedByRegistryStaff: 'false', status: '3', isEscalated: 'false', isEscalatedToDev: 'true' });
		expect(ticketStatsQuery({ creatorId: 'null' }).has('userId')).toBe(false);
	});
});

describe('support ticket lifecycle', () => {
	const resolvedAt = '2026-03-01T12:00:00Z';
	const deadline = Date.parse(resolvedAt) + 24 * 60 * 60 * 1000;

	it('includes the officer and destination in a team escalation message', () => {
		expect(ticketEscalationMessage(' Jane Doe ', 'Technical Support')).toBe(
			'Jane Doe escalated this ticket to Technical Support for further assistance.'
		);
	});

	it('keeps In Progress and the officer name visible for developer escalations', () => {
		const message = ticketEscalationMessage('John Smith');
		expect(message).toBe('In Progress - John Smith escalated this ticket.');
		expect(ticketSystemMessage(message)).toBe(message);
	});

	it('handles missing officer names without displaying a blank actor', () => {
		expect(ticketEscalationMessage('  ')).toBe('In Progress - A support officer escalated this ticket.');
	});

	it('displays existing developer escalation messages as In Progress', () => {
		expect(ticketSystemMessage('Escalated to developers.')).toBe('In Progress');
		expect(ticketSystemMessage('Escalated to Dev')).toBe('In Progress');
		expect(ticketSystemMessage('In Progress')).toBe('In Progress');
	});

	it('preserves other system messages', () => {
		const message = 'This ticket has been escalated to Technical Support for further assistance.';
		expect(ticketSystemMessage(message)).toBe(message);
	});

	it('labels all five backend states', () => {
		expect([0, 1, 2, 3, 4].map(mapTicketStateToString)).toEqual([
			'Awaiting User', 'Awaiting Staff', 'Closed', 'In Progress', 'Resolved'
		]);
	});

	it('allows resolved replies only before the exact 24-hour deadline', () => {
		expect(canReplyToTicket(TicketStates.resolved, resolvedAt, deadline - 1)).toBe(true);
		expect(canReplyToTicket(TicketStates.resolved, resolvedAt, deadline)).toBe(false);
		expect(canReplyToTicket(TicketStates.resolved, resolvedAt, deadline + 1)).toBe(false);
	});

	it('blocks closed tickets and resolved tickets without a valid resolution time', () => {
		expect(canReplyToTicket(TicketStates.closed, resolvedAt, deadline - 1)).toBe(false);
		expect(canReplyToTicket(TicketStates.resolved, null)).toBe(false);
		expect(canReplyToTicket(TicketStates.resolved, 'invalid')).toBe(false);
	});

	it.each([TicketStates.awaitingUser, TicketStates.awaitingStaff, TicketStates.inProgress])(
		'allows replies on active status %s', (status) => {
			expect(canReplyToTicket(status, null)).toBe(true);
		}
	);

	it('preserves In Progress regardless of who replies', () => {
		expect(ticketReplyStatus(TicketStates.inProgress, true)).toBe(TicketStates.inProgress);
		expect(ticketReplyStatus(TicketStates.inProgress, false)).toBe(TicketStates.inProgress);
	});

	it('requests Awaiting Staff when the creator replies to an ordinary resolved ticket', () => {
		expect(ticketReplyStatus(TicketStates.resolved, true)).toBe(TicketStates.awaitingStaff);
		expect(ticketReplyStatus(TicketStates.resolved, true, TicketStates.awaitingUser)).toBe(TicketStates.awaitingStaff);
		expect(ticketReplyStatus(TicketStates.resolved, true, TicketStates.awaitingStaff)).toBe(TicketStates.awaitingStaff);
	});

	it('requests In Progress when reopening a ticket that was In Progress before resolution', () => {
		expect(ticketReplyStatus(TicketStates.resolved, true, TicketStates.inProgress)).toBe(TicketStates.inProgress);
	});

	it('sends an active reply state for staff on resolved tickets without forcing a local reopening', () => {
		expect(ticketReplyStatus(TicketStates.resolved, false)).toBe(TicketStates.awaitingUser);
		expect(ticketReplyStatus(TicketStates.resolved, false, TicketStates.inProgress)).toBe(TicketStates.inProgress);
	});

	it('retains the awaiting-state exchange on other active tickets', () => {
		expect(ticketReplyStatus(TicketStates.awaitingUser, true)).toBe(TicketStates.awaitingStaff);
		expect(ticketReplyStatus(TicketStates.awaitingStaff, false)).toBe(TicketStates.awaitingUser);
	});
});
import { describe, expect, it } from 'vitest';
import { TicketStates } from '$lib/helpers';
import { canReplyToTicket, mapTicketStateToString, ticketReplyStatus, ticketSystemMessage } from './supportutils';

describe('support ticket lifecycle', () => {
	const resolvedAt = '2026-03-01T12:00:00Z';
	const deadline = Date.parse(resolvedAt) + 24 * 60 * 60 * 1000;

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

	it('submits an active state for resolved replies so the server controls reopening', () => {
		expect(ticketReplyStatus(TicketStates.resolved, true)).toBe(TicketStates.inProgress);
		expect(ticketReplyStatus(TicketStates.resolved, false)).toBe(TicketStates.inProgress);
	});

	it('retains the awaiting-state exchange on other active tickets', () => {
		expect(ticketReplyStatus(TicketStates.awaitingUser, true)).toBe(TicketStates.awaitingStaff);
		expect(ticketReplyStatus(TicketStates.awaitingStaff, false)).toBe(TicketStates.awaitingUser);
	});
});
import { describe, expect, it } from 'vitest';
import { UserRoles } from '$lib/helpers';
import { canAccessModulePath, canAccessSidebarItem } from './moduleAccess';

describe('Tech module access', () => {
	it.each(['Users', 'statistics'])('hides %s even on a mixed Tech/SuperAdmin account', (location) => {
		expect(canAccessSidebarItem({ location }, [UserRoles.Tech])).toBe(false);
		expect(canAccessSidebarItem({ location }, [UserRoles.Tech, UserRoles.SuperAdmin])).toBe(false);
	});

	it.each(['Dashboard', 'Publications', 'journal', 'Resources', 'iposupport', 'Opposition', 'profile', 'admin', 'ClaimRequests'])('allows Tech to access sidebar item %s', (location) => {
		expect(canAccessSidebarItem({ location, roles: [UserRoles.User], hiddenForRoles: [UserRoles.Tech] }, [UserRoles.Tech])).toBe(true);
	});

	it.each(['/home/users', '/home/users/', '/home/users/add', '/statistics', '/statistics/performance/', '/statistics/techfee', '/home/statistics', '/HOME/USERS/roles'])('blocks direct and nested Tech route %s', (pathname) => {
		expect(canAccessModulePath(pathname, [UserRoles.Tech])).toBe(false);
		expect(canAccessModulePath(pathname, [UserRoles.Tech, UserRoles.SuperAdmin])).toBe(false);
		expect(canAccessModulePath(pathname, [UserRoles.SuperAdmin])).toBe(true);
	});

	it.each(['/home/admin', '/home/profile', '/home/iposupport', '/home/users-guide', '/statistics-help'])('does not block unrelated route %s', (pathname) => {
		expect(canAccessModulePath(pathname, [UserRoles.Tech])).toBe(true);
	});

	it('preserves existing visibility rules for other roles', () => {
		expect(canAccessSidebarItem({ location: 'Users', roles: [UserRoles.SuperAdmin] }, [UserRoles.SuperAdmin])).toBe(true);
		expect(canAccessSidebarItem({ location: 'Users', roles: [UserRoles.SuperAdmin] }, [UserRoles.User])).toBe(false);
		expect(canAccessSidebarItem({ location: 'Dashboard', hiddenForRoles: [UserRoles.TrademarkSupport] }, [UserRoles.TrademarkSupport])).toBe(false);
	});
});
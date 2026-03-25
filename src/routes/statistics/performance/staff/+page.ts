import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { get } from 'svelte/store';
import { loggedInUser } from '$lib/store';
import { UserRoles } from '$lib/helpers';

export const load: PageLoad = async ({ url }) => {
  const user = get(loggedInUser);

  // Check if user is logged in
  if (!user || !user.userRoles || user.userRoles.length === 0) {
    throw redirect(303, '/auth');
  }

  // Check if user has authorized roles for statistics
  const authorizedRoles = [
    UserRoles.Finance,
    UserRoles.PermSec,
    UserRoles.Minister,
    UserRoles.Tech,
    UserRoles.SuperAdmin,
    UserRoles.TrademarkRegistrar,
    UserRoles.PatentDesignRegistrar,
  ];

  const hasAuthorizedRole = user.userRoles.some((role) =>
    authorizedRoles.includes(role)
  );

  // If user doesn't have authorized role, redirect to dashboard
  if (!hasAuthorizedRole) {
    throw redirect(303, '/home/Dashboard');
  }

  // Get registry type from URL
  const registryType = url.searchParams.get('registryType') || 'Trademark';

  return {
    registryType,
  };
};
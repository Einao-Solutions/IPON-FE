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

  const hasAuthorizedRole = user.userRoles.includes(UserRoles.SuperAdmin);

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
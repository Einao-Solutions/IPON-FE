import { UserRoles } from "$lib/helpers";

type SidebarAccessItem = {
  location: string;
  roles?: UserRoles[];
  hiddenForRoles?: UserRoles[];
};

export function isTechRestrictedModule(
  location: string,
  roles: UserRoles[],
): boolean {
  return (
    roles.includes(UserRoles.Tech) &&
    !roles.includes(UserRoles.SuperAdmin) &&
    ["users", "statistics"].includes(location.toLowerCase())
  );
}

export function canAccessSidebarItem(
  item: SidebarAccessItem,
  roles: UserRoles[],
): boolean {
  if (
    item.location.toLowerCase() === "users" &&
    !roles.includes(UserRoles.SuperAdmin)
  )
    return false;
  if (isTechRestrictedModule(item.location, roles)) return false;
  if (roles.includes(UserRoles.Tech)) return true;
  return (
    !item.hiddenForRoles?.some((role) => roles.includes(role)) &&
    (!item.roles || item.roles.some((role) => roles.includes(role)))
  );
}

export function isRestrictedModulePath(pathname: string): boolean {
  const segments = pathname.toLowerCase().split("/").filter(Boolean);
  return (
    segments[0] === "statistics" ||
    (segments[0] === "home" && ["users", "statistics"].includes(segments[1]))
  );
}

export function canAccessModulePath(pathname: string, roles: UserRoles[]): boolean {
	const segments = pathname.toLowerCase().split('/').filter(Boolean);
	if (segments[0] === 'home' && segments[1] === 'users' && !roles.includes(UserRoles.SuperAdmin)) return false;
	// Tech alone is kept out of the restricted modules; SuperAdmin always
	// overrides that, matching isTechRestrictedModule for the sidebar.
	return (
		!roles.includes(UserRoles.Tech) ||
		roles.includes(UserRoles.SuperAdmin) ||
		!isRestrictedModulePath(pathname)
	);
}

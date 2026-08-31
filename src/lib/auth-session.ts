export function isLocalhostOrigin() {
  if (typeof window === 'undefined') return false;
  const { protocol, hostname } = window.location;
  return protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1');
}

export function buildCookieOptions({
  maxAge,
  isSecure,
}: {
  maxAge: number;
  isSecure: boolean;
}) {
  const options = [`path=/`, `max-age=${maxAge}`];

  if (isSecure) {
    options.push('secure');
  }

  options.push('samesite=strict');
  return options.join('; ');
}

export function setAuthCookies(token: string, user: unknown) {
  const isLocal = isLocalhostOrigin();
  const maxAge = 7 * 24 * 60 * 60;
  const encodedUser = encodeURIComponent(JSON.stringify(user));

  document.cookie = `auth_token=${token}; ${buildCookieOptions({ maxAge, isSecure: !isLocal })}`;
  document.cookie = `user=${encodedUser}; ${buildCookieOptions({ maxAge, isSecure: !isLocal })}`;
}

export function clearAuthCookies() {
  const isLocal = isLocalhostOrigin();
  const baseOptions = buildCookieOptions({ maxAge: 0, isSecure: !isLocal });

  document.cookie = `auth_token=; ${baseOptions}`;
  document.cookie = `user=; ${baseOptions}`;
}

/**
 * Cookie utility functions for managing authentication tokens
 */

interface CookieOptions {
  expires?: Date;
  maxAge?: number; // in seconds
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Set a cookie with the given name and value
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  const {
    expires,
    maxAge,
    path = '/',
    domain,
    secure = true,
    sameSite = 'lax',
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (expires) {
    cookieString += `; expires=${expires.toUTCString()}`;
  }

  if (maxAge) {
    cookieString += `; max-age=${maxAge}`;
  }

  if (path) {
    cookieString += `; path=${path}`;
  }

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  if (secure && window.location.protocol === 'https:') {
    cookieString += '; secure';
  }

  cookieString += `; samesite=${sameSite}`;

  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }

  return null;
}

/**
 * Remove a cookie by name
 */
export function removeCookie(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  const { path = '/', domain } = options;
  
  // Set expiration date in the past to delete the cookie
  let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
  
  if (domain) {
    cookieString += `; domain=${domain}`;
  }
  
  document.cookie = cookieString;
}

/**
 * Set access token cookie (short-lived, 15 minutes default)
 */
export function setAccessToken(token: string, maxAge: number = 15 * 60): void {
  setCookie('accessToken', token, {
    maxAge,
    path: '/',
    secure: window.location.protocol === 'https:', // Only secure in HTTPS
    sameSite: 'lax',
  });
}

/**
 * Set refresh token cookie (long-lived, 7 days default)
 */
export function setRefreshToken(token: string, maxAge: number = 7 * 24 * 60 * 60): void {
  setCookie('refreshToken', token, {
    maxAge,
    path: '/',
    secure: window.location.protocol === 'https:', // Only secure in HTTPS
    sameSite: 'lax',
  });
}

/**
 * Get access token from cookie
 */
export function getAccessToken(): string | null {
  return getCookie('accessToken');
}

/**
 * Get refresh token from cookie
 */
export function getRefreshToken(): string | null {
  return getCookie('refreshToken');
}

/**
 * Clear both token cookies
 */
export function clearTokens(): void {
  removeCookie('accessToken');
  removeCookie('refreshToken');
}


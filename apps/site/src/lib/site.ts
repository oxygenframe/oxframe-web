/** Canonical origin of the public site. */
export const SITE = 'https://oxframe.dev';

/** Social preview image (1200×630), see static/og.png. */
export const OG_IMAGE = `${SITE}/og.png`;

/** Absolute canonical URL for a path: no query, hash or trailing slash. */
export function canonical(pathname: string): string {
  const path = pathname.replace(/\/+$/, '');
  return `${SITE}${path || '/'}`;
}

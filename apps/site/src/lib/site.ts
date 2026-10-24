/** Canonical origin of the public site. */
export const SITE = 'https://oxframe.dev';

/** Social preview image (1200×630), see static/og.png. */
export const OG_IMAGE = `${SITE}/og.png`;

/** Square logo for structured data (static/logo-512.png, scripts/icons.ts). */
export const LOGO = `${SITE}/logo-512.png`;

/**
 * Who makes oxframe, for JSON-LD. Pages link to it by `@id`; the home page
 * and the docs carry it whole, so a search engine reads the name, the logo
 * and the profiles that say this oxframe is the Rust library.
 */
/** The project's account on X. */
export const X_HANDLE = 'oxframe';
export const X_URL = `https://x.com/${X_HANDLE}`;

/** Where to write: questions, press, security reports, removing a shared video. */
export const CONTACT_EMAIL = 'contact@oxframe.dev';

/** The author's account on X. */
export const AUTHOR_X_URL = 'https://x.com/hovs_io';

export const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: 'oxframe',
  alternateName: ['oxframe.dev', 'oxygenframe'],
  url: `${SITE}/`,
  logo: { '@type': 'ImageObject', url: LOGO, width: 512, height: 512 },
  description: 'Open-source motion graphics library in Rust, built for AI coding agents.',
  email: CONTACT_EMAIL,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: CONTACT_EMAIL,
    url: `${SITE}/about`,
  },
  sameAs: [
    'https://github.com/oxygenframe',
    X_URL,
    'https://crates.io/crates/oxframe',
    'https://docs.rs/oxframe',
  ],
};

/** The site, for JSON-LD. `name` is the site name search results show. */
export const WEBSITE = {
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  name: 'oxframe',
  alternateName: 'oxframe.dev',
  url: `${SITE}/`,
  inLanguage: 'en',
  publisher: { '@id': ORGANIZATION['@id'] },
};

/** Absolute canonical URL for a path: no query, hash or trailing slash. */
export function canonical(pathname: string): string {
  const path = pathname.replace(/\/+$/, '');
  return `${SITE}${path || '/'}`;
}

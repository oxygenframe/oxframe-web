// /sitemap.xml, prerendered from the docs list so new pages appear in it.
import { agents, skills } from '$lib/agents';
import { href, pages } from '$lib/docs';
import { SITE } from '$lib/site';

export const prerender = true;

export function GET(): Response {
  const paths = [
    '/',
    '/playground',
    '/gallery',
    '/compare',
    '/use-cases',
    '/showcase',
    '/remotion-alternative',
    '/manim-alternative',
    '/ai-video-from-code',
    '/programmatic-video-rust',
    '/agents',
    ...agents.map((a) => `/agents/${a.slug}`),
    ...skills.map((s) => `/agents/skills/${s.name}`),
    ...pages.map((p) => href(p.slug)),
  ];
  const urls = paths.map((p) => `  <url><loc>${SITE}${p}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}

// /sitemap.xml, prerendered from the docs list so new pages appear in it.
import { agents, skills } from '$lib/agents';
import { href, pages } from '$lib/docs';
import { exampleByName } from '$lib/examples';
import { galleryItems } from '$lib/gallery';
import { mediaFor } from '$lib/media';
import { SITE } from '$lib/site';

const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A <video:video> entry (Google video sitemap) for an example's video. */
function video(name: string, title: string, description: string): string {
  const m = mediaFor(name);
  if (!m) return '';
  return [
    '    <video:video>',
    `      <video:thumbnail_loc>${SITE}${m.poster}</video:thumbnail_loc>`,
    `      <video:title>${xml(title)}</video:title>`,
    `      <video:description>${xml(description)}</video:description>`,
    `      <video:content_loc>${SITE}${m.mp4}</video:content_loc>`,
    `      <video:duration>${Math.max(1, Math.round(m.seconds))}</video:duration>`,
    '    </video:video>',
  ].join('\n');
}

/** Videos shown on a page, keyed by path. */
const videos: Record<string, string[]> = {
  '/': [
    video(
      'showreel',
      'oxframe showreel',
      'Scenes from the oxframe examples, rendered by oxframe on the CPU: functions on axes, a lit 3D cube, a shear of the plane and a shader sea.',
    ),
  ],
  '/gallery': galleryItems.map((item) =>
    video(item.name, exampleByName(item.name)?.title ?? item.name, item.prompt),
  ),
};

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
  const urls = paths
    .map((p) => {
      const v = (videos[p] ?? []).filter(Boolean);
      return v.length
        ? `  <url>\n    <loc>${SITE}${p}</loc>\n${v.join('\n')}\n  </url>`
        : `  <url><loc>${SITE}${p}</loc></url>`;
    })
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}

import { error } from '@sveltejs/kit';
import { vsPage, vsPages } from '$lib/vs';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => vsPages.map((p) => ({ slug: p.slug }));

export const load: PageLoad = ({ params }) => {
  const p = vsPage(params.slug);
  if (!p) error(404, 'No such comparison');
  return { slug: p.slug };
};

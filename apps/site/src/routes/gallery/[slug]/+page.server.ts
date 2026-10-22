// One gallery example: its source, highlighted at build time. A server load,
// so each page carries only its own code.
import { error } from '@sveltejs/kit';
import { galleryItems, itemBySlug, slugOf } from '$lib/gallery';
import { usesOf } from '$lib/uses';
import type { EntryGenerator, PageServerLoad } from './$types';

const highlighted = import.meta.glob('../../../lib/examples/*.rs', {
  query: '?highlight',
  import: 'default',
  eager: true,
}) as Record<string, string>;
const sources = import.meta.glob('../../../lib/examples/*.rs', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const prerender = true;

export const entries: EntryGenerator = () => galleryItems.map((i) => ({ slug: slugOf(i.name) }));

export const load: PageServerLoad = ({ params }) => {
  const item = itemBySlug(params.slug);
  if (!item) error(404, 'No such example');
  const file = `../../../lib/examples/${item.name}.rs`;
  const source = sources[file];
  if (!source) error(404, `No source for ${item.name}`);
  return { name: item.name, code: highlighted[file]!, uses: usesOf(source) };
};

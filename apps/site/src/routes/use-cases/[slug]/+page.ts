import { error } from '@sveltejs/kit';
import { useCaseBySlug, useCases } from '$lib/use-cases';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => useCases.map((u) => ({ slug: u.slug }));

export const load: PageLoad = ({ params }) => {
  const useCase = useCaseBySlug(params.slug);
  if (!useCase) error(404, 'No such use case');
  return { slug: useCase.slug };
};

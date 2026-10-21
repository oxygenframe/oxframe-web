import { error } from '@sveltejs/kit';
import { agent, agents } from '$lib/agents';

export const entries = () => agents.map((a) => ({ agent: a.slug }));

export function load({ params }) {
  const page = agent(params.agent);
  if (!page) error(404, 'No such agent page');
  return { page };
}

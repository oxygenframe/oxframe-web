import { error } from '@sveltejs/kit';
import { skill, skills } from '$lib/agents';

export const entries = () => skills.map((s) => ({ skill: s.name }));

export function load({ params }) {
  const page = skill(params.skill);
  if (!page) error(404, 'No such skill');
  return { page };
}

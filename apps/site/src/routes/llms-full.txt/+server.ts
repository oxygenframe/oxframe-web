// /llms-full.txt (llmstxt.org): /llms.txt plus the full source of every
// guide lesson and example, so a model can learn the API from working code.
import { lessonExamples, showcaseExamples } from '$lib/examples';
import llms from '../../../static/llms.txt?raw';

export const prerender = true;

export function GET(): Response {
  const section = (title: string, list: typeof lessonExamples) =>
    `## ${title}\n\n` +
    list
      .map((e) => `### ${e.name}: ${e.title}\n\n\`\`\`rust\n${e.source.trimEnd()}\n\`\`\`\n`)
      .join('\n');
  const body = [
    llms.trimEnd(),
    section('Guide lessons (in order, each builds on the previous one)', lessonExamples),
    section('Examples', showcaseExamples),
  ].join('\n\n');
  return new Response(`${body}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

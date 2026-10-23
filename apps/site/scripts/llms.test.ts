import { describe, expect, test } from 'bun:test';

import { llmsIndex, pageText } from './llms';

describe('llms', () => {
  test('the index points at the full dump', () => {
    const text = llmsIndex(
      'https://oxframe.dev/docs',
      'https://oxframe.dev/llms-full.txt',
      [
        {
          title: 'Guide',
          pages: [{ slug: 'guide/components', title: 'Components', description: 'Title cards.' }],
        },
      ],
      '0.20.5',
    );
    expect(text).toContain('llms-full.txt');
    expect(text).toContain('https://oxframe.dev/docs/guide/components');
    expect(text).toContain('oxframe 0.20.5, pre-1.0');
  });

  test('a svelte page becomes readable text', () => {
    const text = pageText('<h1>Hello</h1><p>A {`circle`}</p><script>hidden</script>');
    expect(text).toContain('Hello');
    expect(text).toContain('circle');
    expect(text).not.toContain('hidden');
  });
});

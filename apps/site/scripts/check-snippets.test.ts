import { expect, test } from 'bun:test';
import { isRust, snippets, split, statements, wrap } from './check-snippets';

test('shell, TOML and template commands are not Rust', () => {
  expect(isRust('oxframe render --gpu')).toBe(false);
  expect(isRust('oxframe = { version = "…", features = ["math"] }')).toBe(false);
  expect(isRust('[check]\nmin_contrast = 4.5')).toBe(false);
  expect(isRust('${INSTALL_CLI}')).toBe(false);
  expect(isRust('docker run --rm -v "$PWD:/work" ghcr.io/oxygenframe/oxframe oxframe render')).toBe(
    false,
  );
  expect(isRust('jobs:\n  video:\n    runs-on: ubuntu-latest')).toBe(false);
  expect(isRust('ball.x().to(400.0, 1.0).await;')).toBe(true);
});

test('setup, after and skip comments attach to the next block', () => {
  const page = `<pre><code>{\`let a = view.add(Circle::new());\`}</code></pre>
<!-- snippet-after: 0 -->
<!-- snippet-setup: let b = a; -->
<pre><code
    >{\`b.fade_in().await;\`}</code
  ></pre>
<!-- snippet-skip: pseudo-code -->
<pre><code>a.something(...);</code></pre>`;
  const [first, second, third] = snippets('p', page);
  expect(first!.setup).toBe('');
  expect(second!.setup).toBe('let a = view.add(Circle::new());\nlet b = a;');
  expect(second!.code).toBe('b.fade_in().await;');
  expect(third!.skip).toBe('pseudo-code');
});

test('HTML entities in a plain block are decoded', () => {
  const [s] = snippets(
    'p',
    '<pre><code>stagger(0.1, &amp;wave, |c| c.pop_in()).await;</code></pre>',
  );
  expect(s!.code).toBe('stagger(0.1, &wave, |c| c.pop_in()).await;');
});

test('items go to module level, statements into the scene function', () => {
  const { items, stmts } = split(
    'struct A;\nimpl A {\n    fn f(&self) {}\n}\n\nlet a = A;\na.f();',
  );
  expect(items).toBe('struct A;\nimpl A {\n    fn f(&self) {}\n}');
  expect(stmts).toBe('let a = A;\na.f();');
});

test('a builder chain and a reference list become statements', () => {
  expect(statements('Project::new("x")\n    .scene(intro())')).toBe(
    'let _ = Project::new("x")\n    .scene(intro());',
  );
  expect(statements('Rect::new().z_index(-1.0)   // below\nlabel.fade_in().await')).toBe(
    'let _ = Rect::new().z_index(-1.0); // below\nlabel.fade_in().await;',
  );
  expect(statements('let a = 1;\na.max(2);')).toBe('let a = 1;\na.max(2);');
});

test('a wrapped snippet has the prelude and its own module', () => {
  const out = wrap({
    page: '3d/+page.svelte',
    index: 2,
    code: 'cube.fade_in().await;',
    setup: 'let cube = 1;',
    skip: null,
  });
  expect(out).toContain('mod s_3d_2 {');
  expect(out).toContain('use oxframe::prelude::*;');
  expect(out).toContain('async fn snippet(view: View) {\nlet cube = 1;\ncube.fade_in().await;\n}');
});

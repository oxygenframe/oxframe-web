// Which parts of oxframe an example uses, each with the docs page about it.
// The gallery pages list them, so an example leads to the docs it shows off.
import { href } from './docs';
import { exampleByName } from './examples';
import { galleryItems, slugOf } from './gallery';

interface Use {
  label: string;
  slug: string;
  /** Matches the example's source when it uses this part. */
  test: RegExp;
}

const USES: Use[] = [
  {
    label: 'Components',
    slug: 'guide/components',
    test: /\b(TitleCard|BulletList|LowerThird|EndCard|ChapterMarker|Callout|CodeExplainer|FlowDiagram)::/,
  },
  { label: 'Charts and plots', slug: 'charts', test: /\b(Axes|NumberLine)::|\.plot\(|\.bars\(/ },
  {
    label: 'Matrices and tables',
    slug: 'matrices',
    test: /\b(Matrix|Table)::|apply_matrix|\.vector\(/,
  },
  { label: '3D', slug: '3d', test: /\b(View3d|Scene3d|Mesh)::/ },
  { label: 'Camera', slug: 'camera', test: /\bCamera::/ },
  { label: 'Icons', slug: 'icons', test: /\bicon!\(/ },
  { label: 'Presentations', slug: 'presentations', test: /\bslide_break\(|\bnotes\(/ },
  { label: 'Shaders', slug: 'guide/shaders', test: /\bshaders::|\bShader::|\.effect\(/ },
  { label: 'Sound and voice', slug: 'guide/sound', test: /\bsound\(|\bvoice\(|Audio::track/ },
  { label: 'Scenes and transitions', slug: 'guide/scenes', test: /\btransition\(/ },
  { label: 'Text', slug: 'guide/text', test: /\bTxt::|\bspan\(|\.morph_to\(/ },
  { label: 'Code', slug: 'nodes', test: /\bCode::/ },
  {
    label: 'Groups and layout',
    slug: 'guide/groups',
    test: /\b(Layout|Group)::|\.next_to\(|\.to_edge\(/,
  },
  {
    label: 'Drawing and morphing',
    slug: 'guide/drawing',
    test: /\.draw_on\(|\.data\(\)\.to\(|\bPath::/,
  },
  { label: 'Together and in order', slug: 'guide/together', test: /\ball\(|\bstagger\(|\bany\(/ },
  { label: 'Signals', slug: 'guide/signals', test: /\bSignal::new|\.bind\(/ },
  {
    label: 'Randomness and background tasks',
    slug: 'guide/random',
    test: /\brandom(_range)?\(|\.rng\(|\bspawn\(|\bParticles::/,
  },
  { label: 'Markers, eases, tunables', slug: 'timing', test: /\bwait_until\(|\btune!\(|\bease!\(/ },
  {
    label: 'Effects',
    slug: 'effects',
    test: /\.(blur|clip|blend|glow|shadow|fill_gradient|dash)\(/,
  },
  { label: 'Your own node', slug: 'custom-nodes', test: /#\[derive\(Node\)\]/ },
  { label: 'Video in a scene', slug: 'nodes', test: /\bVideo::/ },
  { label: 'SVG', slug: 'nodes', test: /\bSvg::/ },
];

/** The docs pages for the parts of oxframe that `source` uses, in reading order. */
export function usesOf(source: string): { label: string; href: string }[] {
  const seen = new Set<string>();
  return USES.filter((u) => u.test.test(source))
    .filter((u) => !seen.has(u.label) && seen.add(u.label))
    .map((u) => ({ label: u.label, href: href(u.slug) }));
}

/** Up to six gallery examples that use what the docs page `slug` is about. */
export function examplesUsing(slug: string): { title: string; href: string }[] {
  const page = href(slug);
  return galleryItems
    .filter((item) => {
      const source = exampleByName(item.name)?.source;
      return source !== undefined && usesOf(source).some((u) => u.href === page);
    })
    .slice(0, 6)
    .map((item) => ({ title: item.title, href: `/gallery/${slugOf(item.name)}` }));
}

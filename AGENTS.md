# Notes for coding agents

## SEO is a first-class requirement for apps/site

oxframe.dev lives on search and link previews. Every change to the site is
also an SEO change; treat a regression like a failing test.

- **Every indexable page renders `<Seo>`** (`src/lib/components/Seo.svelte`)
  exactly once: a unique title (≤ 65 chars, keyword first, "— oxframe" last)
  and a unique description (70–170 chars) saying what a searcher gets.
  Docs pages take both from `src/lib/docs.ts` via the docs layout — a new
  doc page means a new entry there with a `description`.
- **Content must be in the prerendered HTML.** Crawlers and link previews
  read the HTML before JS. Never put a page behind `ssr = false`; mount
  browser-only parts in `onMount` (see `routes/playground`), with a real
  `<h1>` and intro text in the shell.
- **One `<h1>` per page**, then `h2`/`h3` in order (restyle, don't skip
  levels). Images get meaningful `alt`. Link text says where it goes.
- **New routes go into `routes/sitemap.xml`** (docs pages are added
  automatically) and, if useful for agents, into `static/llms.txt`.
- **Canonical URLs**: `https://oxframe.dev`, no trailing slash, no query.
  Query-string variants (`/playground?ex=…`) canonicalize to the base page.
- **Structured data**: JSON-LD via `<Seo jsonld>` — SoftwareApplication on
  the home page, TechArticle + BreadcrumbList on docs, WebApplication on the
  playground. Keep facts in it true (versions, URLs).
- **Social card**: `static/og.png` (1200×630, `bun scripts/og-image.ts`).
- **Speed is ranking**: keep heavy code (Monaco, the engine) lazy and off
  pages that don't need it.
- Non-production pages and errors are `noindex`.
- **Mobile**: nothing may scroll sideways at 320 px (e2e: "no page is wider
  than a phone screen"). Wrap rows, let wide tables and code scroll.

`apps/site/e2e/docs.spec.ts` ("every sitemap page has complete, unique SEO
metadata") enforces most of this; extend it when you add a rule.

## Versioned docs

The docs at `/docs/…` describe the SDK version in `apps/site/src/lib/sdk.ts`
(the playground builds with the same one). Older minor versions are
snapshots at `/docs/<series>/…`; `/docs/<current series>/…` 301-redirects to
`/docs/…` (`apps/site/redirects.ts`), so version-pinned links always work.

- The version switcher lists the current docs plus the snapshots
  (`src/lib/docs-archive/`), labelled with the newest published patch from
  crates.io (`src/lib/versions.json`, refreshed by `scripts/crate-versions.ts`
  on every build, kept as is when crates.io is unreachable).
- **Releasing a new minor version (0.1 → 0.2):** first
  `bun scripts/archive-docs.ts 0.1` (snapshot of the 0.1 docs, links
  rewritten), then `bun run format`, then bump `src/lib/sdk.ts` and change the
  docs for 0.2. Patch releases only bump `sdk.ts`.
  Bumping `sdk.ts` redeploys both the site and compile.oxframe.dev (new
  container image, ~30–40 min); in between the playground says it is being
  upgraded.
- Archived pages are canonicalized to the current page and stay out of the
  sitemap; "API reference" links to docs.rs for the selected version.

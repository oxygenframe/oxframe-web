// Renders static/og.png, the 1200×630 link preview (Open Graph / Twitter).
// Rerun after changing the tagline: bun scripts/og-image.ts
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const frame = readFileSync(join(import.meta.dir, '../static/hero-poster.png')).toString('base64');
const html = `<!doctype html><html><body style="margin:0">
<div style="width:1200px;height:630px;box-sizing:border-box;padding:64px 72px;
  background:#111214;color:#ececee;font-family:Inter,system-ui,sans-serif;
  display:flex;gap:48px;align-items:center">
  <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between;height:100%">
    <div style="display:flex;align-items:center;gap:18px">
      <svg width="64" height="64" viewBox="0 0 32 32"><rect x="3" y="9" width="14" height="14" rx="3" fill="#e13238"/><circle cx="22" cy="16" r="7" fill="#68abdf"/></svg>
      <span style="font-size:48px;font-weight:700;letter-spacing:-1px">oxframe</span>
    </div>
    <div>
      <div style="font-size:52px;font-weight:700;line-height:1.08;letter-spacing:-1.5px">
        Motion graphics your<br>AI agent can see</div>
      <div style="margin-top:18px;font-size:24px;color:#a9abb3">
        Code in Rust · a live editor · a check the agent can read</div>
    </div>
    <div style="font-family:ui-monospace,Menlo,monospace;font-size:24px;color:#6cb2eb">oxframe.dev</div>
  </div>
  <img alt="" src="data:image/png;base64,${frame}" style="width:520px;height:292px;object-fit:cover;border-radius:16px;border:1px solid #2e3036"/>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: join(import.meta.dir, '../static/og.png') });
await browser.close();
console.log('static/og.png');

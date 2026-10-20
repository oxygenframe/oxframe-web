// Renders static/og.png, the 1200×630 link preview (Open Graph / Twitter).
// Rerun after changing the tagline: bun scripts/og-image.ts
import { chromium } from '@playwright/test';
import { join } from 'node:path';

const html = `<!doctype html><html><body style="margin:0">
<div style="width:1200px;height:630px;box-sizing:border-box;padding:72px 80px;
  background:#111214;color:#ececee;font-family:Inter,system-ui,sans-serif;
  display:flex;flex-direction:column;justify-content:space-between">
  <div style="display:flex;align-items:center;gap:22px">
    <svg width="84" height="84" viewBox="0 0 32 32"><rect x="3" y="9" width="14" height="14" rx="3" fill="#e13238"/><circle cx="22" cy="16" r="7" fill="#68abdf"/></svg>
    <span style="font-size:60px;font-weight:700;letter-spacing:-1px">oxframe</span>
  </div>
  <div>
    <div style="font-size:68px;font-weight:700;line-height:1.08;letter-spacing:-1.5px">
      Motion graphics and<br>animation in Rust</div>
    <div style="margin-top:22px;font-size:30px;color:#a9abb3">
      Live editor · browser playground · deterministic video</div>
  </div>
  <div style="font-family:ui-monospace,Menlo,monospace;font-size:28px;color:#6cb2eb">oxframe.dev</div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: join(import.meta.dir, '../static/og.png') });
await browser.close();
console.log('static/og.png');

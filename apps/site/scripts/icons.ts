// Renders the raster icons from static/favicon.svg: PNG favicons (Google
// shows a favicon in results only from a square icon, a multiple of 48 px),
// favicon.ico for clients that ask for it, the Apple touch icon, and the
// 512 px logo that the Organization JSON-LD points at.
// Rerun after changing the mark: bun scripts/icons.ts
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(import.meta.dir, '../static');
const svg = readFileSync(join(dir, 'favicon.svg'), 'utf8');

/** `size` px PNG of the mark, `pad` px inside the edge, on `bg` (or clear). */
async function render(size: number, pad = 0, bg?: string): Promise<Buffer> {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const inner = size - 2 * pad;
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:${bg ?? 'transparent'}">
<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">
${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`,
  );
  const png = await page.screenshot({ omitBackground: !bg });
  await page.close();
  return png;
}

/** An .ico holding one PNG, which every current browser and crawler reads. */
function ico(png: Buffer, size: number): Buffer {
  const head = Buffer.alloc(6 + 16);
  head.writeUInt16LE(0, 0); // reserved
  head.writeUInt16LE(1, 2); // type: icon
  head.writeUInt16LE(1, 4); // one image
  head.writeUInt8(size % 256, 6); // width (0 means 256)
  head.writeUInt8(size % 256, 7); // height
  head.writeUInt16LE(1, 10); // color planes
  head.writeUInt16LE(32, 12); // bits per pixel
  head.writeUInt32LE(png.length, 14); // image size
  head.writeUInt32LE(head.length, 18); // image offset
  return Buffer.concat([head, png]);
}

const browser = await chromium.launch();
for (const size of [48, 96, 192]) {
  writeFileSync(join(dir, `favicon-${size}.png`), await render(size));
}
writeFileSync(join(dir, 'logo-512.png'), await render(512, 24));
writeFileSync(join(dir, 'apple-touch-icon.png'), await render(180, 18, '#111214'));
writeFileSync(join(dir, 'favicon.ico'), ico(await render(48), 48));
await browser.close();
console.log('wrote favicon-{48,96,192}.png, favicon.ico, apple-touch-icon.png, logo-512.png');

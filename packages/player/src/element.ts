// <oxframe-player>: plays an oxframe scene compiled to wasm, on any page.
//
//   <script type="module" src="https://oxframe.dev/player.js"></script>
//   <oxframe-player build="<id from compile.oxframe.dev>" controls loop></oxframe-player>
//
// The scene runs in a Web Worker (player-worker.js, next to this file), so a
// slow or hanging scene never blocks the page. Nothing loads until the
// player scrolls near the viewport.

import { InPageWasm } from '@oxframe/backends';
import type { Frame } from '@oxframe/backends';
import { type Event as EngineEvent, PROTOCOL_VERSION } from '@oxframe/protocol';

const DEFAULT_COMPILE = 'https://compile.oxframe.dev';
const VERSION = '0.1.0';

interface Example {
  name: string;
  source: string;
  status: string;
  js_url: string | null;
  wasm_url: string | null;
}

/**
 * The worker comes from next to this script. A page on another origin may
 * not start a worker from oxframe.dev directly, so there a same-origin blob
 * imports it.
 */
function createWorker(): Worker {
  const url = new URL('player-worker.js', import.meta.url);
  if (url.origin === location.origin) return new Worker(url, { type: 'module' });
  const blob = new Blob([`import ${JSON.stringify(url.href)};`], { type: 'text/javascript' });
  return new Worker(URL.createObjectURL(blob), { type: 'module' });
}

const STYLE = `
:host { display: block; position: relative; aspect-ratio: var(--ratio, 16 / 9); background: #111; color: #eee;
  font: 13px/1.4 system-ui, sans-serif; border-radius: 8px; overflow: hidden; contain: content; }
canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; cursor: pointer; }
.msg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  padding: 16px; text-align: center; white-space: pre-wrap; color: #aaa; }
.msg:empty { display: none; }
.bar { position: absolute; left: 0; right: 0; bottom: 0; display: flex; gap: 8px; align-items: center;
  padding: 6px 10px; background: linear-gradient(transparent, rgb(0 0 0 / .65)); opacity: 0; transition: opacity .2s; }
:host(:hover) .bar, :host(:focus-within) .bar, :host([data-paused]) .bar { opacity: 1; }
:host(:not([controls])) .bar { display: none; }
button { all: unset; cursor: pointer; width: 24px; height: 24px; display: grid; place-items: center; border-radius: 4px; }
button:focus-visible { outline: 2px solid #68abdf; }
svg { width: 18px; height: 18px; fill: currentColor; }
input { flex: 1; min-width: 0; accent-color: #68abdf; }
.time { font-variant-numeric: tabular-nums; white-space: nowrap; }
a { color: inherit; opacity: .7; text-decoration: none; font-size: 11px; }
`;
const PLAY = '<svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg>';
const PAUSE = '<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>';

const clock = (s: number) => {
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(1).padStart(4, '0')}`;
};

export class OxframePlayer extends HTMLElement {
  static observedAttributes = ['build', 'js', 'wasm', 'example'];

  private backend: InPageWasm | null = null;
  private readonly canvas: HTMLCanvasElement;
  private readonly msg: HTMLElement;
  private readonly button: HTMLButtonElement;
  private readonly range: HTMLInputElement;
  private readonly time: HTMLElement;
  private fps = 60;
  private frames = 0;
  private frame = 0;
  private playing = false;
  private ready = false;
  private visible = false;
  private started = false;
  /** Playing when it scrolled out of view, to resume when it comes back. */
  private resume = false;
  /** Set between the end of playback and the last frame being shown. */
  private holdEnd = false;
  private seekedAt = 0;
  private readonly observer: IntersectionObserver;
  private readonly resize: ResizeObserver;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${STYLE}</style><canvas part="canvas"></canvas><div class="msg" part="message"></div>
<div class="bar" part="controls"><button type="button" aria-label="Play">${PLAY}</button>
<input type="range" min="0" max="0" value="0" step="1" aria-label="Time">
<span class="time">0:00.0</span><a href="https://oxframe.dev" target="_blank" rel="noopener">oxframe</a></div>`;
    this.canvas = root.querySelector('canvas')!;
    this.msg = root.querySelector('.msg')!;
    this.button = root.querySelector('button')!;
    this.range = root.querySelector('input')!;
    this.time = root.querySelector('.time')!;
    this.canvas.addEventListener('click', () => this.toggle());
    this.button.addEventListener('click', () => this.toggle());
    this.range.addEventListener('input', () => this.seekFrame(Number(this.range.value)));
    this.addEventListener('keydown', (e) => {
      if (e.key === ' ' && e.target === this) {
        e.preventDefault();
        this.toggle();
      }
    });
    this.observer = new IntersectionObserver(
      ([entry]) => this.onVisible(entry?.isIntersecting ?? false),
      { rootMargin: '200px' },
    );
    this.resize = new ResizeObserver(() => this.sendViewport());
  }

  connectedCallback(): void {
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.toggleAttribute('data-paused', true);
    if (!this.msg.textContent) this.msg.textContent = 'Loading…';
    this.observer.observe(this);
    this.resize.observe(this);
  }

  disconnectedCallback(): void {
    this.observer.disconnect();
    this.resize.disconnect();
    this.stop();
  }

  attributeChangedCallback(): void {
    if (this.started) {
      this.stop();
      if (this.visible) void this.start();
    }
  }

  // ------------------------------------------------------------- public API

  /** Starts playback (loads the scene first if needed). */
  play(): void {
    this.resume = false;
    if (!this.ready) {
      this.setAttribute('autoplay', '');
      if (!this.started) void this.start();
      return;
    }
    if (this.frame >= this.frames - 1) this.seekFrame(0);
    this.backend?.send({ type: 'Play' });
  }

  pause(): void {
    this.resume = false;
    this.backend?.send({ type: 'Pause' });
  }

  get paused(): boolean {
    return !this.playing;
  }

  /** Length in seconds; 0 until the scene is loaded. */
  get duration(): number {
    return this.frames / this.fps;
  }

  get currentTime(): number {
    return this.frame / this.fps;
  }

  set currentTime(seconds: number) {
    this.seekFrame(Math.round(seconds * this.fps));
  }

  // ---------------------------------------------------------------- loading

  private onVisible(visible: boolean): void {
    this.visible = visible;
    if (visible && !this.started) void this.start();
    if (!visible && this.playing) {
      this.pause();
      this.resume = true;
    } else if (visible && this.resume) {
      this.play();
    }
  }

  private compileBase(): string {
    return (this.getAttribute('compile') ?? DEFAULT_COMPILE).replace(/\/+$/, '');
  }

  /** The build to play, from `build`, `js` + `wasm`, or `example`. */
  private async urls(): Promise<{ js: string; wasm: string }> {
    const js = this.getAttribute('js');
    const wasm = this.getAttribute('wasm');
    if (js && wasm)
      return { js: new URL(js, location.href).href, wasm: new URL(wasm, location.href).href };
    const base = this.compileBase();
    const build = this.getAttribute('build');
    if (build) {
      if (!/^[0-9a-f]{32}$/.test(build)) throw new Error(`build="${build}" is not a build id`);
      return {
        js: `${base}/api/artifact/${build}/bundle.js`,
        wasm: `${base}/api/artifact/${build}/bundle.wasm`,
      };
    }
    const name = this.getAttribute('example');
    if (name) {
      const list = (await (await fetch(`${base}/api/examples`)).json()) as Example[];
      const ex = list.find((e) => e.name === name);
      if (!ex) throw new Error(`there is no example "${name}"`);
      if (ex.status === 'done' && ex.js_url && ex.wasm_url)
        return { js: ex.js_url, wasm: ex.wasm_url };
      // Right after an oxframe release the examples are rebuilt (a few minutes).
      throw new Error(`example "${name}" is being rebuilt; reload in a few minutes`);
    }
    throw new Error('set build="…" (or js and wasm) to choose a scene');
  }

  private async start(): Promise<void> {
    this.started = true;
    let urls: { js: string; wasm: string };
    try {
      urls = await this.urls();
    } catch (e) {
      this.fail(e instanceof Error ? e.message : String(e));
      return;
    }
    if (!this.started) return;
    const backend = new InPageWasm({ jsUrl: urls.js, wasmUrl: urls.wasm, createWorker });
    this.backend = backend;
    backend.connect({
      status: (s) => {
        if (s.state === 'open')
          backend.send({
            type: 'Hello',
            protocol_version: PROTOCOL_VERSION,
            ui_version: `player ${VERSION}`,
          });
        else if (s.state === 'closed' && this.backend === backend && !this.msg.textContent)
          this.fail(s.reason);
      },
      event: (e) => this.onEvent(e),
      frame: (f) => this.onFrame(f),
    });
  }

  private stop(): void {
    this.started = false;
    this.ready = false;
    this.playing = false;
    const b = this.backend;
    this.backend = null;
    b?.close();
  }

  private fail(message: string): void {
    this.msg.textContent = `This scene cannot play: ${message}`;
    this.dispatchEvent(new CustomEvent('error', { detail: { message } }));
  }

  // ---------------------------------------------------------------- engine

  private onEvent(e: EngineEvent): void {
    switch (e.type) {
      case 'Ready': {
        this.fps = e.fps;
        const [w, h] = e.size;
        this.style.setProperty('--ratio', `${w} / ${h}`);
        this.ready = true;
        this.sendViewport();
        const at = Number(this.getAttribute('at') ?? 0);
        this.frame = Math.max(0, Math.round((Number.isFinite(at) ? at : 0) * this.fps));
        this.backend?.send({ type: 'Seek', frame: this.frame });
        this.dispatchEvent(new Event('ready'));
        const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (this.hasAttribute('autoplay') && !still && this.visible)
          this.backend?.send({ type: 'Play' });
        break;
      }
      case 'Timeline':
        this.frames = e.frames;
        this.range.max = String(Math.max(0, e.frames - 1));
        this.showTime();
        break;
      case 'Frame': {
        // The engine loops by itself: a frame before the last one means it
        // went past the end (unless a seek just moved the playhead back).
        const wrapped =
          this.playing && e.index < this.frame && performance.now() - this.seekedAt > 250;
        this.frame = e.index;
        this.showTime();
        this.dispatchEvent(new Event('timeupdate'));
        if (wrapped) {
          if (!this.hasAttribute('loop')) {
            this.holdEnd = true;
            this.backend?.send({ type: 'Pause' });
            this.seekFrame(this.frames - 1);
          }
          this.dispatchEvent(new Event('ended'));
        }
        break;
      }
      case 'Playback': {
        const was = this.playing;
        this.playing = e.playing;
        this.frame = e.frame;
        this.button.innerHTML = e.playing ? PAUSE : PLAY;
        this.button.setAttribute('aria-label', e.playing ? 'Pause' : 'Play');
        this.toggleAttribute('data-paused', !e.playing);
        this.showTime();
        if (e.playing && !was) this.dispatchEvent(new Event('play'));
        if (!e.playing && was) this.dispatchEvent(new Event('pause'));
        break;
      }
      case 'Error':
        this.fail(e.message);
        break;
    }
  }

  private onFrame(f: Frame): void {
    const { image } = f;
    // Stopping at the end: skip the frames from after the wrap.
    if (this.holdEnd) {
      if (f.header.frame !== this.frames - 1) {
        image.close?.();
        return;
      }
      this.holdEnd = false;
    }
    if (this.canvas.width !== image.width || this.canvas.height !== image.height) {
      this.canvas.width = image.width;
      this.canvas.height = image.height;
    }
    this.canvas.getContext('2d')?.drawImage(image, 0, 0);
    image.close?.();
    if (this.msg.textContent && this.ready) this.msg.textContent = '';
  }

  private toggle(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  private seekFrame(frame: number): void {
    const last = Math.max(0, this.frames - 1);
    this.frame = Math.max(0, Math.min(last, Math.round(frame)));
    this.seekedAt = performance.now();
    if (this.frame !== last) this.holdEnd = false;
    this.backend?.send({ type: 'Seek', frame: this.frame });
    this.showTime();
  }

  private sendViewport(): void {
    if (!this.ready) return;
    const { width, height } = this.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    this.backend?.send({
      type: 'SetViewport',
      w: Math.round(width),
      h: Math.round(height),
      dpr: devicePixelRatio || 1,
    });
  }

  private showTime(): void {
    this.range.value = String(this.frame);
    this.time.textContent = `${clock(this.frame / this.fps)} / ${clock(this.frames / this.fps)}`;
  }
}

if (!customElements.get('oxframe-player')) customElements.define('oxframe-player', OxframePlayer);

declare global {
  interface HTMLElementTagNameMap {
    'oxframe-player': OxframePlayer;
  }
}

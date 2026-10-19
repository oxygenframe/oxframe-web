import { COMPILE_URL, SDK_VERSION } from './config';

export interface CompileError {
  file: string;
  line: number;
  column: number;
  message: string;
}

export interface CompileResult {
  id: string;
  status: 'queued' | 'building' | 'done' | 'error';
  wasm_url: string | null;
  js_url: string | null;
  errors: CompileError[];
  log?: string;
}

export interface Example {
  name: string;
  title: string;
  source: string;
  id: string;
  status: CompileResult['status'] | 'missing';
  wasm_url: string | null;
  js_url: string | null;
}

/** Compiles on the service; polls if the build outlives the request. */
export async function compile(source: string, signal?: AbortSignal): Promise<CompileResult> {
  const res = await fetch(`${COMPILE_URL}/api/compile`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ source, sdk_version: SDK_VERSION }),
    signal,
  });
  if (res.status === 429) {
    const retry = res.headers.get('retry-after');
    throw new Error(`Too many builds — try again in ${retry ?? 'a few'} s.`);
  }
  if (!res.ok)
    throw new Error(
      ((await res.json().catch(() => ({}))) as { error?: string }).error ?? res.statusText,
    );
  let r = (await res.json()) as CompileResult;
  while (r.status === 'queued' || r.status === 'building') {
    await new Promise((ok) => setTimeout(ok, 1000));
    if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
    r = (await (
      await fetch(`${COMPILE_URL}/api/compile/${r.id}`, { signal })
    ).json()) as CompileResult;
  }
  return r;
}

export async function examples(): Promise<Example[]> {
  const res = await fetch(`${COMPILE_URL}/api/examples`);
  if (!res.ok) throw new Error(res.statusText);
  return (await res.json()) as Example[];
}

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

/** Share links carry the source in the URL hash (never sent to a server). */
export function encodeShare(source: string): string {
  return `#code=${compressToEncodedURIComponent(source)}`;
}

export function decodeShare(hash: string): string | null {
  const m = /[#&]code=([^&]+)/.exec(hash);
  if (!m?.[1]) return null;
  return decompressFromEncodedURIComponent(m[1]) || null;
}

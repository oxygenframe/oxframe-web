// Rendered videos of the gallery examples, served from R2 at /media/
// (scripts/render-media.ts writes media.json after uploading them).
import data from './media.json';
import { SITE } from './site';

export interface MediaItem {
  mp4: string;
  poster: string;
  seconds: number;
  width: number;
  height: number;
  bytes: number;
  /** Captions of a video with sound; a silent video has none. */
  captions?: string;
  /** The spoken lines as plain text (VideoObject.transcript). */
  transcript?: string;
}

const items = data.items as Record<string, MediaItem>;

/** The video of example `name`, if one has been rendered. */
export const mediaFor = (name: string): MediaItem | undefined => items[name];

/**
 * Videos shorter than this are loops that decorate their page (a one-second
 * gallery example), not videos to offer search engines: they stay on the
 * page but out of the video sitemap and VideoObject markup.
 */
export const MIN_INDEXED_SECONDS = 3;

/** The video of example `name` when it is long enough to index as a video. */
export const indexedMediaFor = (name: string): MediaItem | undefined => {
  const m = mediaFor(name);
  return m && m.seconds >= MIN_INDEXED_SECONDS ? m : undefined;
};

/** schema.org VideoObject for an example's video, for search results. */
export function videoObject(name: string, title: string, description: string): object | null {
  const m = indexedMediaFor(name);
  if (!m) return null;
  return {
    '@type': 'VideoObject',
    name: title,
    description,
    thumbnailUrl: `${SITE}${m.poster}`,
    contentUrl: `${SITE}${m.mp4}`,
    uploadDate: `${data.date}T00:00:00+00:00`,
    duration: `PT${m.seconds.toFixed(1)}S`,
    width: m.width,
    height: m.height,
    ...(m.transcript ? { transcript: m.transcript } : {}),
  };
}

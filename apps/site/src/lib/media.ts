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
}

const items = data.items as Record<string, MediaItem>;

/** The video of example `name`, if one has been rendered. */
export const mediaFor = (name: string): MediaItem | undefined => items[name];

/** schema.org VideoObject for an example's video, for search results. */
export function videoObject(name: string, title: string, description: string): object | null {
  const m = mediaFor(name);
  if (!m) return null;
  return {
    '@type': 'VideoObject',
    name: title,
    description,
    thumbnailUrl: `${SITE}${m.poster}`,
    contentUrl: `${SITE}${m.mp4}`,
    uploadDate: data.date,
    duration: `PT${m.seconds.toFixed(1)}S`,
    width: m.width,
    height: m.height,
  };
}

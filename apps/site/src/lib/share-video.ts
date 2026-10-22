// Share with video: the playground's MP4 and a poster go to /api/share
// (apps/site/worker/share.ts), which answers with a /s/<id> link whose
// preview plays the video in Discord and Slack.

/** Longest video a share takes (the Worker checks it too). */
export const MAX_SHARE_SECONDS = 30;
/** Bitrate of a shared export: 30 s stay under the Worker's 16 MB. */
export const SHARE_BITRATE = 3_000_000;

/** A JPEG of the frame at 60 % of `video`, and the video's length. */
export async function posterOf(video: Blob): Promise<{ poster: Blob; seconds: number }> {
  const url = URL.createObjectURL(video);
  try {
    const el = document.createElement('video');
    el.muted = true;
    el.preload = 'auto';
    el.src = url;
    await new Promise<void>((resolve, reject) => {
      el.onloadedmetadata = () => resolve();
      el.onerror = () => reject(new Error('the exported video does not play here'));
    });
    const seconds = el.duration;
    await new Promise<void>((resolve) => {
      el.onseeked = () => resolve();
      el.currentTime = seconds * 0.6;
    });
    const canvas = document.createElement('canvas');
    canvas.width = el.videoWidth;
    canvas.height = el.videoHeight;
    canvas.getContext('2d')!.drawImage(el, 0, 0);
    const poster = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('no poster'))), 'image/jpeg', 0.85),
    );
    return { poster, seconds };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Uploads a shared video; the `/s/<id>` link, or the server's reason. */
export async function uploadShare(video: Blob, poster: Blob, code: string): Promise<string> {
  const body = new FormData();
  body.set('video', video, 'scene.mp4');
  body.set('poster', poster, 'poster.jpg');
  body.set('code', code);
  const res = await fetch('/api/share', { method: 'POST', body });
  const out = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !out.url) throw new Error(out.error ?? `sharing failed (${res.status})`);
  return out.url;
}

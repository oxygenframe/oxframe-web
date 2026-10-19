/** Mapping between frame pixels (project size, top-left origin) and
 *  viewport CSS pixels, given zoom and pan. */
export interface ViewTransform {
  scale: number;
  ox: number;
  oy: number;
}

export function viewTransform(
  size: [number, number],
  container: { w: number; h: number },
  zoom: number,
  panX: number,
  panY: number,
): ViewTransform {
  const fit = Math.min(container.w / size[0], container.h / size[1]);
  const scale = fit * zoom;
  return {
    scale,
    ox: container.w / 2 - (size[0] * scale) / 2 + panX,
    oy: container.h / 2 - (size[1] * scale) / 2 + panY,
  };
}

export function toFrame(v: ViewTransform, x: number, y: number): [number, number] {
  return [(x - v.ox) / v.scale, (y - v.oy) / v.scale];
}

export function toScreen(v: ViewTransform, x: number, y: number): [number, number] {
  return [v.ox + x * v.scale, v.oy + y * v.scale];
}

/** Zoom around a screen point: returns the new pan so that point stays. */
export function zoomAround(
  size: [number, number],
  container: { w: number; h: number },
  zoom: number,
  panX: number,
  panY: number,
  newZoom: number,
  sx: number,
  sy: number,
): { panX: number; panY: number } {
  const before = viewTransform(size, container, zoom, panX, panY);
  const [fx, fy] = toFrame(before, sx, sy);
  const after = viewTransform(size, container, newZoom, 0, 0);
  const [nx, ny] = toScreen(after, fx, fy);
  return { panX: sx - nx, panY: sy - ny };
}

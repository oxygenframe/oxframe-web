// The theme chosen with the header's switch, applied before the page paints
// (loaded blocking from app.html). Without a choice the system's setting
// applies through CSS. The key is shared with the editor (@oxframe/editor-ui).
try {
  const t = localStorage.getItem('oxframe-theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch {
  // Storage blocked: follow the system.
}

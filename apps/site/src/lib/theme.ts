// Light or dark: the header's switch, the playground editor and Monaco share
// one choice, kept in localStorage under the editor's key and put on <html
// data-theme> (static/theme.js does that before the first paint).
export type Theme = 'light' | 'dark';

const KEY = 'oxframe-theme';
/** Fired on window when the theme changes; `detail` is the new theme. */
export const THEME_EVENT = 'oxframe-theme';

/** The theme on screen: the choice, else the system's setting. */
export function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  if (t === 'light' || t === 'dark') return t;
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/** Switches the page to `theme`, remembers it and tells the editors. */
export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Storage blocked: the choice lasts for this page.
  }
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
}

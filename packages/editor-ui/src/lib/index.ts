export { default as Editor } from './components/Editor.svelte';
export { default as Present } from './components/Present.svelte';
export { default as PresentNotes } from './components/PresentNotes.svelte';
export { Presentation, presentKey, type PresentStatus } from './present.svelte';
export { EditorState, formatTime, type EditorOptions, type EditorError } from './state.svelte';
export { cubicBezier, PRESETS } from './ease';
export { t } from './i18n';
export * as persist from './persist';

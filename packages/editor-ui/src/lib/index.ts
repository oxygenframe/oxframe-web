export { default as Editor } from './components/Editor.svelte';
export { EditorState, formatTime, type EditorOptions, type EditorError } from './state.svelte';
export { cubicBezier, PRESETS } from './ease';
export { t } from './i18n';
export * as persist from './persist';

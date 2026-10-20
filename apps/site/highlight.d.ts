export function guessLang(code: string): string;
export function inlineLang(code: string): string | null;
export function highlight(code: string, lang?: string): Promise<string>;
export function escapeBraces(html: string): string;
export function codeText(body: string): string | null;
export function highlightCode(): import('svelte/compiler').PreprocessorGroup;

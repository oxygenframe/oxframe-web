/** compile-service origin; set PUBLIC_COMPILE_URL at build time. */
export const COMPILE_URL: string =
  (import.meta.env.PUBLIC_COMPILE_URL as string | undefined) ?? 'http://127.0.0.1:8787';
export const SDK_VERSION = '0.1.0';

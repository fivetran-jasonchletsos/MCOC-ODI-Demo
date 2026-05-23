export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function asset(p: string | null | undefined): string | undefined {
  if (!p) return undefined;
  if (/^https?:\/\//.test(p)) return p;
  return `${BASE}${p}`;
}

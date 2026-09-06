import type { Locale } from "@agrivision/shared-types";

export function cropLabel(
  localNames: Record<string, string> | undefined | null,
  locale: Locale,
  fallback: string
): string {
  if (!localNames) return fallback;
  return localNames[locale] ?? localNames.hi ?? fallback;
}

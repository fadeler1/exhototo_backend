/** Corrige mojibake típico (UTF-8 leído como Latin-1): "25Â°" → "25°". */
export function fixLegacyEncoding(value: string | null | undefined): string {
  if (value == null || typeof value !== 'string') return '';
  if (!/[ÃÂ]/.test(value)) return value;
  try {
    const bytes = Buffer.from(value, 'latin1');
    return bytes.toString('utf8');
  } catch {
    return value;
  }
}

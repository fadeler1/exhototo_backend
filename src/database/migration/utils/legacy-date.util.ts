/**
 * Convierte fechas legacy `dd/MM/yyyy` (MySQL DILIGENCIA.FECHA) a Date.
 */
export function parseLegacyDate(value: string | Date | null | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;

  const trimmed = String(value).trim();
  const slashParts = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashParts) {
    const day = Number(slashParts[1]);
    const month = Number(slashParts[2]) - 1;
    const year = Number(slashParts[3]);
    return new Date(year, month, day);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

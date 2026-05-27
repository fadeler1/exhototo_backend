import { DILIGENCIA_DATE_FILTER_CODES } from '../../../../common/constants/diligencia.constants';

export interface DiligenciaFilterInput {
  fechaDesde?: Date;
  fechaHasta?: Date;
  diligenciaCodigo?: string;
}

/**
 * Construye $elemMatch para `diligencias` embebidas.
 * - Solo fechas: códigos legacy 1 y 2 (buscador histórico).
 * - Solo código: cualquier diligencia con ese tipo.
 * - Fechas + código: diligencia específica dentro del rango.
 */
export function buildDiligenciaElemMatch(
  filters: DiligenciaFilterInput,
): Record<string, unknown> | null {
  const codigo = filters.diligenciaCodigo?.trim();
  const hasFecha = Boolean(filters.fechaDesde && filters.fechaHasta);
  const hasCodigo = Boolean(codigo);

  if (!hasFecha && !hasCodigo) {
    return null;
  }

  const elemMatch: Record<string, unknown> = {};

  if (hasCodigo) {
    elemMatch.codigo = codigo;
  } else if (hasFecha) {
    elemMatch.codigo = { $in: [...DILIGENCIA_DATE_FILTER_CODES] };
  }

  if (hasFecha) {
    elemMatch.fecha = {
      $gte: filters.fechaDesde,
      $lte: filters.fechaHasta,
    };
  }

  return elemMatch;
}

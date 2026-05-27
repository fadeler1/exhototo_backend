import { DiligenciaEntity } from '../../domain/interfaces/exhorto.repository.interface';

/** Orden cronológico como en el legacy PHP (por fecha ascendente). */
export function sortDiligenciasAsc<T extends { fecha: Date }>(diligencias: T[]): T[] {
  return [...diligencias].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
  );
}

export function sortDiligenciaEntities(
  diligencias: DiligenciaEntity[],
): DiligenciaEntity[] {
  return sortDiligenciasAsc(diligencias);
}

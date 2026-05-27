import { Types } from 'mongoose';
import { ExhortoEstado } from '../../../common/enums/exhorto-estado.enum';
import { ExhortoLegacySource } from '../../../common/enums/exhorto-legacy-source.enum';
import { sortDiligenciasAsc } from '../../../modules/exhortos/infrastructure/utils/sort-diligencias.util';
import type {
  MysqlBoletaReceptorRow,
  MysqlDiligenciaRow,
  MysqlExhortoRow,
} from '../migration.types';
import { parseLegacyDate } from './legacy-date.util';
import { parseDiligenciaLegacy } from './legacy-diligencia.util';
import type { LegacyUserResolver } from './legacy-user-resolver.util';

interface MappedDiligencia {
  codigo: string;
  etiqueta: string;
  etiquetaLegacy: string;
  fecha: Date;
  observaciones: string;
  usuario: string;
  usuarioId?: Types.ObjectId;
}

export function mapDiligenciasFromMysql(
  rows: MysqlDiligenciaRow[],
  defaultUsuario: string,
  userResolver?: LegacyUserResolver,
) {
  return sortDiligenciasAsc(
    rows.map((d) => {
      const parsed = parseDiligenciaLegacy(d.DILIGENCIA);
      const legacyUsuario = (d.USUARIO ?? defaultUsuario).toString().trim();
      const resolved = userResolver?.resolve(legacyUsuario) ?? {
        nombre: legacyUsuario || defaultUsuario,
      };

      const diligencia: MappedDiligencia = {
        codigo: parsed.codigo,
        etiqueta: parsed.etiqueta,
        etiquetaLegacy: parsed.etiquetaLegacy,
        fecha: parseLegacyDate(d.FECHA),
        observaciones: (d.OBSERVACIONES ?? '').toString().trim(),
        usuario: resolved.nombre,
        ...(resolved.userId ? { usuarioId: resolved.userId } : {}),
      };

      return diligencia;
    }),
  );
}

export function mapBoletasReceptorFromMysql(rows: MysqlBoletaReceptorRow[]) {
  return rows.map((b) => {
    const parsed = parseDiligenciaLegacy(b.DILIGENCIA);
    return {
      receptor: b.RECEPTOR.toString().trim(),
      documento: Number(b.DOCUMENTO),
      monto: Number(b.MONTO),
      diligenciaCodigo: parsed.codigo,
      diligenciaEtiquetaLegacy: parsed.etiquetaLegacy,
    };
  });
}

export function buildExhortoMongoDocument(
  row: MysqlExhortoRow,
  diligencias: MysqlDiligenciaRow[],
  boletasReceptor: MysqlBoletaReceptorRow[],
  userResolver?: LegacyUserResolver,
): Record<string, unknown> {
  const legacyUsuario = row.USUARIO?.toString().trim() ?? '';
  const resolved = userResolver?.resolve(legacyUsuario) ?? {
    nombre: legacyUsuario || 'migracion',
  };
  const defaultUsuario = resolved.nombre;
  const legacyId = Number(row.ID);

  const doc: Record<string, unknown> = {
    legacyMysqlId: legacyId,
    apellidoDeudor: row.APELLIDO_DEUDOR?.toString().trim() ?? '',
    nombreCliente: row.NOMBRE_CLIENTE?.toString().trim() ?? '',
    rut: row.RUT?.toString().trim() ?? '',
    tribunalOrigen: row.TRIBUNAL_ORIGEN?.toString().trim() ?? '',
    rolJuicio: row.ROL_JUICIO?.toString().trim() ?? '',
    ciudad: row.CIUDAD?.toString().trim() ?? '',
    facultades: row.FACULTADES?.toString().trim() ?? '',
    abogado: row.ABOGADO?.toString().trim() ?? '',
    createdByName: defaultUsuario,
    estado:
      Number(row.ESTADO) === 0
        ? ExhortoEstado.TERMINADO
        : ExhortoEstado.VIGENTE,
    diligencias: mapDiligenciasFromMysql(
      diligencias,
      defaultUsuario,
      userResolver,
    ),
    boletasReceptor: mapBoletasReceptorFromMysql(boletasReceptor),
    tieneBoletaHonorario: Number(row.BOLETA_HONORARIOS) === 1,
    tieneBoletaDevolucion: Number(row.BOLETA_DEVOLUCION) === 1,
    legacySource:
      row.legacySource === 'respaldo'
        ? ExhortoLegacySource.RESPALDO
        : ExhortoLegacySource.ACTIVO,
  };

  if (resolved.userId) {
    doc.createdById = resolved.userId as Types.ObjectId;
  }

  return doc;
}

export function groupByExhortoId<T extends { ID_EXHORTO: number }>(
  rows: T[],
): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const row of rows) {
    const key = Number(row.ID_EXHORTO);
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}

/** Cuenta filas cuyo USUARIO legacy no pudo vincularse a `users`. */
export function countUnmatchedLegacyUsuarios(
  exhortoRows: MysqlExhortoRow[],
  diligenciaRows: MysqlDiligenciaRow[],
  userResolver: LegacyUserResolver,
): number {
  let unmatched = 0;

  for (const row of exhortoRows) {
    const legacy = row.USUARIO?.toString().trim() ?? '';
    if (legacy && !userResolver.resolve(legacy).userId) {
      unmatched++;
    }
  }

  for (const row of diligenciaRows) {
    const legacy = row.USUARIO?.toString().trim() ?? '';
    if (legacy && !userResolver.resolve(legacy).userId) {
      unmatched++;
    }
  }

  return unmatched;
}

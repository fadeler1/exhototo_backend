import { existsSync } from 'fs';
import { join } from 'path';
import type {
  MysqlBoletaHonorarioRow,
  MysqlBoletaReceptorRow,
  MysqlDiligenciaRow,
  MysqlExhortoRow,
  MysqlUsuarioRow,
} from '../migration.types';
import {
  flattenInsertRows,
  parseSqlInsertsFromFile,
  type ParsedInsertBlock,
} from './sql-insert.parser';

export const DEFAULT_SQL_BUNDLE_FILE = 'ctr17658_EXHORTO.sql';

/** Nombres en mayúsculas (como los agrupa `groupBlocksByTable`). */
const BUNDLE_TABLES = {
  exhortos: 'EXHORTO',
  exhortosRespaldo: 'RESPALDO_EXHORTO',
  diligencias: 'DILIGENCIA',
  diligenciasRespaldo: 'RESPALDO_DILIGENCIA',
  boletasReceptor: 'BOLETA_RECEPTOR',
  boletasHonorario: 'BOLETA_HONORARIO',
  usuarios: 'USUARIO',
} as const;

export interface SqlBundleLoadOptions {
  /** Por defecto false: solo tablas activas EXHORTO + DILIGENCIA (base real). */
  includeRespaldo?: boolean;
}

export interface SqlBundleDataset {
  exhortos: MysqlExhortoRow[];
  diligencias: MysqlDiligenciaRow[];
  boletasReceptor: MysqlBoletaReceptorRow[];
  boletasHonorario: MysqlBoletaHonorarioRow[];
  usuarios: MysqlUsuarioRow[];
  counts: {
    exhortosActivos: number;
    exhortosRespaldo: number;
    diligenciasActivas: number;
    diligenciasRespaldo: number;
  };
}

export function resolveSqlBundlePath(
  sqlDir: string,
  bundleFile?: string,
): string | undefined {
  const file = bundleFile ?? DEFAULT_SQL_BUNDLE_FILE;
  const path = join(sqlDir, file);
  return existsSync(path) ? path : undefined;
}

/**
 * Lee el dump phpMyAdmin completo (ctr17658_EXHORTO.sql) una sola vez.
 * Por defecto usa solo EXHORTO + DILIGENCIA (los 2345 exhortos activos en MySQL).
 */
export function loadLegacyDatasetFromSqlBundle(
  bundlePath: string,
  options: SqlBundleLoadOptions = {},
): SqlBundleDataset {
  const includeRespaldo = options.includeRespaldo === true;
  const blocks = parseSqlInsertsFromFile(bundlePath);
  const rowsByTable = groupBlocksByTable(blocks);

  const exhortosActivos = rowsByTable.get(BUNDLE_TABLES.exhortos) ?? [];
  const activoIds = new Set(exhortosActivos.map((r) => Number(r.ID)));

  let exhortosRespaldo: Record<string, string | number | null>[] = [];
  if (includeRespaldo) {
    const exhortosRespaldoRaw =
      rowsByTable.get(BUNDLE_TABLES.exhortosRespaldo) ?? [];
    exhortosRespaldo = dedupeRowsById(
      exhortosRespaldoRaw.filter((r) => !activoIds.has(Number(r.ID))),
    );
  }

  const exhortos: MysqlExhortoRow[] = [
    ...tagExhortoRows(exhortosActivos, 'activo'),
    ...(includeRespaldo
      ? tagExhortoRows(exhortosRespaldo, 'respaldo')
      : []),
  ];

  const diligenciasActivas = rowsByTable.get(BUNDLE_TABLES.diligencias) ?? [];
  let diligenciasRespaldo: Record<string, string | number | null>[] = [];

  if (includeRespaldo) {
    const diligenciasRespaldoRaw =
      rowsByTable.get(BUNDLE_TABLES.diligenciasRespaldo) ?? [];
    const activoDilIds = new Set(diligenciasActivas.map((r) => Number(r.ID)));
    diligenciasRespaldo = dedupeRowsById(
      diligenciasRespaldoRaw.filter((r) => !activoDilIds.has(Number(r.ID))),
    );
  }

  const diligencias = [
    ...diligenciasActivas,
    ...diligenciasRespaldo,
  ] as unknown as MysqlDiligenciaRow[];

  return {
    exhortos: exhortos as unknown as MysqlExhortoRow[],
    diligencias,
    boletasReceptor: (rowsByTable.get(BUNDLE_TABLES.boletasReceptor) ??
      []) as unknown as MysqlBoletaReceptorRow[],
    boletasHonorario: (rowsByTable.get(BUNDLE_TABLES.boletasHonorario) ??
      []) as unknown as MysqlBoletaHonorarioRow[],
    usuarios: (rowsByTable.get(BUNDLE_TABLES.usuarios) ??
      []) as unknown as MysqlUsuarioRow[],
    counts: {
      exhortosActivos: exhortosActivos.length,
      exhortosRespaldo: exhortosRespaldo.length,
      diligenciasActivas: diligenciasActivas.length,
      diligenciasRespaldo: diligenciasRespaldo.length,
    },
  };
}

/** phpMyAdmin a veces repite el mismo ID en tablas respaldo; conserva la última fila. */
function dedupeRowsById(
  rows: Record<string, string | number | null>[],
): Record<string, string | number | null>[] {
  const map = new Map<number, Record<string, string | number | null>>();
  for (const row of rows) {
    map.set(Number(row.ID), row);
  }
  return [...map.values()];
}

function tagExhortoRows(
  rows: Record<string, string | number | null>[],
  legacySource: 'activo' | 'respaldo',
): MysqlExhortoRow[] {
  return rows.map((row) => ({
    ...(row as unknown as MysqlExhortoRow),
    legacySource,
  }));
}

function groupBlocksByTable(
  blocks: ParsedInsertBlock[],
): Map<string, Record<string, string | number | null>[]> {
  const map = new Map<string, Record<string, string | number | null>[]>();

  for (const block of blocks) {
    const table = block.table.toUpperCase();
    const existing = map.get(table) ?? [];
    existing.push(...block.rows);
    map.set(table, existing);
  }

  return map;
}

/** Carga una tabla desde archivos sueltos (modo legacy). */
export function loadTableRowsFromSeparateFile<T>(
  dir: string,
  fileName: string,
  tableName: string,
): T[] {
  return flattenInsertRows(
    parseSqlInsertsFromFile(join(dir, fileName), tableName),
  ) as unknown as T[];
}

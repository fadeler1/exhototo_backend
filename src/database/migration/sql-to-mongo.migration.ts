import { Injectable, Logger } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';
import type {
  LegacyDataset,
  MigrationOptions,
  MigrationStats,
} from './migration.types';
import { LegacyDataMigratorService } from './legacy-data-migrator.service';
import {
  DEFAULT_SQL_BUNDLE_FILE,
  loadLegacyDatasetFromSqlBundle,
  loadTableRowsFromSeparateFile,
  resolveSqlBundlePath,
} from './utils/sql-bundle.loader';
import type {
  MysqlBoletaHonorarioRow,
  MysqlBoletaReceptorRow,
  MysqlDiligenciaRow,
  MysqlExhortoRow,
  MysqlUsuarioRow,
} from './migration.types';

const SQL_FILES = {
  exhortos: 'EXHORTO.sql',
  diligencias: 'DILIGENCIA.sql',
  boletasReceptor: 'BOLETA_RECEPTOR.sql',
  boletasHonorario: 'BOLETA_HONORARIO.sql',
} as const;

@Injectable()
export class SqlToMongoMigration {
  private readonly logger = new Logger(SqlToMongoMigration.name);

  constructor(private readonly migrator: LegacyDataMigratorService) {}

  async run(
    options: MigrationOptions,
    sqlDir: string,
  ): Promise<MigrationStats> {
    const dir = sqlDir.startsWith('/') ? sqlDir : join(process.cwd(), sqlDir);
    const data = this.loadDataset(dir, options);

    const exhortoIds = new Set(data.exhortos.map((r) => Number(r.ID)));
    const orphanDiligencias = data.diligencias.filter(
      (d) => !exhortoIds.has(Number(d.ID_EXHORTO)),
    ).length;
    const orphanDilExhortos = new Set(
      data.diligencias
        .map((d) => Number(d.ID_EXHORTO))
        .filter((id) => !exhortoIds.has(id)),
    ).size;

    if (orphanDiligencias > 0) {
      this.logger.warn(
        `${orphanDiligencias} diligencias huérfanas (${orphanDilExhortos} exhortos distintos sin padre en el dump).`,
      );
    }

    if (options.sequential) {
      this.logger.log(
        'Modo secuencial: cada exhorto se inserta en MongoDB con sus diligencias y boletas receptor embebidas.',
      );
    }

    const stats = await this.migrator.migrate(data, options);
    this.logger.log('Migración SQL → MongoDB finalizada');
    return stats;
  }

  private loadDataset(dir: string, options: MigrationOptions): LegacyDataset {
    if (!options.noBundle) {
      const bundlePath = resolveSqlBundlePath(dir, options.bundleFile);
      if (bundlePath) {
        return this.loadFromBundle(bundlePath, options);
      }
    }

    return this.loadFromSeparateFiles(dir);
  }

  private loadFromBundle(
    bundlePath: string,
    options: MigrationOptions,
  ): LegacyDataset {
    this.logger.log(`Leyendo dump completo: ${bundlePath}`);
    const bundle = loadLegacyDatasetFromSqlBundle(bundlePath, {
      includeRespaldo: options.includeRespaldo,
    });

    const respaldoNote = options.includeRespaldo
      ? ` + ${bundle.counts.exhortosRespaldo} respaldo`
      : '';

    this.logger.log(
      `Filas parseadas (bundle): ${bundle.exhortos.length} exhortos ` +
        `(${bundle.counts.exhortosActivos} en tabla EXHORTO${respaldoNote}), ` +
        `${bundle.diligencias.length} diligencias en DILIGENCIA, ` +
        `${bundle.boletasReceptor.length} boletas receptor, ` +
        `${bundle.boletasHonorario.length} boletas honorario, ${bundle.usuarios.length} usuarios`,
    );

    return {
      users: options.includeUsers ? bundle.usuarios : [],
      exhortos: bundle.exhortos,
      diligencias: bundle.diligencias,
      boletasReceptor: bundle.boletasReceptor,
      boletasHonorario: bundle.boletasHonorario,
    };
  }

  private loadFromSeparateFiles(dir: string): LegacyDataset {
    for (const file of Object.values(SQL_FILES)) {
      const path = join(dir, file);
      if (!existsSync(path)) {
        throw new Error(
          `No se encuentra ${path}. Usa --bundle=${DEFAULT_SQL_BUNDLE_FILE} o coloca los .sql en ${dir}.`,
        );
      }
    }

    this.logger.log(`Leyendo dumps SQL sueltos desde: ${dir}`);

    const exhortoRows = loadTableRowsFromSeparateFile<MysqlExhortoRow>(
      dir,
      SQL_FILES.exhortos,
      'EXHORTO',
    );
    const diligenciaRows = loadTableRowsFromSeparateFile<MysqlDiligenciaRow>(
      dir,
      SQL_FILES.diligencias,
      'DILIGENCIA',
    );
    const boletaReceptorRows =
      loadTableRowsFromSeparateFile<MysqlBoletaReceptorRow>(
        dir,
        SQL_FILES.boletasReceptor,
        'BOLETA_RECEPTOR',
      );
    const boletaHonorarioRows =
      loadTableRowsFromSeparateFile<MysqlBoletaHonorarioRow>(
        dir,
        SQL_FILES.boletasHonorario,
        'BOLETA_HONORARIO',
      );

    this.logger.log(
      `Filas parseadas: ${exhortoRows.length} exhortos, ${diligenciaRows.length} diligencias, ` +
        `${boletaReceptorRows.length} boletas receptor, ${boletaHonorarioRows.length} boletas honorario`,
    );

    return {
      users: [],
      exhortos: exhortoRows,
      diligencias: diligenciaRows,
      boletasReceptor: boletaReceptorRows,
      boletasHonorario: boletaHonorarioRows,
    };
  }
}

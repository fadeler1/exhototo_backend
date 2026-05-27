import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { LegacyDataset, MigrationOptions, MigrationStats } from './migration.types';
import { LegacyDataMigratorService } from './legacy-data-migrator.service';

const REQUIRED_FILES = [
  'EXHORTO.csv',
  'DILIGENCIA.csv',
  'BOLETA_RECEPTOR.csv',
  'BOLETA_HONORARIO.csv',
] as const;

const OPTIONAL_FILES = ['USUARIO.csv'] as const;

@Injectable()
export class CsvToMongoMigration {
  private readonly logger = new Logger(CsvToMongoMigration.name);

  constructor(private readonly migrator: LegacyDataMigratorService) {}

  async run(
    options: MigrationOptions,
    dataDir: string,
  ): Promise<MigrationStats> {
    const dir = dataDir.startsWith('/')
      ? dataDir
      : join(process.cwd(), dataDir);

    this.logger.log(`Leyendo CSV desde: ${dir}`);

    for (const file of REQUIRED_FILES) {
      const path = join(dir, file);
      if (!existsSync(path)) {
        throw new Error(
          `Falta el archivo ${file} en ${dir}. Exporta desde phpMyAdmin (ver data/mysql-export/README.txt)`,
        );
      }
    }

    const data: LegacyDataset = {
      users: [],
      exhortos: this.loadCsv<LegacyDataset['exhortos'][number]>(
        join(dir, 'EXHORTO.csv'),
      ),
      diligencias: this.loadCsv<LegacyDataset['diligencias'][number]>(
        join(dir, 'DILIGENCIA.csv'),
      ),
      boletasReceptor: this.loadCsv<LegacyDataset['boletasReceptor'][number]>(
        join(dir, 'BOLETA_RECEPTOR.csv'),
      ),
      boletasHonorario: this.loadCsv<LegacyDataset['boletasHonorario'][number]>(
        join(dir, 'BOLETA_HONORARIO.csv'),
      ),
    };

    const usuarioPath = join(dir, 'USUARIO.csv');
    if (existsSync(usuarioPath)) {
      data.users = this.loadCsv<LegacyDataset['users'][number]>(usuarioPath);
    } else if (options.includeUsers) {
      this.logger.warn(
        'USUARIO.csv no encontrado; omite usuarios o exporta la tabla',
      );
    }

    this.logger.log(
      `Datos cargados: ${data.exhortos.length} exhortos, ${data.diligencias.length} diligencias`,
    );

    const stats = await this.migrator.migrate(data, options);
    this.logger.log('Migración CSV → MongoDB finalizada');
    return stats;
  }

  private loadCsv<T>(filePath: string): T[] {
    let content = readFileSync(filePath, 'utf-8');
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
    }

    const delimiter = content.includes(';') && !content.includes(',')
      ? ';'
      : ',';

    const rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      delimiter,
      trim: true,
      cast: false,
    }) as Record<string, string>[];

    return rows.map((row) => this.normalizeKeys(row) as T);
  }

  private normalizeKeys(row: Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      const k = key.replace(/^\ufeff/, '').trim();
      normalized[k] = value;
    }
    return normalized;
  }
}

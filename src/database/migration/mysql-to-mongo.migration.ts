import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPool, Pool, RowDataPacket } from 'mysql2/promise';
import type { LegacyDataset, MigrationOptions, MigrationStats } from './migration.types';
import { LegacyDataMigratorService } from './legacy-data-migrator.service';
import { printMysqlAccessDeniedHelp } from './utils/mysql-access-help.util';

@Injectable()
export class MysqlToMongoMigration {
  private readonly logger = new Logger(MysqlToMongoMigration.name);

  constructor(
    private readonly config: ConfigService,
    private readonly migrator: LegacyDataMigratorService,
  ) {}

  async run(options: MigrationOptions): Promise<MigrationStats> {
    const pool: Pool = createPool({
      host: this.config.get<string>('mysql.host'),
      port: this.config.get<number>('mysql.port'),
      user: this.config.get<string>('mysql.user'),
      password: this.config.get<string>('mysql.password'),
      database: this.config.get<string>('mysql.database'),
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 20000,
    });

    try {
      await pool.query('SELECT 1');
      this.logger.log('Conexión MySQL OK');

      const data = await this.loadFromMysql(pool);
      const stats = await this.migrator.migrate(data, options);
      this.logger.log('Migración MySQL → MongoDB finalizada');
      return stats;
    } catch (error) {
      const err = error as { code?: string; errno?: number };
      if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.errno === 1045) {
        printMysqlAccessDeniedHelp();
      }
      throw error;
    } finally {
      await pool.end();
    }
  }

  private async loadFromMysql(pool: Pool): Promise<LegacyDataset> {
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT ID, NOMBRE, LOGIN, PASSWORD, PERFIL, EMAIL, AUTORIZACION FROM USUARIO ORDER BY ID',
    );
    const [exhortos] = await pool.query<RowDataPacket[]>(
      `SELECT ID, APELLIDO_DEUDOR, NOMBRE_CLIENTE, RUT, TRIBUNAL_ORIGEN, ROL_JUICIO,
              CIUDAD, FACULTADES, ABOGADO, USUARIO, ESTADO, BOLETA_HONORARIOS, BOLETA_DEVOLUCION
       FROM EXHORTO ORDER BY ID`,
    );
    const [diligencias] = await pool.query<RowDataPacket[]>(
      'SELECT ID, ID_EXHORTO, DILIGENCIA, FECHA, OBSERVACIONES, USUARIO FROM DILIGENCIA ORDER BY ID_EXHORTO, ID',
    );
    const [boletasReceptor] = await pool.query<RowDataPacket[]>(
      'SELECT ID, ID_EXHORTO, RECEPTOR, DOCUMENTO, MONTO, DILIGENCIA FROM BOLETA_RECEPTOR ORDER BY ID_EXHORTO, ID',
    );
    const [boletasHonorario] = await pool.query<RowDataPacket[]>(
      `SELECT ID, ID_EXHORTO, DOCUMENTO, MONTO, ESTADO, TIPO, PERTENECE, FECHA
       FROM BOLETA_HONORARIO ORDER BY ID`,
    );

    return {
      users: users as LegacyDataset['users'],
      exhortos: exhortos as LegacyDataset['exhortos'],
      diligencias: diligencias as LegacyDataset['diligencias'],
      boletasReceptor: boletasReceptor as LegacyDataset['boletasReceptor'],
      boletasHonorario: boletasHonorario as LegacyDataset['boletasHonorario'],
    };
  }
}

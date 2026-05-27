import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { UserPerfil } from '../../common/enums/user-perfil.enum';
import { BoletaHonorarioEstado } from '../../common/enums/boleta-honorario-estado.enum';
import { BoletaHonorarioTipo } from '../../common/enums/boleta-honorario-tipo.enum';
import {
  BoletaHonorario,
  BoletaHonorarioDocument,
} from '../../modules/honorarios/infrastructure/schemas/boleta-honorario.schema';
import {
  Exhorto,
  ExhortoDocument,
} from '../../modules/exhortos/infrastructure/schemas/exhorto.schema';
import { User, UserDocument } from '../../modules/users/infrastructure/schemas/user.schema';
import type {
  LegacyDataset,
  MigrationOptions,
  MigrationStats,
  MysqlBoletaHonorarioRow,
  MysqlUsuarioRow,
} from './migration.types';
import { parseLegacyDate } from './utils/legacy-date.util';
import {
  buildExhortoMongoDocument,
  countUnmatchedLegacyUsuarios,
  groupByExhortoId,
} from './utils/legacy-exhorto-document.util';
import {
  buildLegacyUserResolver,
  type LegacyUserResolver,
} from './utils/legacy-user-resolver.util';

@Injectable()
export class LegacyDataMigratorService {
  private readonly logger = new Logger(LegacyDataMigratorService.name);

  constructor(
    @InjectModel(Exhorto.name) private readonly exhortoModel: Model<ExhortoDocument>,
    @InjectModel(BoletaHonorario.name)
    private readonly boletaHonorarioModel: Model<BoletaHonorarioDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async migrate(
    data: LegacyDataset,
    options: MigrationOptions,
  ): Promise<MigrationStats> {
    const stats: MigrationStats = {
      users: { created: 0, updated: 0, skipped: 0 },
      exhortos: 0,
      exhortosActivos: 0,
      exhortosRespaldo: 0,
      diligencias: 0,
      boletasReceptor: 0,
      boletasHonorario: 0,
      skippedExhortos: 0,
      unmatchedUsuarios: 0,
      orphanDiligencias: 0,
      orphanBoletasHonorario: 0,
      errors: [],
    };

    if (options.clear && !options.dryRun) {
      await this.boletaHonorarioModel.deleteMany({});
      await this.exhortoModel.deleteMany({});
      this.logger.warn('Colecciones exhortos y boletas_honorario vaciadas');
    }

    if (options.includeUsers) {
      await this.migrateUsers(data.users, stats, options);
    }

    stats.orphanDiligencias = this.countOrphanDiligencias(data);
    const userResolver = await this.loadUserResolver();
    const exhortoIds = new Set(data.exhortos.map((e) => Number(e.ID)));
    const diligenciasInDump = data.diligencias.filter((d) =>
      exhortoIds.has(Number(d.ID_EXHORTO)),
    );
    stats.unmatchedUsuarios = countUnmatchedLegacyUsuarios(
      data.exhortos,
      diligenciasInDump,
      userResolver,
    );
    if (stats.unmatchedUsuarios > 0) {
      this.logger.warn(
        `${stats.unmatchedUsuarios} filas con USUARIO legacy sin match en colección users`,
      );
    }

    const exhortoIdMap = options.sequential
      ? await this.migrateExhortosSequential(data, stats, options, userResolver)
      : await this.migrateExhortos(data, stats, options, userResolver);

    if (options.sequential) {
      await this.migrateBoletasHonorarioSequential(
        data.boletasHonorario,
        stats,
        options,
        exhortoIdMap,
      );
    } else {
      await this.migrateBoletasHonorario(
        data.boletasHonorario,
        stats,
        options,
        exhortoIdMap,
      );
    }

    return stats;
  }

  private async migrateUsers(
    users: MysqlUsuarioRow[],
    stats: MigrationStats,
    options: MigrationOptions,
  ): Promise<void> {
    const saltRounds = 10;

    for (const row of users) {
      const login = row.LOGIN.trim().toLowerCase();
      const existing = await this.userModel.findOne({ login }).exec();

      if (existing && !options.forceUsers) {
        stats.users.skipped++;
        continue;
      }

      const hashedPassword = await bcrypt.hash(row.PASSWORD, saltRounds);
      const payload = {
        nombre: row.NOMBRE,
        login,
        password: hashedPassword,
        perfil:
          row.PERFIL === UserPerfil.INGRESAR
            ? UserPerfil.INGRESAR
            : UserPerfil.TODO,
        email: row.EMAIL.trim().toLowerCase(),
        autorizacion: Number(row.AUTORIZACION) || 0,
        mustChangePassword: false,
      };

      if (options.dryRun) {
        stats.users.created++;
        continue;
      }

      if (existing && options.forceUsers) {
        await this.userModel.updateOne({ login }, payload).exec();
        stats.users.updated++;
      } else {
        await this.userModel.create(payload);
        stats.users.created++;
      }
    }
  }

  /**
   * Por cada fila de EXHORTO: busca diligencias y boletas receptor por ID_EXHORTO
   * y persiste un documento en MongoDB de forma secuencial (uno a uno).
   */
  private async loadUserResolver(): Promise<LegacyUserResolver> {
    const users = await this.userModel
      .find()
      .select('_id nombre login')
      .lean()
      .exec();

    this.logger.log(
      `Usuarios en MongoDB para vincular USUARIO legacy: ${users.length}`,
    );

    return buildLegacyUserResolver(
      users.map((u) => ({
        _id: u._id as Types.ObjectId,
        nombre: u.nombre,
        login: u.login,
      })),
    );
  }

  private async migrateExhortosSequential(
    data: LegacyDataset,
    stats: MigrationStats,
    options: MigrationOptions,
    userResolver: LegacyUserResolver,
  ): Promise<Map<number, Types.ObjectId>> {
    const exhortoIdMap = new Map<number, Types.ObjectId>();
    const diligenciasByExhorto = groupByExhortoId(data.diligencias);
    const boletasReceptorByExhorto = groupByExhortoId(data.boletasReceptor);
    const total = data.exhortos.length;

    this.logger.log(
      `Migración secuencial: ${total} exhortos (diligencias y boletas receptor embebidas por ID_EXHORTO)`,
    );

    for (let index = 0; index < data.exhortos.length; index++) {
      const row = data.exhortos[index];
      const legacyId = Number(row.ID);

      if (!options.dryRun && !options.clear) {
        const existing = await this.exhortoModel
          .findOne({ legacyMysqlId: legacyId })
          .select('_id')
          .lean()
          .exec();
        if (existing) {
          exhortoIdMap.set(legacyId, existing._id as Types.ObjectId);
          stats.skippedExhortos++;
          continue;
        }
      }

      const diligenciasRaw = diligenciasByExhorto.get(legacyId) ?? [];
      const boletasRaw = boletasReceptorByExhorto.get(legacyId) ?? [];
      const doc = buildExhortoMongoDocument(
        row,
        diligenciasRaw,
        boletasRaw,
        userResolver,
      );

      stats.diligencias += (doc.diligencias as unknown[]).length;
      stats.boletasReceptor += (doc.boletasReceptor as unknown[]).length;

      if (options.dryRun) {
        exhortoIdMap.set(legacyId, new Types.ObjectId());
        stats.exhortos++;
        if (row.legacySource === 'respaldo') {
          stats.exhortosRespaldo++;
        } else {
          stats.exhortosActivos++;
        }
        continue;
      }

      try {
        const created = await this.exhortoModel.create(doc);
        exhortoIdMap.set(legacyId, created._id);
        stats.exhortos++;
        if (row.legacySource === 'respaldo') {
          stats.exhortosRespaldo++;
        } else {
          stats.exhortosActivos++;
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        stats.errors.push(`Exhorto ${legacyId}: ${message}`);
      }

      const processed = index + 1;
      if (processed % 100 === 0 || processed === total) {
        this.logger.log(
          `Exhortos procesados: ${processed}/${total} (insertados: ${stats.exhortos}, omitidos: ${stats.skippedExhortos})`,
        );
      }
    }

    return exhortoIdMap;
  }

  private async migrateExhortos(
    data: LegacyDataset,
    stats: MigrationStats,
    options: MigrationOptions,
    userResolver: LegacyUserResolver,
  ): Promise<Map<number, Types.ObjectId>> {
    const exhortoIdMap = new Map<number, Types.ObjectId>();
    const diligenciasByExhorto = groupByExhortoId(data.diligencias);
    const boletasReceptorByExhorto = groupByExhortoId(data.boletasReceptor);
    const pendingDocs: Array<{
      legacyId: number;
      doc: Record<string, unknown>;
      legacySource: 'activo' | 'respaldo';
    }> = [];

    for (const row of data.exhortos) {
      const legacyId = Number(row.ID);

      if (!options.dryRun && !options.clear) {
        const existing = await this.exhortoModel
          .findOne({ legacyMysqlId: legacyId })
          .select('_id')
          .lean()
          .exec();
        if (existing) {
          exhortoIdMap.set(legacyId, existing._id as Types.ObjectId);
          stats.skippedExhortos++;
          continue;
        }
      }

      const diligenciasRaw = diligenciasByExhorto.get(legacyId) ?? [];
      const boletasRaw = boletasReceptorByExhorto.get(legacyId) ?? [];
      const doc = buildExhortoMongoDocument(
        row,
        diligenciasRaw,
        boletasRaw,
        userResolver,
      );

      stats.diligencias += (doc.diligencias as unknown[]).length;
      stats.boletasReceptor += (doc.boletasReceptor as unknown[]).length;

      if (options.dryRun) {
        exhortoIdMap.set(legacyId, new Types.ObjectId());
        stats.exhortos++;
        if (row.legacySource === 'respaldo') {
          stats.exhortosRespaldo++;
        } else {
          stats.exhortosActivos++;
        }
        continue;
      }

      pendingDocs.push({
        legacyId,
        doc,
        legacySource: row.legacySource === 'respaldo' ? 'respaldo' : 'activo',
      });
    }

    this.logger.log(
      `Insertando ${pendingDocs.length} exhortos en MongoDB (lotes de 25)...`,
    );

    const batchSize = 25;
    for (let i = 0; i < pendingDocs.length; i += batchSize) {
      const batch = pendingDocs.slice(i, i + batchSize);
      try {
        const inserted = await this.exhortoModel.insertMany(
          batch.map((b) => b.doc),
          { ordered: false },
        );
        for (const doc of inserted) {
          if (doc.legacyMysqlId != null) {
            exhortoIdMap.set(Number(doc.legacyMysqlId), doc._id);
          }
        }
        stats.exhortos += inserted.length;
        for (const item of batch) {
          if (item.legacySource === 'respaldo') {
            stats.exhortosRespaldo++;
          } else {
            stats.exhortosActivos++;
          }
        }
        this.logger.log(
          `Exhortos insertados: ${Math.min(i + batchSize, pendingDocs.length)}/${pendingDocs.length}`,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        stats.errors.push(`Lote exhortos ${i}-${i + batchSize}: ${message}`);
      }
    }

    return exhortoIdMap;
  }

  private async migrateBoletasHonorarioSequential(
    rows: MysqlBoletaHonorarioRow[],
    stats: MigrationStats,
    options: MigrationOptions,
    exhortoIdMap: Map<number, Types.ObjectId>,
  ): Promise<void> {
    const total = rows.length;
    this.logger.log(`Migración secuencial: ${total} boletas honorario`);

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const legacyId = Number(row.ID);
      const exhortoObjectId = exhortoIdMap.get(Number(row.ID_EXHORTO));

      if (!exhortoObjectId) {
        stats.orphanBoletasHonorario++;
        continue;
      }

      if (options.dryRun) {
        stats.boletasHonorario++;
        continue;
      }

      try {
        await this.boletaHonorarioModel.create({
          legacyMysqlId: legacyId,
          exhortoId: exhortoObjectId,
          documento: Number(row.DOCUMENTO),
          monto: Number(row.MONTO),
          estado:
            Number(row.ESTADO) === 1
              ? BoletaHonorarioEstado.PAGADO
              : BoletaHonorarioEstado.PENDIENTE,
          tipo:
            Number(row.TIPO) === 2
              ? BoletaHonorarioTipo.DEVOLUCION
              : BoletaHonorarioTipo.HONORARIO,
          pertenece: row.PERTENECE?.toString().trim() ?? '',
          fecha: parseLegacyDate(row.FECHA),
        });
        stats.boletasHonorario++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        stats.errors.push(`Boleta honorario ${legacyId}: ${message}`);
      }

      const processed = index + 1;
      if (processed % 500 === 0 || processed === total) {
        this.logger.log(
          `Boletas honorario: ${processed}/${total} (insertadas: ${stats.boletasHonorario})`,
        );
      }
    }
  }

  private async migrateBoletasHonorario(
    rows: MysqlBoletaHonorarioRow[],
    stats: MigrationStats,
    options: MigrationOptions,
    exhortoIdMap: Map<number, Types.ObjectId>,
  ): Promise<void> {
    const pending: Record<string, unknown>[] = [];

    for (const row of rows) {
      const legacyId = Number(row.ID);
      const exhortoObjectId = exhortoIdMap.get(Number(row.ID_EXHORTO));

      if (!exhortoObjectId) {
        stats.orphanBoletasHonorario++;
        continue;
      }

      if (options.dryRun) {
        stats.boletasHonorario++;
        continue;
      }

      pending.push({
        legacyMysqlId: legacyId,
        exhortoId: exhortoObjectId,
        documento: Number(row.DOCUMENTO),
        monto: Number(row.MONTO),
        estado:
          Number(row.ESTADO) === 1
            ? BoletaHonorarioEstado.PAGADO
            : BoletaHonorarioEstado.PENDIENTE,
        tipo:
          Number(row.TIPO) === 2
            ? BoletaHonorarioTipo.DEVOLUCION
            : BoletaHonorarioTipo.HONORARIO,
        pertenece: row.PERTENECE?.toString().trim() ?? '',
        fecha: parseLegacyDate(row.FECHA),
      });
    }

    const batchSize = 200;
    for (let i = 0; i < pending.length; i += batchSize) {
      const batch = pending.slice(i, i + batchSize);
      try {
        await this.boletaHonorarioModel.insertMany(batch, { ordered: false });
        stats.boletasHonorario += batch.length;
        this.logger.log(
          `Boletas honorario: ${Math.min(i + batchSize, pending.length)}/${pending.length}`,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        stats.errors.push(`Lote boletas ${i}: ${message}`);
      }
    }
  }

  private countOrphanDiligencias(data: LegacyDataset): number {
    const exhortoIds = new Set(data.exhortos.map((e) => Number(e.ID)));
    return data.diligencias.filter(
      (d) => !exhortoIds.has(Number(d.ID_EXHORTO)),
    ).length;
  }
}

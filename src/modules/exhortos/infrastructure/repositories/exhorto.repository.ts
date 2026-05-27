import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { aggregatePorRegion } from '../../../../common/utils/chile-regions.util';
import { ExhortoEstado } from '../../../../common/enums/exhorto-estado.enum';
import {
  ExhortoAttributeCount,
  ExhortoDashboardStats,
} from '../../domain/interfaces/exhorto-dashboard-stats.interface';
import {
  BoletaReceptorEntity,
  CreateExhortoData,
  DiligenciaEntity,
  ExhortoEntity,
  ExhortoSearchFilters,
  IExhortoRepository,
  MoveTerminatedExhortosToRespaldoFilters,
  MoveTerminatedExhortosToRespaldoResult,
  RestoreExhortosFromRespaldoResult,
  SearchRespaldoExhortoFilters,
  UpdateExhortoData,
} from '../../domain/interfaces/exhorto.repository.interface';
import { Exhorto, ExhortoDocument } from '../schemas/exhorto.schema';
import { RESPALDO_EXHORTO_MODEL } from '../schemas/respaldo-exhorto.schema';
import { buildDiligenciaElemMatch } from '../utils/build-diligencia-elem-match.util';
import { sortDiligenciaEntities } from '../utils/sort-diligencias.util';

@Injectable()
export class ExhortoRepository implements IExhortoRepository {
  constructor(
    @InjectModel(Exhorto.name) private readonly model: Model<ExhortoDocument>,
    @InjectModel(RESPALDO_EXHORTO_MODEL)
    private readonly respaldoModel: Model<ExhortoDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private mapDiligencia(
    d: ExhortoDocument['diligencias'][number] & {
      _id?: Types.ObjectId;
      createdAt?: Date;
      updatedAt?: Date;
    },
  ): DiligenciaEntity {
    return {
      id: d._id?.toString() ?? '',
      codigo: d.codigo,
      etiqueta: d.etiqueta,
      etiquetaLegacy: d.etiquetaLegacy,
      fecha: d.fecha,
      observaciones: d.observaciones,
      usuario: d.usuario,
      usuarioId: d.usuarioId?.toString(),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  private mapBoleta(
    b: ExhortoDocument['boletasReceptor'][number] & {
      _id?: Types.ObjectId;
      createdAt?: Date;
      updatedAt?: Date;
    },
  ): BoletaReceptorEntity {
    return {
      id: b._id?.toString() ?? '',
      receptor: b.receptor,
      documento: b.documento,
      monto: b.monto,
      diligenciaCodigo: b.diligenciaCodigo,
      diligenciaEtiquetaLegacy: b.diligenciaEtiquetaLegacy,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    };
  }

  private toEntity(
    doc: ExhortoDocument & { createdAt?: Date; updatedAt?: Date },
  ): ExhortoEntity {
    return {
      id: doc._id.toString(),
      apellidoDeudor: doc.apellidoDeudor,
      nombreCliente: doc.nombreCliente,
      rut: doc.rut,
      tribunalOrigen: doc.tribunalOrigen,
      rolJuicio: doc.rolJuicio,
      ciudad: doc.ciudad,
      facultades: doc.facultades,
      abogado: doc.abogado,
      createdById: doc.createdById?.toString(),
      createdByName: doc.createdByName,
      estado: doc.estado,
      diligencias: sortDiligenciaEntities(
        doc.diligencias.map((d) => this.mapDiligencia(d)),
      ),
      boletasReceptor: doc.boletasReceptor.map((b) => this.mapBoleta(b)),
      tieneBoletaHonorario: doc.tieneBoletaHonorario,
      tieneBoletaDevolucion: doc.tieneBoletaDevolucion,
      legacySource: doc.legacySource,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private buildFilter(filters: ExhortoSearchFilters): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    if (filters.apellidoDeudor) {
      query.apellidoDeudor = { $regex: filters.apellidoDeudor, $options: 'i' };
    }
    if (filters.nombreCliente) {
      query.nombreCliente = { $regex: filters.nombreCliente, $options: 'i' };
    }
    if (filters.tribunalOrigen) {
      query.tribunalOrigen = { $regex: filters.tribunalOrigen, $options: 'i' };
    }
    if (filters.rolJuicio) {
      query.rolJuicio = { $regex: filters.rolJuicio, $options: 'i' };
    }
    if (filters.ciudad) {
      query.ciudad = { $regex: filters.ciudad, $options: 'i' };
    }
    if (filters.facultades) {
      query.facultades = { $regex: filters.facultades, $options: 'i' };
    }
    if (filters.abogado) {
      query.abogado = { $regex: filters.abogado, $options: 'i' };
    }
    if (filters.estado !== undefined) {
      query.estado = filters.estado;
    }

    const diligenciaMatch = buildDiligenciaElemMatch({
      fechaDesde: filters.fechaDesde,
      fechaHasta: filters.fechaHasta,
      diligenciaCodigo: filters.diligenciaCodigo,
    });
    if (diligenciaMatch) {
      query.diligencias = { $elemMatch: diligenciaMatch };
    }

    return query;
  }

  findById(id: string): Promise<ExhortoEntity | null> {
    return this.model
      .findById(id)
      .exec()
      .then((doc) => (doc ? this.toEntity(doc) : null));
  }

  async search(filters: ExhortoSearchFilters): Promise<{
    data: ExhortoEntity[];
    total: number;
  }> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 50, 200);
    const skip = (page - 1) * limit;
    const query = this.buildFilter(filters);

    const [docs, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return { data: docs.map((d) => this.toEntity(d)), total };
  }

  async searchRespaldo(filters: SearchRespaldoExhortoFilters): Promise<{
    data: ExhortoEntity[];
    total: number;
    page: number;
    limit: number;
    collection: 'respaldo_exhorto';
  }> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 50, 200);
    const skip = (page - 1) * limit;
    const query = this.buildRespaldoFilter(filters);

    const [docs, total] = await Promise.all([
      this.respaldoModel
        .find(query)
        .sort({ archivedAt: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.respaldoModel.countDocuments(query).exec(),
    ]);

    return {
      data: docs.map((d) => this.toEntity(d)),
      total,
      page,
      limit,
      collection: 'respaldo_exhorto',
    };
  }

  async create(data: CreateExhortoData): Promise<ExhortoEntity> {
    const doc = await this.model.create({
      ...data,
      createdById: data.createdById
        ? new Types.ObjectId(data.createdById)
        : undefined,
      estado: ExhortoEstado.VIGENTE,
      diligencias: [],
      boletasReceptor: [],
      tieneBoletaHonorario: false,
      tieneBoletaDevolucion: false,
    });
    return this.toEntity(doc);
  }

  async update(
    id: string,
    data: UpdateExhortoData,
  ): Promise<ExhortoEntity | null> {
    const doc = await this.model
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async addDiligencia(
    exhortoId: string,
    diligencia: Omit<DiligenciaEntity, 'id' | 'createdAt' | 'updatedAt'>,
    nuevoEstado: ExhortoEstado,
  ): Promise<ExhortoEntity | null> {
    const doc = await this.model
      .findByIdAndUpdate(
        exhortoId,
        {
          $push: { diligencias: diligencia },
          $set: { estado: nuevoEstado },
        },
        { new: true },
      )
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async updateDiligencia(
    exhortoId: string,
    diligenciaId: string,
    update: Partial<DiligenciaEntity>,
    nuevoEstado: ExhortoEstado,
  ): Promise<ExhortoEntity | null> {
    const setFields: Record<string, unknown> = { estado: nuevoEstado };
    for (const [key, value] of Object.entries(update)) {
      if (value !== undefined && key !== 'id') {
        setFields[`diligencias.$.${key}`] = value;
      }
    }

    const doc = await this.model
      .findOneAndUpdate(
        {
          _id: exhortoId,
          'diligencias._id': new Types.ObjectId(diligenciaId),
        },
        { $set: setFields },
        { new: true },
      )
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async removeDiligencia(
    exhortoId: string,
    diligenciaId: string,
    nuevoEstado: ExhortoEstado,
  ): Promise<ExhortoEntity | null> {
    const doc = await this.model
      .findByIdAndUpdate(
        exhortoId,
        {
          $pull: { diligencias: { _id: new Types.ObjectId(diligenciaId) } },
          $set: { estado: nuevoEstado },
        },
        { new: true },
      )
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async addBoletaReceptor(
    exhortoId: string,
    boleta: Omit<BoletaReceptorEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ExhortoEntity | null> {
    const doc = await this.model
      .findByIdAndUpdate(
        exhortoId,
        { $push: { boletasReceptor: boleta } },
        { new: true },
      )
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async updateBoletaReceptor(
    exhortoId: string,
    boletaId: string,
    update: Partial<BoletaReceptorEntity>,
  ): Promise<ExhortoEntity | null> {
    const setFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(update)) {
      if (value !== undefined && key !== 'id') {
        setFields[`boletasReceptor.$.${key}`] = value;
      }
    }

    const doc = await this.model
      .findOneAndUpdate(
        {
          _id: exhortoId,
          'boletasReceptor._id': new Types.ObjectId(boletaId),
        },
        { $set: setFields },
        { new: true },
      )
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async removeBoletaReceptor(
    exhortoId: string,
    boletaId: string,
  ): Promise<ExhortoEntity | null> {
    const doc = await this.model
      .findByIdAndUpdate(
        exhortoId,
        { $pull: { boletasReceptor: { _id: new Types.ObjectId(boletaId) } } },
        { new: true },
      )
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  private buildMoveToRespaldoFilter(
    filters: MoveTerminatedExhortosToRespaldoFilters,
  ): Record<string, unknown> {
    const query: Record<string, unknown> = {
      estado: ExhortoEstado.TERMINADO,
    };
    const diligenciaMatch = buildDiligenciaElemMatch({
      fechaDesde: filters.fechaDesde,
      fechaHasta: filters.fechaHasta,
      diligenciaCodigo: filters.diligenciaCodigo,
    });
    if (diligenciaMatch) {
      query.diligencias = { $elemMatch: diligenciaMatch };
    }
    return query;
  }

  private buildRespaldoFilter(
    filters: SearchRespaldoExhortoFilters,
  ): Record<string, unknown> {
    const query: Record<string, unknown> = {
      estado: filters.estado,
    };
    const diligenciaMatch = buildDiligenciaElemMatch({
      fechaDesde: filters.fechaDesde,
      fechaHasta: filters.fechaHasta,
      diligenciaCodigo: filters.diligenciaCodigo,
    });
    if (diligenciaMatch) {
      query.diligencias = { $elemMatch: diligenciaMatch };
    }
    return query;
  }

  private isTransactionUnsupported(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return (
      message.includes('Transaction numbers are only allowed') ||
      message.includes('Transaction not supported') ||
      message.includes('transactions are not supported')
    );
  }

  private async moveTerminatedToRespaldoInternal(
    filters: MoveTerminatedExhortosToRespaldoFilters,
    session?: ClientSession,
  ): Promise<MoveTerminatedExhortosToRespaldoResult> {
    const filter = this.buildMoveToRespaldoFilter(filters);
    const query = this.model.find(filter).lean();
    if (session) query.session(session);

    const docs = (await query.exec()) as unknown as Array<
      Record<string, unknown> & { _id: Types.ObjectId }
    >;

    if (docs.length === 0) {
      return {
        collection: 'respaldo_exhorto',
        matched: 0,
        moved: 0,
        deleted: 0,
        fechaDesde: filters.fechaDesde,
        fechaHasta: filters.fechaHasta,
      };
    }

    const archivedAt = new Date();
    const ids = docs.map((doc) => doc._id);

    await this.respaldoModel.collection.bulkWrite(
      docs.map((doc) => ({
        replaceOne: {
          filter: { _id: doc._id },
          replacement: {
            ...doc,
            archivedAt,
            archivedFromCollection: 'exhortos',
          },
          upsert: true,
        },
      })),
      { session },
    );

    const deleteQuery = this.model.deleteMany({
      ...filter,
      _id: { $in: ids },
    });
    if (session) deleteQuery.session(session);
    const deleteResult = await deleteQuery.exec();

    return {
      collection: 'respaldo_exhorto',
      matched: docs.length,
      moved: docs.length,
      deleted: deleteResult.deletedCount ?? 0,
      fechaDesde: filters.fechaDesde,
      fechaHasta: filters.fechaHasta,
    };
  }

  async moveTerminatedToRespaldo(
    filters: MoveTerminatedExhortosToRespaldoFilters,
  ): Promise<MoveTerminatedExhortosToRespaldoResult> {
    const session = await this.connection.startSession();

    try {
      let result: MoveTerminatedExhortosToRespaldoResult | undefined;
      await session.withTransaction(async () => {
        result = await this.moveTerminatedToRespaldoInternal(filters, session);
      });
      return (
        result ?? {
          collection: 'respaldo_exhorto',
          matched: 0,
          moved: 0,
          deleted: 0,
          fechaDesde: filters.fechaDesde,
          fechaHasta: filters.fechaHasta,
        }
      );
    } catch (error) {
      if (this.isTransactionUnsupported(error)) {
        return this.moveTerminatedToRespaldoInternal(filters);
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private async restoreFromRespaldoInternal(
    filters: SearchRespaldoExhortoFilters,
    session?: ClientSession,
  ): Promise<RestoreExhortosFromRespaldoResult> {
    const filter = this.buildRespaldoFilter(filters);
    const query = this.respaldoModel.find(filter).lean();
    if (session) query.session(session);

    const docs = (await query.exec()) as unknown as Array<
      Record<string, unknown> & { _id: Types.ObjectId }
    >;

    if (docs.length === 0) {
      return {
        collection: 'exhortos',
        matched: 0,
        moved: 0,
        deleted: 0,
        fechaDesde: filters.fechaDesde,
        fechaHasta: filters.fechaHasta,
        estado: filters.estado,
      };
    }

    const ids = docs.map((doc) => doc._id);

    await this.model.collection.bulkWrite(
      docs.map((doc) => {
        const { archivedAt, archivedFromCollection, ...restoredDoc } = doc;
        void archivedAt;
        void archivedFromCollection;

        return {
          replaceOne: {
            filter: { _id: doc._id },
            replacement: restoredDoc,
            upsert: true,
          },
        };
      }),
      { session },
    );

    const deleteQuery = this.respaldoModel.deleteMany({
      ...filter,
      _id: { $in: ids },
    });
    if (session) deleteQuery.session(session);
    const deleteResult = await deleteQuery.exec();

    return {
      collection: 'exhortos',
      matched: docs.length,
      moved: docs.length,
      deleted: deleteResult.deletedCount ?? 0,
      fechaDesde: filters.fechaDesde,
      fechaHasta: filters.fechaHasta,
      estado: filters.estado,
    };
  }

  async restoreFromRespaldo(
    filters: SearchRespaldoExhortoFilters,
  ): Promise<RestoreExhortosFromRespaldoResult> {
    const session = await this.connection.startSession();

    try {
      let result: RestoreExhortosFromRespaldoResult | undefined;
      await session.withTransaction(async () => {
        result = await this.restoreFromRespaldoInternal(filters, session);
      });
      return (
        result ?? {
          collection: 'exhortos',
          matched: 0,
          moved: 0,
          deleted: 0,
          fechaDesde: filters.fechaDesde,
          fechaHasta: filters.fechaHasta,
          estado: filters.estado,
        }
      );
    } catch (error) {
      if (this.isTransactionUnsupported(error)) {
        return this.restoreFromRespaldoInternal(filters);
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private async groupByField(
    field: keyof Pick<
      ExhortoDocument,
      'ciudad' | 'abogado' | 'tribunalOrigen' | 'facultades'
    >,
    limit = 12,
  ): Promise<ExhortoAttributeCount[]> {
    const rows = await this.model.aggregate<{
      _id: string | null;
      total: number;
      vigente: number;
      terminado: number;
    }>([
      {
        $project: {
          estado: 1,
          value: {
            $trim: {
              input: { $ifNull: [`$${field}`, ''] },
            },
          },
        },
      },
      {
        $group: {
          _id: '$value',
          total: { $sum: 1 },
          vigente: {
            $sum: {
              $cond: [{ $eq: ['$estado', ExhortoEstado.VIGENTE] }, 1, 0],
            },
          },
          terminado: {
            $sum: {
              $cond: [{ $eq: ['$estado', ExhortoEstado.TERMINADO] }, 1, 0],
            },
          },
        },
      },
      { $sort: { total: -1 } },
      { $limit: limit },
    ]);

    return rows
      .map((row) => {
        const raw = typeof row._id === 'string' ? row._id.trim() : '';
        return {
          nombre: raw || 'Sin dato',
          total: row.total,
          vigente: row.vigente,
          terminado: row.terminado,
        };
      })
      .filter((row) => row.nombre !== 'Sin dato' || row.total > 0);
  }

  async getDashboardStats(): Promise<ExhortoDashboardStats> {
    const [vigente, terminado, porCiudad, porAbogado, porTribunal, porFacultades, recientesDocs] =
      await Promise.all([
        this.model.countDocuments({ estado: ExhortoEstado.VIGENTE }).exec(),
        this.model.countDocuments({ estado: ExhortoEstado.TERMINADO }).exec(),
        this.groupByField('ciudad'),
        this.groupByField('abogado'),
        this.groupByField('tribunalOrigen'),
        this.groupByField('facultades'),
        this.model
          .find()
          .sort({ createdAt: -1 })
          .limit(8)
          .select(
            'apellidoDeudor nombreCliente ciudad abogado estado createdAt',
          )
          .exec(),
      ]);

    const total = vigente + terminado;
    const porRegion = aggregatePorRegion(porCiudad);

    return {
      resumen: { total, vigente, terminado },
      porRegion,
      porCiudad,
      porAbogado,
      porTribunal,
      porFacultades,
      recientes: recientesDocs.map((doc) => {
        const plain = doc.toObject();
        return {
          id: doc._id.toString(),
          apellidoDeudor: doc.apellidoDeudor,
          nombreCliente: doc.nombreCliente,
          ciudad: doc.ciudad,
          abogado: doc.abogado,
          estado: doc.estado,
          createdAt: (plain as { createdAt?: Date }).createdAt,
        };
      }),
    };
  }
}

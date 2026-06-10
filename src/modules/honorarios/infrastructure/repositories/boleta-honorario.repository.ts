import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { BoletaHonorarioEstado } from '../../../../common/enums/boleta-honorario-estado.enum';
import { BoletaHonorarioTipo } from '../../../../common/enums/boleta-honorario-tipo.enum';
import {
  BoletaHonorarioEntity,
  BoletaHonorarioSearchFilters,
  CreateBoletaHonorarioData,
  IBoletaHonorarioRepository,
} from '../../domain/interfaces/boleta-honorario.repository.interface';
import {
  BoletaHonorario,
  BoletaHonorarioDocument,
} from '../schemas/boleta-honorario.schema';

interface AggregateExhortoSnapshot {
  apellidoDeudor: string;
  nombreCliente: string;
  abogado: string;
  ciudad: string;
  rolJuicio: string;
  estado: number;
  tieneBoletaHonorario: boolean;
  tieneBoletaDevolucion: boolean;
}

interface AggregateBoletaRow extends BoletaHonorarioDocument {
  exhorto: AggregateExhortoSnapshot;
}

@Injectable()
export class BoletaHonorarioRepository implements IBoletaHonorarioRepository {
  constructor(
    @InjectModel(BoletaHonorario.name)
    private readonly model: Model<BoletaHonorarioDocument>,
  ) {}

  private toEntity(
    doc: BoletaHonorarioDocument & { createdAt?: Date; updatedAt?: Date },
    exhorto?: BoletaHonorarioEntity['exhorto'],
  ): BoletaHonorarioEntity {
    return {
      id: doc._id.toString(),
      exhortoId: doc.exhortoId.toString(),
      documento: doc.documento,
      monto: doc.monto,
      estado: doc.estado,
      tipo: doc.tipo,
      pertenece: doc.pertenece,
      fecha: doc.fecha,
      exhorto,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  findById(id: string): Promise<BoletaHonorarioEntity | null> {
    return this.model
      .findById(id)
      .exec()
      .then((doc) => (doc ? this.toEntity(doc) : null));
  }

  async search(filters: BoletaHonorarioSearchFilters): Promise<{
    data: BoletaHonorarioEntity[];
    total: number;
  }> {
    const isExport = Boolean(filters.export);
    const page = filters.page ?? 1;
    const limit = isExport
      ? undefined
      : Math.min(filters.limit ?? 50, 200);
    const skip = isExport ? 0 : (page - 1) * (limit as number);

    const matchBoleta: Record<string, unknown> = {};
    if (filters.documento !== undefined)
      matchBoleta.documento = filters.documento;
    if (filters.tipo !== undefined) matchBoleta.tipo = filters.tipo;
    if (filters.estado !== undefined) matchBoleta.estado = filters.estado;

    const matchExhorto: Record<string, unknown> = {};
    if (filters.ciudad) {
      matchExhorto['exhorto.ciudad'] = {
        $regex: filters.ciudad,
        $options: 'i',
      };
    }
    if (filters.abogado) {
      matchExhorto['exhorto.abogado'] = {
        $regex: filters.abogado,
        $options: 'i',
      };
    }
    if (filters.caratula) {
      matchExhorto.$or = [
        {
          'exhorto.apellidoDeudor': {
            $regex: filters.caratula,
            $options: 'i',
          },
        },
        {
          'exhorto.nombreCliente': {
            $regex: filters.caratula,
            $options: 'i',
          },
        },
      ];
    }
    if (filters.rolJuicio) {
      matchExhorto['exhorto.rolJuicio'] = {
        $regex: filters.rolJuicio,
        $options: 'i',
      };
    }

    const pipeline: PipelineStage[] = [
      { $match: matchBoleta },
      {
        $lookup: {
          from: 'exhortos',
          localField: 'exhortoId',
          foreignField: '_id',
          as: 'exhorto',
        },
      },
      { $unwind: '$exhorto' },
    ];

    if (Object.keys(matchExhorto).length > 0) {
      pipeline.push({ $match: matchExhorto });
    }

    const countPipeline = [...pipeline, { $count: 'total' }];
    const dataPipeline: PipelineStage[] = [
      ...pipeline,
      { $sort: { fecha: -1 as const } },
    ];
    if (!isExport) {
      dataPipeline.push({ $skip: skip }, { $limit: limit as number });
    }

    const [countResult, rows] = await Promise.all([
      this.model.aggregate<{ total: number }>(countPipeline).exec(),
      this.model.aggregate(dataPipeline).exec(),
    ]);

    const total = countResult[0]?.total ?? 0;
    const data = rows.map((row: AggregateBoletaRow) =>
      this.toEntity(row as BoletaHonorarioDocument, {
        apellidoDeudor: row.exhorto.apellidoDeudor,
        nombreCliente: row.exhorto.nombreCliente,
        abogado: row.exhorto.abogado,
        ciudad: row.exhorto.ciudad,
        rolJuicio: row.exhorto.rolJuicio,
        estado: row.exhorto.estado,
        tieneBoletaHonorario: row.exhorto.tieneBoletaHonorario,
        tieneBoletaDevolucion: row.exhorto.tieneBoletaDevolucion,
      }),
    );

    return { data, total };
  }

  async create(
    data: CreateBoletaHonorarioData,
  ): Promise<BoletaHonorarioEntity> {
    const doc = await this.model.create({
      ...data,
      exhortoId: new Types.ObjectId(data.exhortoId),
      estado: BoletaHonorarioEstado.PENDIENTE,
    });
    return this.toEntity(doc);
  }

  async updateEstado(
    id: string,
    estado: BoletaHonorarioEstado,
  ): Promise<BoletaHonorarioEntity | null> {
    const doc = await this.model
      .findByIdAndUpdate(id, { estado }, { returnDocument: 'after' })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async update(
    id: string,
    data: Partial<CreateBoletaHonorarioData>,
  ): Promise<BoletaHonorarioEntity | null> {
    const update: Record<string, unknown> = { ...data };
    if (data.exhortoId) {
      update.exhortoId = new Types.ObjectId(data.exhortoId);
    }
    const doc = await this.model
      .findByIdAndUpdate(id, update, { returnDocument: 'after' })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  countByExhortoAndTipo(
    exhortoId: string,
    tipo: BoletaHonorarioTipo,
  ): Promise<number> {
    return this.model
      .countDocuments({
        exhortoId: new Types.ObjectId(exhortoId),
        tipo,
      })
      .exec();
  }
}

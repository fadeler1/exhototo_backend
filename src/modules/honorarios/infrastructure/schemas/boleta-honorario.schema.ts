import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BoletaHonorarioEstado } from '../../../../common/enums/boleta-honorario-estado.enum';
import { BoletaHonorarioTipo } from '../../../../common/enums/boleta-honorario-tipo.enum';

export type BoletaHonorarioDocument = HydratedDocument<BoletaHonorario>;

@Schema({ collection: 'boletas_honorario', timestamps: true })
export class BoletaHonorario {
  @Prop({ type: Types.ObjectId, ref: 'Exhorto', required: true, index: true })
  exhortoId: Types.ObjectId;

  @Prop({ required: true, index: true })
  documento: number;

  @Prop({ required: true })
  monto: number;

  @Prop({
    type: Number,
    enum: BoletaHonorarioEstado,
    default: BoletaHonorarioEstado.PENDIENTE,
    index: true,
  })
  estado: BoletaHonorarioEstado;

  @Prop({
    type: Number,
    enum: BoletaHonorarioTipo,
    required: true,
    index: true,
  })
  tipo: BoletaHonorarioTipo;

  @Prop({ required: true, trim: true })
  pertenece: string;

  @Prop({ required: true, type: Date })
  fecha: Date;

  @Prop({ unique: true, sparse: true, index: true })
  legacyMysqlId?: number;
}

export const BoletaHonorarioSchema =
  SchemaFactory.createForClass(BoletaHonorario);

BoletaHonorarioSchema.index({ exhortoId: 1, tipo: 1 });

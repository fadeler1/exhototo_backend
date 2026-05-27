import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ExhortoEstado } from '../../../../common/enums/exhorto-estado.enum';
import { ExhortoLegacySource } from '../../../../common/enums/exhorto-legacy-source.enum';
import {
  BoletaReceptorEmbedded,
  BoletaReceptorEmbeddedSchema,
} from './boleta-receptor.subschema';
import {
  DiligenciaEmbedded,
  DiligenciaEmbeddedSchema,
} from './diligencia.subschema';

export type ExhortoDocument = HydratedDocument<Exhorto>;

@Schema({ collection: 'exhortos', timestamps: true })
export class Exhorto {
  @Prop({ required: true, trim: true, index: true })
  apellidoDeudor: string;

  @Prop({ required: true, trim: true, index: true })
  nombreCliente: string;

  @Prop({ trim: true, default: '' })
  rut: string;

  @Prop({ required: true, trim: true })
  tribunalOrigen: string;

  @Prop({ required: true, trim: true, index: true })
  rolJuicio: string;

  @Prop({ required: true, trim: true, index: true })
  ciudad: string;

  @Prop({ default: '' })
  facultades: string;

  @Prop({ required: true, trim: true, index: true })
  abogado: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdById?: Types.ObjectId;

  @Prop({ required: true })
  createdByName: string;

  @Prop({
    type: Number,
    enum: ExhortoEstado,
    default: ExhortoEstado.VIGENTE,
    index: true,
  })
  estado: ExhortoEstado;

  /**
   * Todas las diligencias del exhorto viven dentro del mismo documento (array embebido).
   * No existe colección separada `diligencias` en MongoDB.
   */
  @Prop({
    type: [DiligenciaEmbeddedSchema],
    default: () => [],
  })
  diligencias: DiligenciaEmbedded[];

  @Prop({
    type: [BoletaReceptorEmbeddedSchema],
    default: () => [],
  })
  boletasReceptor: BoletaReceptorEmbedded[];

  /** Denormalizado para consultas rápidas (legacy BOLETA_HONORARIOS / BOLETA_DEVOLUCION) */
  @Prop({ default: false })
  tieneBoletaHonorario: boolean;

  @Prop({ default: false })
  tieneBoletaDevolucion: boolean;

  /** ID original en MySQL (migración). Permite re-ejecutar el script sin duplicar. */
  @Prop({ unique: true, sparse: true, index: true })
  legacyMysqlId?: number;

  /** Tabla de origen: EXHORTO (activo) o respaldo_exhorto (histórico). */
  @Prop({
    type: String,
    enum: ExhortoLegacySource,
    default: ExhortoLegacySource.ACTIVO,
    index: true,
  })
  legacySource: ExhortoLegacySource;
}

export const ExhortoSchema = SchemaFactory.createForClass(Exhorto);

ExhortoSchema.index({ apellidoDeudor: 'text', nombreCliente: 'text' });
ExhortoSchema.index({ 'diligencias.fecha': 1, 'diligencias.codigo': 1 });

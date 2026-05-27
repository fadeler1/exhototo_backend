import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ _id: true, timestamps: true })
export class DiligenciaEmbedded {
  @Prop({ required: true })
  codigo: string;

  @Prop({ required: true })
  etiqueta: string;

  @Prop({ required: true })
  etiquetaLegacy: string;

  @Prop({ required: true, type: Date })
  fecha: Date;

  @Prop({ default: '' })
  observaciones: string;

  @Prop({ required: true })
  usuario: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  usuarioId?: Types.ObjectId;
}

export const DiligenciaEmbeddedSchema =
  SchemaFactory.createForClass(DiligenciaEmbedded);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DiligenciaTipoDocument = HydratedDocument<DiligenciaTipo>;

@Schema({ collection: 'diligencia_tipos', timestamps: true })
export class DiligenciaTipo {
  @Prop({ required: true, unique: true })
  codigo: string;

  @Prop({ required: true })
  etiqueta: string;

  @Prop({ required: true })
  etiquetaLegacy: string;

  @Prop({ default: true })
  activo: boolean;

  @Prop({ default: 0 })
  orden: number;
}

export const DiligenciaTipoSchema =
  SchemaFactory.createForClass(DiligenciaTipo);

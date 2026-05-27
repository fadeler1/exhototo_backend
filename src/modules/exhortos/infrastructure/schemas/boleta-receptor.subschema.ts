import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: true, timestamps: true })
export class BoletaReceptorEmbedded {
  @Prop({ required: true, trim: true })
  receptor: string;

  @Prop({ required: true })
  documento: number;

  @Prop({ required: true })
  monto: number;

  @Prop({ default: '' })
  diligenciaCodigo: string;

  @Prop({ default: '' })
  diligenciaEtiquetaLegacy: string;
}

export const BoletaReceptorEmbeddedSchema = SchemaFactory.createForClass(
  BoletaReceptorEmbedded,
);

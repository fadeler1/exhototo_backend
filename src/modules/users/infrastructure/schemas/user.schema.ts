import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserPerfil } from '../../../../common/enums/user-perfil.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  login: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: UserPerfil })
  perfil: UserPerfil;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ default: 0 })
  autorizacion: number;

  @Prop({ default: true })
  mustChangePassword: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 });

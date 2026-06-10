import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DEFAULT_USER_PASSWORD } from '../../../../common/constants/diligencia.constants';
import {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
  UserEntity,
} from '../../domain/interfaces/user.repository.interface';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectModel(User.name) private readonly model: Model<UserDocument>,
  ) {}

  private toEntity(
    doc: UserDocument & { createdAt?: Date; updatedAt?: Date },
  ): UserEntity {
    return {
      id: doc._id.toString(),
      nombre: doc.nombre,
      login: doc.login,
      password: doc.password,
      perfil: doc.perfil,
      email: doc.email,
      autorizacion: doc.autorizacion,
      mustChangePassword: doc.mustChangePassword,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  findAll(): Promise<UserEntity[]> {
    return this.model
      .find()
      .sort({ nombre: 1 })
      .exec()
      .then((docs) => docs.map((d) => this.toEntity(d)));
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.model
      .findById(id)
      .exec()
      .then((doc) => (doc ? this.toEntity(doc) : null));
  }

  findByLogin(login: string): Promise<UserEntity | null> {
    return this.model
      .findOne({ login: login.toLowerCase() })
      .exec()
      .then((doc) => (doc ? this.toEntity(doc) : null));
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.model
      .findOne({ email: email.toLowerCase() })
      .exec()
      .then((doc) => (doc ? this.toEntity(doc) : null));
  }

  findByAutorizacion(token: number): Promise<UserEntity | null> {
    return this.model
      .findOne({ autorizacion: token })
      .exec()
      .then((doc) => (doc ? this.toEntity(doc) : null));
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const doc = await this.model.create({
      nombre: data.nombre,
      login: data.login.toLowerCase(),
      password: data.password ?? DEFAULT_USER_PASSWORD,
      perfil: data.perfil,
      email: data.email.toLowerCase(),
      autorizacion: 0,
      mustChangePassword: true,
    });
    return this.toEntity(doc);
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity | null> {
    const update: Record<string, unknown> = { ...data };
    if (data.login) update.login = data.login.toLowerCase();
    if (data.email) update.email = data.email.toLowerCase();
    if (data.password) update.mustChangePassword = false;

    const doc = await this.model
      .findByIdAndUpdate(id, update, { returnDocument: 'after' })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }
}

import { UserPerfil } from '../../../../common/enums/user-perfil.enum';

export interface UserEntity {
  id: string;
  nombre: string;
  login: string;
  password: string;
  perfil: UserPerfil;
  email: string;
  autorizacion: number;
  mustChangePassword: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserData {
  nombre: string;
  login: string;
  perfil: UserPerfil;
  email: string;
  password?: string;
}

export interface UpdateUserData {
  nombre?: string;
  login?: string;
  perfil?: UserPerfil;
  email?: string;
  password?: string;
  autorizacion?: number;
}

export interface IUserRepository {
  findAll(): Promise<UserEntity[]>;
  findById(id: string): Promise<UserEntity | null>;
  findByLogin(login: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByAutorizacion(token: number): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
  update(id: string, data: UpdateUserData): Promise<UserEntity | null>;
  delete(id: string): Promise<boolean>;
}

import { BoletaHonorarioEstado } from '../../../../common/enums/boleta-honorario-estado.enum';
import { BoletaHonorarioTipo } from '../../../../common/enums/boleta-honorario-tipo.enum';

export interface BoletaHonorarioEntity {
  id: string;
  exhortoId: string;
  documento: number;
  monto: number;
  estado: BoletaHonorarioEstado;
  tipo: BoletaHonorarioTipo;
  pertenece: string;
  fecha: Date;
  exhorto?: {
    apellidoDeudor: string;
    nombreCliente: string;
    abogado: string;
    ciudad: string;
    rolJuicio: string;
    estado: number;
    tieneBoletaHonorario: boolean;
    tieneBoletaDevolucion: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateBoletaHonorarioData {
  exhortoId: string;
  documento: number;
  monto: number;
  tipo: BoletaHonorarioTipo;
  pertenece: string;
  fecha: Date;
}

export interface BoletaHonorarioSearchFilters {
  ciudad?: string;
  abogado?: string;
  caratula?: string;
  rolJuicio?: string;
  documento?: number;
  tipo?: BoletaHonorarioTipo;
  estado?: BoletaHonorarioEstado;
  page?: number;
  limit?: number;
  /** Sin paginación: devuelve todos los registros del filtro (exportación Excel). */
  export?: boolean;
}

export interface IBoletaHonorarioRepository {
  findById(id: string): Promise<BoletaHonorarioEntity | null>;
  search(filters: BoletaHonorarioSearchFilters): Promise<{
    data: BoletaHonorarioEntity[];
    total: number;
  }>;
  create(data: CreateBoletaHonorarioData): Promise<BoletaHonorarioEntity>;
  updateEstado(
    id: string,
    estado: BoletaHonorarioEstado,
  ): Promise<BoletaHonorarioEntity | null>;
  update(
    id: string,
    data: Partial<CreateBoletaHonorarioData>,
  ): Promise<BoletaHonorarioEntity | null>;
  delete(id: string): Promise<boolean>;
  countByExhortoAndTipo(
    exhortoId: string,
    tipo: BoletaHonorarioTipo,
  ): Promise<number>;
}

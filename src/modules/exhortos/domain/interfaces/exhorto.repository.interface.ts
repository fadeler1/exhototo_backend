import { ExhortoEstado } from '../../../../common/enums/exhorto-estado.enum';
import { ExhortoLegacySource } from '../../../../common/enums/exhorto-legacy-source.enum';
import type { ExhortoDashboardStats } from './exhorto-dashboard-stats.interface';

export interface DiligenciaEntity {
  id: string;
  codigo: string;
  etiqueta: string;
  etiquetaLegacy: string;
  fecha: Date;
  observaciones: string;
  usuario: string;
  usuarioId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BoletaReceptorEntity {
  id: string;
  receptor: string;
  documento: number;
  monto: number;
  diligenciaCodigo: string;
  diligenciaEtiquetaLegacy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExhortoEntity {
  id: string;
  apellidoDeudor: string;
  nombreCliente: string;
  rut: string;
  tribunalOrigen: string;
  rolJuicio: string;
  ciudad: string;
  facultades: string;
  abogado: string;
  createdById?: string;
  createdByName: string;
  estado: ExhortoEstado;
  diligencias: DiligenciaEntity[];
  boletasReceptor: BoletaReceptorEntity[];
  tieneBoletaHonorario: boolean;
  tieneBoletaDevolucion: boolean;
  legacySource?: ExhortoLegacySource;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateExhortoData {
  apellidoDeudor: string;
  nombreCliente: string;
  rut?: string;
  tribunalOrigen: string;
  rolJuicio: string;
  ciudad: string;
  facultades: string;
  abogado: string;
  createdById?: string;
  createdByName: string;
}

export interface UpdateExhortoData {
  apellidoDeudor?: string;
  nombreCliente?: string;
  rut?: string;
  tribunalOrigen?: string;
  rolJuicio?: string;
  ciudad?: string;
  facultades?: string;
  abogado?: string;
  estado?: ExhortoEstado;
  tieneBoletaHonorario?: boolean;
  tieneBoletaDevolucion?: boolean;
}

export interface ExhortoSearchFilters {
  apellidoDeudor?: string;
  nombreCliente?: string;
  tribunalOrigen?: string;
  rolJuicio?: string;
  ciudad?: string;
  facultades?: string;
  abogado?: string;
  estado?: ExhortoEstado;
  fechaDesde?: Date;
  fechaHasta?: Date;
  diligenciaCodigo?: string;
  page?: number;
  limit?: number;
}

export interface MoveTerminatedExhortosToRespaldoFilters {
  fechaDesde: Date;
  fechaHasta: Date;
  diligenciaCodigo?: string;
}

export interface SearchRespaldoExhortoFilters {
  fechaDesde: Date;
  fechaHasta: Date;
  estado: ExhortoEstado;
  diligenciaCodigo?: string;
  page?: number;
  limit?: number;
}

export interface MoveTerminatedExhortosToRespaldoResult {
  collection: 'respaldo_exhorto';
  matched: number;
  moved: number;
  deleted: number;
  fechaDesde: Date;
  fechaHasta: Date;
}

export interface RestoreExhortosFromRespaldoResult {
  collection: 'exhortos';
  matched: number;
  moved: number;
  deleted: number;
  fechaDesde: Date;
  fechaHasta: Date;
  estado: ExhortoEstado;
}

export interface IExhortoRepository {
  findById(id: string): Promise<ExhortoEntity | null>;
  search(filters: ExhortoSearchFilters): Promise<{
    data: ExhortoEntity[];
    total: number;
  }>;
  create(data: CreateExhortoData): Promise<ExhortoEntity>;
  update(id: string, data: UpdateExhortoData): Promise<ExhortoEntity | null>;
  delete(id: string): Promise<boolean>;
  addDiligencia(
    exhortoId: string,
    diligencia: Omit<DiligenciaEntity, 'id' | 'createdAt' | 'updatedAt'>,
    nuevoEstado: ExhortoEstado,
  ): Promise<ExhortoEntity | null>;
  updateDiligencia(
    exhortoId: string,
    diligenciaId: string,
    update: Partial<DiligenciaEntity>,
    nuevoEstado: ExhortoEstado,
  ): Promise<ExhortoEntity | null>;
  removeDiligencia(
    exhortoId: string,
    diligenciaId: string,
    nuevoEstado: ExhortoEstado,
  ): Promise<ExhortoEntity | null>;
  addBoletaReceptor(
    exhortoId: string,
    boleta: Omit<BoletaReceptorEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ExhortoEntity | null>;
  updateBoletaReceptor(
    exhortoId: string,
    boletaId: string,
    update: Partial<BoletaReceptorEntity>,
  ): Promise<ExhortoEntity | null>;
  removeBoletaReceptor(
    exhortoId: string,
    boletaId: string,
  ): Promise<ExhortoEntity | null>;
  getDashboardStats(): Promise<ExhortoDashboardStats>;
  moveTerminatedToRespaldo(
    filters: MoveTerminatedExhortosToRespaldoFilters,
  ): Promise<MoveTerminatedExhortosToRespaldoResult>;
  searchRespaldo(filters: SearchRespaldoExhortoFilters): Promise<{
    data: ExhortoEntity[];
    total: number;
    page: number;
    limit: number;
    collection: 'respaldo_exhorto';
  }>;
  restoreFromRespaldo(
    filters: SearchRespaldoExhortoFilters,
  ): Promise<RestoreExhortosFromRespaldoResult>;
}

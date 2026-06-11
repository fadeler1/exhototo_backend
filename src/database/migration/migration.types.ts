export interface MigrationOptions {
  dryRun: boolean;
  clear: boolean;
  includeUsers: boolean;
  forceUsers: boolean;
  /** Inserta un exhorto (y sus boletas honorario) por vez en MongoDB */
  sequential?: boolean;
  /** Dump phpMyAdmin multi-tabla (ej. ctr17658_EXHORTO.sql) */
  bundleFile?: string;
  /** Fuerza archivos sueltos (EXHORTO.sql, DILIGENCIA.sql, etc.) */
  noBundle?: boolean;
  /** Incluye respaldo_exhorto / respaldo_diligencia (histórico; no es la base activa). */
  includeRespaldo?: boolean;
}

export interface LegacyDataset {
  users: MysqlUsuarioRow[];
  exhortos: MysqlExhortoRow[];
  diligencias: MysqlDiligenciaRow[];
  boletasReceptor: MysqlBoletaReceptorRow[];
  boletasHonorario: MysqlBoletaHonorarioRow[];
}

export type ExhortoLegacySourceTag = 'activo' | 'respaldo';

export interface MigrationStats {
  users: { created: number; updated: number; skipped: number };
  exhortos: number;
  exhortosActivos: number;
  exhortosRespaldo: number;
  diligencias: number;
  boletasReceptor: number;
  boletasHonorario: number;
  skippedExhortos: number;
  /** Exhortos/diligencias cuyo USUARIO legacy no coincide con ningún documento en `users` */
  unmatchedUsuarios: number;
  /** Diligencias cuyo ID_EXHORTO no está en el dump de EXHORTO */
  orphanDiligencias: number;
  /** Boletas honorario cuyo ID_EXHORTO no está en el dump de EXHORTO */
  orphanBoletasHonorario: number;
  errors: string[];
}

export interface MysqlExhortoRow {
  ID: number;
  APELLIDO_DEUDOR: string;
  NOMBRE_CLIENTE: string;
  RUT: string | null;
  TRIBUNAL_ORIGEN: string;
  ROL_JUICIO: string;
  CIUDAD: string;
  FACULTADES: string | null;
  ABOGADO: string;
  USUARIO: string;
  ESTADO: number;
  BOLETA_HONORARIOS: number;
  BOLETA_DEVOLUCION: number;
  /** Asignado al fusionar EXHORTO + respaldo_exhorto desde el bundle */
  legacySource?: ExhortoLegacySourceTag;
}

export interface MysqlDiligenciaRow {
  ID: number;
  ID_EXHORTO: number;
  DILIGENCIA: string;
  FECHA: string;
  OBSERVACIONES: string | null;
  USUARIO: string;
}

export interface MysqlBoletaReceptorRow {
  ID: number;
  ID_EXHORTO: number;
  RECEPTOR: string;
  DOCUMENTO: number;
  MONTO: number;
  DILIGENCIA: string;
}

export interface MysqlBoletaHonorarioRow {
  ID: number;
  ID_EXHORTO: number;
  DOCUMENTO: number;
  MONTO: number;
  ESTADO: number;
  TIPO: number;
  PERTENECE: string;
  FECHA: string;
}

export interface MysqlUsuarioRow {
  ID: number;
  NOMBRE: string;
  LOGIN: string;
  PASSWORD: string;
  PERFIL: string;
  EMAIL: string;
  AUTORIZACION: number;
}

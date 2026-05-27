export interface ExhortoAttributeCount {
  nombre: string;
  total: number;
  vigente: number;
  terminado: number;
}

export interface ExhortoDashboardRecent {
  id: string;
  apellidoDeudor: string;
  nombreCliente: string;
  ciudad: string;
  abogado: string;
  estado: number;
  createdAt?: Date;
}

export interface ExhortoRegionCount {
  code: string;
  name: string;
  total: number;
  vigente: number;
  terminado: number;
}

export interface ExhortoDashboardStats {
  resumen: {
    total: number;
    vigente: number;
    terminado: number;
  };
  /** Mapa regional: agrupación de `porCiudad` por región de Chile */
  porRegion: ExhortoRegionCount[];
  porCiudad: ExhortoAttributeCount[];
  porAbogado: ExhortoAttributeCount[];
  porTribunal: ExhortoAttributeCount[];
  porFacultades: ExhortoAttributeCount[];
  recientes: ExhortoDashboardRecent[];
}

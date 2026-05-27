import { fixLegacyEncoding } from './fix-legacy-encoding.util';

export interface ChileRegionDefinition {
  code: string;
  name: string;
}

export const CHILE_REGIONS: ChileRegionDefinition[] = [
  { code: 'CL-AP', name: 'Arica y Parinacota' },
  { code: 'CL-TA', name: 'Tarapacá' },
  { code: 'CL-AN', name: 'Antofagasta' },
  { code: 'CL-AT', name: 'Atacama' },
  { code: 'CL-CO', name: 'Coquimbo' },
  { code: 'CL-VS', name: 'Valparaíso' },
  { code: 'CL-RM', name: 'Metropolitana' },
  { code: 'CL-LI', name: "O'Higgins" },
  { code: 'CL-ML', name: 'Maule' },
  { code: 'CL-NB', name: 'Ñuble' },
  { code: 'CL-BI', name: 'Biobío' },
  { code: 'CL-AR', name: 'Araucanía' },
  { code: 'CL-LR', name: 'Los Ríos' },
  { code: 'CL-LL', name: 'Los Lagos' },
  { code: 'CL-AI', name: 'Aysén' },
  { code: 'CL-MA', name: 'Magallanes' },
];

const CIUDAD_TO_REGION: Record<string, string> = {
  ARICA: 'CL-AP',
  IQUIQUE: 'CL-TA',
  ALTOHOSPICIO: 'CL-TA',
  ANTOFAGASTA: 'CL-AN',
  CALAMA: 'CL-AN',
  COPIAPO: 'CL-AT',
  LASERENA: 'CL-CO',
  COQUIMBO: 'CL-CO',
  VALPARAISO: 'CL-VS',
  'VINA DEL MAR': 'CL-VS',
  VINADELMAR: 'CL-VS',
  QUILPUE: 'CL-VS',
  SANTIAGO: 'CL-RM',
  'SAN BERNARDO': 'CL-RM',
  MAIPU: 'CL-RM',
  RANCAGUA: 'CL-LI',
  SANFERNANDO: 'CL-LI',
  TALCA: 'CL-ML',
  CURICO: 'CL-ML',
  LINARES: 'CL-ML',
  CHILLAN: 'CL-NB',
  CONCEPCION: 'CL-BI',
  TALCAHUANO: 'CL-BI',
  LOSANGELES: 'CL-BI',
  TEMUCO: 'CL-AR',
  VALDIVIA: 'CL-LR',
  OSORNO: 'CL-LL',
  PUERTOMONTT: 'CL-LL',
  CASTRO: 'CL-LL',
  COYHAIQUE: 'CL-AI',
  PUNTAARENAS: 'CL-MA',
};

export function normalizeCiudadKey(ciudad: string | null | undefined): string {
  const text = fixLegacyEncoding((ciudad ?? '').trim());
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

export function ciudadToRegionCode(ciudad: string | null | undefined): string {
  const key = normalizeCiudadKey(ciudad);
  if (!key) return 'CL-XX';
  if (CIUDAD_TO_REGION[key]) return CIUDAD_TO_REGION[key];

  for (const [city, code] of Object.entries(CIUDAD_TO_REGION)) {
    if (key.includes(city) || city.includes(key)) return code;
  }

  if (key.includes('CONCEPCION')) return 'CL-BI';
  if (key.includes('SANTIAGO')) return 'CL-RM';
  if (key.includes('VALPARAISO') || key.includes('VINA')) return 'CL-VS';
  if (key.includes('ANTOFAGASTA')) return 'CL-AN';
  if (key.includes('TEMUCO')) return 'CL-AR';
  if (key.includes('PUERTO MONTT') || key.includes('PUERTOMONTT')) return 'CL-LL';

  return 'CL-XX';
}

export interface AttributeCountInput {
  nombre: string;
  total: number;
  vigente: number;
  terminado: number;
}

export interface RegionCountOutput {
  code: string;
  name: string;
  total: number;
  vigente: number;
  terminado: number;
}

/** Agrupa conteos por ciudad hacia regiones de Chile (para mapa HOME). */
export function aggregatePorRegion(
  porCiudad: AttributeCountInput[],
): RegionCountOutput[] {
  const acc = new Map<
    string,
    { total: number; vigente: number; terminado: number }
  >();

  for (const item of porCiudad) {
    const code = ciudadToRegionCode(item.nombre);
    const bucket = acc.get(code) ?? { total: 0, vigente: 0, terminado: 0 };
    bucket.total += item.total;
    bucket.vigente += item.vigente;
    bucket.terminado += item.terminado;
    acc.set(code, bucket);
  }

  const regions: RegionCountOutput[] = CHILE_REGIONS.map((region) => ({
    code: region.code,
    name: region.name,
    total: acc.get(region.code)?.total ?? 0,
    vigente: acc.get(region.code)?.vigente ?? 0,
    terminado: acc.get(region.code)?.terminado ?? 0,
  }));

  const otras = acc.get('CL-XX');
  if (otras && otras.total > 0) {
    regions.push({
      code: 'CL-XX',
      name: 'Otras / sin clasificar',
      ...otras,
    });
  }

  return regions;
}

import {
  aggregatePorRegion,
  ciudadToRegionCode,
  normalizeCiudadKey,
} from './chile-regions.util';

describe('chile-regions.util', () => {
  it('normaliza ciudad con acentos', () => {
    expect(normalizeCiudadKey(' Concepción ')).toBe('CONCEPCION');
  });

  it('mapea ciudades conocidas a región', () => {
    expect(ciudadToRegionCode('Santiago')).toBe('CL-RM');
    expect(ciudadToRegionCode('CONCEPCION')).toBe('CL-BI');
    expect(ciudadToRegionCode('Ciudad desconocida')).toBe('CL-XX');
  });

  it('agrupa por región desde porCiudad', () => {
    const regions = aggregatePorRegion([
      { nombre: 'Santiago', total: 10, vigente: 7, terminado: 3 },
      { nombre: 'Concepción', total: 5, vigente: 2, terminado: 3 },
    ]);

    const rm = regions.find((r) => r.code === 'CL-RM');
    const bi = regions.find((r) => r.code === 'CL-BI');
    expect(rm?.total).toBe(10);
    expect(bi?.total).toBe(5);
  });
});

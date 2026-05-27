import { parseDiligenciaLegacy } from './legacy-diligencia.util';
import { parseLegacyDate } from './legacy-date.util';

describe('legacy migration utils', () => {
  it('parsea diligencia legacy', () => {
    const r = parseDiligenciaLegacy('2.-INGRESO - ROL');
    expect(r.codigo).toBe('2');
    expect(r.etiqueta).toBe('INGRESO - ROL');
    expect(r.etiquetaLegacy).toBe('2.-INGRESO - ROL');
  });

  it('parsea fecha dd/MM/yyyy', () => {
    const d = parseLegacyDate('15/06/2024');
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(15);
  });
});

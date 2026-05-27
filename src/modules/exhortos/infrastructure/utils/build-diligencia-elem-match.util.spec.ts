import { buildDiligenciaElemMatch } from './build-diligencia-elem-match.util';

describe('buildDiligenciaElemMatch', () => {
  const desde = new Date('2024-01-01T00:00:00.000Z');
  const hasta = new Date('2024-12-31T23:59:59.999Z');

  it('returns null when no diligencia filters', () => {
    expect(buildDiligenciaElemMatch({})).toBeNull();
  });

  it('filters by codigo only', () => {
    expect(buildDiligenciaElemMatch({ diligenciaCodigo: '34' })).toEqual({
      codigo: '34',
    });
  });

  it('filters by legacy date codes when only dates', () => {
    expect(buildDiligenciaElemMatch({ fechaDesde: desde, fechaHasta: hasta })).toEqual({
      codigo: { $in: ['1', '2'] },
      fecha: { $gte: desde, $lte: hasta },
    });
  });

  it('filters by codigo and date range together', () => {
    expect(
      buildDiligenciaElemMatch({
        diligenciaCodigo: '2',
        fechaDesde: desde,
        fechaHasta: hasta,
      }),
    ).toEqual({
      codigo: '2',
      fecha: { $gte: desde, $lte: hasta },
    });
  });
});

import { ExhortoEstado } from '../enums/exhorto-estado.enum';
import { ExhortoStateDomain } from './exhorto-state.domain';

describe('ExhortoStateDomain', () => {
  it('cierra el exhorto al agregar diligencia 39 o 40', () => {
    expect(
      ExhortoStateDomain.estadoAfterAddDiligencia(ExhortoEstado.VIGENTE, '39'),
    ).toBe(ExhortoEstado.TERMINADO);
  });

  it('reabre el exhorto si no quedan diligencias de cierre', () => {
    expect(
      ExhortoStateDomain.estadoAfterRemoveDiligencia([{ codigo: '2' }]),
    ).toBe(ExhortoEstado.VIGENTE);
  });
});

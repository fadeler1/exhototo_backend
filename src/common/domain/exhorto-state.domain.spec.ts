import { ExhortoEstado } from '../enums/exhorto-estado.enum';
import { ExhortoStateDomain } from './exhorto-state.domain';

describe('ExhortoStateDomain', () => {
  it('cierra el exhorto al agregar diligencia 34 o 35', () => {
    expect(
      ExhortoStateDomain.estadoAfterAddDiligencia(ExhortoEstado.VIGENTE, '34'),
    ).toBe(ExhortoEstado.TERMINADO);
  });

  it('reabre el exhorto si no quedan diligencias de cierre', () => {
    expect(
      ExhortoStateDomain.estadoAfterRemoveDiligencia([{ codigo: '2' }]),
    ).toBe(ExhortoEstado.VIGENTE);
  });
});

import { ExhortoEstado } from '../enums/exhorto-estado.enum';
import { DILIGENCIA_CLOSING_CODES } from '../constants/diligencia.constants';

export interface DiligenciaStateInput {
  codigo: string;
}

/**
 * Reglas de negocio del estado del exhorto (antes dispersas en PHP).
 * Single Responsibility: solo calcula transiciones de ESTADO.
 */
export class ExhortoStateDomain {
  static isClosingDiligencia(codigo: string): boolean {
    return (DILIGENCIA_CLOSING_CODES as readonly string[]).includes(codigo);
  }

  static estadoAfterAddDiligencia(
    current: ExhortoEstado,
    diligenciaCodigo: string,
  ): ExhortoEstado {
    if (this.isClosingDiligencia(diligenciaCodigo)) {
      return ExhortoEstado.TERMINADO;
    }
    return current;
  }

  static estadoAfterRemoveDiligencia(
    remainingDiligencias: DiligenciaStateInput[],
  ): ExhortoEstado {
    const hasClosing = remainingDiligencias.some((d) =>
      this.isClosingDiligencia(d.codigo),
    );
    return hasClosing ? ExhortoEstado.TERMINADO : ExhortoEstado.VIGENTE;
  }
}

export interface ParsedDiligenciaLegacy {
  codigo: string;
  etiqueta: string;
  etiquetaLegacy: string;
}

/**
 * Parsea textos como `2.-INGRESO - ROL` o `1.-a ENCARGA EXHORTO CLIENTE`.
 */
export function parseDiligenciaLegacy(raw: string): ParsedDiligenciaLegacy {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d+)\.-\s*(.*)$/i);
  if (match) {
    const codigo = match[1];
    const etiqueta = match[2].trim();
    return {
      codigo,
      etiqueta,
      etiquetaLegacy: `${codigo}.-${etiqueta}`,
    };
  }
  return {
    codigo: '0',
    etiqueta: trimmed,
    etiquetaLegacy: trimmed,
  };
}

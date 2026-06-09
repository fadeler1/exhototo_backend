/** Catálogo de tipos de diligencia — orden y textos vigentes */
export const DILIGENCIA_TIPOS_SEED = [
  { codigo: '0', etiqueta: 'ESTAMPADOS EN SISTEMA' },
  { codigo: '1', etiqueta: 'ENCARGA EXHORTO CLIENTE' },
  { codigo: '2', etiqueta: 'INGRESO - ROL' },
  { codigo: '3', etiqueta: 'CÚMPLASE' },
  { codigo: '4', etiqueta: 'ENCARGO EXHORTO RECEPTOR' },
  { codigo: '5', etiqueta: 'REITERA ENCARGO RECEPTOR' },
  { codigo: '6', etiqueta: 'EXHORTO EN PODER DE RECEPTOR' },
  { codigo: '7', etiqueta: 'SE INSISTE RECEPTOR APURAR GESTION' },
  { codigo: '8', etiqueta: 'BUSQUEDA NEGATIVA' },
  { codigo: '9', etiqueta: 'SEÑALA NUEVO DOMICILIO' },
  { codigo: '10', etiqueta: 'BUSQUEDA POSITIVA' },
  { codigo: '11', etiqueta: 'NOTIFICACION ART. 44' },
  { codigo: '12', etiqueta: 'NOTIFICACION PERSONAL' },
  { codigo: '13', etiqueta: 'REQUERIMIENTO DE PAGO' },
  { codigo: '14', etiqueta: 'OPOSICIÓN EMBARGO' },
  { codigo: '15', etiqueta: 'NOTIFICACION CEDULA' },
  { codigo: '16', etiqueta: 'SOLICITA FUERZA PÚBLICA PARA EMBARGO' },
  { codigo: '17', etiqueta: 'SOLICITA FUERZA PUBLICA PARA RETIRO' },
  { codigo: '18', etiqueta: 'EMBARGO VEHICULO' },
  { codigo: '19', etiqueta: 'EMBARGO INMUEBLE' },
  { codigo: '20', etiqueta: 'EMBARGO BIENES MUEBLES' },
  { codigo: '21', etiqueta: 'EMBARGO CUENTA CORRIENTE Y OTROS' },
  { codigo: '22', etiqueta: 'EMBARGO FRUSTRADO' },
  { codigo: '23', etiqueta: 'OPOSICIÓN RETIRO' },
  { codigo: '24', etiqueta: 'RETIRO FRUSTRADO' },
  { codigo: '25', etiqueta: 'SOLICITA AMPLIACIÓN DE PLAZO' },
  { codigo: '26', etiqueta: 'AMPLIACIÓN DE PLAZO POR' },
  { codigo: '27', etiqueta: 'SOLICITA AUTORIZACION ADICIONAL POR DISTANCIA' },
  { codigo: '28', etiqueta: 'SUSPENSIÓN DE EXHORTO' },
  { codigo: '29', etiqueta: 'AMPLIACIÓN DE EMBARGO' },
  { codigo: '30', etiqueta: 'ALZAMIENTO DE EMBARGO' },
  { codigo: '31', etiqueta: 'FUERZA PUBLICA PARA LANZAMIENTO' },
  { codigo: '32', etiqueta: 'NOTIFICACIÓN LANZAMIENTO' },
  { codigo: '33', etiqueta: 'SOLICITA CLIENTE SUBIR ESCRITO' },
  { codigo: '34', etiqueta: 'SE INFORMA GESTIÓN AL CLIENTE' },
  { codigo: '35', etiqueta: 'SE SOLICITA DESIGNACIÓN DE RECEPTOR AD-HOC' },
  { codigo: '36', etiqueta: 'SE DESIGNA RECEPTOR AD-HOC' },
  { codigo: '37', etiqueta: 'SOLICITA DEVOLUCIÓN EXHORTO' },
  { codigo: '38', etiqueta: 'DEVOLUCION EXHORTO TRIBUNAL DE ORIGEN' },
  {
    codigo: '39',
    etiqueta:
      'DEVOLUCION EXHORTO SIN DILIGENCIA / EXHORTO EN ESTADO DE TERMINADO',
  },
  {
    codigo: '40',
    etiqueta:
      'DEVOLUCION EXHORTO CLIENTE / EXHORTO EN ESTADO DE TERMINADO',
  },
  { codigo: '41', etiqueta: 'COBRADO AL CLIENTE' },
] as const;

export function formatDiligenciaLegacy(
  codigo: string,
  etiqueta: string,
): string {
  return `${codigo}.-${etiqueta}`;
}

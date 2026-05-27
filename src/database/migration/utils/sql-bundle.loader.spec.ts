import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadLegacyDatasetFromSqlBundle } from './sql-bundle.loader';

describe('sql-bundle.loader', () => {
  it('agrupa tablas desde un dump multi-tabla', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sql-bundle-'));
    const bundlePath = join(dir, 'test-bundle.sql');
    const sql = `
INSERT INTO \`EXHORTO\` (\`ID\`, \`APELLIDO_DEUDOR\`, \`NOMBRE_CLIENTE\`, \`RUT\`, \`TRIBUNAL_ORIGEN\`, \`ROL_JUICIO\`, \`CIUDAD\`, \`FACULTADES\`, \`ABOGADO\`, \`USUARIO\`, \`ESTADO\`, \`BOLETA_HONORARIOS\`, \`BOLETA_DEVOLUCION\`) VALUES
(1, 'DEUDOR', 'CLIENTE', '', 'TRIB', 'ROL', 'STGO', 'FAC', 'ABG', 'USER', 1, 0, 0);
INSERT INTO \`DILIGENCIA\` (\`ID\`, \`ID_EXHORTO\`, \`DILIGENCIA\`, \`FECHA\`, \`OBSERVACIONES\`, \`USUARIO\`, \`orden\`) VALUES
(10, 1, '1.-ENCARGA', '01/01/2020', '', 'USER', 1);
INSERT INTO \`BOLETA_RECEPTOR\` (\`ID\`, \`ID_EXHORTO\`, \`RECEPTOR\`, \`DOCUMENTO\`, \`MONTO\`, \`DILIGENCIA\`) VALUES
(20, 1, 'REC', 1, 1000, '1.-ENCARGA');
INSERT INTO \`BOLETA_HONORARIO\` (\`ID\`, \`ID_EXHORTO\`, \`DOCUMENTO\`, \`MONTO\`, \`ESTADO\`, \`TIPO\`, \`PERTENECE\`, \`FECHA\`) VALUES
(30, 1, 99, 5000, 0, 1, 'USER', '01/01/2020');
INSERT INTO \`USUARIO\` (\`ID\`, \`NOMBRE\`, \`LOGIN\`, \`PASSWORD\`, \`PERFIL\`, \`EMAIL\`, \`AUTORIZACION\`) VALUES
(1, 'USER', 'user', 'pass', 'TODO', 'u@test.cl', 0);
`;
    writeFileSync(bundlePath, sql, 'latin1');

    const data = loadLegacyDatasetFromSqlBundle(bundlePath);

    expect(data.exhortos).toHaveLength(1);
    expect(data.diligencias).toHaveLength(1);
    expect(data.boletasReceptor).toHaveLength(1);
    expect(data.boletasHonorario).toHaveLength(1);
    expect(data.usuarios).toHaveLength(1);
    expect(Number(data.diligencias[0].ID_EXHORTO)).toBe(1);
  });
});

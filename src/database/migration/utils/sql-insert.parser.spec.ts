import { parseSqlInserts } from './sql-insert.parser';

describe('sql-insert.parser', () => {
  it('parsea INSERT de phpMyAdmin', () => {
    const sql = `
INSERT INTO \`EXHORTO\` (\`ID\`, \`APELLIDO_DEUDOR\`, \`NOMBRE_CLIENTE\`, \`ESTADO\`) VALUES
(1, 'PEREZ', 'BANCO', 1),
(2, 'GOMEZ', 'FORUM', 0);
`;
    const blocks = parseSqlInserts(sql, 'EXHORTO');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].rows).toHaveLength(2);
    expect(blocks[0].rows[0].ID).toBe(1);
    expect(blocks[0].rows[0].APELLIDO_DEUDOR).toBe('PEREZ');
    expect(blocks[0].rows[1].ESTADO).toBe(0);
  });

  it('parsea comillas escapadas', () => {
    const sql = `INSERT INTO \`DILIGENCIA\` (\`ID\`, \`OBSERVACIONES\`) VALUES (1, 'texto con ''comilla'' interna');`;
    const rows = parseSqlInserts(sql, 'DILIGENCIA')[0].rows;
    expect(rows[0].OBSERVACIONES).toBe("texto con 'comilla' interna");
  });
});

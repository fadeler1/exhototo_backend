import { readFileSync } from 'fs';

export interface ParsedInsertBlock {
  table: string;
  columns: string[];
  rows: Record<string, string | number | null>[];
}

const INSERT_HEADER =
  /INSERT\s+INTO\s+`([^`]+)`\s*\(([^)]+)\)\s*VALUES\s*/gi;

export function readSqlDumpFile(filePath: string): string {
  return readFileSync(filePath, 'latin1');
}

export function parseSqlInsertsFromFile(
  filePath: string,
  tableFilter?: string,
): ParsedInsertBlock[] {
  const content = readSqlDumpFile(filePath);
  return parseSqlInserts(content, tableFilter);
}

export function parseSqlInserts(
  sql: string,
  tableFilter?: string,
): ParsedInsertBlock[] {
  const blocks: ParsedInsertBlock[] = [];
  let match: RegExpExecArray | null;

  INSERT_HEADER.lastIndex = 0;
  while ((match = INSERT_HEADER.exec(sql)) !== null) {
    const table = match[1];
    if (tableFilter && table.toUpperCase() !== tableFilter.toUpperCase()) {
      continue;
    }

    const columns = match[2]
      .split(',')
      .map((c) => c.trim().replace(/^`|`$/g, ''));

    const valuesStart = match.index + match[0].length;
    const valuesEnd = findValuesBlockEnd(sql, valuesStart);
    const valuesBlock = sql.slice(valuesStart, valuesEnd);

    const tuples = splitTopLevelTuples(valuesBlock);
    const rows = tuples.map((tuple) => rowToObject(columns, parseTupleValues(tuple)));

    blocks.push({ table, columns, rows });
  }

  return blocks;
}

export function flattenInsertRows(
  blocks: ParsedInsertBlock[],
): Record<string, string | number | null>[] {
  return blocks.flatMap((b) => b.rows);
}

function findValuesBlockEnd(sql: string, start: number): number {
  let inString = false;
  for (let i = start; i < sql.length; i++) {
    const c = sql[i];
    if (c === "'" && sql[i - 1] !== '\\') {
      if (inString && sql[i + 1] === "'") {
        i++;
        continue;
      }
      inString = !inString;
      continue;
    }
    if (!inString && c === ';') {
      return i;
    }
  }
  return sql.length;
}

function splitTopLevelTuples(block: string): string[] {
  const tuples: string[] = [];
  let depth = 0;
  let inString = false;
  let start = -1;

  for (let i = 0; i < block.length; i++) {
    const c = block[i];

    if (c === "'" && block[i - 1] !== '\\') {
      if (inString && block[i + 1] === "'") {
        i++;
        continue;
      }
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (c === '(') {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (c === ')') {
      depth--;
      if (depth === 0 && start >= 0) {
        tuples.push(block.slice(start, i));
        start = -1;
      }
    }
  }

  return tuples;
}

function parseTupleValues(tuple: string): (string | number | null)[] {
  const values: (string | number | null)[] = [];
  let i = 0;

  while (i < tuple.length) {
    while (i < tuple.length && (tuple[i] === ' ' || tuple[i] === ',')) i++;
    if (i >= tuple.length) break;

    if (tuple[i] === "'") {
      i++;
      let value = '';
      while (i < tuple.length) {
        if (tuple[i] === "'") {
          if (tuple[i + 1] === "'") {
            value += "'";
            i += 2;
            continue;
          }
          i++;
          break;
        }
        if (tuple[i] === '\\' && i + 1 < tuple.length) {
          value += tuple[i + 1];
          i += 2;
          continue;
        }
        value += tuple[i];
        i++;
      }
      values.push(value);
      continue;
    }

    if (tuple.slice(i, i + 4).toUpperCase() === 'NULL') {
      values.push(null);
      i += 4;
      continue;
    }

    let num = '';
    while (i < tuple.length && tuple[i] !== ',') {
      num += tuple[i];
      i++;
    }
    values.push(Number(num.trim()));
  }

  return values;
}

function rowToObject(
  columns: string[],
  values: (string | number | null)[],
): Record<string, string | number | null> {
  const row: Record<string, string | number | null> = {};
  columns.forEach((col, idx) => {
    row[col] = values[idx] ?? null;
  });
  return row;
}

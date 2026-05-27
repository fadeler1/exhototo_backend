import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SqlToMongoMigration } from './sql-to-mongo.migration';
import type { MigrationOptions } from './migration.types';
import {
  DEFAULT_SQL_BUNDLE_FILE,
  resolveSqlBundlePath,
} from './utils/sql-bundle.loader';

function parseArgs(argv: string[]): MigrationOptions & { sqlDir: string } {
  const dirArg = argv.find((a) => a.startsWith('--dir='));
  const bundleArg = argv.find((a) => a.startsWith('--bundle='));
  const sqlDir = dirArg?.split('=')[1] ?? 'data/sql';
  const noBundle = argv.includes('--no-bundle');

  let bundleFile: string | undefined;
  if (bundleArg) {
    bundleFile = bundleArg.split('=')[1] || DEFAULT_SQL_BUNDLE_FILE;
  } else if (!noBundle && resolveSqlBundlePath(sqlDir)) {
    bundleFile = DEFAULT_SQL_BUNDLE_FILE;
  }

  return {
    dryRun: argv.includes('--dry-run'),
    clear: argv.includes('--clear'),
    includeUsers: argv.includes('--users'),
    forceUsers: argv.includes('--force-users'),
    sequential: argv.includes('--sequential'),
    includeRespaldo: argv.includes('--include-respaldo'),
    bundleFile,
    sqlDir,
  };
}

async function bootstrap() {
  const options = parseArgs(process.argv.slice(2));

  console.log('Opciones:', options);
  const bundlePath = options.bundleFile
    ? resolveSqlBundlePath(options.sqlDir, options.bundleFile)
    : undefined;

  if (bundlePath) {
    console.log(`Fuente: dump bundle ${bundlePath}`);
    console.log(
      'Tablas activas: EXHORTO (2345), DILIGENCIA, BOLETA_RECEPTOR, BOLETA_HONORARIO (+ USUARIO con --users)',
    );
    console.log(
      'Las tablas respaldo_* del dump se ignoran salvo que uses --include-respaldo',
    );
  } else {
    console.log(
      'Fuente: archivos sueltos EXHORTO.sql, DILIGENCIA.sql, BOLETA_RECEPTOR.sql, BOLETA_HONORARIO.sql',
    );
  }
  console.log(
    'Flags: --sequential, --bundle=archivo.sql, --no-bundle, --include-respaldo, --users\n',
  );

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const stats = await app.get(SqlToMongoMigration).run(options, options.sqlDir);
    console.log('\n=== Resumen migración SQL ===');
    const { errors, ...summary } = stats;
    console.log(JSON.stringify(summary, null, 2));
    if (errors.length > 0) {
      console.log(`\nErrores (${errors.length}), primeros 10:`);
      errors.slice(0, 10).forEach((e) => console.log(`  - ${e}`));
    }
    if (stats.errors.length > 0) process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void bootstrap();

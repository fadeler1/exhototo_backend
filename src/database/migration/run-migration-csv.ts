import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CsvToMongoMigration } from './csv-to-mongo.migration';
import type { MigrationOptions } from './migration.types';

function parseArgs(argv: string[]): MigrationOptions & { dataDir: string } {
  const dataDirArg = argv.find((a) => a.startsWith('--dir='));
  return {
    dryRun: argv.includes('--dry-run'),
    clear: argv.includes('--clear'),
    includeUsers: argv.includes('--users'),
    forceUsers: argv.includes('--force-users'),
    dataDir: dataDirArg?.split('=')[1] ?? 'data/mysql-export',
  };
}

async function bootstrap() {
  const options = parseArgs(process.argv.slice(2));

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const stats = await app
      .get(CsvToMongoMigration)
      .run(options, options.dataDir);
    console.log('\n=== Resumen migración CSV ===');
    console.log(JSON.stringify(stats, null, 2));
    if (stats.errors.length > 0) process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void bootstrap();

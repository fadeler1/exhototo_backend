import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { MysqlToMongoMigration } from './mysql-to-mongo.migration';
import type { MigrationOptions } from './migration.types';

function parseArgs(argv: string[]): MigrationOptions {
  return {
    dryRun: argv.includes('--dry-run'),
    clear: argv.includes('--clear'),
    includeUsers: argv.includes('--users'),
    forceUsers: argv.includes('--force-users'),
  };
}

async function bootstrap() {
  const options = parseArgs(process.argv.slice(2));

  if (!process.env.MYSQL_HOST || !process.env.MYSQL_DATABASE) {
    console.error(
      'Configura MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD y MYSQL_DATABASE en .env',
    );
    process.exit(1);
  }

  console.log('Opciones:', options);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const stats = await app.get(MysqlToMongoMigration).run(options);
    console.log('\n=== Resumen migración ===');
    console.log(JSON.stringify(stats, null, 2));
    if (stats.errors.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await app.close();
  }
}

void bootstrap();

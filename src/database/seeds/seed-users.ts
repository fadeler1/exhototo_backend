import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UsersSeedService } from './users.seed.service';

async function bootstrap() {
  const force = process.argv.includes('--force');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const result = await app.get(UsersSeedService).seed(force);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

void bootstrap();

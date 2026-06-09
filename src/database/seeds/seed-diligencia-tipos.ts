import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DiligenciaTiposSeedService } from './diligencia-tipos.seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const result = await app.get(DiligenciaTiposSeedService).seed();
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

void bootstrap();

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BOLETA_HONORARIO_REPOSITORY } from '../../common/tokens/repository.tokens';
import { ExhortosModule } from '../exhortos/exhortos.module';
import { HonorariosService } from './application/honorarios.service';
import { BoletaHonorarioRepository } from './infrastructure/repositories/boleta-honorario.repository';
import {
  BoletaHonorario,
  BoletaHonorarioSchema,
} from './infrastructure/schemas/boleta-honorario.schema';
import { HonorariosController } from './presentation/honorarios.controller';

@Module({
  imports: [
    ExhortosModule,
    MongooseModule.forFeature([
      { name: BoletaHonorario.name, schema: BoletaHonorarioSchema },
    ]),
  ],
  controllers: [HonorariosController],
  providers: [
    HonorariosService,
    {
      provide: BOLETA_HONORARIO_REPOSITORY,
      useClass: BoletaHonorarioRepository,
    },
  ],
})
export class HonorariosModule {}

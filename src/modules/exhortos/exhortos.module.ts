import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EXHORTO_REPOSITORY } from '../../common/tokens/repository.tokens';
import { CatalogModule } from '../catalog/catalog.module';
import { BoletasReceptorService } from './application/boletas-receptor.service';
import { DiligenciasService } from './application/diligencias.service';
import { ExhortosService } from './application/exhortos.service';
import { ExhortoRepository } from './infrastructure/repositories/exhorto.repository';
import {
  Exhorto,
  ExhortoSchema,
} from './infrastructure/schemas/exhorto.schema';
import {
  RESPALDO_EXHORTO_MODEL,
  RespaldoExhortoSchema,
} from './infrastructure/schemas/respaldo-exhorto.schema';
import { ExhortosController } from './presentation/exhortos.controller';

@Module({
  imports: [
    CatalogModule,
    MongooseModule.forFeature([
      { name: Exhorto.name, schema: ExhortoSchema },
      { name: RESPALDO_EXHORTO_MODEL, schema: RespaldoExhortoSchema },
    ]),
  ],
  controllers: [ExhortosController],
  providers: [
    ExhortosService,
    DiligenciasService,
    BoletasReceptorService,
    { provide: EXHORTO_REPOSITORY, useClass: ExhortoRepository },
  ],
  exports: [ExhortosService, EXHORTO_REPOSITORY],
})
export class ExhortosModule {}

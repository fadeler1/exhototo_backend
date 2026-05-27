import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogService } from './application/catalog.service';
import {
  DiligenciaTipo,
  DiligenciaTipoSchema,
} from './infrastructure/schemas/diligencia-tipo.schema';
import { CatalogController } from './presentation/catalog.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DiligenciaTipo.name, schema: DiligenciaTipoSchema },
    ]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}

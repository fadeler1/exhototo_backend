import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogModule } from '../../modules/catalog/catalog.module';
import { User, UserSchema } from '../../modules/users/infrastructure/schemas/user.schema';
import { DiligenciaTiposSeedService } from './diligencia-tipos.seed.service';
import { UsersSeedService } from './users.seed.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    CatalogModule,
  ],
  providers: [UsersSeedService, DiligenciaTiposSeedService],
  exports: [UsersSeedService, DiligenciaTiposSeedService],
})
export class SeedsModule {}

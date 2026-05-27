import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { MigrationModule } from './database/migration/migration.module';
import { SeedsModule } from './database/seeds/seeds.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ExhortosModule } from './modules/exhortos/exhortos.module';
import { HonorariosModule } from './modules/honorarios/honorarios.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    SeedsModule,
    MigrationModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    ExhortosModule,
    HonorariosModule,
  ],
})
export class AppModule {}

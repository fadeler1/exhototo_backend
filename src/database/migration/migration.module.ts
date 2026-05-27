import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BoletaHonorario,
  BoletaHonorarioSchema,
} from '../../modules/honorarios/infrastructure/schemas/boleta-honorario.schema';
import {
  Exhorto,
  ExhortoSchema,
} from '../../modules/exhortos/infrastructure/schemas/exhorto.schema';
import { User, UserSchema } from '../../modules/users/infrastructure/schemas/user.schema';
import { CsvToMongoMigration } from './csv-to-mongo.migration';
import { LegacyDataMigratorService } from './legacy-data-migrator.service';
import { MysqlToMongoMigration } from './mysql-to-mongo.migration';
import { SqlToMongoMigration } from './sql-to-mongo.migration';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exhorto.name, schema: ExhortoSchema },
      { name: BoletaHonorario.name, schema: BoletaHonorarioSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [
    LegacyDataMigratorService,
    MysqlToMongoMigration,
    CsvToMongoMigration,
    SqlToMongoMigration,
  ],
  exports: [
    LegacyDataMigratorService,
    MysqlToMongoMigration,
    CsvToMongoMigration,
    SqlToMongoMigration,
  ],
})
export class MigrationModule {}

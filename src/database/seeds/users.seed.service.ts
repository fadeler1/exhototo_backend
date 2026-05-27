import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../modules/users/infrastructure/schemas/user.schema';
import { USERS_SEED_DATA } from './users.seed.data';

@Injectable()
export class UsersSeedService {
  private readonly logger = new Logger(UsersSeedService.name);
  private readonly saltRounds = 10;

  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async seed(force = false): Promise<{ created: number; updated: number; skipped: number }> {
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of USERS_SEED_DATA) {
      const login = row.login.toLowerCase();
      const existing = await this.userModel.findOne({ login }).exec();

      if (existing && !force) {
        skipped++;
        this.logger.log(`Usuario ya existe (omitido): ${login}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(row.password, this.saltRounds);
      const payload = {
        nombre: row.nombre,
        login,
        password: hashedPassword,
        perfil: row.perfil,
        email: row.email.toLowerCase(),
        autorizacion: row.autorizacion,
        mustChangePassword: false,
      };

      if (existing && force) {
        await this.userModel.updateOne({ login }, payload).exec();
        updated++;
        this.logger.log(`Usuario actualizado: ${login}`);
      } else {
        await this.userModel.create(payload);
        created++;
        this.logger.log(`Usuario creado: ${login} (legacy ID ${row.legacyId})`);
      }
    }

    this.logger.log(
      `Seed usuarios finalizado → creados: ${created}, actualizados: ${updated}, omitidos: ${skipped}`,
    );
    return { created, updated, skipped };
  }
}

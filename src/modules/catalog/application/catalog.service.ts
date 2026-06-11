import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DILIGENCIA_TIPOS_SEED,
  formatDiligenciaLegacy,
} from '../data/diligencia-tipos.seed';
import {
  DiligenciaTipo,
  DiligenciaTipoDocument,
} from '../infrastructure/schemas/diligencia-tipo.schema';

@Injectable()
export class CatalogService implements OnModuleInit {
  constructor(
    @InjectModel(DiligenciaTipo.name)
    private readonly diligenciaTipoModel: Model<DiligenciaTipoDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDiligenciaTipos();
  }

  async syncDiligenciaTipos(): Promise<{ upserted: number }> {
    await Promise.all(
      DILIGENCIA_TIPOS_SEED.map((item, index) =>
        this.diligenciaTipoModel.updateOne(
          { codigo: item.codigo },
          {
            $set: {
              codigo: item.codigo,
              etiqueta: item.etiqueta,
              etiquetaLegacy: formatDiligenciaLegacy(
                item.codigo,
                item.etiqueta,
              ),
              activo: true,
              orden: index,
            },
          },
          { upsert: true },
        ),
      ),
    );

    return { upserted: DILIGENCIA_TIPOS_SEED.length };
  }

  private async seedDiligenciaTipos() {
    await this.syncDiligenciaTipos();
  }

  findDiligenciaTipos() {
    return this.diligenciaTipoModel
      .find({ activo: true })
      .sort({ orden: 1 })
      .lean()
      .exec();
  }

  async findDiligenciaTipoByCodigo(codigo: string) {
    return this.diligenciaTipoModel
      .findOne({ codigo, activo: true })
      .lean()
      .exec();
  }
}

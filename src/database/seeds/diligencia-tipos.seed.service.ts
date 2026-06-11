import { Injectable, Logger } from '@nestjs/common';
import { CatalogService } from '../../modules/catalog/application/catalog.service';

@Injectable()
export class DiligenciaTiposSeedService {
  private readonly logger = new Logger(DiligenciaTiposSeedService.name);

  constructor(private readonly catalogService: CatalogService) {}

  async seed() {
    const result = await this.catalogService.syncDiligenciaTipos();
    this.logger.log(
      `Catálogo diligencia_tipos sincronizado → upserted: ${result.upserted}`,
    );
    return result;
  }
}

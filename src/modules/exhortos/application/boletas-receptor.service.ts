import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EXHORTO_REPOSITORY } from '../../../common/tokens/repository.tokens';
import { CatalogService } from '../../catalog/application/catalog.service';
import type { IExhortoRepository } from '../domain/interfaces/exhorto.repository.interface';
import { CreateBoletaReceptorDto } from '../presentation/dto/create-boleta-receptor.dto';
import { UpdateBoletaReceptorDto } from '../presentation/dto/update-boleta-receptor.dto';
import { ExhortosService } from './exhortos.service';

@Injectable()
export class BoletasReceptorService {
  constructor(
    @Inject(EXHORTO_REPOSITORY)
    private readonly exhortoRepository: IExhortoRepository,
    private readonly catalogService: CatalogService,
    private readonly exhortosService: ExhortosService,
  ) {}

  async add(exhortoId: string, dto: CreateBoletaReceptorDto) {
    await this.exhortosService.findById(exhortoId);

    const updated = await this.exhortoRepository.addBoletaReceptor(exhortoId, {
      receptor: dto.receptor,
      documento: dto.documento,
      monto: dto.monto,
      diligenciaCodigo: '',
      diligenciaEtiquetaLegacy: '',
    });

    if (!updated) throw new NotFoundException('Exhorto no encontrado');
    return updated;
  }

  async update(
    exhortoId: string,
    boletaId: string,
    dto: UpdateBoletaReceptorDto,
  ) {
    await this.exhortosService.findById(exhortoId);
    const { diligenciaCodigo, ...rest } = dto;
    const update = { ...rest };

    if (diligenciaCodigo) {
      const tipo =
        await this.catalogService.findDiligenciaTipoByCodigo(diligenciaCodigo);
      if (!tipo) throw new BadRequestException('Tipo de diligencia inválido');
      Object.assign(update, {
        diligenciaCodigo: tipo.codigo,
        diligenciaEtiquetaLegacy: tipo.etiquetaLegacy,
      });
    }

    const updated = await this.exhortoRepository.updateBoletaReceptor(
      exhortoId,
      boletaId,
      update,
    );

    if (!updated) throw new NotFoundException('Boleta receptor no encontrada');
    return updated;
  }

  async remove(exhortoId: string, boletaId: string) {
    await this.exhortosService.findById(exhortoId);
    const updated = await this.exhortoRepository.removeBoletaReceptor(
      exhortoId,
      boletaId,
    );
    if (!updated) throw new NotFoundException('Boleta receptor no encontrada');
    return updated;
  }
}

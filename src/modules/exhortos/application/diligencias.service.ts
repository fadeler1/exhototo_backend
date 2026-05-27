import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExhortoStateDomain } from '../../../common/domain/exhorto-state.domain';
import { EXHORTO_REPOSITORY } from '../../../common/tokens/repository.tokens';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { CatalogService } from '../../catalog/application/catalog.service';
import type { IExhortoRepository } from '../domain/interfaces/exhorto.repository.interface';
import { CreateDiligenciaDto } from '../presentation/dto/create-diligencia.dto';
import { UpdateDiligenciaDto } from '../presentation/dto/update-diligencia.dto';
import { ExhortosService } from './exhortos.service';

@Injectable()
export class DiligenciasService {
  constructor(
    @Inject(EXHORTO_REPOSITORY)
    private readonly exhortoRepository: IExhortoRepository,
    private readonly catalogService: CatalogService,
    private readonly exhortosService: ExhortosService,
  ) {}

  async add(exhortoId: string, dto: CreateDiligenciaDto, user: JwtPayload) {
    const exhorto = await this.exhortosService.findById(exhortoId);
    const tipo = await this.catalogService.findDiligenciaTipoByCodigo(
      dto.codigo,
    );
    if (!tipo) {
      throw new BadRequestException('Tipo de diligencia inválido');
    }

    const nuevoEstado = ExhortoStateDomain.estadoAfterAddDiligencia(
      exhorto.estado,
      dto.codigo,
    );

    const updated = await this.exhortoRepository.addDiligencia(
      exhortoId,
      {
        codigo: tipo.codigo,
        etiqueta: tipo.etiqueta,
        etiquetaLegacy: tipo.etiquetaLegacy,
        fecha: new Date(dto.fecha),
        observaciones: dto.observaciones ?? '',
        usuario: user.nombre,
        usuarioId: user.sub,
      },
      nuevoEstado,
    );

    if (!updated) throw new NotFoundException('Exhorto no encontrado');
    return updated;
  }

  async update(
    exhortoId: string,
    diligenciaId: string,
    dto: UpdateDiligenciaDto,
  ) {
    const exhorto = await this.exhortosService.findById(exhortoId);
    const diligencia = exhorto.diligencias.find((d) => d.id === diligenciaId);
    if (!diligencia) throw new NotFoundException('Diligencia no encontrada');

    const codigo = dto.codigo ?? diligencia.codigo;
    const tipo = await this.catalogService.findDiligenciaTipoByCodigo(codigo);
    if (!tipo) throw new BadRequestException('Tipo de diligencia inválido');

    const diligenciasActualizadas = exhorto.diligencias.map((d) =>
      d.id === diligenciaId ? { codigo } : { codigo: d.codigo },
    );
    const nuevoEstado = ExhortoStateDomain.estadoAfterRemoveDiligencia(
      diligenciasActualizadas,
    );

    const updated = await this.exhortoRepository.updateDiligencia(
      exhortoId,
      diligenciaId,
      {
        codigo: tipo.codigo,
        etiqueta: tipo.etiqueta,
        etiquetaLegacy: tipo.etiquetaLegacy,
        fecha: dto.fecha ? new Date(dto.fecha) : undefined,
        observaciones: dto.observaciones,
      },
      nuevoEstado,
    );

    if (!updated) throw new NotFoundException('Exhorto no encontrado');
    return updated;
  }

  async remove(exhortoId: string, diligenciaId: string) {
    const exhorto = await this.exhortosService.findById(exhortoId);
    const remaining = exhorto.diligencias
      .filter((d) => d.id !== diligenciaId)
      .map((d) => ({ codigo: d.codigo }));

    const nuevoEstado =
      ExhortoStateDomain.estadoAfterRemoveDiligencia(remaining);

    const updated = await this.exhortoRepository.removeDiligencia(
      exhortoId,
      diligenciaId,
      nuevoEstado,
    );

    if (!updated) throw new NotFoundException('Exhorto no encontrado');
    return updated;
  }
}

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BoletaHonorarioEstado } from '../../../common/enums/boleta-honorario-estado.enum';
import { BoletaHonorarioTipo } from '../../../common/enums/boleta-honorario-tipo.enum';
import {
  BOLETA_HONORARIO_REPOSITORY,
  EXHORTO_REPOSITORY,
} from '../../../common/tokens/repository.tokens';
import type { IExhortoRepository } from '../../exhortos/domain/interfaces/exhorto.repository.interface';
import type {
  BoletaHonorarioSearchFilters,
  IBoletaHonorarioRepository,
} from '../domain/interfaces/boleta-honorario.repository.interface';
import { CreateBoletaHonorarioDto } from '../presentation/dto/create-boleta-honorario.dto';
import { SearchBoletaHonorarioDto } from '../presentation/dto/search-boleta-honorario.dto';
import { UpdateBoletaHonorarioDto } from '../presentation/dto/update-boleta-honorario.dto';

@Injectable()
export class HonorariosService {
  constructor(
    @Inject(BOLETA_HONORARIO_REPOSITORY)
    private readonly boletaRepository: IBoletaHonorarioRepository,
    @Inject(EXHORTO_REPOSITORY)
    private readonly exhortoRepository: IExhortoRepository,
  ) {}

  search(dto: SearchBoletaHonorarioDto) {
    const filters: BoletaHonorarioSearchFilters = { ...dto };
    return this.boletaRepository.search(filters);
  }

  async findById(id: string) {
    const boleta = await this.boletaRepository.findById(id);
    if (!boleta) throw new NotFoundException('Boleta no encontrada');
    return boleta;
  }

  async create(dto: CreateBoletaHonorarioDto) {
    const exhorto = await this.exhortoRepository.findById(dto.exhortoId);
    if (!exhorto) throw new NotFoundException('Exhorto no encontrado');

    const boleta = await this.boletaRepository.create({
      exhortoId: dto.exhortoId,
      documento: dto.documento,
      monto: dto.monto,
      tipo: dto.tipo,
      pertenece: dto.pertenece,
      fecha: new Date(dto.fecha),
    });

    await this.syncExhortoFlags(dto.exhortoId, dto.tipo);
    return boleta;
  }

  async update(id: string, dto: UpdateBoletaHonorarioDto) {
    await this.findById(id);
    const updated = await this.boletaRepository.update(id, {
      documento: dto.documento,
      monto: dto.monto,
      pertenece: dto.pertenece,
      fecha: dto.fecha ? new Date(dto.fecha) : undefined,
    });
    if (!updated) throw new NotFoundException('Boleta no encontrada');
    return updated;
  }

  async markAsPaid(id: string) {
    await this.findById(id);
    const updated = await this.boletaRepository.updateEstado(
      id,
      BoletaHonorarioEstado.PAGADO,
    );
    if (!updated) throw new NotFoundException('Boleta no encontrada');
    return updated;
  }

  /**
   * Legacy `eliminarDocumento.php`: DELETE boleta + actualizar EXHORTO.
   * TIPO 1 → `tieneBoletaHonorario`; TIPO 2 → `tieneBoletaDevolucion`.
   * Si quedan otras boletas del mismo tipo en el exhorto, el flag sigue en true.
   */
  async remove(id: string) {
    const boleta = await this.findById(id);
    const deleted = await this.boletaRepository.delete(id);
    if (!deleted) throw new NotFoundException('Boleta no encontrada');
    await this.syncExhortoFlags(boleta.exhortoId, boleta.tipo);
  }

  /** Equivalente a BOLETA_HONORARIOS / BOLETA_DEVOLUCION en MySQL según existan boletas del tipo. */
  private async syncExhortoFlags(exhortoId: string, tipo: BoletaHonorarioTipo) {
    const count = await this.boletaRepository.countByExhortoAndTipo(
      exhortoId,
      tipo,
    );
    const hasBoleta = count > 0;

    if (tipo === BoletaHonorarioTipo.HONORARIO) {
      await this.exhortoRepository.update(exhortoId, {
        tieneBoletaHonorario: hasBoleta,
      });
    } else {
      await this.exhortoRepository.update(exhortoId, {
        tieneBoletaDevolucion: hasBoleta,
      });
    }
  }
}

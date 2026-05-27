import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EXHORTO_REPOSITORY } from '../../../common/tokens/repository.tokens';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import type {
  ExhortoSearchFilters,
  IExhortoRepository,
} from '../domain/interfaces/exhorto.repository.interface';
import { CreateExhortoDto } from '../presentation/dto/create-exhorto.dto';
import { MoveExhortosToRespaldoDto } from '../presentation/dto/move-exhortos-to-respaldo.dto';
import { RestoreExhortosFromRespaldoDto } from '../presentation/dto/restore-exhortos-from-respaldo.dto';
import { SearchExhortoDto } from '../presentation/dto/search-exhorto.dto';
import { SearchRespaldoExhortoDto } from '../presentation/dto/search-respaldo-exhorto.dto';
import { UpdateExhortoDto } from '../presentation/dto/update-exhorto.dto';

@Injectable()
export class ExhortosService {
  constructor(
    @Inject(EXHORTO_REPOSITORY)
    private readonly exhortoRepository: IExhortoRepository,
  ) {}

  search(dto: SearchExhortoDto) {
    const filters: ExhortoSearchFilters = {
      apellidoDeudor: dto.apellidoDeudor,
      nombreCliente: dto.nombreCliente,
      tribunalOrigen: dto.tribunalOrigen,
      rolJuicio: dto.rolJuicio,
      ciudad: dto.ciudad,
      facultades: dto.facultades,
      abogado: dto.abogado,
      estado: dto.estado,
      fechaDesde: dto.fechaDesde ? this.parseStartOfDay(dto.fechaDesde) : undefined,
      fechaHasta: dto.fechaHasta ? this.parseEndOfDay(dto.fechaHasta) : undefined,
      diligenciaCodigo: dto.diligenciaCodigo?.trim() || undefined,
      page: dto.page,
      limit: dto.limit,
    };
    this.assertValidDateRange(filters.fechaDesde, filters.fechaHasta);
    return this.exhortoRepository.search(filters);
  }

  async findById(id: string) {
    const exhorto = await this.exhortoRepository.findById(id);
    if (!exhorto) throw new NotFoundException('Exhorto no encontrado');
    return exhorto;
  }

  /** Devuelve solo el array `diligencias` embebido en el documento del exhorto. */
  async findDiligencias(exhortoId: string) {
    const exhorto = await this.findById(exhortoId);
    return exhorto.diligencias;
  }

  create(dto: CreateExhortoDto, user: JwtPayload) {
    return this.exhortoRepository.create({
      apellidoDeudor: dto.apellidoDeudor,
      nombreCliente: dto.nombreCliente,
      rut: dto.rut ?? '',
      tribunalOrigen: dto.tribunalOrigen,
      rolJuicio: dto.rolJuicio,
      ciudad: dto.ciudad,
      facultades: dto.facultades ?? '',
      abogado: dto.abogado,
      createdById: user.sub,
      createdByName: user.nombre,
    });
  }

  async update(id: string, dto: UpdateExhortoDto) {
    await this.findById(id);
    const updated = await this.exhortoRepository.update(id, dto);
    if (!updated) throw new NotFoundException('Exhorto no encontrado');
    return updated;
  }

  async remove(id: string) {
    await this.findById(id);
    const deleted = await this.exhortoRepository.delete(id);
    if (!deleted) throw new NotFoundException('Exhorto no encontrado');
  }

  getDashboardStats() {
    return this.exhortoRepository.getDashboardStats();
  }

  moveTerminatedToRespaldo(dto: MoveExhortosToRespaldoDto) {
    const fechaDesde = this.parseStartOfDay(dto.fechaDesde);
    const fechaHasta = this.parseEndOfDay(dto.fechaHasta);

    if (fechaDesde > fechaHasta) {
      throw new BadRequestException(
        'fechaDesde debe ser menor o igual a fechaHasta',
      );
    }

    return this.exhortoRepository.moveTerminatedToRespaldo({
      fechaDesde,
      fechaHasta,
      diligenciaCodigo: dto.diligenciaCodigo?.trim() || undefined,
    });
  }

  searchRespaldo(dto: SearchRespaldoExhortoDto) {
    const fechaDesde = this.parseStartOfDay(dto.fechaDesde);
    const fechaHasta = this.parseEndOfDay(dto.fechaHasta);

    if (fechaDesde > fechaHasta) {
      throw new BadRequestException(
        'fechaDesde debe ser menor o igual a fechaHasta',
      );
    }

    return this.exhortoRepository.searchRespaldo({
      fechaDesde,
      fechaHasta,
      estado: dto.estado,
      diligenciaCodigo: dto.diligenciaCodigo?.trim() || undefined,
      page: dto.page,
      limit: dto.limit,
    });
  }

  restoreFromRespaldo(dto: RestoreExhortosFromRespaldoDto) {
    const fechaDesde = this.parseStartOfDay(dto.fechaDesde);
    const fechaHasta = this.parseEndOfDay(dto.fechaHasta);

    if (fechaDesde > fechaHasta) {
      throw new BadRequestException(
        'fechaDesde debe ser menor o igual a fechaHasta',
      );
    }

    return this.exhortoRepository.restoreFromRespaldo({
      fechaDesde,
      fechaHasta,
      estado: dto.estado,
      diligenciaCodigo: dto.diligenciaCodigo?.trim() || undefined,
    });
  }

  private assertValidDateRange(fechaDesde?: Date, fechaHasta?: Date) {
    if ((fechaDesde && !fechaHasta) || (!fechaDesde && fechaHasta)) {
      throw new BadRequestException(
        'fechaDesde y fechaHasta deben enviarse juntas',
      );
    }
    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      throw new BadRequestException(
        'fechaDesde debe ser menor o igual a fechaHasta',
      );
    }
  }

  private parseStartOfDay(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('fechaDesde inválida');
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      date.setUTCHours(0, 0, 0, 0);
    }
    return date;
  }

  private parseEndOfDay(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('fechaHasta inválida');
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      date.setUTCHours(23, 59, 59, 999);
    }
    return date;
  }
}

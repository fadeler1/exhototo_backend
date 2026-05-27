import { NotFoundException } from '@nestjs/common';
import { BoletaHonorarioTipo } from '../../../common/enums/boleta-honorario-tipo.enum';
import { HonorariosService } from './honorarios.service';
import type { IBoletaHonorarioRepository } from '../domain/interfaces/boleta-honorario.repository.interface';
import type { IExhortoRepository } from '../../exhortos/domain/interfaces/exhorto.repository.interface';

describe('HonorariosService.remove (legacy eliminarDocumento)', () => {
  const exhortoId = '507f1f77bcf86cd799439011';
  const boletaId = '507f1f77bcf86cd799439012';

  let boletaRepository: jest.Mocked<
    Pick<
      IBoletaHonorarioRepository,
      'findById' | 'delete' | 'countByExhortoAndTipo'
    >
  >;
  let exhortoRepository: jest.Mocked<Pick<IExhortoRepository, 'findById' | 'update'>>;
  let service: HonorariosService;

  beforeEach(() => {
    boletaRepository = {
      findById: jest.fn(),
      delete: jest.fn(),
      countByExhortoAndTipo: jest.fn(),
    };
    exhortoRepository = {
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    };
    service = new HonorariosService(
      boletaRepository as unknown as IBoletaHonorarioRepository,
      exhortoRepository as unknown as IExhortoRepository,
    );
  });

  it('elimina la boleta y pone tieneBoletaHonorario en false si no quedan honorarios (TIPO=1)', async () => {
    boletaRepository.findById.mockResolvedValue({
      id: boletaId,
      exhortoId,
      documento: 1,
      monto: 1000,
      estado: 0,
      tipo: BoletaHonorarioTipo.HONORARIO,
      pertenece: 'USER',
      fecha: new Date(),
    });
    boletaRepository.delete.mockResolvedValue(true);
    boletaRepository.countByExhortoAndTipo.mockResolvedValue(0);

    await service.remove(boletaId);

    expect(boletaRepository.delete).toHaveBeenCalledWith(boletaId);
    expect(exhortoRepository.update).toHaveBeenCalledWith(exhortoId, {
      tieneBoletaHonorario: false,
    });
  });

  it('elimina la boleta y pone tieneBoletaDevolucion en false si TIPO=2 y no quedan devoluciones', async () => {
    boletaRepository.findById.mockResolvedValue({
      id: boletaId,
      exhortoId,
      documento: 1,
      monto: 1000,
      estado: 0,
      tipo: BoletaHonorarioTipo.DEVOLUCION,
      pertenece: 'USER',
      fecha: new Date(),
    });
    boletaRepository.delete.mockResolvedValue(true);
    boletaRepository.countByExhortoAndTipo.mockResolvedValue(0);

    await service.remove(boletaId);

    expect(exhortoRepository.update).toHaveBeenCalledWith(exhortoId, {
      tieneBoletaDevolucion: false,
    });
  });

  it('mantiene tieneBoletaHonorario true si aún hay otras boletas del mismo tipo', async () => {
    boletaRepository.findById.mockResolvedValue({
      id: boletaId,
      exhortoId,
      documento: 1,
      monto: 1000,
      estado: 0,
      tipo: BoletaHonorarioTipo.HONORARIO,
      pertenece: 'USER',
      fecha: new Date(),
    });
    boletaRepository.delete.mockResolvedValue(true);
    boletaRepository.countByExhortoAndTipo.mockResolvedValue(1);

    await service.remove(boletaId);

    expect(exhortoRepository.update).toHaveBeenCalledWith(exhortoId, {
      tieneBoletaHonorario: true,
    });
  });

  it('lanza NotFoundException si la boleta no existe', async () => {
    boletaRepository.findById.mockResolvedValue(null);

    await expect(service.remove(boletaId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

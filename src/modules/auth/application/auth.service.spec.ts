import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserPerfil } from '../../../common/enums/user-perfil.enum';
import { AuthService } from './auth.service';
import { PasswordRecoveryMailService } from './password-recovery-mail.service';

describe('AuthService password recovery', () => {
  const user = {
    id: 'user-1',
    nombre: 'Pablo',
    login: 'pmagnere',
    password: 'hash',
    perfil: UserPerfil.TODO,
    email: 'test@example.com',
    autorizacion: 48291,
    mustChangePassword: false,
  };

  const userRepository = {
    findByLogin: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  const passwordRecoveryMailService = {
    sendRecoveryCode: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      userRepository as never,
      jwtService as unknown as JwtService,
      passwordRecoveryMailService as unknown as PasswordRecoveryMailService,
    );
  });

  it('genera código, lo guarda y envía el correo', async () => {
    userRepository.findByEmail.mockResolvedValue(user);
    userRepository.update.mockResolvedValue({ ...user, autorizacion: 99999 });

    const result = await service.requestPasswordRecovery(user.email);

    expect(result.message).toContain('Se enviará un correo');
    expect(userRepository.update).toHaveBeenCalledWith(user.id, {
      autorizacion: expect.any(Number),
    });
    expect(passwordRecoveryMailService.sendRecoveryCode).toHaveBeenCalledWith(
      user.email,
      expect.any(Number),
    );
  });

  it('rechaza email no registrado', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      service.requestPasswordRecovery('noexiste@example.com'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('valida un código correcto', async () => {
    userRepository.findByEmail.mockResolvedValue(user);

    await expect(
      service.validateRecoveryCode(user.email, 48291),
    ).resolves.toEqual({ valid: true });
  });

  it('rechaza un código inválido', async () => {
    userRepository.findByEmail.mockResolvedValue(user);

    await expect(
      service.validateRecoveryCode(user.email, 11111),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('actualiza la contraseña e invalida el código', async () => {
    userRepository.findByEmail.mockResolvedValue(user);
    userRepository.update.mockResolvedValue({
      ...user,
      autorizacion: 0,
      password: '$2b$10$hashed',
    });

    const result = await service.resetPassword(user.email, 48291, 'nueva1234');

    expect(result.message).toBe('Contraseña modificada correctamente');
    expect(userRepository.update).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({
        autorizacion: 0,
        password: expect.stringMatching(/^\$2[aby]\$/),
      }),
    );
  });
});

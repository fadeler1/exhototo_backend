import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { USER_REPOSITORY } from '../../../common/tokens/repository.tokens';
import type { IUserRepository } from '../../users/domain/interfaces/user.repository.interface';
import { LoginDto } from '../presentation/dto/login.dto';
import { PasswordRecoveryMailService } from './password-recovery-mail.service';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly passwordRecoveryMailService: PasswordRecoveryMailService,
  ) {}

  async login(dto: LoginDto) {
    const login = (dto.username ?? dto.usuario ?? '').trim().toLowerCase();
    if (!login) {
      throw new UnauthorizedException('Usuario y contraseña son obligatorios');
    }

    const user = await this.userRepository.findByLogin(login);
    if (!user) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    const valid = await this.validatePassword(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    const payload = {
      sub: user.id,
      login: user.login,
      nombre: user.nombre,
      perfil: user.perfil,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user: {
        username: user.login,
        nombre: user.nombre,
        perfil: user.perfil,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async requestPasswordRecovery(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new NotFoundException(
        'No está registrado con ese email. Contacte al administrador del sitio.',
      );
    }

    const codigo = randomInt(10000, 100000);
    await this.userRepository.update(user.id, { autorizacion: codigo });
    await this.passwordRecoveryMailService.sendRecoveryCode(
      user.email,
      codigo,
      user.nombre,
    );

    return {
      message:
        'Se envió un correo con el código para restablecer la contraseña.',
    };
  }

  async validateRecoveryCode(email: string, codigo: number) {
    await this.assertValidRecoveryCode(email, codigo);
    return { valid: true };
  }

  async resetPassword(email: string, codigo: number, password: string) {
    const user = await this.assertValidRecoveryCode(email, codigo);
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    await this.userRepository.update(user.id, {
      password: hashedPassword,
      autorizacion: 0,
    });

    return { message: 'Contraseña modificada correctamente' };
  }

  private async assertValidRecoveryCode(email: string, codigo: number) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user || user.autorizacion === 0 || user.autorizacion !== codigo) {
      throw new BadRequestException('Código inválido o expirado');
    }

    return user;
  }

  /** Soporta contraseñas legacy en texto plano y bcrypt */
  private async validatePassword(
    plain: string,
    stored: string,
  ): Promise<boolean> {
    if (stored.startsWith('$2')) {
      return bcrypt.compare(plain, stored);
    }
    return plain === stored;
  }
}

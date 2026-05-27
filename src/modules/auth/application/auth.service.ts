import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { USER_REPOSITORY } from '../../../common/tokens/repository.tokens';
import type { IUserRepository } from '../../users/domain/interfaces/user.repository.interface';
import { LoginDto } from '../presentation/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
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

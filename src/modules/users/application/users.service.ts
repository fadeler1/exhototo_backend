import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DEFAULT_USER_PASSWORD } from '../../../common/constants/diligencia.constants';
import { USER_REPOSITORY } from '../../../common/tokens/repository.tokens';
import type {
  IUserRepository,
  UpdateUserData,
  UserEntity,
} from '../domain/interfaces/user.repository.interface';
import { CreateUserDto } from '../presentation/dto/create-user.dto';
import { UpdateUserDto } from '../presentation/dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly saltRounds = 10;

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  findAll(): Promise<UserEntity[]> {
    return this.userRepository.findAll();
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async create(dto: CreateUserDto): Promise<Omit<UserEntity, 'password'>> {
    const existing = await this.userRepository.findByLogin(dto.login);
    if (existing) {
      throw new ConflictException('El login ya está registrado');
    }
    const hashed = await bcrypt.hash(
      dto.password ?? DEFAULT_USER_PASSWORD,
      this.saltRounds,
    );
    const user = await this.userRepository.create({
      ...dto,
      password: hashed,
    });
    return this.sanitize(user);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<UserEntity, 'password'>> {
    await this.findById(id);
    const data: UpdateUserData = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, this.saltRounds);
    }
    const updated = await this.userRepository.update(id, data);
    if (!updated) throw new NotFoundException('Usuario no encontrado');
    return this.sanitize(updated);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    const deleted = await this.userRepository.delete(id);
    if (!deleted) throw new NotFoundException('Usuario no encontrado');
  }

  sanitize(user: UserEntity): Omit<UserEntity, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safe } = user;
    return safe;
  }
}

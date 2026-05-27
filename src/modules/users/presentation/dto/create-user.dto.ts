import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserPerfil } from '../../../../common/enums/user-perfil.enum';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsString()
  @MinLength(3)
  login: string;

  @IsEmail()
  email: string;

  @IsEnum(UserPerfil)
  perfil: UserPerfil;

  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;
}

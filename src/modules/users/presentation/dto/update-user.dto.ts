import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserPerfil } from '../../../../common/enums/user-perfil.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  login?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UserPerfil)
  perfil?: UserPerfil;

  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;
}

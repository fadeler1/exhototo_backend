import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsString, Min, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  codigo: number;

  @IsString()
  @MinLength(4)
  password: string;
}

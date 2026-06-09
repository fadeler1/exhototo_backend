import { Type } from 'class-transformer';
import { IsEmail, IsInt, Min } from 'class-validator';

export class ValidateRecoveryCodeDto {
  @IsEmail()
  email: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  codigo: number;
}

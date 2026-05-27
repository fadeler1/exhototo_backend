import { IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  usuario?: string;

  @IsString()
  @MinLength(1)
  password: string;
}

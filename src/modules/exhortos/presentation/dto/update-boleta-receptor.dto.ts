import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateBoletaReceptorDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  receptor?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  documento?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monto?: number;

  @IsOptional()
  @IsString()
  diligenciaCodigo?: string;
}

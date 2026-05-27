import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateBoletaHonorarioDto {
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
  @MinLength(1)
  pertenece?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}

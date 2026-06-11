import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBoletaReceptorDto {
  @IsString()
  @MinLength(1)
  receptor: string;

  @IsNumber()
  @Min(0)
  documento: number;

  @IsNumber()
  @Min(0)
  monto: number;

  @IsOptional()
  @IsString()
  diligenciaEtiquetaLegacy?: string;
}

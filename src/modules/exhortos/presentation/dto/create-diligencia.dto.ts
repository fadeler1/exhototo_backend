import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDiligenciaDto {
  @IsString()
  @MinLength(1)
  codigo: string;

  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

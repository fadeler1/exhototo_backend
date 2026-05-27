import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateDiligenciaDto {
  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

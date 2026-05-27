import { IsDateString, IsOptional, IsString } from 'class-validator';

export class MoveExhortosToRespaldoDto {
  @IsDateString()
  fechaDesde: string;

  @IsDateString()
  fechaHasta: string;

  @IsOptional()
  @IsString()
  diligenciaCodigo?: string;
}

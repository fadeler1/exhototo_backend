import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ExhortoEstado } from '../../../../common/enums/exhorto-estado.enum';

export class RestoreExhortosFromRespaldoDto {
  @IsDateString()
  fechaDesde: string;

  @IsDateString()
  fechaHasta: string;

  @IsEnum(ExhortoEstado)
  @Type(() => Number)
  estado: ExhortoEstado;

  @IsOptional()
  @IsString()
  diligenciaCodigo?: string;
}

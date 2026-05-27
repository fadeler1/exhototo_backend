import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ExhortoEstado } from '../../../../common/enums/exhorto-estado.enum';

export class SearchRespaldoExhortoDto {
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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

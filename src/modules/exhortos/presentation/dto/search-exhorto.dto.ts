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

export class SearchExhortoDto {
  @IsOptional()
  @IsString()
  apellidoDeudor?: string;

  @IsOptional()
  @IsString()
  nombreCliente?: string;

  @IsOptional()
  @IsString()
  tribunalOrigen?: string;

  @IsOptional()
  @IsString()
  rolJuicio?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  facultades?: string;

  @IsOptional()
  @IsString()
  abogado?: string;

  @IsOptional()
  @IsEnum(ExhortoEstado)
  @Type(() => Number)
  estado?: ExhortoEstado;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  /** Código del catálogo de diligencias (ej. "1", "2", "34"). */
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

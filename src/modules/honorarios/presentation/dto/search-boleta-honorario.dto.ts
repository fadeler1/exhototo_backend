import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { BoletaHonorarioEstado } from '../../../../common/enums/boleta-honorario-estado.enum';
import { BoletaHonorarioTipo } from '../../../../common/enums/boleta-honorario-tipo.enum';

export class SearchBoletaHonorarioDto {
  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  abogado?: string;

  @IsOptional()
  @IsString()
  caratula?: string;

  @IsOptional()
  @IsString()
  rolJuicio?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  documento?: number;

  @IsOptional()
  @IsEnum(BoletaHonorarioTipo)
  @Type(() => Number)
  tipo?: BoletaHonorarioTipo;

  @IsOptional()
  @IsEnum(BoletaHonorarioEstado)
  @Type(() => Number)
  estado?: BoletaHonorarioEstado;

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

  /** `true` o `1`: devuelve todos los resultados en una sola respuesta (sin paginar). */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1' || value === 1)
  @IsBoolean()
  export?: boolean;
}

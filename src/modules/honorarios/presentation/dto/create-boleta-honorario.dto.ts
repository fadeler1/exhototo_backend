import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { BoletaHonorarioTipo } from '../../../../common/enums/boleta-honorario-tipo.enum';

export class CreateBoletaHonorarioDto {
  @IsMongoId()
  exhortoId: string;

  @IsNumber()
  @Min(0)
  documento: number;

  @IsNumber()
  @Min(0)
  monto: number;

  @IsEnum(BoletaHonorarioTipo)
  @Type(() => Number)
  tipo: BoletaHonorarioTipo;

  @IsString()
  @MinLength(1)
  pertenece: string;

  @IsDateString()
  fecha: string;
}

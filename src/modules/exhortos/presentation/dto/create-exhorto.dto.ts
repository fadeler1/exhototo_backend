import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateExhortoDto {
  @IsString()
  @MinLength(1)
  apellidoDeudor: string;

  @IsString()
  @MinLength(1)
  nombreCliente: string;

  @IsOptional()
  @IsString()
  rut?: string;

  @IsString()
  @MinLength(1)
  tribunalOrigen: string;

  @IsString()
  @MinLength(1)
  rolJuicio: string;

  @IsString()
  @MinLength(1)
  ciudad: string;

  @IsOptional()
  @IsString()
  facultades?: string;

  @IsString()
  @MinLength(1)
  abogado: string;
}

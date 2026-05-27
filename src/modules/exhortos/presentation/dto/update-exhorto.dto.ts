import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateExhortoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  apellidoDeudor?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  nombreCliente?: string;

  @IsOptional()
  @IsString()
  rut?: string;

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
}

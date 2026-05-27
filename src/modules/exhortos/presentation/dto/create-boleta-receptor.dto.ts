import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreateBoletaReceptorDto {
  @IsString()
  @MinLength(1)
  receptor: string;

  @IsNumber()
  @Min(0)
  documento: number;

  @IsNumber()
  @Min(0)
  monto: number;
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HonorariosService } from '../application/honorarios.service';
import { CreateBoletaHonorarioDto } from './dto/create-boleta-honorario.dto';
import { SearchBoletaHonorarioDto } from './dto/search-boleta-honorario.dto';
import { UpdateBoletaHonorarioDto } from './dto/update-boleta-honorario.dto';

@Controller('honorarios')
@UseGuards(JwtAuthGuard)
export class HonorariosController {
  constructor(private readonly honorariosService: HonorariosService) {}

  @Get()
  search(@Query() query: SearchBoletaHonorarioDto) {
    return this.honorariosService.search(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.honorariosService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateBoletaHonorarioDto) {
    return this.honorariosService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBoletaHonorarioDto) {
    return this.honorariosService.update(id, dto);
  }

  @Post(':id/pagar')
  pay(@Param('id') id: string) {
    return this.honorariosService.markAsPaid(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.honorariosService.remove(id);
  }
}

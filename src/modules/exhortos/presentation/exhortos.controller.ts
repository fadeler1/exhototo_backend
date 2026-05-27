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
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { BoletasReceptorService } from '../application/boletas-receptor.service';
import { DiligenciasService } from '../application/diligencias.service';
import { ExhortosService } from '../application/exhortos.service';
import { CreateBoletaReceptorDto } from './dto/create-boleta-receptor.dto';
import { CreateDiligenciaDto } from './dto/create-diligencia.dto';
import { CreateExhortoDto } from './dto/create-exhorto.dto';
import { MoveExhortosToRespaldoDto } from './dto/move-exhortos-to-respaldo.dto';
import { RestoreExhortosFromRespaldoDto } from './dto/restore-exhortos-from-respaldo.dto';
import { SearchExhortoDto } from './dto/search-exhorto.dto';
import { SearchRespaldoExhortoDto } from './dto/search-respaldo-exhorto.dto';
import { UpdateBoletaReceptorDto } from './dto/update-boleta-receptor.dto';
import { UpdateDiligenciaDto } from './dto/update-diligencia.dto';
import { UpdateExhortoDto } from './dto/update-exhorto.dto';

@Controller('exhortos')
@UseGuards(JwtAuthGuard)
export class ExhortosController {
  constructor(
    private readonly exhortosService: ExhortosService,
    private readonly diligenciasService: DiligenciasService,
    private readonly boletasReceptorService: BoletasReceptorService,
  ) {}

  @Get()
  search(@Query() query: SearchExhortoDto) {
    return this.exhortosService.search(query);
  }

  @Get('dashboard/stats')
  dashboardStats() {
    return this.exhortosService.getDashboardStats();
  }

  @Post('respaldo/mover')
  moveTerminatedToRespaldo(@Body() dto: MoveExhortosToRespaldoDto) {
    return this.exhortosService.moveTerminatedToRespaldo(dto);
  }

  @Get('respaldo/buscar')
  searchRespaldo(@Query() query: SearchRespaldoExhortoDto) {
    return this.exhortosService.searchRespaldo(query);
  }

  @Post('respaldo/recuperar')
  restoreFromRespaldo(@Body() dto: RestoreExhortosFromRespaldoDto) {
    return this.exhortosService.restoreFromRespaldo(dto);
  }

  @Get(':id/diligencias')
  findDiligencias(@Param('id') id: string) {
    return this.exhortosService.findDiligencias(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exhortosService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateExhortoDto, @CurrentUser() user: JwtPayload) {
    return this.exhortosService.create(dto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExhortoDto) {
    return this.exhortosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.exhortosService.remove(id);
  }

  @Post(':id/diligencias')
  addDiligencia(
    @Param('id') id: string,
    @Body() dto: CreateDiligenciaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.diligenciasService.add(id, dto, user);
  }

  @Patch(':id/diligencias/:diligenciaId')
  updateDiligencia(
    @Param('id') id: string,
    @Param('diligenciaId') diligenciaId: string,
    @Body() dto: UpdateDiligenciaDto,
  ) {
    return this.diligenciasService.update(id, diligenciaId, dto);
  }

  @Delete(':id/diligencias/:diligenciaId')
  removeDiligencia(
    @Param('id') id: string,
    @Param('diligenciaId') diligenciaId: string,
  ) {
    return this.diligenciasService.remove(id, diligenciaId);
  }

  @Post(':id/boletas-receptor')
  addBoletaReceptor(
    @Param('id') id: string,
    @Body() dto: CreateBoletaReceptorDto,
  ) {
    return this.boletasReceptorService.add(id, dto);
  }

  @Patch(':id/boletas-receptor/:boletaId')
  updateBoletaReceptor(
    @Param('id') id: string,
    @Param('boletaId') boletaId: string,
    @Body() dto: UpdateBoletaReceptorDto,
  ) {
    return this.boletasReceptorService.update(id, boletaId, dto);
  }

  @Delete(':id/boletas-receptor/:boletaId')
  removeBoletaReceptor(
    @Param('id') id: string,
    @Param('boletaId') boletaId: string,
  ) {
    return this.boletasReceptorService.remove(id, boletaId);
  }
}

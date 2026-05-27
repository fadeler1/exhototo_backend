import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CatalogService } from '../application/catalog.service';

@Controller('catalog')
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('diligencias')
  findDiligencias() {
    return this.catalogService.findDiligenciaTipos();
  }
}

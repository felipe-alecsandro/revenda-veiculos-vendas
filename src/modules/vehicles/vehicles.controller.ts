import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar veiculos a venda, do mais barato ao mais caro',
  })
  @ApiOkResponse({ description: 'Veiculos com status AVAILABLE.' })
  listAvailable() {
    return this.vehiclesService.listAvailable();
  }

  @Get('sold')
  @ApiOperation({
    summary: 'Listar veiculos vendidos, do mais barato ao mais caro',
  })
  @ApiOkResponse({ description: 'Vendas pagas ordenadas pelo preco da venda.' })
  listSold() {
    return this.vehiclesService.listSold();
  }
}

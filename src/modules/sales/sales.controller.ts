import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PurchaseVehicleDto } from './dto/purchase-vehicle.dto';
import { SalesService } from './sales.service';

@ApiTags('Sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Reservar veiculo e gerar codigo de pagamento' })
  purchase(@Body() body: PurchaseVehicleDto) {
    return this.salesService.purchase(body.vehicleId, body.cpf);
  }

  @Get()
  @ApiOperation({ summary: 'Listar compras pagas de um CPF' })
  listByCpf(@Query('cpf') cpf?: string) {
    return this.salesService.listByCpf(cpf ?? '');
  }
}

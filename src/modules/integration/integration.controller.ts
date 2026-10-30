import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpsertVehicleDto } from '../vehicles/dto/upsert-vehicle.dto';
import { VehiclesService } from '../vehicles/vehicles.service';
import { InternalTokenGuard } from './internal-token.guard';

@ApiTags('Integration')
@ApiHeader({ name: 'x-internal-token', required: true })
@Controller('integration/vehicles')
@UseGuards(InternalTokenGuard)
export class IntegrationController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Put(':id')
  @ApiOperation({ summary: 'Sincronizar a projecao de um veiculo do catalogo' })
  upsert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpsertVehicleDto,
  ) {
    return this.vehiclesService.upsertProjection(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover veiculo disponivel da projecao' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.vehiclesService.removeProjection(id);
  }
}

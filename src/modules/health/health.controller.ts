import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ description: 'Servico operacional.' })
  check() {
    return {
      status: 'ok',
      service: 'revenda-veiculos-vendas',
      timestamp: new Date().toISOString(),
    };
  }
}

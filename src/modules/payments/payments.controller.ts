import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SalesService } from '../sales/sales.service';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly salesService: SalesService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Informar pagamento efetuado ou cancelado a partir do codigo',
  })
  webhook(@Body() body: PaymentWebhookDto) {
    return this.salesService.applyPayment(body.paymentCode, body.status);
  }
}

import { IsIn, IsUUID } from 'class-validator';

export class PaymentWebhookDto {
  @IsUUID()
  paymentCode!: string;

  @IsIn(['PAID', 'CANCELLED'])
  status!: 'PAID' | 'CANCELLED';
}

import { Module } from '@nestjs/common';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { IntegrationController } from './integration.controller';
import { InternalTokenGuard } from './internal-token.guard';

@Module({
  imports: [VehiclesModule],
  controllers: [IntegrationController],
  providers: [InternalTokenGuard],
})
export class IntegrationModule {}

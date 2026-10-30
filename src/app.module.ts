import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InitSchema1710000000000 } from './database/migrations/1710000000000-init-schema';
import { HealthModule } from './modules/health/health.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SaleEntity } from './modules/sales/entities/sale.entity';
import { SalesModule } from './modules/sales/sales.module';
import { VehicleEntity } from './modules/vehicles/entities/vehicle.entity';
import { VehiclesModule } from './modules/vehicles/vehicles.module';

const isTest = process.env.NODE_ENV === 'test';

@Module({
  imports: [
    TypeOrmModule.forRoot(
      isTest
        ? {
            type: 'sqlite',
            database: ':memory:',
            entities: [VehicleEntity, SaleEntity],
            synchronize: true,
            dropSchema: true,
          }
        : {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [VehicleEntity, SaleEntity],
            migrations: [InitSchema1710000000000],
            migrationsRun: true,
            synchronize: false,
          },
    ),
    VehiclesModule,
    SalesModule,
    PaymentsModule,
    IntegrationModule,
    HealthModule,
  ],
})
export class AppModule {}

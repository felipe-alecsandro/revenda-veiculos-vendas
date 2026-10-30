import 'dotenv/config';
import { DataSource } from 'typeorm';
import { SaleEntity } from '../modules/sales/entities/sale.entity';
import { VehicleEntity } from '../modules/vehicles/entities/vehicle.entity';
import { InitSchema1710000000000 } from './migrations/1710000000000-init-schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required.');
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [VehicleEntity, SaleEntity],
  migrations: [InitSchema1710000000000],
  synchronize: false,
});

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { VehicleEntity } from '../../vehicles/entities/vehicle.entity';

export type SaleStatus = 'PENDING' | 'PAID' | 'CANCELLED';

@Entity('sales')
export class SaleEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId!: string;

  @ManyToOne(() => VehicleEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: VehicleEntity;

  @Column({ name: 'buyer_cpf', type: 'varchar', length: 11 })
  buyerCpf!: string;

  @Column({
    name: 'sale_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value),
    },
  })
  salePrice!: number;

  @Column({ name: 'payment_code', type: 'varchar', length: 36, unique: true })
  paymentCode!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: SaleStatus;

  @Column({ name: 'sold_at', type: 'varchar', length: 50, nullable: true })
  soldAt!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

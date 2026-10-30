import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { normalizeCpf } from '../../common/normalize-cpf';
import { pessimisticWriteLock } from '../../common/write-lock';
import { VehicleEntity } from '../vehicles/entities/vehicle.entity';
import { SaleEntity, SaleStatus } from './entities/sale.entity';

export interface SaleView {
  id: string;
  vehicleId: string;
  buyerCpf: string;
  salePrice: number;
  paymentCode: string;
  status: SaleStatus;
  soldAt: string | null;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    price: number;
    imageUrl: string | null;
    status: VehicleEntity['status'];
  } | null;
}

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SaleEntity)
    private readonly salesRepository: Repository<SaleEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async purchase(vehicleId: string, cpf: string): Promise<SaleView> {
    const buyerCpf = normalizeCpf(cpf);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const vehicle = await queryRunner.manager.findOne(VehicleEntity, {
        where: { id: vehicleId },
        lock: pessimisticWriteLock(this.dataSource.options.type),
      });
      if (!vehicle) {
        throw new NotFoundException('Vehicle was not found.');
      }
      if (vehicle.status !== 'AVAILABLE') {
        throw new ConflictException('Vehicle is no longer available.');
      }

      vehicle.status = 'RESERVED';
      await queryRunner.manager.save(vehicle);

      const sale = queryRunner.manager.create(SaleEntity, {
        id: randomUUID(),
        vehicleId,
        buyerCpf,
        salePrice: vehicle.price,
        paymentCode: randomUUID(),
        status: 'PENDING',
        soldAt: null,
      });
      const savedSale = await queryRunner.manager.save(sale);
      await queryRunner.commitTransaction();
      return this.toView(savedSale, vehicle);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async applyPayment(
    paymentCode: string,
    status: 'PAID' | 'CANCELLED',
  ): Promise<SaleView> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const sale = await queryRunner.manager.findOne(SaleEntity, {
        where: { paymentCode },
        lock: pessimisticWriteLock(this.dataSource.options.type),
      });
      if (!sale) {
        throw new NotFoundException('Payment code was not found.');
      }

      if (
        (sale.status === 'PAID' && status === 'PAID') ||
        (sale.status === 'CANCELLED' && status === 'CANCELLED')
      ) {
        const vehicle = await queryRunner.manager.findOne(VehicleEntity, {
          where: { id: sale.vehicleId },
        });
        await queryRunner.commitTransaction();
        return this.toView(sale, vehicle);
      }

      if (sale.status !== 'PENDING') {
        throw new ConflictException('Payment can no longer change status.');
      }

      const vehicle = await queryRunner.manager.findOne(VehicleEntity, {
        where: { id: sale.vehicleId },
        lock: pessimisticWriteLock(this.dataSource.options.type),
      });
      if (!vehicle) {
        throw new NotFoundException('Vehicle was not found.');
      }

      if (status === 'PAID') {
        sale.status = 'PAID';
        sale.soldAt = new Date().toISOString();
        vehicle.status = 'SOLD';
      } else {
        sale.status = 'CANCELLED';
        sale.soldAt = null;
        vehicle.status = 'AVAILABLE';
      }

      await queryRunner.manager.save(vehicle);
      const savedSale = await queryRunner.manager.save(sale);
      await queryRunner.commitTransaction();
      return this.toView(savedSale, vehicle);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async listByCpf(cpf: string): Promise<SaleView[]> {
    if (!cpf?.trim()) {
      throw new BadRequestException('cpf is required.');
    }
    const buyerCpf = normalizeCpf(cpf);
    const sales = await this.salesRepository.find({
      where: { buyerCpf, status: 'PAID' },
      relations: { vehicle: true },
      order: { soldAt: 'DESC' },
    });
    return sales.map((sale) => this.toView(sale, sale.vehicle));
  }

  private toView(sale: SaleEntity, vehicle: VehicleEntity | null): SaleView {
    return {
      id: sale.id,
      vehicleId: sale.vehicleId,
      buyerCpf: sale.buyerCpf,
      salePrice: sale.salePrice,
      paymentCode: sale.paymentCode,
      status: sale.status,
      soldAt: sale.soldAt,
      vehicle: vehicle
        ? {
            id: vehicle.id,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            color: vehicle.color,
            price: vehicle.price,
            imageUrl: vehicle.imageUrl,
            status: vehicle.status,
          }
        : null,
    };
  }
}

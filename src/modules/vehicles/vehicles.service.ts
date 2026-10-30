import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleEntity } from '../sales/entities/sale.entity';
import { UpsertVehicleDto } from './dto/upsert-vehicle.dto';
import { VehicleEntity, VehicleStatus } from './entities/vehicle.entity';

export interface ListedVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  price: number;
  imageUrl: string | null;
  status: VehicleStatus;
  buyerCpf?: string;
  soldAt?: string | null;
}

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehiclesRepository: Repository<VehicleEntity>,
    @InjectRepository(SaleEntity)
    private readonly salesRepository: Repository<SaleEntity>,
  ) {}

  async listAvailable(): Promise<ListedVehicle[]> {
    const vehicles = await this.vehiclesRepository.find({
      where: { status: 'AVAILABLE' },
      order: { price: 'ASC' },
    });
    return vehicles.map((vehicle) => this.toListed(vehicle));
  }

  async listSold(): Promise<ListedVehicle[]> {
    const sales = await this.salesRepository.find({
      where: { status: 'PAID' },
      relations: { vehicle: true },
      order: { salePrice: 'ASC', soldAt: 'ASC' },
    });
    return sales.map((sale) => ({
      ...this.toListed(sale.vehicle),
      price: sale.salePrice,
      buyerCpf: sale.buyerCpf,
      soldAt: sale.soldAt,
    }));
  }

  async upsertProjection(
    id: string,
    input: UpsertVehicleDto,
  ): Promise<VehicleEntity> {
    const existing = await this.vehiclesRepository.findOne({ where: { id } });
    if (!existing) {
      const created = this.vehiclesRepository.create({
        id,
        brand: input.brand,
        model: input.model,
        year: input.year,
        color: input.color,
        price: input.price,
        imageUrl: input.imageUrl ?? null,
        status: 'AVAILABLE',
      });
      return this.vehiclesRepository.save(created);
    }

    existing.brand = input.brand;
    existing.model = input.model;
    existing.year = input.year;
    existing.color = input.color;
    existing.price = input.price;
    existing.imageUrl = input.imageUrl ?? null;
    return this.vehiclesRepository.save(existing);
  }

  async removeProjection(id: string): Promise<void> {
    const vehicle = await this.vehiclesRepository.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${id} not found.`);
    }
    if (vehicle.status !== 'AVAILABLE') {
      throw new ConflictException(
        'Vehicle cannot be removed while reserved or sold.',
      );
    }

    await this.vehiclesRepository.manager.transaction(async (manager) => {
      await manager.delete(SaleEntity, { vehicleId: id, status: 'CANCELLED' });
      await manager.delete(VehicleEntity, { id });
    });
  }

  private toListed(vehicle: VehicleEntity): ListedVehicle {
    return {
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      price: vehicle.price,
      imageUrl: vehicle.imageUrl,
      status: vehicle.status,
    };
  }
}

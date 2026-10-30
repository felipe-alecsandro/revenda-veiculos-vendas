import { IsUUID } from 'class-validator';
import { IsCpf } from '../../../common/is-cpf.decorator';

export class PurchaseVehicleDto {
  @IsUUID()
  vehicleId!: string;

  @IsCpf()
  cpf!: string;
}

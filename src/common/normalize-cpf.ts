import { BadRequestException } from '@nestjs/common';
import { isValidCpf, onlyCpfDigits } from './cpf';

export function normalizeCpf(value: string): string {
  const digits = onlyCpfDigits(value);
  if (!isValidCpf(digits)) {
    throw new BadRequestException('cpf is invalid.');
  }
  return digits;
}

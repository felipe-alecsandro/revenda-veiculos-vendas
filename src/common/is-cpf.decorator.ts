import { ValidateBy, ValidationOptions, buildMessage } from 'class-validator';
import { isValidCpf } from './cpf';

export function IsCpf(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isCpf',
      validator: {
        validate: (value: unknown): boolean =>
          typeof value === 'string' && isValidCpf(value),
        defaultMessage: buildMessage(
          () => 'cpf is invalid.',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}

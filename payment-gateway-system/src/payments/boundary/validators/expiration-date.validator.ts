import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { isValidExpirationDate } from '../../../core/service/utils.service';

@ValidatorConstraint({ async: true })
export class IsValidExpirationDateConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments) {
    return isValidExpirationDate(value);
  }
}

export function IsValidExpirationDate(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidExpirationDateConstraint,
    });
  };
}

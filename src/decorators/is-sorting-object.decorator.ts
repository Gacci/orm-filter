import {
  registerDecorator,
  ValidatorOptions,
  ValidationArguments,
} from 'class-validator';

export function IsSortObject(
  allowedColumns?: string[],
  validatorOptions?: ValidatorOptions
) {
  return function (object: Object, propertyName: string) {
    let errors: string[] = [];
    registerDecorator({
      name: 'isSortObject',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [allowedColumns],
      options: validatorOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          errors = [];
          if (Object.prototype.toString.call(value) !== '[object Object]') {
            return false;
          }

          const [allowedColumns] = args.constraints || [];
          if (!allowedColumns?.length) {
            return true;
          }

          Object.entries(value).forEach(([k, v]) => {
            if (v !== 1 && v !== -1) {
              errors.push(
                `Invalid value for key "${k}": ${v}. Must be 'asc' or 'desc'`
              );
            }
            if (!allowedColumns.includes(k)) {
              errors.push(`Key "${k}" is not allowed`);
            }
          });

          return !errors.length;
        },
        defaultMessage(args: ValidationArguments) {
          return errors.join(',');
        },
      },
    });
  };
}

import { Logger } from '@nestjs/common';

export function Log(module?: string, action?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const logger = new Logger(target.constructor.name);
    module = module ?? target.constructor.name;
    action = action ?? propertyKey;

    const targetMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      logger.log(`[${module}] [${action}]  :: Before`);
      let result;
      try {
        result = await targetMethod.apply(this, args);
      } catch (e) {
        logger.log(`[${module}] [${action}]  :: After`);
        throw e;
      }
      logger.log(`[${module}] [${action}]  :: After`);
      return result;
    };

    return descriptor;
  };
}

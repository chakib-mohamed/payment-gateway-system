import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilsService {
  uuidRegex = new RegExp(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );

  isUUIDValid(uuid: string): boolean {
    return this.uuidRegex.test(uuid);
  }

  isValidExpirationDate(dValue: string): boolean {
    return isValidExpirationDate(dValue);
  }

  getDateFromCardExpirationDate(expirationDate: string): Date {
    const splitted = expirationDate.split('/');
    const month = splitted[0];
    let year = splitted[1];

    year = new Date().getFullYear().toString().substr(0, 2) + year;

    return new Date(+year, +month, 0); // 0 means Last day of the month before
  }
}

export const isValidExpirationDate: (dValue: string) => boolean = (dValue) => {
  const splitted = dValue.split('/');
  const pattern = /^\d{2}$/;

  if (!pattern.test(splitted[0]) || !pattern.test(splitted[1])) return false;

  if (+splitted[0] < 1 || +splitted[0] > 12) return false;

  return true;
};

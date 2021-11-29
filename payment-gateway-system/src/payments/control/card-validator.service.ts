import { Injectable, Logger } from '@nestjs/common';
import { CardType } from '../entity/card-type';

@Injectable()
export class CardValidatorService {
  private readonly logger = new Logger(CardValidatorService.name);

  isCardNumberValid(cardNumber: string): boolean {
    const trimedCardNum = cardNumber.trim().replace(' ', '');
    if (trimedCardNum.length > 19 || trimedCardNum.length < 13) {
      return false;
    }

    return this.luhnCheck(cardNumber);
  }

  private luhnCheck(cardNumber: string): boolean {
    // accept only digits, dashes or spaces
    if (/[^0-9-\s]+/.test(cardNumber)) return false;

    // The Luhn Algorithm. It's so pretty.
    let nCheck = 0,
      bEven = false;
    cardNumber = cardNumber.replace(/\D/g, '');

    for (let n = cardNumber.length - 1; n >= 0; n--) {
      const cDigit = cardNumber.charAt(n);
      let nDigit = parseInt(cDigit, 10);

      if (bEven) {
        if ((nDigit *= 2) > 9) nDigit -= 9;
      }

      nCheck += nDigit;
      bEven = !bEven;
    }

    return nCheck % 10 == 0;
  }

  isCardExpired(expirationDate: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return today > expirationDate;
  }

  isCardSupported(cardNumber: string, supportedCardTypes: CardType[]): boolean {
    return supportedCardTypes.some((ct) => {
      const pattern = ct.pattern;
      return new RegExp(pattern).test(cardNumber);
    });
  }

  isCardBlackListed(cardNumber: string) {
    return false;
  }
}

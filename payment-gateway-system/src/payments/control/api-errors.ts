export type error = { code: string; msg: string };

export enum ApiError {
  ERR1 = 'Client Not Found',
  ERR2 = 'Client Not Valid',
  ERR3 = 'Pos Not Valid',
  ERR4 = 'Card is Not Valid',
  ERR5 = 'Card expired',
  ERR6 = 'Card Type Not Valid',
  ERR7 = 'Card Not Supported',
  ERR8 = 'Amount exceeds permitted limit',
  ERR9 = 'Bank Not Valid',
  ERR10 = 'Unxpected Error occured',
  ERR11 = 'Payment Not Found',
}

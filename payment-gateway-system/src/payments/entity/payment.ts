import { PubSub } from 'graphql-subscriptions';
import { AfterSave, BeforeSave, BelongsTo, Column, DataType, ForeignKey, Model, Table, Unique } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Bank } from './bank';
import { Pos } from './pos';

export const pubSub = new PubSub();
export const PAYMENT_EVENT = 'paymentEvent';

@Table
export class Payment extends Model {
  @Unique
  @Column(DataType.UUID)
  uuid: string;

  @BelongsTo(() => Pos)
  pos: Pos;

  @ForeignKey(() => Pos)
  @Column
  posId: number;

  @BelongsTo(() => Bank)
  issuingBank: Bank;

  @ForeignKey(() => Bank)
  @Column
  issuingBankId: number;

  @Column
  amount: number;

  rawCardNumber: string;

  @Column
  cardNumber: string;

  @Column
  verificationCode: number;

  rawExpirationDate: string;

  @Column
  expirationDate: Date;

  @Column
  status: number;

  @BeforeSave
  static setUUID(payment: Payment): void {
    if (payment.uuid == null) {
      payment.uuid = uuidv4();
    }
  }

  @AfterSave
  static publishGqlEvent(payment: Payment): void {
    pubSub.publish(PAYMENT_EVENT, payment);
  }
}

import { BeforeSave, BelongsTo, BelongsToMany, Column, DataType, ForeignKey, Model, Table, Unique } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Bank } from './bank';
import { CardType } from './card-type';
import { ClientCardType } from './client-card-type';

@Table
export class Client extends Model {
  @Unique
  @Column(DataType.UUID)
  uuid: string;

  @Unique
  @Column
  name: string;

  @Unique
  @Column
  pan: number;

  @Unique
  @Column
  address: string;

  @Column
  isActive: boolean;

  @Column
  threshold: number;

  @Column
  redirectURL: string; // Redirect URL when a payment processing is finished

  @ForeignKey(() => Bank)
  @Column
  bankId: number;

  @BelongsTo(() => Bank)
  bank: Bank;

  @BelongsToMany(() => CardType, () => ClientCardType)
  supportedCardTypes: CardType[];

  @Column
  clientId: string; // Corresponds to keycloak user id

  @BeforeSave
  static setUUID(client: Client): void {
    if (client.uuid == null) {
      client.uuid = uuidv4();
    }
  }
}

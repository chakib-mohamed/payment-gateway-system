import {
  BeforeSave,
  Column,
  DataType,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';

@Table
export class CardType extends Model {
  @Unique
  @Column(DataType.UUID)
  uuid: string;

  @Unique
  @Column
  name: string;

  @Unique
  @Column
  pattern: string;

  // @BelongsToMany(() => Client, () => ClientCardType)
  // books: Client[];

  @BeforeSave
  static setUUID(cardType: CardType): void {
    cardType.uuid = uuidv4();
  }
}

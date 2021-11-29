import { BeforeSave, Column, DataType, Model, Table, Unique } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';

// Could be alse a PSP
@Table
export class Bank extends Model {
  @Unique
  @Column(DataType.UUID)
  uuid: string;

  @Unique
  @Column
  name: string;

  @Unique
  @Column
  authorizationURL: string;

  @Unique
  @Column
  AReqURL: string; // 3d secure Auth request URL

  @Unique
  @Column
  bin: number; // Should be a bin range

  @BeforeSave
  static setUUID(bank: Bank): void {
    if (bank.uuid == null) {
      bank.uuid = uuidv4();
    }
  }
}

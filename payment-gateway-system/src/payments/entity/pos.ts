import { v4 as uuidv4 } from 'uuid';
import { Column, DataType, Table, Model, BeforeSave, ForeignKey, BelongsTo, Unique } from 'sequelize-typescript';
import { Client } from './client';

@Table
export class Pos extends Model {
  @Unique
  @Column(DataType.UUID)
  uuid: string;

  @Column
  isActive: boolean;

  @ForeignKey(() => Client)
  clientId: number;

  @BelongsTo(() => Client)
  client: Client;

  @BeforeSave
  static setUUID(pos: Pos): void {
    if (pos.uuid == null) {
      pos.uuid = uuidv4();
    }
  }
}

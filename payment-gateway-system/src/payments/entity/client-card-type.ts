import {
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { CardType } from './card-type';
import { Client } from './client';

@Table
export class ClientCardType extends Model {
  @PrimaryKey
  @ForeignKey(() => Client)
  @Column
  clientId: number;

  @PrimaryKey
  @ForeignKey(() => CardType)
  @Column
  cardTypeId: number;
}

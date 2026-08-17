import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  HasMany,
  DefaultScope
} from 'sequelize-typescript';
 import { VehicleMaster } from './vehicleMaster';

@DefaultScope(() => ({
  where: {
    isDeleted: false
  }
}))

@Table({
  tableName: 'owner',
  timestamps: true,
  updatedAt: false,
})
export class Owner extends Model {
  @PrimaryKey
  @Column({
  type: DataType.UUID,
  defaultValue: DataType.UUIDV4,
})
  ownerId!: string;

  @Column(DataType.STRING)
  ownerName!: string;

  @Column(DataType.STRING)
  email!: string;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  phno!: string;
  
  @Column(DataType.STRING)
  address!: string;

  @Column(DataType.STRING)
  country!: string;
  
  @Column(DataType.STRING)
  state!: string;
  
  @Column(DataType.STRING)
  city!: string;
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false
  })
  isDeleted!: boolean;

  @HasMany(() => VehicleMaster)
  VehicleMaster!: VehicleMaster[];

}

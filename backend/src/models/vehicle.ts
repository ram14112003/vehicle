// vehicle.ts
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  HasMany,
  BelongsTo,
  ForeignKey,
  DefaultScope,
  HasOne // <-- Import HasOne
} from 'sequelize-typescript';

import { VehicleType } from './vehicleType';
import { Drivers } from './drivers';
import { VehicleMaster } from './vehicleMaster'; // <-- Import VehicleMaster

@DefaultScope(() => ({
  where: {
    isDeleted: false
  }
}))

@Table({
  tableName: 'vehicle',
  timestamps: true,
  updatedAt: false,
})
export class Vehicle extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  vehicleId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  vehicleName!: string;

  @ForeignKey(() => VehicleType)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  vehicleTypeId!: string;
  
  @BelongsTo(() => VehicleType)
  vehicleType!: VehicleType;

  // @Column(DataType.INTEGER)
  // localPerHour!: number;

  // @Column(DataType.INTEGER)
  // localPerKm!: number;

  // @Column(DataType.INTEGER)
  // OutstationPerKm!: number;
  
  // @Column(DataType.INTEGER)
  // OSDriverBata!: number;
  

  @Column({
  type: DataType.STRING,
  allowNull: false,
})
manufacturing!: string;

  @Column(DataType.JSON)
  vehicleImg!: string[];

  @Column(DataType.STRING)
  availableStatus!: string;
  
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false
  })
  isDeleted!: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @HasMany(() => Drivers)
  driver!: Drivers[];
  
@HasOne(() => VehicleMaster, { as: "vehicleMaster", foreignKey: "vehicleId" })
vehicleMaster!: VehicleMaster;

}
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  ForeignKey,
  BelongsTo
} from 'sequelize-typescript';

import { VehicleType } from './vehicleType';
import { Vehicle } from './vehicle';
import { Vendor } from './vendor';

// vehicleMaster.ts
@Table({
  tableName: 'vehicleMaster',
  timestamps: true, 
  updatedAt: false,
})
export class VehicleMaster extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  vehicleMasterId!: string;

  @Column(DataType.STRING)
  vehicleNumber!: string;

  @ForeignKey(() => Vehicle)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  vehicleId!: string;
  
@BelongsTo(() => Vehicle, { as: "vehicle", foreignKey: "vehicleId" })
vehicle!: Vehicle;


  @Column(DataType.STRING) // <-- Store vehicle model name directly
  vehicleModelName!: string;

  @ForeignKey(() => VehicleType)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  vehicleTypeId!: string;

   @BelongsTo(() => VehicleType)
  vehicleTypes!: VehicleType;

  @Column(DataType.STRING) // <-- Store vehicle type directly
  vehicleType!: string;

  @ForeignKey(() => Vendor)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  vendorId!: string;

  @BelongsTo(() => Vendor)
  vendor!: Vendor;

  @Column(DataType.STRING) // <-- Store owner name directly
  vendorName!: string;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  isDeleted!: number;

  @Column({ type: DataType.DATE })
  deletedAt?: Date;
}
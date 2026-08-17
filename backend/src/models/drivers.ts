import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  ForeignKey,
  BelongsTo,
  HasMany,
  DefaultScope
} from 'sequelize-typescript';

import { Employee } from './employee'
import { Booking } from './booking';
import { Vehicle } from './vehicle';
import { VehicleType } from './vehicleType';

@DefaultScope(() => ({
  where: {
    isDeleted: false
  }
}))

@Table({
  tableName: 'drivers',
  timestamps: true, 
  updatedAt: false,
})
export class Drivers extends Model {
  @PrimaryKey
  @Column({
  type: DataType.UUID,
  defaultValue: DataType.UUIDV4,
})
  driverId!: string;

  @Column(DataType.STRING)
  driverName!: string;

  @Column(DataType.STRING)
  driverEmail!: string;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  phno!: string;

  @Column(DataType.STRING)
  password!: string;

  @Column(DataType.STRING)
  city!: string;
  
  @Column(DataType.STRING)
  state!: string;

    @Column(DataType.STRING)
  country!: string;

  @Column(DataType.STRING)
  address!: string;

  @Column(DataType.STRING)
  pincode!: string;

  @Column(DataType.STRING)
  licenseNo!: string;

  @Column(DataType.DATE)
  licExpDate!: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  otp!: number;


  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  ratings!: number;

  
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  trackLocation!: string;

    @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  trackingsource!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  fcm_token!: string;

   @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  role!: string;

  @ForeignKey(() => Vehicle)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  vehicleId!: string;

  @BelongsTo(() => Vehicle)
  vehicle!: Vehicle;

  @ForeignKey(() => VehicleType)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  vehicleTypeId!: string;

  @BelongsTo(() => VehicleType)
  vehicleType!: VehicleType;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  createdBy!: string;

  @BelongsTo(() => Employee, {
    targetKey: 'employeeId'
  })
  employee!: Employee;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false
  })
  isDeleted!: boolean;


  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;
  
  @HasMany(() => Booking)
  bookings!: Booking[];
}

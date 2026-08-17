import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  DefaultScope, 
  HasMany
} from 'sequelize-typescript';
import { Vehicle } from './vehicle';
import { Invoice } from './invoice';
import { Drivers } from './drivers';
import { VehicleMaster } from './vehicleMaster';

@DefaultScope(() => ({
  where: {
    isDeleted: false
  }
}))
@Table({
  tableName: 'vehicleType',
  timestamps: true, 
  updatedAt: false,
})
export class VehicleType extends Model {
  @PrimaryKey
  @Column({
  type: DataType.UUID,
  defaultValue: DataType.UUIDV4,
})
  vehicleTypeId!: string;

  @Column(DataType.STRING)
  vehicleType!: string;

    @Column(DataType.JSON)
    vehicleImg!: string[];

  @Column(DataType.STRING)
  AdvanceBookingHours!: string;

  @Column(DataType.INTEGER)
  seatCapacity!: number;  
@Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  priorMinutes!: number;
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false
  })
  isDeleted!: boolean;
@Column({
  type: DataType.STRING,
  allowNull: false,
  defaultValue: "regular",
})
bookingType!: string;
  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @HasMany(() => Vehicle)
  vehicle!: Vehicle[];

  @HasMany(() => Invoice)
  invoice!: Invoice[];

  @HasMany(() => VehicleMaster)
  vehicleMaster!: VehicleMaster[];

  @HasMany(() => Drivers)
drivers!: Drivers[];
}
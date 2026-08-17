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

// import { Vehicle } from './vehicle';
import { Employee } from './employee';
import { Invoice } from './invoice';
 import { VehicleMaster } from './vehicleMaster';


@DefaultScope(() => ({
  where: {
    isDeleted: false
  }
}))

@Table({
  tableName: 'vendor',
  timestamps: true,
  updatedAt: false,
})
export class Vendor extends Model {
  @PrimaryKey
  @Column({
  type: DataType.UUID,
  defaultValue: DataType.UUIDV4,
})
  vendorId!: string;

  @Column(DataType.STRING)
  vendorName!: string;

  @Column(DataType.STRING)
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  fcm_token!: string;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  phno!: string;

  @Column(DataType.STRING)
  password!: string;

  // @ForeignKey(() => Vehicle)
  // @Column({
  //   type: DataType.UUID,
  //   allowNull: true,
  // })
  // vehicleId!: string;

  // @BelongsTo(() => Vehicle)
  // vehicle!: Vehicle;

  @Column(DataType.STRING)
  address!: string;

  @Column(DataType.STRING)
  country!: string;
  
  @Column(DataType.STRING)
  state!: string;
  
  @Column(DataType.STRING)
  city!: string;

  @Column(DataType.STRING)
  role!: string;

  @Column(DataType.INTEGER)
  vehicleCount!: number;

  @Column(DataType.STRING)
  refererVendor!: string;

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

    //  @HasMany(() => Vehicle)
    // vehicles!: Vehicle[];

    @HasMany(() => Invoice)
    invoice!: Invoice[];

    @HasMany(() => VehicleMaster)
    VehicleMaster!: VehicleMaster[];
    

}

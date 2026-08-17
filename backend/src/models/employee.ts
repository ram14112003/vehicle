import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  HasMany
} from 'sequelize-typescript';

import { Vendor } from './vendor';
import { Company } from './company';
import { Drivers } from './drivers';
import { Booking } from './booking';
@Table({
  tableName: 'employee',
  timestamps: true, 
  updatedAt: false,
})
export class Employee extends Model {
  @PrimaryKey
  @Column({
  type: DataType.UUID,
  defaultValue: DataType.UUIDV4,
})
  employeeId!: string;

  @Column(DataType.STRING)
  username!: string;

  @Column(DataType.BOOLEAN)
  empManager!: boolean;


  @Column(DataType.STRING)
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  phno!: string;

  @Column(DataType.STRING)
  password!: string;

  @Column(DataType.STRING)
  role!: string;

   @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  fcm_token!: string;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @HasMany(() => Vendor)
  vendors!: Vendor[];

  @HasMany(() => Company)
  company!: Company[];

  @HasMany(() => Drivers)
  drivers!: Drivers[];

  
    @HasMany(() => Booking)
    bookings!: Booking[];
}

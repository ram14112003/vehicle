import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  BelongsTo,
  ForeignKey,
  HasMany,
  DefaultScope, BeforeCreate
} from 'sequelize-typescript';

import { Employee } from './employee';
import { User } from './user';
import { Invoice } from './invoice';
import {MonthlyInvoice } from './monthlyInvoice';
import { Booking } from './booking';


@DefaultScope(() => ({
  where: {
    isDeleted: false
  }
}))

@Table({
  tableName: 'company',
  timestamps: true,
  updatedAt: false,
})


export class Company extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  companyId!: string;

  @Column(DataType.STRING)
  companyName!: string;

  @Column(DataType.STRING)
  companyPhno!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  employeeId!: string;

  @BelongsTo(() => Employee)
  employee!: Employee;

  @Column(DataType.STRING)
  domainName!: string;

  @Column(DataType.STRING)
  seoUrl!: string;

  @Column(DataType.STRING)
  gstNo!: string;

  @Column(DataType.STRING)
companyCode!: string;

//  @BeforeCreate
//   static async generateCompanyCode(instance: Company) {
//     if (!instance.companyName) {
//       throw new Error("companyName is required");
//     }

//     const baseCode = instance.companyName
//       .replace(/[^a-zA-Z]/g, "")   // remove spaces & symbols
//       .substring(0, 3)
//       .toUpperCase();

//     let finalCode = baseCode;
//     let counter = 1;

//     while (
//       await Company.findOne({ where: { companyCode: finalCode } })
//     ) {
//       finalCode = `${baseCode}${counter}`;
//       counter++;
//          }

//     instance.companyCode = finalCode;
//   }


  // @Column(DataType.STRING)
  // managerEmail!: string;

  // @Column({
  //   type: DataType.JSON,
  //   allowNull: false,
  //   defaultValue: [],
  // })
  // managerEmail!: string[]; 
 @Column({
  type: DataType.TEXT,
  allowNull: true,
})
managerEmail!: string;
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  managerApproval!: boolean;

  @Column(DataType.STRING)
  allowTax!: string;

   @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  needEmail!: boolean;


  @Column(DataType.TEXT)
  companyLogo!: string;

  @Column(DataType.STRING)
  companyAddress!: string;

  @Column(DataType.STRING)
  startTime!: string;

  @Column(DataType.STRING)
  closeTime!: string;

  @Column(DataType.STRING)
  priorMinutes!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isDeleted!: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @HasMany(() => Invoice)
  invoice!: Invoice[];

   @HasMany(() => MonthlyInvoice)
  monthlyinvoice!: MonthlyInvoice[];

  @HasMany(() => Booking, { as: "bookings", foreignKey: "companyId" })
bookings!: Booking[];
}

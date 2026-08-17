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
  BeforeCreate
} from 'sequelize-typescript';
import { Vehicle } from './vehicle';
import { User } from './user';
import { Vendor } from './vendor';
import { Booking } from './booking';
import { Company } from './company';
import { Payment } from './payment';
import { ClosePending } from './closepending';
import { VehicleType } from './vehicleType';
import { Configuration } from './configuration';
import { InvoiceSequence } from "./invoice_sequence";
import { Sequelize } from "sequelize";
import { MonthlyInvoice } from './monthlyInvoice';

function getFinancialYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // Jan = 1

    if (month >= 4) {
    // Apr–Dec → 25-26
    return `${String(year % 100).padStart(2, "0")}-${String((year + 1) % 100).padStart(2, "0")}`;
  } else {
    // Jan–Mar → 24-25
    return `${String((year - 1) % 100).padStart(2, "0")}-${String(year % 100).padStart(2, "0")}`;
  }
}

 
@Table({
  tableName: 'invoice',
  timestamps: true, 
  updatedAt: false,
})
export class Invoice extends Model {
  @PrimaryKey
  @Column({
  type: DataType.UUID,
  defaultValue: DataType.UUIDV4,
})
  invoiceId!: string;

  
    @Column({
      type: DataType.STRING,
      unique: true,
    })
    invoiceNumber!: string;
  

  static async generateNextInvoiceNumber(
    companyId: string,
    companyCode: string,
    excludeInvoiceId: string | null = null,
    t: any = null
  ): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const financialYear =
      month >= 4
        ? `${year}-${String(year + 1).slice(-2)}`
        : `${year - 1}-${String(year).slice(-2)}`;

    let seq = await InvoiceSequence.findOne({
      where: { companyId, financialYear },
      transaction: t,
      lock: t ? t.LOCK.UPDATE : undefined,
    });

    if (!seq) {
      seq = await InvoiceSequence.create(
        { companyId, financialYear, current: 0 },
        { transaction: t }
      );
    }

    const extractSuffix = (code: string, compCode: string): number => {
      if (!code || !compCode) return 0;
      const index = code.indexOf(compCode);
      if (index === -1) return 0;
      const suffixStr = code.slice(index + compCode.length);
      const parsed = parseInt(suffixStr, 10);
      return isNaN(parsed) ? 0 : parsed;
    };

    const { MonthlyInvoice } = require('./monthlyInvoice');
    const { OnCallInvoice } = require('./onCallInvoice');

    const invoiceWhere: any = { companyId };
    if (excludeInvoiceId) {
      const { Op } = require('sequelize');
      invoiceWhere.invoiceId = { [Op.ne]: excludeInvoiceId };
    }
    const invoices = await this.findAll({
      where: invoiceWhere,
      attributes: ['invoiceNumber'],
      transaction: t,
    });

    const monthlyWhere: any = { companyId };
    if (excludeInvoiceId) {
      const { Op } = require('sequelize');
      monthlyWhere.invoiceId = { [Op.ne]: excludeInvoiceId };
    }
    const monthlys = await MonthlyInvoice.findAll({
      where: monthlyWhere,
      attributes: ['monthlyBookingCode'],
      transaction: t,
    });

    let excludeOnCallInvoiceCode: string | null = null;
    if (excludeInvoiceId) {
      const linkedInvoice = await this.findByPk(excludeInvoiceId, { transaction: t });
      if (linkedInvoice) {
        excludeOnCallInvoiceCode = linkedInvoice.invoiceNumber;
      }
    }
    const oncalls = await OnCallInvoice.findAll({
      where: { companyId },
      attributes: ['onCallInvoiceCode'],
      transaction: t,
    });

    let maxSuffix = 0;
    invoices.forEach((inv: any) => {
      maxSuffix = Math.max(maxSuffix, extractSuffix(inv.invoiceNumber, companyCode));
    });
    monthlys.forEach((m: any) => {
      maxSuffix = Math.max(maxSuffix, extractSuffix(m.monthlyBookingCode, companyCode));
    });
    oncalls.forEach((oc: any) => {
      if (excludeOnCallInvoiceCode && oc.onCallInvoiceCode === excludeOnCallInvoiceCode) {
        return;
      }
      maxSuffix = Math.max(maxSuffix, extractSuffix(oc.onCallInvoiceCode, companyCode));
    });

    if (seq.current < maxSuffix) {
      seq.current = maxSuffix;
    }

    let newInvoiceNumber = "";
    while (true) {
      seq.current += 1;
      newInvoiceNumber = `${financialYear}-${companyCode}${String(seq.current).padStart(2, "0")}`;

      const dupInvoice = await this.findOne({
        where: { companyId, invoiceNumber: newInvoiceNumber },
        transaction: t,
      });
      const dupMonthly = await MonthlyInvoice.findOne({
        where: { companyId, monthlyBookingCode: newInvoiceNumber },
        transaction: t,
      });
      const dupOncall = await OnCallInvoice.findOne({
        where: { companyId, onCallInvoiceCode: newInvoiceNumber },
        transaction: t,
      });

      if (!dupInvoice && !dupMonthly && !dupOncall) {
        break;
      }
    }

    await seq.save({ transaction: t });
    return newInvoiceNumber;
  }

  @BeforeCreate
  static async generateInvoiceNumber(instance: Invoice) {
    if (!instance.companyId) {
      throw new Error("companyId is required to generate invoice number");
    }
    const sequelize = instance.sequelize as Sequelize;
    await sequelize.transaction(async (t) => {
      const company = await Company.findByPk(instance.companyId, {
        transaction: t,
      });
      if (!company) throw new Error("Company not found");
      if (!company.companyCode) {
        throw new Error("companyCode not set for company");
      }
      instance.invoiceNumber = await this.generateNextInvoiceNumber(
        instance.companyId,
        company.companyCode,
        null,
        t
      );
    });
  }



  

  @Column(DataType.DATE)
  startDate!: Date;

  @Column(DataType.DATE)
  endDate!: Date;


  @Column(DataType.INTEGER)
  invoiceAmount!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  userId!: string;

  @BelongsTo(() => User)
  user!: User;


  @ForeignKey(() => Vendor)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  vendorId!: string;

  @BelongsTo(() => Vendor)
  vendor!: Vendor;

   @Column(DataType.STRING)
  invoiceStatus!: string;

  @ForeignKey(() => VehicleType)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  vehicleTypeId!: string;


  
  @BelongsTo(() => VehicleType)
  vehicleType!: VehicleType;


  @ForeignKey(() => Booking)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  bookingId!: string;

  @BelongsTo(() => Booking)
  booking!: Booking;
  
  // @ForeignKey(() => ClosePending)
  // @Column({
  //   type: DataType.UUID,
  //   allowNull: true,
  // })
  // closependingId!: string;

  // @BelongsTo(() => ClosePending)
  // closePending!: ClosePending;

  @ForeignKey(() => ClosePending)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  closePendingId!: string;



  @BelongsTo(() => ClosePending)
  closePending!: ClosePending;

  @ForeignKey(() => Company)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  companyId!: string;

  @BelongsTo(() => Company)
  company!: Company;
  
  @ForeignKey(() => Payment)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  paymentId!: string;

  @BelongsTo(() => Payment, { as: "payment" })
payment!: Payment;

@ForeignKey(() => MonthlyInvoice)
@Column({ type: DataType.UUID, allowNull: true })
monthlyInvoiceId!: string | null;


@BelongsTo(() => MonthlyInvoice)
monthlyInvoice?: MonthlyInvoice;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;
}
import {
  Table, Column, Model, DataType, PrimaryKey, Default, CreatedAt,
  ForeignKey, BelongsTo, BeforeCreate, HasMany
} from "sequelize-typescript";
import { Invoice } from "./invoice";
import { Company } from "./company";
import { MonthlyInvoiceItems } from "./monthlyInvoiceItems";
// import { MonthlyBookingSequence } from "./monthlyBookingSequence";
// import QueryTypes from "sequelize/lib/query-types";
import { InvoiceSequence } from "./invoice_sequence";
import { Sequelize } from "sequelize";

@Table({ tableName: "monthly_invoice", timestamps: true, updatedAt: false })
export class MonthlyInvoice extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  monthlyInvoiceId!: string;

  
    @Column({
      type: DataType.STRING,
      unique: true,
    })
    monthlyBookingCode!: string;
  

  
  // @BeforeCreate
  // static async generateMonthlyBookingCode(instance: MonthlyInvoice) {
  //   if (!instance.companyId) {
  //     throw new Error("companyId is required to generate monthlyBookingCode");
  //   }

  //   const sequelize = instance.sequelize as Sequelize;

  //   await sequelize.transaction(async (t) => {

  //     const company = await Company.findByPk(instance.companyId, {
  //       transaction: t,
  //       lock: t.LOCK.UPDATE,
  //     });

  //     if (!company) throw new Error("Company not found");

  //     const companyCode = (company as any).companyCode;
  //     if (!companyCode) throw new Error("Company code not configured");

  //     const now = new Date();
  //     const year = now.getFullYear();
  //     const month = now.getMonth() + 1;

  //     const financialYear =
  //       month >= 4
  //         ? `${year}-${String(year + 1).slice(-2)}`
  //         : `${year - 1}-${String(year).slice(-2)}`;

  //     let seq = await InvoiceSequence.findOne({
  //       where: {
  //         companyId: instance.companyId,
  //         financialYear,
  //       },
  //       transaction: t,
  //       lock: t.LOCK.UPDATE,
  //     });

  //     if (!seq) {
  //       seq = await InvoiceSequence.create(
  //         {
  //           companyId: instance.companyId,
  //           financialYear,
  //           current: 0,
  //         },
  //         { transaction: t }
  //       );
  //     }

  //     seq.current += 1;
  //     await seq.save({ transaction: t });

  //     const runningNo = String(seq.current).padStart(2, "0");

  //     instance.monthlyBookingCode = `${financialYear}-${companyCode}${runningNo}`;
  //   });
  // }
// static async generateMonthlyBookingCode(instance: MonthlyInvoice) {
//   if (!instance.companyId) {
//     throw new Error("companyId is required to generate monthlyBookingCode");
//   }

//   // 1️⃣ Fetch company to get companyCode
//   const company = await Company.findByPk(instance.companyId);
//   if (!company) {
//     throw new Error("Company not found");
//   }

//   const companyCode = (company as any).companyCode; // e.g. "TES"
//   if (!companyCode) {
//     throw new Error("Company code not configured");
//   }

//   // 2️⃣ Compute financial year (India)
//   const now = new Date();
//   const year = now.getFullYear();
//   const month = now.getMonth() + 1;

//   const financialYear =
//     month >= 4
//       ? `${year}-${String(year + 1).slice(-2)}`
//       : `${year - 1}-${String(year).slice(-2)}`;

//   // 3️⃣ Insert or increment sequence safely
//   await MonthlyBookingSequence.sequelize!.query(
//     `
//     INSERT INTO monthlyBookingSequence (financialYear, companyCode, lastNumber)
//     VALUES (:financialYear, :companyCode, 1)
//     ON DUPLICATE KEY UPDATE lastNumber = lastNumber + 1
//     `,
//     {
//       replacements: { financialYear, companyCode },
//       type: QueryTypes.INSERT,
//     }
//   );

//   // 4️⃣ Fetch updated counter
//   const seq = await MonthlyBookingSequence.findOne({
//     where: { financialYear, companyCode },
//   });

//   const nextNumber = seq ? seq.lastNumber : 1;

//   // 5️⃣ Generate FINAL invoice number
//   // IMPORTANT: pad only up to 2 digits, allow growth beyond
//   const running =
//     nextNumber < 100
//       ? String(nextNumber).padStart(2, "0")
//       : String(nextNumber);

//   instance.monthlyBookingCode = `${financialYear}-${companyCode}${running}`;
// }

  

  @Column({ type: DataType.DATEONLY, allowNull: false })
  invoiceDate!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  invoiceMonth!: string;

  // @Column({ type: DataType.UUID, allowNull: false })
  // companyId!: string;

   @ForeignKey(() => Company)
  @Column({ type: DataType.UUID, allowNull: false })
  companyId!: string;
   @BelongsTo(() => Company)
  company?: Company;

  @Column({ type: DataType.STRING, allowNull: false })
  companyName!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  vehicleTypeId!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  vehicleTypeName!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  vehicleNumber!: string;

  @Column({
  type: DataType.STRING,
  allowNull: true,
})
companyAddress!: string;
  
@Column({ type: DataType.STRING, allowNull: false })
route!: string;

  @Column({ type: DataType.UUID, allowNull: true })
  packageDataId!: string | null;

  @Column({ type: DataType.JSON, allowNull: true })
  packageDetails!: any | null;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  extraKm!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  extraDays!: number;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "toll" })
  extraChargeType!: string;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  extraChargesInputAmount!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  discount!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  advance!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  packageAmount!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  extraKmAmount!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  extraDaysAmount!: number;
@Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  extraHrs!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  extraHourRate!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  extraHrsAmount!: number;
  
  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  netTotal!: number;
@Column({ type: DataType.JSON, allowNull: true, defaultValue: [] })
extraCharges!: any[];
  @Column({ type: DataType.JSON, allowNull: true })
  taxes!: any | null;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  totalTaxAmount!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  finalTotal!: number;

  // ✅ NEW: 0=open, 1=closed
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  closeStatus!: number;

  // ✅ link created invoice
  @ForeignKey(() => Invoice)
  @Column({ type: DataType.UUID, allowNull: true })
  invoiceId!: string | null;

  @BelongsTo(() => Invoice)
  invoice?: Invoice;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  balanceDue!: number;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @HasMany(() => MonthlyInvoiceItems)
  monthlyInvoiceItems!: MonthlyInvoiceItems[];
}
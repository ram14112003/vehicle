// ─────────────────────────────────────────────
// onCallInvoiceItems.ts
// ─────────────────────────────────────────────
import {
  Table, Column, Model, DataType,
  PrimaryKey, ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import { OnCallInvoice } from './onCallInvoice';

@Table({
  tableName: 'onCallInvoiceItems',
  timestamps: true,
  updatedAt: false,
})
export class OnCallInvoiceItems extends Model {

  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  onCallInvoiceItemId!: string;

  @ForeignKey(() => OnCallInvoice)
  @Column(DataType.UUID)
  onCallBillId!: string;

  @BelongsTo(() => OnCallInvoice)
  invoice!: OnCallInvoice;

  // ── Trip & Vehicle ────────────────────────────
  @Column(DataType.STRING) tripSheetNo!: string;
  @Column(DataType.DATE)   date!: Date;
  @Column(DataType.STRING) vehicleTypeId!: string;
  @Column(DataType.STRING) vehicleNo!: string;
  @Column(DataType.STRING) driverName!: string;
  @Column(DataType.STRING) guestName!: string;
  @Column(DataType.STRING) bookedBy!: string;
  @Column(DataType.STRING) tripDetails!: string;

  // ── KM & Time ────────────────────────────────
  @Column(DataType.FLOAT)   garageOpenKm!: number;
  @Column(DataType.FLOAT)   garageCloseKm!: number;
  @Column(DataType.FLOAT)   garageKms!: number;
  @Column(DataType.FLOAT)   guestOpenKm!: number;
  @Column(DataType.FLOAT)   guestCloseKm!: number;
  @Column(DataType.FLOAT)   guestKms!: number;
  @Column(DataType.BOOLEAN) hideGuestDetails!: boolean;
  @Column(DataType.STRING)  startingTime!: string;
  @Column(DataType.STRING)  closingTime!: string;
  @Column(DataType.FLOAT)   usageHours!: number;

  // ── Package ───────────────────────────────────
  @Column(DataType.STRING)  packageType!: string;
  @Column(DataType.STRING)  travelPackage!: string;
  @Column(DataType.INTEGER) packageDays!: number;
  @Column(DataType.INTEGER) driverDays!: number;
  @Column(DataType.TEXT)    selectedPackageMeta!: string;  // JSON object

  // ── Charges ───────────────────────────────────
  @Column(DataType.DECIMAL(18, 2)) packageAmount!: number;
  @Column(DataType.FLOAT) additionalKms!: number;
  @Column(DataType.DECIMAL(18, 2)) additionalKmsAmount!: number;
  @Column(DataType.FLOAT) additionalHours!: number;
  @Column(DataType.DECIMAL(18, 2)) additionalHoursAmount!: number;
  @Column(DataType.DECIMAL(18, 2)) driverBatta!: number;
  @Column(DataType.TEXT)  extraChargesBreakup!: string;    // JSON: [{title, amount}]
  @Column(DataType.DECIMAL(18, 2)) extraCharges!: number;
  @Column(DataType.DECIMAL(18, 2)) discountAmount!: number;
  @Column(DataType.DECIMAL(18, 2)) advanceAmount!: number;

  // ── Tax ───────────────────────────────────────
  @Column(DataType.TEXT)  taxes!: string;
  // JSON: [{ taxName: "CGST", taxPercent: 9, taxAmount: 450 }, ...]
  @Column(DataType.DECIMAL(18, 2)) totalTaxAmount!: number;

  // ── Totals ────────────────────────────────────
  @Column(DataType.DECIMAL(18, 2)) amount!: number;     // sub-total (before tax)
  @Column(DataType.DECIMAL(18, 2)) total!: number;      // final total
  @Column(DataType.DECIMAL(18, 2)) totalDue!: number;
}
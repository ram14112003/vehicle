import {
  Table, Column, Model, DataType,
  PrimaryKey, ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import { MonthlyInvoice } from './monthlyInvoice';

@Table({
  tableName: 'monthly_invoice_items',
  timestamps: true,
  updatedAt: 'updatedAt',
  createdAt: 'createdAt',
})
export class MonthlyInvoiceItems extends Model {

  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  monthlyInvoiceItemId!: string;

  @ForeignKey(() => MonthlyInvoice)
  @Column(DataType.UUID)
  monthlyInvoiceId!: string;

  @BelongsTo(() => MonthlyInvoice)
  monthlyInvoice!: MonthlyInvoice;

  // ── Route & Vehicle Details ────────────────────
  @Column({ type: DataType.STRING, allowNull: true })
  route!: string;

  @Column({ type: DataType.UUID, allowNull: true })
  vehicleTypeId!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  vehicleTypeName!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  vehicleNumber!: string;

  // ── Package ───────────────────────────────────
  @Column({ type: DataType.UUID, allowNull: true })
  packageDataId!: string | null;

  @Column({ type: DataType.JSON, allowNull: true })
  packageDetails!: any | null;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  packageAmount!: number;

  // ── KM, Days & Hours ──────────────────────────
  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  extraKm!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  extraKmAmount!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  extraDays!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  extraDaysAmount!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  extraHrs!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  extraHourRate!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  extraHrsAmount!: number;

  // ── Charges & Discounts ───────────────────────
  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "toll" })
  extraChargeType!: string;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  extraChargesInputAmount!: number;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [] })
  extraCharges!: any[];

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  discount!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  advance!: number;

  // ── Tax & Totals ──────────────────────────────
  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  netTotal!: number;

  @Column({ type: DataType.JSON, allowNull: true })
  taxes!: any | null;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  totalTaxAmount!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  finalTotal!: number;

  @Column({ type: DataType.DOUBLE, allowNull: false, defaultValue: 0 })
  balanceDue!: number;
}

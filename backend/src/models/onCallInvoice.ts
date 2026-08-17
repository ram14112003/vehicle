import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  DefaultScope,
  HasMany,
  BeforeCreate,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Sequelize } from 'sequelize';

import { OnCallInvoiceItems } from './onCallInvoiceItems';
import { Company } from './company';
import { InvoiceSequence } from './invoice_sequence';

@DefaultScope(() => ({
  where: { isDeleted: false },
}))

@Table({
  tableName: 'onCallInvoice',
  timestamps: true,
  updatedAt: false,
})
export class OnCallInvoice extends Model {

  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  onCallBillId!: string;

  // ✅ NEW CODE FIELD
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: true,
  })
  onCallInvoiceCode!: string;

  @ForeignKey(() => Company)
  @Column(DataType.UUID)
  companyId!: string;

@BelongsTo(() => Company, {
  foreignKey: "companyId",
  as: "company"
})
company!: Company;
  @Column(DataType.STRING)
  companyName!: string;

  @Column(DataType.TEXT)
  tripSheetNumbers!: string;

  @Column(DataType.DECIMAL(18, 2))
  totalAmount!: number;

  @Column(DataType.TEXT)
  totalTaxAmount!: string;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: true,
  })
  invoiceSubTotal!: number | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  invoiceTaxBreakup!: string | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  })
  isDeleted!: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @HasMany(() => OnCallInvoiceItems)
  invoiceItems!: OnCallInvoiceItems[];

  // ✅ AUTO GENERATE CODE

}
import { Table, Column, Model, DataType, PrimaryKey } from "sequelize-typescript";

@Table({ tableName: "invoice_sequences", timestamps: false })
export class InvoiceSequence extends Model {

  @PrimaryKey
  @Column(DataType.UUID)
  companyId!: string;

  @PrimaryKey
  @Column(DataType.STRING)
  financialYear!: string;   // e.g. "2025-26"

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  current!: number;
}

import { Table, Column, Model, PrimaryKey, DataType } from "sequelize-typescript";

@Table({ tableName: "monthlyBookingSequence", timestamps: false })
export class MonthlyBookingSequence extends Model {
  @PrimaryKey
  @Column(DataType.STRING) // e.g. "2025-26"
  financialYear!: string;

  @PrimaryKey
  @Column(DataType.STRING) // e.g. "TES"
  companyCode!: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  lastNumber!: number;
}

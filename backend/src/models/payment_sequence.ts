import { Table, Column, Model, PrimaryKey, DataType } from "sequelize-typescript";

@Table({ tableName: "payment_sequence", timestamps: false })
export class PaymentSequence extends Model {
  @PrimaryKey
  @Column({ type: DataType.DATEONLY })
  seq_date!: string;

  @Column({ type: DataType.INTEGER })
  last_number!: number;
}
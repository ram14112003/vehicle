import { Table, Column, Model, PrimaryKey, DataType } from "sequelize-typescript";

@Table({ tableName: "booking_sequence", timestamps: false })
export class BookingSequence extends Model {
  @PrimaryKey
  @Column({ type: DataType.DATEONLY })
  seq_date!: string;

  @Column({ type: DataType.INTEGER })
  last_number!: number;
}
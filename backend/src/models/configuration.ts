import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  UpdatedAt
} from 'sequelize-typescript';

@Table({
  tableName: 'configuration',
  timestamps: true
})
export class Configuration extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  configId!: string;

  @Column(DataType.FLOAT)
  serviceTaxPercentage!: number;

  @Column(DataType.INTEGER)
  dueDays!: number;

  @Column(DataType.STRING)
  invoiceNoStartingFrom!: string;

  @Column(DataType.INTEGER)
  cancelBookingHours!: number;

  @Column(DataType.STRING)
  invoiceNoPrefix!: string;

  @Column(DataType.STRING)
  smtpServer!: string;

  @Column(DataType.STRING)
  smtpEmailAddress!: string;

  @Column(DataType.STRING)
  smtpEmailPassword!: string;

  @Column(DataType.INTEGER)
  smtpEmailPort!: number;

  @Column(DataType.BOOLEAN)
  outstationHasTax!: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;
}

import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  BelongsTo
} from 'sequelize-typescript';
import { Booking } from './booking';

@Table({
  tableName: 'sms_logs',
  timestamps: true,
  updatedAt: false,
})
export class SmsLog extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  smsLogId!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  bookingId!: string;

  @BelongsTo(() => Booking, { foreignKey: 'bookingId', constraints: false })
  booking!: Booking;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  recipientType!: 'CUSTOMER' | 'DRIVER';

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  recipientId!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  phoneNumber!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  messageType!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  messageBody!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'SENT',
  })
  status!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    defaultValue: 'PENDING',
  })
  deliveryStatus!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    defaultValue: 'SUCCESS',
  })
  providerStatus!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  providerMessageId!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  errorMessage!: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  sentAt!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deliveredAt!: Date;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;
}

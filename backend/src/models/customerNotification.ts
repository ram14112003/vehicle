import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  BelongsTo
} from 'sequelize-typescript';
import { User } from './user';
import { Booking } from './booking';

@Table({
  tableName: 'customer_notifications',
  timestamps: true,
  updatedAt: false,
})
export class CustomerNotification extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  notificationId!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  userId!: string;

  @BelongsTo(() => User, { foreignKey: 'userId', constraints: false })
  user!: User;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  bookingId!: string;

  @BelongsTo(() => Booking, { foreignKey: 'bookingId', constraints: false })
  booking!: Booking;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    defaultValue: 'DRIVER_ASSIGNED',
  })
  type!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title!: string;


  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  message!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isRead!: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;
}

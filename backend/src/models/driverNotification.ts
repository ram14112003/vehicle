import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  BelongsTo
} from 'sequelize-typescript';
import { Drivers } from './drivers';
import { Booking } from './booking';

@Table({
  tableName: 'driver_notifications',
  timestamps: true,
  updatedAt: false,
})
export class DriverNotification extends Model {
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
  driverId!: string;

  @BelongsTo(() => Drivers, { foreignKey: 'driverId', constraints: false })
  driver!: Drivers;

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
    defaultValue: 'NEW_RIDE_ASSIGNED',
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
  readStatus!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isRead!: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;
}

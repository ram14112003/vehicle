import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,

} from 'sequelize-typescript';

@Table({
  tableName: 'otp',
  timestamps: true,
  updatedAt: false,
})
export class OTP extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  otpId!: string;

  @Column({
    type: DataType.STRING(6),
    allowNull: true,
  })
  otp?: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  loginId!: string; // Can be userId, vendorId, or driverId

  
  // ✅ Add this new column for 2Factor session ID
  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  sessionId?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  expiresAt!: Date;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

}
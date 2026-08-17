// Updated User Model with gender column
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  HasMany,
  BelongsTo,
  ForeignKey,
  DefaultScope
} from 'sequelize-typescript';

import { Booking } from './booking';
import { Company } from './company';

@DefaultScope(() => ({
  where: {
    isDeleted: false
  }
}))
@Table({
  tableName: 'user',
  timestamps: true,
  updatedAt: false,
})
export class User extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  userId!: string;
@Column(DataType.STRING)
danfossuserId!: string;

@Column(DataType.STRING)
managerId!: string;

@Column(DataType.STRING)
managerEmail!: string;

  @Column(DataType.STRING)
  username!: string;

  @Column(DataType.STRING)
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  mobile!: string;

  @Column(DataType.STRING)
  password!: string;

  @Column(DataType.BOOLEAN)
  isManager!: boolean;

  @Column(DataType.BOOLEAN)
  companyManager!: boolean;

  @Column(DataType.STRING)
  role!: string;

  @Column({
  type: DataType.STRING(36),
  allowNull: true
})
approvedManagerById!: string | null;

  // Gender column added
  @Column({
    type: DataType.ENUM('male', 'female', 'other'),
    allowNull: true
  })
  gender!: 'male' | 'female' | 'other';

  @Column(DataType.STRING)
  country!: string;

  @Column(DataType.STRING)
  city!: string;

     @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  fcm_token!: string;

  @ForeignKey(() => Company)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  companyId!: string;

  @BelongsTo(() => Company)
  company!: Company;

  @Column({
    type: DataType.ENUM('active', 'inactive', 'suspended', 'pending'),
    defaultValue: 'active',
    allowNull: false
  })
  status!: 'active' | 'inactive' | 'suspended' | 'pending';

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  presentAddress!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  pinCode!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  state!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  userAddress!: string;

   @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false
  })
  isPayHolder!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  costCenter!: string;
  

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false
  })
  isDeleted!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false
  })
  isConfirmed!: boolean;

  
@Column(DataType.JSON)         // <-- new
addresses!: Array<{
  label: string;              // "Home" | "Office"
  country: string;
  state: string;
  city: string;
  pinCode: string;
  presentAddress: string;
  userAddress: string;
}> | null;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @HasMany(() => Booking)
  bookings!: Booking[];
}
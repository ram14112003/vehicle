
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  DefaultScope,
  ForeignKey,
  BelongsTo,
  HasMany
} from 'sequelize-typescript';
import { PackageData } from './packageData';
import { Company } from './company';
import { Booking } from './booking';
import { Invoice } from './invoice';

@DefaultScope(() => ({
  where: {
    isDeleted: false
  }
}))

@Table({
  tableName: 'closependings',
  timestamps: true,
  updatedAt: false,
  freezeTableName: true,
  underscored: false
})
export class ClosePending extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  closependingId!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  pickupDate!: Date;

  // ===== Garage Fields =====
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  garageKms!: number;

@Column({
  type: DataType.STRING,  // ✅ Change to STRING
  allowNull: true
})
usageHours!: string;

  @Column(DataType.INTEGER)
  garageOpenKm!: number;

  @Column(DataType.INTEGER)
  garageCloseKm!: number;

  @Column(DataType.DATE)
  garageOpenDateTime!: Date;

  @Column(DataType.DATE)
  garageCloseDateTime!: Date;

  // ===== Guest Fields =====
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  guestKms!: number;

  @Column(DataType.INTEGER)
  guestOpenKm!: number;

  @Column(DataType.INTEGER)
  guestCloseKm!: number;

  @Column(DataType.DATE)
  guestOpenDateTime!: Date;

  @Column(DataType.DATE)
  guestCloseDateTime!: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  hideGuestDetails!: boolean;

  @ForeignKey(() => PackageData)
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  packageDataId!: string;
@Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00
  })
  extraDriverBeta!: number;

  @Column({
  type: DataType.INTEGER,
  defaultValue: 0,
  allowNull: true,
})
driverBetaDays!: number;

  
  @Column(DataType.STRING)
  chargesTitle!: string;

  @Column(DataType.STRING)
  chargesRemarks!: string;

  @Column({
  type: DataType.JSON,
  allowNull: true
})
extraChargesBreakup!: {
  title: string;
  amount: number;
  remarks?: string;
}[];

  @ForeignKey(() => Company)
  @Column({
    type: DataType.UUID,
    allowNull: true
  })
  companyId!: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  additionalKms!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  additionalHours!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00
  })
  discountAmount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00
  })
  advanceAmount!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  cgstApplicable!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  igstApplicable!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  sgstApplicable!: boolean;

  // ===== PRICING/BILLING FIELDS =====

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00
  })
  packageAmount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00
  })
  additionalKmsAmount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00
  })
  additionalHoursAmount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00
  })
  totalAmount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00
  })
  extraCharges!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00
  })
  total!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00
  })
  totalDue!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00
  })
  cgstAmount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00
  })
  igstAmount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00
  })
  sgstAmount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00
  })
  totalTaxAmount!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false
  })
  isDeleted!: boolean;
@Column({
  type: DataType.STRING,
  allowNull: true,
})
tripSheetNumber!: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true
  })
  selectedPackageData!: object;

  @BelongsTo(() => PackageData)
  packageData!: PackageData;

  @HasMany(() => Invoice)
  invoice!: Invoice[];
}
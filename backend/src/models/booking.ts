import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  BelongsTo,
  ForeignKey,
  HasMany,
  BeforeCreate
} from 'sequelize-typescript';
import { Sequelize, QueryTypes } from "sequelize";
import { Employee } from './employee';
import { Vehicle } from './vehicle';
import { User } from './user';
import { Invoice } from './invoice';
import { Drivers } from './drivers';
import { VehicleType } from './vehicleType';
import { Payment } from './payment';
import { BookingSequence } from './booking_sequence';
import { ClosePending } from './closepending';
import { VehicleMaster } from './vehicleMaster';
import { Company } from './company';

@Table({
  tableName: 'booking',
  timestamps: true,
  updatedAt: false,
})
export class Booking extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  bookingId!: string;

  @Column(DataType.DATE)
  bookingDate!: Date;

  @Column({
  type: DataType.TEXT,
  allowNull: true,
})
managerApprovalToken!: string | null;


  @Column(DataType.TIME)
  bookingTime!: string;

  @Column(DataType.STRING)
  signature!: string;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  bookingCode!: string;


@BeforeCreate
static async generateBookingCode(instance: Booking) {
  // --- Get current date in IST (GMT+5:30) ---
  const nowInIST = new Date().toLocaleString("en-CA", { timeZone: "Asia/Kolkata" });
  // nowInIST example → "2025-10-06, 17:45:12"
  const dateStr = nowInIST.split(",")[0]; // → "2025-10-06"

  // --- Format prefix: YYYYMMDD ---
  const [yyyy, mm, dd] = dateStr.split("-");
  const prefix = `${yyyy}${mm}${dd}`;

  // --- Atomic insert/update in booking_sequence ---
  await BookingSequence.sequelize!.query(
    `
    INSERT INTO booking_sequence (seq_date, last_number)
    VALUES (:dateStr, 1)
    ON DUPLICATE KEY UPDATE last_number = last_number + 1
    `,
    {
      replacements: { dateStr },
      type: QueryTypes.INSERT,
    }
  );

  // --- Fetch updated value ---
  const result = await BookingSequence.findByPk(dateStr);
  const nextNumber = result ? (result as any).last_number : 1;

  // --- Final booking code ---
  const padded = String(nextNumber).padStart(4, "0");
  instance.bookingCode = `${prefix}${padded}`;
}


  // @BeforeCreate
  // static async generateBookingCode(instance: Booking) {
  //   const date = new Date();

  //   // Format prefix: YYYYMMDD
  //   const prefix = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

  //   // Convert to MySQL DATE (YYYY-MM-DD)
  //   const dateStr = date.toISOString().split("T")[0];

  //   // Atomic insert/update
  //   await BookingSequence.sequelize!.query(
  //     `
  //     INSERT INTO booking_sequence (seq_date, last_number)
  //     VALUES (:dateStr, 1)
  //     ON DUPLICATE KEY UPDATE last_number = last_number + 1
  //     `,
  //     {
  //       replacements: { dateStr },
  //       type: QueryTypes.INSERT,
  //     }
  //   );

  //   // Fetch updated value
  //   const result = await BookingSequence.findByPk(dateStr);
  //   const nextNumber = result!.last_number;

  //   // Pad to 4 digits and assign
  //   const padded = String(nextNumber).padStart(4, "0");
  //   instance.bookingCode = `${prefix}${padded}`;
  // }

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  userId!: string;

  @BelongsTo(() => User, { as: 'user' })
  user!: User;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  employeeId!: string;

  @BelongsTo(() => Employee, { as: 'employee' })
  employee!: Employee;

  @Column(DataType.STRING)
  pickupPoint!: string;

  
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  bookingCreatedBy!: string;
@Column({
  type: DataType.STRING,
  allowNull: true,
})
behalfOfName!: string;

@Column({
  type: DataType.STRING,
  allowNull: true,
})
behalfOfPhone!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  pickupCity!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  pickupArea!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  predefinedArea!: string;

  @Column(DataType.STRING)
  dropPoint!: string;

  @Column(DataType.STRING)
  pickupLongitude!: string;

  @Column(DataType.STRING)
  pickupLatitude!: string;

  @Column(DataType.STRING)
  dropLatitude!: string;

  @Column(DataType.STRING)
  dropLongitude!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  travelLatitude!: string;

  @Column({
  type: DataType.JSON,
  allowNull: false,
  defaultValue: [],
})
travelTrail!: any;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  travelLongitude!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  angle!: string;
  

  @Column(DataType.INTEGER)
  travellersCount!: number;

  @Column(DataType.INTEGER)
  femaleCount!: number;

  @Column(DataType.INTEGER)
  maleCount!: number;

  @Column(DataType.STRING)
  pickupAirport!: string;

  @Column(DataType.STRING)
  pickupStation!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  approximatetds2!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  approximatetds1!: string;

  @Column(DataType.STRING)
  remarks!: string;

  @Column(DataType.STRING)
  purpose!: string;

  @Column(DataType.STRING)
  confirmStatus!: string;

  @Column(DataType.STRING)
  bookingStatus!: string;

    @Column(DataType.STRING)
  driverTripStatus!: string;

  @Column(DataType.STRING)
  autoApproveStatus!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  preferredType!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  roundTrip!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  notes!: string;

  @ForeignKey(() => Vehicle)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  vehicleId!: string;

  @BelongsTo(() => Vehicle, { as: 'vehicle' })
  vehicle!: Vehicle;

  @ForeignKey(() => Payment)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  paymentId!: string;

  @BelongsTo(() => Payment, { as: 'payment' })
  payment!: Payment;

  @ForeignKey(() => VehicleType)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  vehicleTypeId!: string;

  @BelongsTo(() => VehicleType, { as: 'vehicleType' })
  vehicleType!: VehicleType;

  @ForeignKey(() => Drivers)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  driverId!: string;

  @BelongsTo(() => Drivers, { as: 'driver' })
  driver!: Drivers;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  createdBy!: string;

  @BelongsTo(() => Employee, { as: 'createdEmployee', targetKey: 'employeeId' })
  createdEmployee!: Employee;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @HasMany(() => Invoice, { as: 'invoice' })
  invoice!: Invoice[];

  @ForeignKey(() => VehicleMaster)
@Column({
  type: DataType.UUID,
  allowNull: true,
})
vehicleMasterId!: string;

@BelongsTo(() => VehicleMaster, { as: "vehicleMaster", foreignKey: "vehicleMasterId" })
vehicleMaster!: VehicleMaster;

  // @HasMany(() => ClosePending, { as: 'closepending', foreignKey: 'packageDataId', sourceKey: 'bookingId' })
  // closepending!: ClosePending[];
@Column({
  type: DataType.STRING,
  allowNull: true,
})
costCenter!: string;

@ForeignKey(() => User)
@Column({
  type: DataType.UUID,
  allowNull: true,
})
managerUserId!: string;

@ForeignKey(() => Company)
@Column({
  type: DataType.UUID,
  allowNull: true,
})
companyId!: string;

@BelongsTo(() => Company, { as: "company", foreignKey: "companyId" })
company!: Company;

@Column({
  type: DataType.STRING,
  allowNull: true,
})
selfName!: string;
@BelongsTo(() => User, { as: "manager", foreignKey: "managerUserId" })
manager!: User;
@Column({
  type: DataType.STRING,
  allowNull: true,
})
managerEmail!: string;
}


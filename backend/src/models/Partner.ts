import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  DefaultScope,
} from 'sequelize-typescript';

@DefaultScope(() => ({
  where: {
    isDeleted: false,
  },
}))

@Table({
  tableName: 'partners',
  timestamps: true,
  updatedAt: false,
})
export class Partner extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  partnerId!: string;

  @Column(DataType.STRING)
  name!: string;

  @Column({
    type:DataType.STRING,
    unique: true,
  })
  email!: string;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  contactNumber!: string;

  @Column(DataType.STRING)
  presentAddress!: string;

  @Column(DataType.STRING)
  cityPreferred!: string;

  @Column(DataType.STRING)
  vehicleType!: string;

 @Column({
  type: DataType.STRING,
  unique: true,
})
licenseNo!: string;


  @Column({
    type: DataType.STRING,
    unique: true,
  })
  registrationNumber!: string;

  @Column(DataType.STRING)
  registrationYear!: string;

  @Column(DataType.STRING)
  fuelType!: string;

  @Column(DataType.INTEGER)
  passengerCapacity!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isDeleted!: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;
}

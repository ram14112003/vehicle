import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  DefaultScope
} from 'sequelize-typescript';
@DefaultScope(() => ({
  where: {
    isDeleted: false
  }
}))

@Table({
  tableName: 'pickupcity',
  timestamps: true, 
  updatedAt: false,
})
export class Pickupcity extends Model {
  @PrimaryKey
  @Column({
  type: DataType.UUID,
  defaultValue: DataType.UUIDV4,
})
  cityId!: string;
  
  @Column(DataType.STRING)
  country!: string;

  @Column(DataType.STRING)
  state!: string;

  @Column(DataType.STRING)
  pickupCity!: string;
  
  @Column(DataType.STRING)
  sortOrder!: string;

  @Column(DataType.STRING)
  isPickupCity!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false
  })
  isDeleted!: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;
}

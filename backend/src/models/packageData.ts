import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  BelongsTo,
  ForeignKey,
  DefaultScope
} from 'sequelize-typescript';
import { Package } from './package';
import { Company } from './company';

@DefaultScope(() => ({
  where: {
    isDeleted: false
  }
}))

@Table({
  tableName: 'packagedata',
  timestamps: true,
  updatedAt: false,
})
export class PackageData extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  packageDataId!: string;
  @Column(DataType.STRING)
  packageType!:string

  @ForeignKey(() => Company)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  companyId!: string;

  //@Column(DataType.STRING)
  @Column(DataType.TEXT('long'))
  packages!: string;

  @BelongsTo(() => Company)
  company!: Company;
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
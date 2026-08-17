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
  tableName: 'mapcount',
  timestamps: true,
  updatedAt: false,
})
export class MapCount extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  appCount!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  webCount!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isDeleted!: boolean;

  @CreatedAt
  createdAt!: Date;
}
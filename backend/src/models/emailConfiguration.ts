import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  UpdatedAt
} from 'sequelize-typescript';

@Table({
  tableName: 'emailConfiguration',
  timestamps: true
})
export class EmailConfiguration extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  emailConfigId!: string;

  @Column(DataType.STRING)
  title!: string;

  @Column(DataType.STRING)
  emailCode!: string;

  @Column(DataType.STRING)
  subject!: string;

  // @Column(DataType.STRING)
  // message!: string;

  @Column({
    type: DataType.TEXT('long'),
    allowNull: true,
  })
  message!: string;

  @Column(DataType.STRING)
  fromName!: string;

  @Column(DataType.STRING)
  fromAddress!: string;

  @Column(DataType.STRING)
  emailBcc!: string;


  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;
}

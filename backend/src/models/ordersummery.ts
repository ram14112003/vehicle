import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    ForeignKey,
    CreatedAt,
    BelongsTo

} from 'sequelize-typescript';
import { Company } from './company';
import { Invoice } from './invoice';
import { Tax } from './tax';


@Table({
    tableName: 'ordersummery',
    timestamps: true,
    updatedAt: false,
})
export class orderSummery extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    ordersummeryid!: string;

    @ForeignKey(() => Company)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    companyId!: string;

    @BelongsTo(() => Company)
    company!: Company;

     @ForeignKey(() => Invoice)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    invoiceId!: string;

    @BelongsTo(() => Invoice)
    invoice!: Invoice;



    @ForeignKey(() => Tax)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    taxId!: string;

    @BelongsTo(() => Tax)
    tax!: Tax;


    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;

}
import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    CreatedAt,
    DefaultScope
} from 'sequelize-typescript';

@Table({
    tableName: 'paymentmode',
    timestamps: true,
    updatedAt: false,
})
@DefaultScope(() => ({
    where: {
        isDeleted: false
    }
}))

export class PaymentMode extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    paymentmodeId!: string;

    @Column(DataType.STRING)
    modelname!: string;

    @Column(DataType.STRING)
    sortorder!: string;

    @Column(DataType.BOOLEAN)
    isOnline!: boolean;

    @Column(DataType.BOOLEAN)
    isActive!: boolean;
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

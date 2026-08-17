// Package Model
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
    DefaultScope
} from 'sequelize-typescript';
import { Company } from './company';

@DefaultScope(() => ({
    where: {
        isDeleted: false
    }
}))
@Table({
    tableName: 'package',
    timestamps: true,
    updatedAt: false,
})
export class Package extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    packageId!: string;

    @ForeignKey(() => Company)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    companyId!: string;

    @BelongsTo(() => Company)
    company!: Company;

    @Column({
        type: DataType.ENUM('Out Station', 'Local City Use'),
        allowNull: false
    })
    packageType!: 'Out Station' | 'Local City Use';
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


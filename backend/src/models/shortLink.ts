import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/dbConfig';

export class ShortLink extends Model {
  public id!: number;
  public code!: string;
  public fullUrl!: string;
  public createdAt!: Date;
  public expiresAt!: Date;
}

ShortLink.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,        // OK
      // ❌ index: true  <-- REMOVE THIS
    },
    fullUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true, // NULL = no expiry
      comment: 'If set, short link expires at this time',
    },
  },
  {
    sequelize,
    tableName: 'short_links',
    timestamps: false,

    // ✅ Correct place for index
    indexes: [
      {
        fields: ['code'],
        unique: true,
      },
    ],
  }
);

export default ShortLink;

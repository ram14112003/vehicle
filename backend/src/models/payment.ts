// payment.ts
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  CreatedAt,
  HasMany,
  BeforeSave,
} from 'sequelize-typescript';
import { QueryTypes, UniqueConstraintError } from 'sequelize';

import { Invoice } from './invoice';
import { Booking } from './booking';
import { PaymentSequence } from './payment_sequence';
import { DecimalDataType } from 'sequelize';

// Optional: bring in any logging util you use, or use console
const log = (tag: string, obj?: any) => {
  // replace with your logger if available
  // Example: logger.info(tag, obj);
  // keep lightweight to avoid adding dependencies here
  // console.debug(tag, JSON.stringify(obj || {}));
};

@Table({
  tableName: 'payment',
  timestamps: true,
  updatedAt: false,
})
export class Payment extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  paymentId!: string;

  @Column(DataType.STRING)
  paymentMode!: string;

  @Column(DataType.BOOLEAN)
  isOnline!: boolean;

  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  // Allow NULL so creation/update paths without a txn id won't fail;
  // the model hook will populate when needed.
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: true,
  })
  transactionId!: string | null;

  @Column(DataType.STRING)
  status!: string;

  @Column(DataType.DECIMAL)
  amount!: DecimalDataType;

  @Column(DataType.DECIMAL)
  tax!: DecimalDataType;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  orderId!: string | null; // ORD...

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  gatewayOrderId!: string | null; // gateway id

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  paymentUrl!: string | null; // redirect link

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  clientAuthToken!: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  expiresAt!: Date | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  meta!: any;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @HasMany(() => Invoice, { as: 'invoices', foreignKey: 'paymentId' })
  invoices!: Invoice[];

  @HasMany(() => Booking)
  booking!: Booking[];

  /**
   * BeforeSave hook: runs for create AND update/save.
   * - If transactionId already exists, leave it alone.
   * - If missing and payment is an online/gateway payment, generate one.
   * - Uses payment_sequence table to produce daily sequential ids: YYYYMMDD + 4-digit sequence.
   * - Retries a few times on unique-constraint collisions (very rare).
   */
  @BeforeSave
  static async ensureTransactionId(instance: Payment) {
    try {
      // if transactionId is already provided by the caller (frontend or other service), do not overwrite
      if (instance.transactionId && String(instance.transactionId).trim().length > 0) {
        return;
      }

      // Determine whether to auto-generate:
      // - If isOnline is true OR paymentMode contains gateway names like 'ccavenue'/'hdfc'
      // Adjust this condition to match your app's paymentMode values.
      const pmode = (instance.paymentMode || '').toString().toLowerCase();
      const shouldAutoGen =
        instance.isOnline === true ||
        pmode.includes('ccavenue') ||
        pmode.includes('hdfc') ||
        pmode.includes('hdfc_payment_page') ||
        pmode.includes('payment_gateway');

      if (!shouldAutoGen) {
        // For COD/manual payments, frontend-provided txn ids (if any) will be used; otherwise skip generation.
        return;
      }

      const sequelize = PaymentSequence.sequelize!;
      const maxAttempts = 3;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        // Build date prefix in IST: YYYYMMDD
        const nowInIST = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }); // "YYYY-MM-DD, hh:mm:ss"
        const dateStr = nowInIST.split(',')[0]; // "YYYY-MM-DD"
        const [yyyy, mm, dd] = dateStr.split('-');
        const prefix = `${yyyy}${mm}${dd}`;

        try {
          // Atomically insert or increment the day's sequence inside a DB transaction
          await sequelize.transaction(async (t) => {
            await sequelize.query(
              `
                INSERT INTO payment_sequence (seq_date, last_number)
                VALUES (:dateStr, 1)
                ON DUPLICATE KEY UPDATE last_number = last_number + 1
              `,
              {
                replacements: { dateStr },
                type: QueryTypes.INSERT,
                transaction: t,
              }
            );
          });

          // Read back the sequence row (this is the current committed value)
          const seqRow = await PaymentSequence.findByPk(dateStr);
          const nextNumber = seqRow ? (seqRow as any).last_number : 1;
          const padded = String(nextNumber).padStart(4, '0');

          instance.transactionId = `${prefix}${padded}`;

          // We successfully assigned a transaction id — break out of retry loop
          break;
        } catch (err: any) {
          // If unique constraint error occurs (collision on transactionId), try again
          const isUniqueErr =
            err instanceof UniqueConstraintError ||
            err.name === 'SequelizeUniqueConstraintError' ||
            (err.errors && err.errors.some((e: any) => e.type === 'unique violation'));

          if (isUniqueErr && attempt < maxAttempts) {
            // small exponential/backoff delay to reduce collision window
            const waitMs = 50 * attempt;
            await new Promise((r) => setTimeout(r, waitMs));
            // continue to next attempt
            continue;
          }

          // rethrow for other errors or if we exhausted attempts
          throw err;
        }
      } // attempts loop
    } catch (ex) {
      // If transaction id generation fails for any reason, we DON'T want to crash everything silently.
      // Let the error bubble up so calling code sees it. If you prefer to continue without txn id,
      // replace the throw with a log and return, but that may break gateway expectations.
      log('ENSURE_TXN_ERROR', { error: (ex as any)?.message || ex });
      throw ex;
    }
  }
}

export default Payment;

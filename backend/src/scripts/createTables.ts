import sequelize from '../config/dbConfig';
import { CustomerNotification } from '../models/customerNotification';
import { DriverNotification } from '../models/driverNotification';
import { SmsLog } from '../models/smsLog';

async function setupTables() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Create customer_notifications table cleanly if not exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`customer_notifications\` (
        \`notificationId\` VARCHAR(255) NOT NULL,
        \`userId\` VARCHAR(255) NOT NULL,
        \`bookingId\` VARCHAR(255) DEFAULT NULL,
        \`type\` VARCHAR(255) NOT NULL DEFAULT 'DRIVER_ASSIGNED',
        \`title\` VARCHAR(255) NOT NULL,
        \`message\` TEXT NOT NULL,
        \`isRead\` TINYINT(1) NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`notificationId\`),
        KEY \`userId_idx\` (\`userId\`),
        KEY \`bookingId_idx\` (\`bookingId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('customer_notifications table verified.');

    // Create driver_notifications table cleanly if not exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`driver_notifications\` (
        \`notificationId\` VARCHAR(255) NOT NULL,
        \`driverId\` VARCHAR(255) NOT NULL,
        \`bookingId\` VARCHAR(255) DEFAULT NULL,
        \`type\` VARCHAR(255) NOT NULL DEFAULT 'NEW_RIDE_ASSIGNED',
        \`title\` VARCHAR(255) NOT NULL,
        \`message\` TEXT NOT NULL,
        \`readStatus\` TINYINT(1) NOT NULL DEFAULT 0,
        \`isRead\` TINYINT(1) NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`notificationId\`),
        KEY \`driverId_idx\` (\`driverId\`),
        KEY \`bookingId_idx\` (\`bookingId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('driver_notifications table verified.');

    // Create sms_logs table cleanly if not exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`sms_logs\` (
        \`smsLogId\` VARCHAR(255) NOT NULL,
        \`bookingId\` VARCHAR(255) DEFAULT NULL,
        \`recipientType\` VARCHAR(50) NOT NULL,
        \`recipientId\` VARCHAR(255) DEFAULT NULL,
        \`phoneNumber\` VARCHAR(50) NOT NULL,
        \`messageType\` VARCHAR(100) NOT NULL,
        \`messageBody\` TEXT NOT NULL,
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'SENT',
        \`deliveryStatus\` VARCHAR(50) DEFAULT 'PENDING',
        \`providerStatus\` VARCHAR(50) DEFAULT 'SUCCESS',
        \`providerMessageId\` VARCHAR(255) DEFAULT NULL,
        \`errorMessage\` TEXT DEFAULT NULL,
        \`sentAt\` DATETIME DEFAULT NULL,
        \`deliveredAt\` DATETIME DEFAULT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`smsLogId\`),
        KEY \`bookingId_idx\` (\`bookingId\`),
        KEY \`recipientType_idx\` (\`recipientType\`),
        KEY \`messageType_idx\` (\`messageType\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Safe column additions if table already existed
    try {
      await sequelize.query(`ALTER TABLE \`sms_logs\` ADD COLUMN \`deliveryStatus\` VARCHAR(50) DEFAULT 'PENDING';`);
    } catch (e) {}
    try {
      await sequelize.query(`ALTER TABLE \`sms_logs\` ADD COLUMN \`providerStatus\` VARCHAR(50) DEFAULT 'SUCCESS';`);
    } catch (e) {}
    try {
      await sequelize.query(`ALTER TABLE \`sms_logs\` ADD COLUMN \`deliveredAt\` DATETIME DEFAULT NULL;`);
    } catch (e) {}

    console.log('sms_logs table created or verified cleanly.');

    // Test Sequelize models
    const count = await CustomerNotification.count();
    console.log(`CustomerNotification count: ${count}`);

    const dCount = await DriverNotification.count();
    console.log(`DriverNotification count: ${dCount}`);

    const smsCount = await SmsLog.count();
    console.log(`SmsLog count: ${smsCount}`);

    console.log('All notification & SMS log tables verified successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating tables:', err);
    process.exit(1);
  }
}

setupTables();

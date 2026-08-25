import sequelize from '../config/dbConfig';
import { CustomerNotification } from '../models/customerNotification';
import { DriverNotification } from '../models/driverNotification';

async function setupTables() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Drop old tables if broken constraints exist
    await sequelize.query(`DROP TABLE IF EXISTS \`customer_notifications\`;`);
    await sequelize.query(`DROP TABLE IF EXISTS \`driver_notifications\`;`);

    // Create customer_notifications table cleanly
    await sequelize.query(`
      CREATE TABLE \`customer_notifications\` (
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
    console.log('customer_notifications table created cleanly.');

    // Create driver_notifications table cleanly
    await sequelize.query(`
      CREATE TABLE \`driver_notifications\` (
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
    console.log('driver_notifications table created cleanly.');

    // Test Sequelize models
    const count = await CustomerNotification.count();
    console.log(`CustomerNotification model query test passed! Count: ${count}`);

    const dCount = await DriverNotification.count();
    console.log(`DriverNotification model query test passed! Count: ${dCount}`);

    console.log('All notification tables verified successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating tables:', err);
    process.exit(1);
  }
}

setupTables();


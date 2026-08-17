import sequelize from '../config/dbConfig';
import { Employee } from './employee';
import { Company } from './company';
import { Drivers } from './drivers';
import { Vehicle } from './vehicle';
import { Vendor } from './vendor';
import { User } from './user';
import { Booking } from './booking';
import { Invoice } from './invoice';
import { Payment } from './payment';
import { Pickuparea } from './pickuparea';
import { Pickupcity } from './pickupcity';
import { Tax } from './tax';
import { VehicleType } from './vehicleType';
import { VehicleMaster } from './vehicleMaster';
import { OTP } from './otp';
import {PaymentMode} from './paymentmode';
import { orderSummery } from './ordersummery';
import { Package } from './package';
import { PackageData } from './packageData';
import { Configuration } from './configuration';
import { ClosePending } from './closepending';
import { EmailConfiguration } from './emailConfiguration';
import { BookingSequence } from './booking_sequence';
import { PaymentSequence } from './payment_sequence';
import { InvoiceSequence } from './invoice_sequence';
import { MonthlyBookingSequence } from './monthlyBookingSequence';
import { MapCount } from './mapCount';
import ShortLink from './shortLink';
import { OnCallInvoice } from './onCallInvoice';
import { OnCallInvoiceItems } from './onCallInvoiceItems';
import { MonthlyInvoice } from './monthlyInvoice';
import { MonthlyInvoiceItems } from './monthlyInvoiceItems';
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
  //  await sequelize.sync();
    console.log('Database connected and tables synced.');
  } catch (error) {
    console.error('DB connection error:', error);
  }
};

export { sequelize, connectDB, Employee, Company, Drivers,Vehicle,Vendor,User, Booking, Invoice, EmailConfiguration,
  VehicleType, Tax, Pickuparea, Pickupcity, VehicleMaster,OTP,PaymentMode,Payment,orderSummery,Package,PackageData,Configuration,
  ClosePending, BookingSequence, PaymentSequence, InvoiceSequence, ShortLink, MonthlyBookingSequence, MapCount, OnCallInvoice,
  OnCallInvoiceItems, MonthlyInvoice, MonthlyInvoiceItems
};

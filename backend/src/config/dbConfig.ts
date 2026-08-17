import { Sequelize,  } from 'sequelize-typescript';
import { Dialect } from 'sequelize';
import config from '../config/config';

import { Employee } from '../models/employee';
import { Company } from '../models/company';
import { Drivers } from '../models/drivers';
import { Vehicle } from '../models/vehicle';
import { Vendor } from '../models/vendor';
import { User } from '../models/user';
import { Booking } from '../models/booking';
import { Invoice } from '../models/invoice';
import { Payment } from '../models/payment';
import { VehicleType } from '../models/vehicleType';
import { Pickuparea } from '../models/pickuparea';
import { Pickupcity } from '../models/pickupcity';
import { OTP } from '../models/otp';
import { Tax } from '../models/tax';
import { VehicleMaster } from '../models/vehicleMaster';
import {PaymentMode} from '../models/paymentmode';
import { orderSummery } from '../models/ordersummery';
import { Package } from '../models/package';
import { PackageData } from '../models/packageData';
import { Configuration } from '../models/configuration';
import { ClosePending } from '../models/closepending';
import { EmailConfiguration } from '../models/emailConfiguration';
import { BookingSequence } from '../models/booking_sequence';
import { PaymentSequence } from '../models/payment_sequence';
import { InvoiceSequence } from '../models/invoice_sequence';
import { Partner } from '../models/Partner';
import { MonthlyInvoice } from '../models/monthlyInvoice';
import { MonthlyInvoiceItems } from '../models/monthlyInvoiceItems';
import { MonthlyBookingSequence } from '../models/monthlyBookingSequence';
import { MapCount } from '../models/mapCount';
import { OnCallInvoice } from '../models/onCallInvoice';
import { OnCallInvoiceItems } from '../models/onCallInvoiceItems';

const sequelize = new Sequelize({
  dialect: config.database.dialect as Dialect,
  host: config.database.host,
  username: config.database.user,
  password: config.database.password,
  database: config.database.dbname,
  models: [Employee, Company, Drivers, Vehicle, Vendor, User, Booking, Invoice, Partner,
    Payment,VehicleType,OTP, Tax, Pickuparea,Pickupcity,VehicleMaster,PaymentMode,orderSummery,Package,
    PackageData,Configuration,ClosePending,EmailConfiguration,BookingSequence,PaymentSequence, InvoiceSequence,
     MonthlyInvoice, MonthlyInvoiceItems, MonthlyBookingSequence,MapCount,OnCallInvoice,OnCallInvoiceItems],
  logging: false,
});

export default sequelize;

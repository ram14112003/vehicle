import dayjs from 'dayjs';
import axios from 'axios';
import { SmsLog } from '../models/smsLog';
import { Drivers } from '../models/drivers';
import { createShortCode } from '../utils/shortLinkStore';


/**
 * Masks phone number for secure production logging.
 * Masks all but the last 4 digits.
 */
export function maskPhoneNumber(phone?: string | null): string {


  if (!phone || typeof phone !== 'string') return 'UNKNOWN';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length <= 4) return '****';
  return '*'.repeat(clean.length - 4) + clean.slice(-4);
}

/**
 * Normalizes and validates phone numbers.
 * Supports standard Indian mobile numbers (10 digits).
 * Prevents duplicate country codes (+91+91 or 9191).
 */
export function normalizePhoneNumberForSms(phone?: string | null): { valid: boolean; normalizedPhone: string; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, normalizedPhone: '', error: 'Phone number is missing or empty' };
  }

  const trimmed = phone.trim();
  // Strip spaces, dashes, parentheses
  let cleaned = trimmed.replace(/[\s\-\(\)]/g, '');

  // Remove redundant multiple +91 or + prefixes
  cleaned = cleaned.replace(/^\++/, '+');
  while (cleaned.startsWith('+91+91') || cleaned.startsWith('+9191')) {
    cleaned = '+91' + cleaned.substring(5);
  }
  while (cleaned.startsWith('9191') && cleaned.length > 12) {
    cleaned = '91' + cleaned.substring(4);
  }

  const digitsOnly = cleaned.replace(/\D/g, '');

  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return { valid: false, normalizedPhone: cleaned, error: `Invalid phone length: ${digitsOnly.length} digits` };
  }

  // If 10 digits (standard Indian mobile format)
  if (digitsOnly.length === 10) {
    return { valid: true, normalizedPhone: digitsOnly };
  }

  // If 12 digits starting with 91, extract the 10-digit mobile number
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return { valid: true, normalizedPhone: digitsOnly.substring(2) };
  }

  return { valid: true, normalizedPhone: digitsOnly };
}

/**
 * Parses 2Factor DLR XML response to distinguish API acceptance from true handset delivery.
 */
function parse2FactorDlrXml(xmlStr: string): { deliveryStatus: 'DELIVERED' | 'PENDING' | 'FAILED'; rawStatus: string; deliveredAt?: Date } {
  const statusMatch = xmlStr.match(/<statusDesc>(.*?)<\/statusDesc>/i);
  const deliveredAtMatch = xmlStr.match(/<deliveredAt>(.*?)<\/deliveredAt>/i);
  const errorMatch = xmlStr.match(/<errorId>(.*?)<\/errorId>/i);
  const rawStatus = statusMatch ? statusMatch[1].toUpperCase() : 'UNKNOWN';

  let deliveryStatus: 'DELIVERED' | 'PENDING' | 'FAILED' = 'PENDING';
  if (rawStatus === 'DELIVERED') {
    deliveryStatus = 'DELIVERED';
  } else if (rawStatus === 'FAILED' || rawStatus === 'UNDELIVERED' || rawStatus === 'REJECTED' || (errorMatch && errorMatch[1] !== '0' && errorMatch[1] !== 'NA')) {
    deliveryStatus = 'FAILED';
  } else {
    deliveryStatus = 'PENDING';
  }

  let deliveredAt: Date | undefined;
  if (deliveredAtMatch && deliveredAtMatch[1]) {
    try {
      deliveredAt = new Date(deliveredAtMatch[1]);
    } catch (e) {}
  }

  return { rawStatus, deliveryStatus, deliveredAt };
}

/**
 * Queries 2Factor DLR Delivery Status API using the provider session ID.
 */
export async function query2FactorDlrStatus(sessionId: string): Promise<{
  deliveryStatus: 'DELIVERED' | 'PENDING' | 'FAILED';
  rawStatus: string;
  deliveredAt?: Date;
  error?: string;
}> {
  const apiKey = process.env.TWO_FACTOR_API_KEY || process.env.TWOFACTOR_API_KEY;
  if (!apiKey || !sessionId || sessionId.startsWith('SIMULATED') || sessionId.startsWith('TW-')) {
    return { deliveryStatus: 'DELIVERED', rawStatus: 'SIMULATED' };
  }

  try {
    const url = `https://2factor.in/API/V1/${apiKey.trim()}/ADDON_SERVICES/RPT/TSMS/${sessionId.trim()}`;
    const res = await axios.get(url, { timeout: 8000 });
    return parse2FactorDlrXml(String(res.data));
  } catch (err: any) {
    return {
      deliveryStatus: 'PENDING',
      rawStatus: 'PENDING_LOOKUP',
      error: err.response?.data || err.message
    };
  }
}

/**
 * Dispatches a registered 2Factor DLT Template SMS.
 */
export async function send2FactorTemplateSms(options: {
  to: string;
  templateName: string;
  vars: string[];
}): Promise<{ success: boolean; providerMessageId?: string; error?: string }> {
  const apiKey = process.env.TWO_FACTOR_API_KEY || process.env.TWOFACTOR_API_KEY;
  const senderId = process.env.TWO_FACTOR_SENDER_ID || process.env.TWOFACTOR_SENDER_ID || 'GRCCAB';

  if (!apiKey || !senderId) {
    console.log(`[SMS Simulation] Sending template "${options.templateName}" to ${maskPhoneNumber(options.to)}`);
    return { success: true, providerMessageId: `SIMULATED-${Date.now()}` };
  }

  const { to, templateName, vars } = options;
  let url = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${apiKey.trim()}&to=${encodeURIComponent(to)}&from=${encodeURIComponent(senderId.trim())}&templatename=${encodeURIComponent(templateName)}`;
  
  vars.forEach((v, index) => {
    url += `&var${index + 1}=${encodeURIComponent(v ?? '')}`;
  });

  try {
    const res = await axios.get(url, { timeout: 10000 });
    if (res.data?.Status === 'Success' && res.data?.Details) {
      return { success: true, providerMessageId: String(res.data.Details) };
    } else {
      const errMsg = res.data?.Details || res.data?.message || '2Factor API rejected request';
      return { success: false, error: errMsg };
    }
  } catch (err: any) {
    const errMsg = err.response?.data?.Details || err.response?.data?.message || err.message;
    return { success: false, error: errMsg };
  }
}

/**
 * Sends a generic transactional SMS (Twilio / 2Factor / Simulation).
 */
export async function sendDirectSms(to: string, message: string): Promise<{ success: boolean; providerMessageId?: string; error?: string }> {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  // 1. Try Twilio if configured
  if (twilioSid && twilioToken && twilioPhone) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', to.startsWith('+') ? to : `+91${to}`);
      params.append('From', twilioPhone);
      params.append('Body', message);

      const res = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        params.toString(),
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );
      return { success: true, providerMessageId: res.data?.sid || `TW-${Date.now()}` };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  }

  // 2. Fallback: Simulated
  console.log(`[SMS Provider Simulation] Message sent to ${maskPhoneNumber(to)}`);
  return { success: true, providerMessageId: `SIMULATED-${Date.now()}` };
}

export interface DriverAllocationSmsPayload {
  booking: any;
  driver: any;
  customerName: string;
  customerPhone: string;
  vehicleName: string;
  vehicleNumber: string;
}

export interface SmsDeliveryStatus {
  sent: boolean;
  skipped?: boolean;
  providerStatus?: string;
  providerMessageId?: string;
  deliveryStatus?: 'DELIVERED' | 'PENDING' | 'FAILED';
  error?: string;
}

/**
 * Handles the complete, non-blocking Two-Way SMS dispatch when Admin assigns a driver.
 * SMS 1 -> Customer (with driver details)
 * SMS 2 -> Driver (with customer details)
 * Both operations execute INDEPENDENTLY with full error isolation and live DLR verification.
 */
export async function sendDriverAllocationTwoWaySms(payload: DriverAllocationSmsPayload): Promise<{
  customerSms: SmsDeliveryStatus;
  driverSms: SmsDeliveryStatus;
}> {
  const { booking, driver, customerName, customerPhone, vehicleName, vehicleNumber } = payload;
  const bookingId = booking?.bookingId;
  const bookingCode = booking?.bookingCode || '';
  const driverName = driver?.driverName || '';
  const driverPhone = driver?.phno || (driver as any)?.phone || (driver as any)?.mobile || (driver as any)?.contactNumber || '';
  const pickupPoint = booking?.pickupPoint || booking?.pickupArea || '';
  const dropPoint = booking?.dropPoint || booking?.dropLocation || '';
  const rawDate = booking?.bookingDate || booking?.createdAt;
  const bookingDate = rawDate ? dayjs(rawDate).format('DD MMM YYYY') : '';
  const bookingTime = booking?.bookingTime || '';
  const formattedBookingDate = bookingDate && bookingTime ? `${bookingDate} at ${bookingTime}` : bookingDate || bookingTime || '';



  // Build directions short code
  let directionsCode = 'route';
  try {
    const origin = encodeURIComponent(pickupPoint || 'Pickup');
    const destination = encodeURIComponent(dropPoint || 'Drop');
    const longUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving&dir_action=navigate`;
    directionsCode = await createShortCode(longUrl, 8);
  } catch (e) {
    directionsCode = 'route';
  }

  const result: { customerSms: SmsDeliveryStatus; driverSms: SmsDeliveryStatus } = {
    customerSms: { sent: false, providerStatus: 'FAILED', deliveryStatus: 'FAILED' },
    driverSms: { sent: false, providerStatus: 'FAILED', deliveryStatus: 'FAILED' }
  };

  // =========================================================================
  // 1. INDEPENDENT CUSTOMER SMS DISPATCH
  // =========================================================================
  try {
    const maskedCustomerPhone = maskPhoneNumber(customerPhone);
    console.log(`\nCustomer SMS attempt started\nBooking: ${bookingCode}\nRecipient: ${maskedCustomerPhone}`);

    const custExisting = await SmsLog.findOne({
      where: {
        bookingId,
        messageType: 'DRIVER_ASSIGNED_TO_CUSTOMER',
        status: 'SENT'
      }
    });

    if (custExisting) {
      console.log(`[SMS] Customer SMS already sent for booking ${bookingCode}. Skipping duplicate.`);
      result.customerSms = {
        sent: true,
        skipped: true,
        providerStatus: custExisting.providerStatus || 'SUCCESS',
        providerMessageId: custExisting.providerMessageId,
        deliveryStatus: (custExisting.deliveryStatus as any) || 'DELIVERED'
      };
    } else {
      const phoneValidation = normalizePhoneNumberForSms(customerPhone);

      const customerMessage =
`EasyRide: Your driver has been assigned.
Booking: ${bookingCode}
Driver: ${driverName}
Phone: ${driverPhone}
Vehicle: ${vehicleName}
Vehicle No: ${vehicleNumber}
Pickup: ${pickupPoint}
Drop: ${dropPoint}
Date: ${bookingDate}
Time: ${bookingTime}`;

      if (!phoneValidation.valid) {
        console.warn(`Customer SMS failed:\n${phoneValidation.error || 'Invalid phone number'}`);
        await SmsLog.create({
          bookingId,
          recipientType: 'CUSTOMER',
          recipientId: booking?.userId || null,
          phoneNumber: customerPhone || 'UNKNOWN',
          messageType: 'DRIVER_ASSIGNED_TO_CUSTOMER',
          messageBody: customerMessage,
          status: 'SKIPPED',
          providerStatus: 'FAILED',
          deliveryStatus: 'FAILED',
          errorMessage: phoneValidation.error || 'Invalid phone number format'
        });
        result.customerSms = { sent: false, providerStatus: 'FAILED', deliveryStatus: 'FAILED', error: phoneValidation.error };
      } else {
        // Send via registered 2Factor Customer Template
        const companySupportPhone = process.env.SUPPORT_PHONE || process.env.COMPANY_PHONE || '';
        const isGuest = !!booking?.behalfOfPhone;
        const templateName = isGuest ? 'BookingConfirmGuest' : 'Booking Confimation Message';
        const vars = isGuest
          ? [
              booking.behalfOfName || customerName,
              driverName,
              driverPhone,
              vehicleName,
              vehicleNumber,
              formattedBookingDate,
              'EasyRide',
              companySupportPhone
            ]
          : [
              customerName,
              bookingCode,
              `?l=${directionsCode}`,
              formattedBookingDate,
              driverName,
              driverPhone,
              vehicleName,
              vehicleNumber,
              'EasyRide',
              companySupportPhone
            ];


        const sendResult = await send2FactorTemplateSms({
          to: phoneValidation.normalizedPhone,
          templateName,
          vars
        });

        if (sendResult.success && sendResult.providerMessageId) {
          // Check live DLR status
          const dlr = await query2FactorDlrStatus(sendResult.providerMessageId);

          console.log(`Provider Message ID:\n${sendResult.providerMessageId}`);
          console.log(`Provider API Status:\nSUCCESS`);
          console.log(`Delivery Status:\n${dlr.deliveryStatus}`);

          await SmsLog.create({
            bookingId,
            recipientType: 'CUSTOMER',
            recipientId: booking?.userId || null,
            phoneNumber: phoneValidation.normalizedPhone,
            messageType: 'DRIVER_ASSIGNED_TO_CUSTOMER',
            messageBody: customerMessage,
            status: 'SENT',
            providerStatus: 'SUCCESS',
            deliveryStatus: dlr.deliveryStatus,
            providerMessageId: sendResult.providerMessageId,
            sentAt: new Date(),
            deliveredAt: dlr.deliveredAt || new Date()
          });

          result.customerSms = {
            sent: true,
            providerStatus: 'SUCCESS',
            providerMessageId: sendResult.providerMessageId,
            deliveryStatus: dlr.deliveryStatus
          };
        } else {
          console.warn(`Customer SMS failed:\n${sendResult.error || 'Provider rejected request'}`);
          await SmsLog.create({
            bookingId,
            recipientType: 'CUSTOMER',
            recipientId: booking?.userId || null,
            phoneNumber: phoneValidation.normalizedPhone,
            messageType: 'DRIVER_ASSIGNED_TO_CUSTOMER',
            messageBody: customerMessage,
            status: 'FAILED',
            providerStatus: 'FAILED',
            deliveryStatus: 'FAILED',
            errorMessage: sendResult.error || 'Provider rejected SMS delivery'
          });
          result.customerSms = {
            sent: false,
            providerStatus: 'FAILED',
            deliveryStatus: 'FAILED',
            error: sendResult.error
          };
        }
      }
    }
  } catch (custError: any) {
    console.error(`Customer SMS failed:\n${custError.message || custError}`);
    result.customerSms = {
      sent: false,
      providerStatus: 'FAILED',
      deliveryStatus: 'FAILED',
      error: custError.message
    };
  }

  // =========================================================================
  // 2. INDEPENDENT DRIVER SMS DISPATCH
  // =========================================================================
  try {
    const maskedDriverPhone = maskPhoneNumber(driverPhone);
    console.log(`\nDriver SMS attempt started\nBooking: ${bookingCode}\nDriver ID: ${driver?.driverId || 'N/A'}\nRecipient: ${maskedDriverPhone}`);

    const drvExisting = await SmsLog.findOne({
      where: {
        bookingId,
        messageType: 'RIDE_ASSIGNED_TO_DRIVER',
        status: 'SENT'
      }
    });

    if (drvExisting) {
      console.log(`[SMS] Driver SMS already sent for booking ${bookingCode}. Skipping duplicate.`);
      result.driverSms = {
        sent: true,
        skipped: true,
        providerStatus: drvExisting.providerStatus || 'SUCCESS',
        providerMessageId: drvExisting.providerMessageId,
        deliveryStatus: (drvExisting.deliveryStatus as any) || 'DELIVERED'
      };
    } else {
      const phoneValidation = normalizePhoneNumberForSms(driverPhone);

      const driverMessage =
`EasyRide – New Ride Assigned

Dear ${driverName},

You have a new confirmed booking.

Booking ID: ${bookingCode}

Customer: ${customerName}
Phone: ${customerPhone}

Pickup:
${pickupPoint}

Drop:
${dropPoint}

Date:
${bookingDate}

Time:
${bookingTime}

Vehicle:
${vehicleName}

Vehicle No:
${vehicleNumber}

Please pick up the customer on time.

Call Customer:
${customerPhone}`;

      if (!phoneValidation.valid) {
        console.warn(`Driver SMS failed:\n${phoneValidation.error || 'Invalid driver phone number'}`);
        await SmsLog.create({
          bookingId,
          recipientType: 'DRIVER',
          recipientId: driver?.driverId || null,
          phoneNumber: driverPhone || 'UNKNOWN',
          messageType: 'RIDE_ASSIGNED_TO_DRIVER',
          messageBody: driverMessage,
          status: 'SKIPPED',
          providerStatus: 'FAILED',
          deliveryStatus: 'FAILED',
          errorMessage: phoneValidation.error || 'Invalid phone number format'
        });
        result.driverSms = {
          sent: false,
          providerStatus: 'FAILED',
          deliveryStatus: 'FAILED',
          error: phoneValidation.error
        };
      } else {
        // Send via registered 2Factor Driver Template
        const sendResult = await send2FactorTemplateSms({

          to: phoneValidation.normalizedPhone,
          templateName: 'Driver Assigning',
          vars: [
            driverName,
            customerName,
            customerPhone,
            `?l=${directionsCode}`
          ]
        });



        if (sendResult.success && sendResult.providerMessageId) {
          // Check live DLR status
          const dlr = await query2FactorDlrStatus(sendResult.providerMessageId);

          console.log(`Provider Message ID:\n${sendResult.providerMessageId}`);
          console.log(`Provider API Status:\nSUCCESS`);
          console.log(`Delivery Status:\n${dlr.deliveryStatus}`);

          await SmsLog.create({
            bookingId,
            recipientType: 'DRIVER',
            recipientId: driver?.driverId || null,
            phoneNumber: phoneValidation.normalizedPhone,
            messageType: 'RIDE_ASSIGNED_TO_DRIVER',
            messageBody: driverMessage,
            status: 'SENT',
            providerStatus: 'SUCCESS',
            deliveryStatus: dlr.deliveryStatus,
            providerMessageId: sendResult.providerMessageId,
            sentAt: new Date(),
            deliveredAt: dlr.deliveredAt || new Date()
          });

          result.driverSms = {
            sent: true,
            providerStatus: 'SUCCESS',
            providerMessageId: sendResult.providerMessageId,
            deliveryStatus: dlr.deliveryStatus
          };
        } else {
          console.warn(`Driver SMS failed:\n${sendResult.error || 'Provider rejected request'}`);
          await SmsLog.create({
            bookingId,
            recipientType: 'DRIVER',
            recipientId: driver?.driverId || null,
            phoneNumber: phoneValidation.normalizedPhone,
            messageType: 'RIDE_ASSIGNED_TO_DRIVER',
            messageBody: driverMessage,
            status: 'FAILED',
            providerStatus: 'FAILED',
            deliveryStatus: 'FAILED',
            errorMessage: sendResult.error || 'Provider rejected SMS delivery'
          });
          result.driverSms = {
            sent: false,
            providerStatus: 'FAILED',
            deliveryStatus: 'FAILED',
            error: sendResult.error
          };
        }
      }
    }
  } catch (drvError: any) {
    console.error(`Driver SMS failed:\n${drvError.message || drvError}`);
    result.driverSms = {
      sent: false,
      providerStatus: 'FAILED',
      deliveryStatus: 'FAILED',
      error: drvError.message
    };
  }

  // =========================================================================
  // 3. FINAL LOG SUMMARY REPORT
  // =========================================================================
  console.log(`\n================ SMS DELIVERY REPORT ================`);
  console.log(`Booking: ${bookingCode}\n`);
  console.log(`Customer:`);
  console.log(`API Status: ${result.customerSms.providerStatus || 'FAILED'}`);
  console.log(`Provider ID: ${result.customerSms.providerMessageId || 'N/A'}`);
  console.log(`Delivery Status: ${result.customerSms.deliveryStatus || 'FAILED'}\n`);

  console.log(`Driver:`);
  console.log(`API Status: ${result.driverSms.providerStatus || 'FAILED'}`);
  console.log(`Provider ID: ${result.driverSms.providerMessageId || 'N/A'}`);
  console.log(`Delivery Status: ${result.driverSms.deliveryStatus || 'FAILED'}`);
  console.log(`=====================================================\n`);

  return result;
}

/**
 * Test function to send a test SMS to a driver and check delivery status.
 */
export async function sendTestDriverSMS(driverId: string): Promise<{
  success: boolean;
  driverId: string;
  maskedPhone: string;
  providerMessageId?: string;
  providerStatus: string;
  deliveryStatus: string;
  error?: string;
}> {
  const driver = await Drivers.findOne({
    where: { driverId, isDeleted: false }
  });

  if (!driver) {
    console.warn(`Driver not found for ID: ${driverId}`);
    return {
      success: false,
      driverId,
      maskedPhone: 'UNKNOWN',
      providerStatus: 'FAILED',
      deliveryStatus: 'FAILED',
      error: 'Driver not found'
    };
  }

  const rawPhone = driver.phno || (driver as any).phone || (driver as any).mobile || '';
  const phoneValidation = normalizePhoneNumberForSms(rawPhone);
  const masked = maskPhoneNumber(rawPhone);

  console.log(`\nDriver SMS attempt started`);
  console.log(`Driver ID: ${driverId}`);
  console.log(`Recipient: ${masked}`);

  if (!phoneValidation.valid) {
    console.warn(`Driver SMS failed: ${phoneValidation.error}`);
    return {
      success: false,
      driverId,
      maskedPhone: masked,
      providerStatus: 'FAILED',
      deliveryStatus: 'FAILED',
      error: phoneValidation.error
    };
  }

  const testCustomerName = process.env.SMS_TEST_CUSTOMER_NAME || 'Customer';
  const testCustomerPhone = process.env.SMS_TEST_CUSTOMER_PHONE || '';
  const testCode = process.env.SMS_TEST_BOOKING_CODE || 'TEST';

  const sendResult = await send2FactorTemplateSms({
    to: phoneValidation.normalizedPhone,
    templateName: 'Driver Assigning',
    vars: [
      driver.driverName || 'Driver',
      testCustomerName,
      testCustomerPhone,
      `?l=${testCode}`
    ]
  });


  if (sendResult.success && sendResult.providerMessageId) {
    const dlr = await query2FactorDlrStatus(sendResult.providerMessageId);

    console.log(`Provider Message ID: ${sendResult.providerMessageId}`);
    console.log(`Provider API Status: SUCCESS`);
    console.log(`Delivery Status: ${dlr.deliveryStatus}`);

    return {
      success: true,
      driverId,
      maskedPhone: masked,
      providerMessageId: sendResult.providerMessageId,
      providerStatus: 'SUCCESS',
      deliveryStatus: dlr.deliveryStatus
    };
  } else {
    console.warn(`Driver SMS failed: ${sendResult.error}`);
    return {
      success: false,
      driverId,
      maskedPhone: masked,
      providerStatus: 'FAILED',
      deliveryStatus: 'FAILED',
      error: sendResult.error
    };
  }
}

// Preserve existing exported function for backward compatibility
export async function sendTransactionalSms(to: string, message: string) {
  return sendDirectSms(to, message);
}

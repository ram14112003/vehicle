import { createShortCode } from "./shortLinkStore";
import { maskPhoneNumber, normalizePhoneNumberForSms } from "../services/smsServices";

type BookingAny = any;

// Build Google Maps URL
function getDirectionsUrl(pickupArea: string, dropPoint: string): string {
  const origin = encodeURIComponent(pickupArea || "Pickup");
  const destination = encodeURIComponent(dropPoint || "Drop");
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving&dir_action=navigate`;
}

// Send SMS helper
async function sendSmsVia2Factor(url: string, tag: string) {
  try {
    const resp = await fetch(url);
    const text = await resp.text();
    return { ok: resp.ok, body: text };
  } catch (err: any) {
    return { ok: false, body: err.message };
  }
}

export async function sendSmsNotifications(options: {
  booking: BookingAny;
  user: any;
  driver: any;
  vehicle?: any;
  formattedBookingDate?: string;
  shouldSendSms: boolean;
}) {
  const { booking, user, driver, vehicle, formattedBookingDate } = options;

  const apiKey = process.env.TWO_FACTOR_API_KEY || process.env.TWOFACTOR_API_KEY;
  const senderId = process.env.TWO_FACTOR_SENDER_ID || process.env.TWOFACTOR_SENDER_ID || "EASYRD";
  if (!apiKey || !senderId) {
    console.warn("[SMS] Configuration missing. Skipping SMS notifications.");
    return { skipped: true };
  }

  // Create short Google Maps direction code safely
  const pickupLabel = booking?.pickupArea || booking?.pickupPoint || "Pickup";
  const dropLabel = booking?.dropPoint || booking?.dropLocation || "Drop";
  const longUrl = getDirectionsUrl(pickupLabel, dropLabel);

  let directionsCode = "";
  try {
    directionsCode = await createShortCode(longUrl, 8);
  } catch (codeErr) {
    directionsCode = "map";
  }

  const customerName = user?.username || booking?.riderName || booking?.behalfOfName || "Customer";
  const customerPhoneRaw = user?.mobile || booking?.riderPhone || booking?.behalfOfPhone || "";
  const driverPhoneRaw = driver?.phno || driver?.phone || driver?.mobile || "";
  const driverName = driver?.driverName || "Driver";

  const vehicleNumber =
    booking?.vehicle?.vehicleMaster?.vehicleNumber ??
    vehicle?.vehicleMaster?.vehicleNumber ??
    booking?.vehicleNumber ??
    vehicle?.vehicleNumber ??
    "Not provided";

  const vehicleName = vehicle?.vehicleName || booking?.preferredType || "Cab";

  const result = {
    customerSms: false,
    driverSms: false,
  };

  // ==========================================
  // 1. INDEPENDENT DRIVER SMS
  // ==========================================
  try {
    const driverPhoneNorm = normalizePhoneNumberForSms(driverPhoneRaw);
    if (driverPhoneNorm.valid) {
      console.log(`\nDriver SMS attempt started\nBooking: ${booking?.bookingCode || booking?.bookingId}\nDriver ID: ${driver?.driverId || 'N/A'}\nRecipient: ${maskPhoneNumber(driverPhoneRaw)}`);

      const guestOrUserName = booking?.behalfOfName || customerName;
      const guestOrUserPhone = booking?.behalfOfPhone || customerPhoneRaw;
      const bookingCode = booking?.bookingCode || booking?.bookingId || '';

      const url =
        `https://2factor.in/API/R1/?module=TRANS_SMS` +
        `&apikey=${apiKey}` +
        `&to=${driverPhoneNorm.normalizedPhone}` +
        `&from=${senderId}` +
        `&templatename=Driver%20Assigning` +
        `&var1=${encodeURIComponent(driverName)}` +
        `&var2=${encodeURIComponent(`${guestOrUserName} (Booking: ${bookingCode})`)}` +
        `&var3=${encodeURIComponent(guestOrUserPhone)}` +
        `&var4=${encodeURIComponent(`Pickup: ${pickupLabel} | Drop: ${dropLabel} | Date: ${formattedBookingDate || ''} | Vehicle: ${vehicleName} (${vehicleNumber})`)}`;


      const r = await sendSmsVia2Factor(url, "driver");
      if (r.ok) {
        console.log("Driver SMS sent successfully\nStatus: Success");
        result.driverSms = true;
      } else {
        console.warn(`Driver SMS failed:\n${r.body || 'Provider rejected request'}`);
      }
    } else {
      console.warn(`Driver SMS failed:\n${driverPhoneNorm.error || 'Invalid driver phone'}`);
    }
  } catch (driverSmsErr: any) {
    console.error(`Driver SMS failed:\n${driverSmsErr.message || driverSmsErr}`);
  }

  // ==========================================
  // 2. INDEPENDENT USER / CUSTOMER SMS
  // ==========================================
  try {
    const customerPhoneNorm = normalizePhoneNumberForSms(customerPhoneRaw);
    if (customerPhoneNorm.valid) {
      console.log(`\nCustomer SMS attempt started\nBooking: ${booking?.bookingCode || booking?.bookingId}\nRecipient: ${maskPhoneNumber(customerPhoneRaw)}`);

      const companySupportPhone = process.env.SUPPORT_PHONE || process.env.COMPANY_PHONE || "";

      let url = "";
      if (booking?.behalfOfPhone) {
        url =
          `https://2factor.in/API/R1/?module=TRANS_SMS` +
          `&apikey=${apiKey}` +
          `&to=${customerPhoneNorm.normalizedPhone}` +
          `&from=${senderId}` +
          `&templatename=BookingConfirmGuest` +
          `&var1=${encodeURIComponent(booking.behalfOfName || customerName)}` +
          `&var2=${encodeURIComponent(driverName)}` +
          `&var3=${encodeURIComponent(driverPhoneRaw)}` +
          `&var4=${encodeURIComponent(vehicleName || "Standard")}` +
          `&var5=${encodeURIComponent(vehicleNumber || "Not Added")}` +
          `&var6=${encodeURIComponent(formattedBookingDate || "")}` +
          `&var7=${encodeURIComponent("EasyRide")}` +
          `&var8=${encodeURIComponent(companySupportPhone)}`;
      } else {
        url =
          `https://2factor.in/API/R1/?module=TRANS_SMS` +
          `&apikey=${apiKey}` +
          `&to=${customerPhoneNorm.normalizedPhone}` +
          `&from=${senderId}` +
          `&templatename=Booking%20Confimation%20Message` +
          `&var1=${encodeURIComponent(customerName)}` +
          `&var2=${encodeURIComponent(booking?.bookingCode || "")}` +
          `&var3=${encodeURIComponent('?l=' + directionsCode)}` +
          `&var4=${encodeURIComponent(formattedBookingDate || "")}` +
          `&var5=${encodeURIComponent(driverName)}` +
          `&var6=${encodeURIComponent(driverPhoneRaw)}` +
          `&var7=${encodeURIComponent(vehicleName || "Standard")}` +
          `&var8=${encodeURIComponent(vehicleNumber || "Not Added")}` +
          `&var9=${encodeURIComponent("EasyRide")}` +
          `&var10=${encodeURIComponent(companySupportPhone)}`;
      }



      const r = await sendSmsVia2Factor(url, "user");
      if (r.ok) {
        console.log("Customer SMS sent successfully\nStatus: Success");
        result.customerSms = true;
      } else {
        console.warn(`Customer SMS failed:\n${r.body || 'Provider rejected request'}`);
      }
    } else {
      console.warn(`Customer SMS failed:\n${customerPhoneNorm.error || 'Invalid customer phone'}`);
    }
  } catch (userSmsErr: any) {
    console.error(`Customer SMS failed:\n${userSmsErr.message || userSmsErr}`);
  }

  console.log(`\n================ SMS DELIVERY REPORT ================`);
  console.log(`Booking: ${booking?.bookingCode || booking?.bookingId}`);
  console.log(`Customer SMS: ${result.customerSms ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Driver SMS: ${result.driverSms ? 'SUCCESS' : 'FAILED'}`);
  console.log(`=====================================================\n`);

  return { skipped: false, ...result };
}

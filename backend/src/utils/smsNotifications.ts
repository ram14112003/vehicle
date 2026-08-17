import { createShortCode } from "./shortLinkStore";

type BookingAny = any;

// Build Google Maps URL
function getDirectionsUrl(pickupArea: string, dropPoint: string): string {
  const origin = encodeURIComponent(pickupArea || "Pickup");
  const destination = encodeURIComponent(dropPoint || "Drop");
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving&dir_action=navigate`;
}

// Send SMS helper
async function sendSmsVia2Factor(url: string, tag: string) {
  console.log(`[SMS][${tag}] → ${url}`);
  const resp = await fetch(url);
  const text = await resp.text();
  return { ok: resp.ok, body: text };
}

export async function sendSmsNotifications(options: {
  booking: BookingAny;
  user: any;
  driver: any;
  vehicle?: any;
  formattedBookingDate?: string;
  shouldSendSms: boolean;
}) {
  const { booking, user, driver, vehicle, formattedBookingDate, shouldSendSms } = options;

//  if (!shouldSendSms) return { skipped: true };

  const apiKey = process.env.TWO_FACTOR_API_KEY;
  const senderId = process.env.TWO_FACTOR_SENDER_ID;
  if (!apiKey || !senderId) throw new Error("SMS API configuration missing");

  // Create short Google Maps direction code
  const pickupLabel = booking?.pickupArea || booking?.pickupPoint || "Pickup";
  const dropLabel = booking?.dropPoint || booking?.dropLocation || "Drop";
  const longUrl = getDirectionsUrl(pickupLabel, dropLabel);

  const directionsCode = await createShortCode(longUrl, 8);
  console.log("Short code:", directionsCode);
  console.log("hello guest ",booking.behalfOfName, booking.behalfOfPhone);
  // ---------------- DRIVER SMS ----------------
  if (driver?.phno && booking.behalfOfPhone) {
    const url = 
      `https://2factor.in/API/R1/?module=TRANS_SMS` +
      `&apikey=${apiKey}` +
      `&to=${driver.phno}` +
      `&from=${senderId}` +
      `&templatename=Driver%20Assigning` +
      `&var1=${encodeURIComponent(driver.driverName || "")}` +
      `&var2=${encodeURIComponent(booking.behalfOfName || "")}` +
      `&var3=${encodeURIComponent(booking.behalfOfPhone || "")}` +
      `&var4=${encodeURIComponent('?l='+directionsCode)}`;

    const r = await sendSmsVia2Factor(url, "driver");
    if (!r.ok) throw new Error("Driver SMS failed");
  }
  else if (driver?.phno) {
    const url = 
      `https://2factor.in/API/R1/?module=TRANS_SMS` +
      `&apikey=${apiKey}` +
      `&to=${driver.phno}` +
      `&from=${senderId}` +
      `&templatename=Driver%20Assigning` +
      `&var1=${encodeURIComponent(driver.driverName || "")}` +
      `&var2=${encodeURIComponent(user.username || "")}` +
      `&var3=${encodeURIComponent(user.mobile || "")}` +
      `&var4=${encodeURIComponent('?l='+directionsCode)}`;

    const r = await sendSmsVia2Factor(url, "driver");
    if (!r.ok) throw new Error("Driver SMS failed");
  }

  // ---------------- USER SMS ----------------
  if (user?.mobile) {
    // const vehicleNumber =
    //   booking?.vehicle?.VehicleMaster?.vehicleNumber ||
    //   booking?.vehicleNumber ||
    //   "Not provided";
    const vehicleNumber =
  booking?.vehicle?.vehicleMaster?.vehicleNumber ??
  vehicle?.vehicleMaster?.vehicleNumber ??
  booking?.vehicleNumber ??
  vehicle?.vehicleNumber ??
  "Not provided";

    const url =
      `https://2factor.in/API/R1/?module=TRANS_SMS` +
      `&apikey=${apiKey}` +
      `&to=${user.mobile}` +
      `&from=${senderId}` +
      `&templatename=Booking%20Confimation%20Message` +
      `&var1=${encodeURIComponent(user.username || "")}` +
      `&var2=${encodeURIComponent(booking.bookingCode || "")}` +
      `&var3=${encodeURIComponent('?l='+directionsCode)}` +
      `&var4=${encodeURIComponent(formattedBookingDate || "")}` +
      `&var5=${encodeURIComponent(driver?.driverName || "")}` +
      `&var6=${encodeURIComponent(driver?.phno || "")}` +
      `&var7=${encodeURIComponent(vehicle?.vehicleName || "")}` +
      `&var8=${encodeURIComponent(vehicleNumber)}` +
      `&var9=${encodeURIComponent("Grace Cabs")}` +
      `&var10=${encodeURIComponent("9003241571")}`;

    const r = await sendSmsVia2Factor(url, "user");
    if (!r.ok) throw new Error("User SMS failed");
  }

    if (booking.behalfOfPhone) {
      console.log("in f ",booking.behalfOfPhone);
    // const vehicleNumber =
    //   booking?.vehicle?.VehicleMaster?.vehicleNumber ||
    //   booking?.vehicleNumber ||
    //   "Not provided";
    const vehicleNumber =
  booking?.vehicle?.vehicleMaster?.vehicleNumber ??
  vehicle?.vehicleMaster?.vehicleNumber ??
  booking?.vehicleNumber ??
  vehicle?.vehicleNumber ??
  "Not provided";

    const url =
      `https://2factor.in/API/R1/?module=TRANS_SMS` +
      `&apikey=${apiKey}` +
      `&to=${booking.behalfOfPhone}` +
      `&from=${senderId}` +
      `&templatename=BookingConfirmGuest` +
      `&var1=${encodeURIComponent(booking.behalfOfName || "")}` +
      `&var2=${encodeURIComponent(driver?.driverName || "")}` +
      `&var3=${encodeURIComponent(driver?.phno || "")}` +
      `&var4=${encodeURIComponent(vehicle?.vehicleName || "")}` +
      `&var5=${encodeURIComponent(vehicleNumber)}` +
      `&var6=${encodeURIComponent(formattedBookingDate || "")}` +
      `&var7=${encodeURIComponent("Grace Cabs")}` +
      `&var8=${encodeURIComponent("9003241571")}`;

    const r = await sendSmsVia2Factor(url, "user");
    if (!r.ok) throw new Error("User SMS failed");
  }

  return { skipped: false };
}

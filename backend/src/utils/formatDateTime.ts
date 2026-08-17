import { isDataType } from "sequelize-typescript";

// 🔹 Format datetime
export const formatDateTime = (d: Date) => {
    const istDate = new Date(
    d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const dd = String(istDate.getDate()).padStart(2, "0");
      const mmm = months[istDate.getMonth()];
      const yyyy = istDate.getFullYear();

      let hh = istDate.getHours();
      const mi = String(istDate.getMinutes()).padStart(2, "0");
      const ampm = hh >= 12 ? "PM" : "AM";
      hh = hh % 12;
      hh = hh ? hh : 12; // 0 → 12

      return `${dd}-${mmm}-${yyyy} ${String(hh).padStart(2, "0")}:${mi} ${ampm}`;
    };

    // utils/dateFormatter.js
// utils/formatDateTime.ts
export function formatToIST(date: Date | undefined, timeString?: string): string {
  if (!date) return "";

  // Convert the Date to ISO (UTC) so we can safely compose with IST time
  const iso = date.toISOString(); // e.g. "2025-10-07T11:00:00.000Z"

  // If a time is provided, use the date part + that time as IST (+05:30).
  // Otherwise, just render the given moment in IST.
  const combined = timeString
    ? `${iso.split("T")[0]}T${timeString}+05:30`
    : `${iso}+05:30`;

  const d = new Date(combined);

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  };

  return d.toLocaleString("en-IN", options);
}


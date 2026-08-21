import { VehicleType } from "../models/vehicleType";
import { Vehicle } from "../models/vehicle";
import { Booking } from "../models/booking";
import { calculateRouteDistance } from "../utils/distanceCalculator";

export const seedInitialVehicles = async () => {
  try {
    const standardFleet = [
      {
        vehicleType: "Sedan Prime",
        seatCapacity: 4,
        priorMinutes: 30,
        AdvanceBookingHours: "1",
        bookingType: "regular",
        baseFare: 250,
        perKmRate: 14,
        vehicleImg: ["/images/step2.jpeg"],
        vehicles: [
          {
            vehicleName: "Swift Dzire / Toyota Etios",
            manufacturing: "2024",
            vehicleImg: ["/images/step2.jpeg"],
            availableStatus: "available"
          }
        ]
      },
      {
        vehicleType: "SUV / Innova",
        seatCapacity: 6,
        priorMinutes: 45,
        AdvanceBookingHours: "2",
        bookingType: "regular",
        baseFare: 450,
        perKmRate: 19,
        vehicleImg: ["/images/step3.jpeg"],
        vehicles: [
          {
            vehicleName: "Toyota Innova Crysta / Ertiga",
            manufacturing: "2024",
            vehicleImg: ["/images/step3.jpeg"],
            availableStatus: "available"
          }
        ]
      },
      {
        vehicleType: "Mini / Hatchback",
        seatCapacity: 4,
        priorMinutes: 20,
        AdvanceBookingHours: "1",
        bookingType: "regular",
        baseFare: 180,
        perKmRate: 12,
        vehicleImg: ["/images/step1.jpeg"],
        vehicles: [
          {
            vehicleName: "Maruti Suzuki WagonR / Swift",
            manufacturing: "2024",
            vehicleImg: ["/images/step1.jpeg"],
            availableStatus: "available"
          }
        ]
      },
      {
        vehicleType: "Executive Luxury",
        seatCapacity: 4,
        priorMinutes: 60,
        AdvanceBookingHours: "3",
        bookingType: "regular",
        baseFare: 800,
        perKmRate: 28,
        vehicleImg: ["/images/GRACELOGO.jpg"],
        vehicles: [
          {
            vehicleName: "Toyota Camry / Mercedes C-Class",
            manufacturing: "2024",
            vehicleImg: ["/images/GRACELOGO.jpg"],
            availableStatus: "available"
          }
        ]
      },
      {
        vehicleType: "Tempo Traveller",
        seatCapacity: 12,
        priorMinutes: 60,
        AdvanceBookingHours: "4",
        bookingType: "regular",
        baseFare: 1200,
        perKmRate: 24,
        vehicleImg: ["/images/step3.jpeg"],
        vehicles: [
          {
            vehicleName: "Force Tempo Traveller 12-16 Seater",
            manufacturing: "2024",
            vehicleImg: ["/images/step3.jpeg"],
            availableStatus: "available"
          }
        ]
      }
    ];

    // 1. Ensure standard fleet types exist and have proper baseFare & perKmRate
    for (const typeData of standardFleet) {
      let vType = await VehicleType.findOne({
        where: { vehicleType: typeData.vehicleType }
      });

      if (!vType) {
        vType = await VehicleType.create({
          vehicleType: typeData.vehicleType,
          seatCapacity: typeData.seatCapacity,
          priorMinutes: typeData.priorMinutes,
          AdvanceBookingHours: typeData.AdvanceBookingHours,
          bookingType: typeData.bookingType,
          baseFare: typeData.baseFare,
          perKmRate: typeData.perKmRate,
          vehicleImg: typeData.vehicleImg,
          isDeleted: false
        });

        for (const veh of typeData.vehicles) {
          await Vehicle.create({
            vehicleName: veh.vehicleName,
            vehicleTypeId: vType.vehicleTypeId,
            manufacturing: veh.manufacturing,
            vehicleImg: veh.vehicleImg,
            availableStatus: veh.availableStatus,
            isDeleted: false
          });
        }
      } else {
        // Update existing record if pricing was missing
        if (!vType.baseFare || vType.baseFare <= 0 || !vType.perKmRate || vType.perKmRate <= 0) {
          await vType.update({
            baseFare: typeData.baseFare,
            perKmRate: typeData.perKmRate,
            isDeleted: false
          });
        }
      }
    }

    // 2. Repair any legacy vehicleType records with 0 pricing
    const allTypes = await VehicleType.findAll({ where: { isDeleted: false } });
    for (const vt of allTypes) {
      const name = (vt.vehicleType || "").toLowerCase();
      let defaultBase = 250;
      let defaultPerKm = 14;

      if (name.includes("suv") || name.includes("innova") || name.includes("mahintra") || vt.seatCapacity >= 6) {
        defaultBase = 450;
        defaultPerKm = 19;
      } else if (name.includes("hatch") || name.includes("mini") || name.includes("areo")) {
        defaultBase = 180;
        defaultPerKm = 12;
      } else if (name.includes("luxury") || name.includes("sports")) {
        defaultBase = 800;
        defaultPerKm = 28;
      } else if (name.includes("tempo") || name.includes("truck") || vt.seatCapacity >= 10) {
        defaultBase = 1200;
        defaultPerKm = 24;
      }

      if (!vt.baseFare || vt.baseFare <= 0 || !vt.perKmRate || vt.perKmRate <= 0) {
        await vt.update({
          baseFare: defaultBase,
          perKmRate: defaultPerKm
        });
      }
    }

    // 3. Backfill existing bookings with 0 distanceKm or 0 finalFare
    const zeroBookings = await Booking.findAll();
    for (const bk of zeroBookings) {
      let needsUpdate = false;
      let dist = bk.distanceKm;
      let fare = bk.finalFare;

      if (!dist || dist <= 0) {
        const route = await calculateRouteDistance(bk.pickupPoint || "Chennai", bk.dropPoint || "Tamil Nadu");
        dist = route.distanceKm;
        needsUpdate = true;
      }

      if (!fare || fare <= 0) {
        const pref = (bk.preferredType || "").toLowerCase();
        let baseRate = bk.baseFare || 250;
        let kmRate = bk.perKmRate || 14;

        if (baseRate <= 0 || kmRate <= 0) {
          if (pref.includes("suv") || pref.includes("innova") || pref.includes("mahintra")) {
            baseRate = 450;
            kmRate = 19;
          } else if (pref.includes("hatch") || pref.includes("mini") || pref.includes("areo")) {
            baseRate = 180;
            kmRate = 12;
          } else if (pref.includes("luxury")) {
            baseRate = 800;
            kmRate = 28;
          } else {
            baseRate = 250;
            kmRate = 14;
          }
        }

        const multiplier = bk.roundTrip === "Yes" || bk.roundTrip === "roundtrip" ? 1.8 : 1.0;
        fare = Math.round(baseRate + (dist * kmRate * multiplier));
        needsUpdate = true;
      }

      if (needsUpdate) {
        await bk.update({
          distanceKm: dist,
          finalFare: fare,
          baseFare: bk.baseFare > 0 ? bk.baseFare : 250,
          perKmRate: bk.perKmRate > 0 ? bk.perKmRate : 14
        });
      }
    }

    console.log("Grace Cabs fleet seeded & historical bookings successfully repaired!");
  } catch (error) {
    console.error("Error seeding & repairing initial vehicle fleet:", error);
  }
};

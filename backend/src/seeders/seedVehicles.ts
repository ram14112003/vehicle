import { VehicleType } from "../models/vehicleType";
import { Vehicle } from "../models/vehicle";

export const seedInitialVehicles = async () => {
  try {
    const count = await VehicleType.count({ where: { isDeleted: false } });
    if (count > 0) {
      return;
    }

    console.log("Seeding initial Grace Cabs fleet into database...");

    const initialTypes = [
      {
        vehicleType: "Sedan Prime",
        seatCapacity: 4,
        priorMinutes: 30,
        AdvanceBookingHours: "1",
        bookingType: "regular",
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

    for (const typeData of initialTypes) {
      const vType = await VehicleType.create({
        vehicleType: typeData.vehicleType,
        seatCapacity: typeData.seatCapacity,
        priorMinutes: typeData.priorMinutes,
        AdvanceBookingHours: typeData.AdvanceBookingHours,
        bookingType: typeData.bookingType,
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
    }

    console.log("Grace Cabs fleet seeded successfully into database!");
  } catch (error) {
    console.error("Error seeding initial vehicle fleet:", error);
  }
};

import { Request, Response } from 'express';
import { Op } from 'sequelize';

import { Pickuparea } from '../models/pickuparea';
import { Pickupcity } from '../models/pickupcity';
import { Company } from '../models/company';
import { Tax } from '../models/tax';
import { PaymentMode } from '../models/paymentmode';
import { Vendor } from '../models/vendor';
import { Drivers } from '../models/drivers';
import { VehicleType } from '../models/vehicleType';
import { Vehicle } from '../models/vehicle';
import { VehicleMaster } from '../models/vehicleMaster';
import { Booking } from '../models/booking';
import { User } from '../models/user';
import { Invoice } from '../models/invoice';

export const globalSearch = async (req: Request, res: Response) => {
  try {
    const { model, keyword, isDeleted } = req.query;

    if (!model || !keyword) {
      return res.status(400).json({ message: 'Model and keyword are required' });
    }

    const isDeletedFilter = isDeleted === '1' ? true : isDeleted === '0' ? false : undefined;

    let result;

    // Helper to build where condition with optional isDeleted
    const buildWhere = (conditions: any[]) => ({
      [Op.and]: [
        { [Op.or]: conditions },
        ...(isDeletedFilter !== undefined ? [{ isDeleted: isDeletedFilter }] : []),
      ],
    });

    switch (model) {
     
     case 'pickuparea': {
  const isDeletedFilter = req.query.isDeleted === '1';
  result = await Pickuparea.findAll({
    where: {
      isDeleted: isDeletedFilter,
      [Op.or]: [
        { pickupArea: { [Op.like]: `%${keyword}%` } },
        { pickupCity: { [Op.like]: `%${keyword}%` } },
      ],
    },
  });
  break;
}

case 'pickupcity': {
  const isDeletedFilter = req.query.isDeleted === '1';
  result = await Pickupcity.findAll({
    where: {
      isDeleted: isDeletedFilter,
      [Op.or]: [
        { pickupCity: { [Op.like]: `%${keyword}%` } },
        { country: { [Op.like]: `%${keyword}%` } },
        { state: { [Op.like]: `%${keyword}%` } },
        { sortOrder: { [Op.like]: `%${keyword}%` } },
        { isPickupCity: { [Op.like]: `%${keyword}%` } },
      ],
    },
  });
  break;
}

case 'company': {
  const isDeletedFilter = req.query.isDeleted === '1';
  result = await Company.findAll({
    where: {
      isDeleted: isDeletedFilter,
      [Op.or]: [
        { companyName: { [Op.like]: `%${keyword}%` } },
        { companyPhno: { [Op.like]: `%${keyword}%` } },
        { domainName: { [Op.like]: `%${keyword}%` } },
        { seoUrl: { [Op.like]: `%${keyword}%` } },
        { managerEmail: { [Op.like]: `%${keyword}%` } },
        { allowTax: { [Op.like]: `%${keyword}%` } },
      ],
    },
  });
  break;
}
case 'tax': {
  result = await Tax.findAll({
    where: {
      [Op.or]: [
        { taxName: { [Op.like]: `%${keyword}%`} },
        { taxPercent: { [Op.like]: `%${keyword}%` } },
      ],
    },
  });
  break;
}
case 'paymentmode': {
  result = await PaymentMode.findAll({
    where: {
      [Op.or]: [
        { modelname: { [Op.like]: `%${keyword}%` } },
        { isOnline: { [Op.like]: `%${keyword}%` } },
        { isActive: { [Op.like]: `%${keyword}%` } },
        { sortorder: { [Op.like]: `%${keyword}%` } }
      ]
    }
  });
  break;
}

case 'vendor': {
  const isDeletedFilter = req.query.isDeleted === '1';
  result = await Vendor.findAll({
    where: {
      isDeleted: isDeletedFilter,
      [Op.or]: [
        { vendorName: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
        { phno: { [Op.like]: `%${keyword}%` } },
        { address: { [Op.like]: `%${keyword}%` } },
        { country: { [Op.like]: `%${keyword}%` } },
        { state: { [Op.like]: `%${keyword}%` } },
        { city: { [Op.like]: `%${keyword}%` } },
      ],
    },
  });
  break;
}

case 'drivers': {
  const isDeletedFilter = req.query.isDeleted === '1';
  result = await Drivers.findAll({
    where: {
      isDeleted: isDeletedFilter,
      [Op.or]: [
        { driverName: { [Op.like]: `%${keyword}%` } },
        { driverEmail: { [Op.like]: `%${keyword}%` } },
        { phno: { [Op.like]: `%${keyword}%` } },
        { address: { [Op.like]: `%${keyword}%` } },
        { city: { [Op.like]: `%${keyword}%` } },
        { state: { [Op.like]: `%${keyword}%` } },
        { country: { [Op.like]: `%${keyword}%` } },
        { licenseNo: { [Op.like]: `%${keyword}%` } },
      ],
    },
  });
  break;
}




  
      case 'vehicleType': {
        const isDeletedFilter = req.query.isDeleted === '1'; // true if trashed mode

        result = await VehicleType.findAll({
          where: {
            isDeleted: isDeletedFilter, // filter active/trash
            [Op.or]: [
              { vehicleType: { [Op.like]: `%${keyword}%` } },
              { AdvanceBookingHours: { [Op.like]: `%${keyword}%` } },
            ],
          },
        });

        break;
      }
      case 'vehicle':
  const isDeletedFilter = req.query.isDeleted === '1';

  result = await Vehicle.findAll({
    where: {
      isDeleted: isDeletedFilter,
      [Op.or]: [
        { vehicleName: { [Op.like]: `%${keyword}%` } },
        { availableStatus: { [Op.like]: `%${keyword}%` } },
        { vehicleImg: { [Op.like]: `%${keyword}%` } },
        { localPerHour: { [Op.like]: `%${keyword}%` } },
        { localPerKm: { [Op.like]: `%${keyword}%` } },
        { OutstationPerKm: { [Op.like]: `%${keyword}%` } },
        { OSDriverBata: { [Op.like]: `%${keyword}%` } },
      ],
    },
    include: [
      {
        model: VehicleType,
        where: {
          vehicleType: { [Op.like]: `%${keyword}%` }
        },
        required: false, // still return results even if vehicleType doesn't match
        attributes: ['vehicleTypeId', 'vehicleType']
      }
    ]
  });
  break;
case 'vehiclemaster': 
  const isDeletedMasterFilter = req.query.isDeleted === '1';
  result = await VehicleMaster.findAll({
    where: {
      isDeleted: isDeletedMasterFilter ? 1 : 0,
      [Op.or]: [
        { vehicleNumber: { [Op.like]: `%${keyword}%` } },
        { vehicleModelName: { [Op.like]: `%${keyword}%` } },    // Changed from vehicleModel
        { vehicleType: { [Op.like]: `%${keyword}%` } },         // Added vehicleType search
        { vendorName: { [Op.like]: `%${keyword}%` } },           // Changed from owner
        // Remove ownerId search or replace with actual owner ID if needed
        // { ownerId: { [Op.like]: %${keyword}% } },
      ],
    },
  });
  break;


case 'booking': {
  result = await Booking.findAll({
    where: {
      [Op.or]: [
        { bookingId: { [Op.like]: `%${keyword}%` } },
        { bookingDate: { [Op.like]: `%${keyword}%` } },
        { bookingTime: { [Op.like]: `%${keyword}%` } },
        { signature: { [Op.like]: `%${keyword}%` } },
        { bookingCode: { [Op.like]: `%${keyword}%` } },
        { pickupPoint: { [Op.like]: `%${keyword}%` } },
        { dropPoint: { [Op.like]: `%${keyword}%` } },
        { remarks: { [Op.like]: `%${keyword}%` } },
        { purpose: { [Op.like]: `%${keyword}%` } },
        { confirmStatus: { [Op.like]: `%${keyword}%` } },
        { bookingStatus: { [Op.like]: `%${keyword}%` } },

        // 🔹 User & Company
        { '$user.username$': { [Op.like]: `%${keyword}%` } },
        { '$user.email$': { [Op.like]: `%${keyword}%` } },
        { '$user.company.companyName$': { [Op.like]: `%${keyword}%` } },

        // 🔹 Invoice Number Search
        { '$invoice.invoiceNumber$': { [Op.like]: `%${keyword}%` } },
      ],
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['username', 'email'],
        include: [
          { model: Company, as: 'company', attributes: ['companyName'] }
        ]
      },
      {
        model: Invoice,
        as: 'invoice',
        attributes: ['invoiceId', 'invoiceNumber', 'invoiceAmount'],
      },
    ],
  });
  break;
}


case 'user': {
  const isDeletedFilter = req.query.isDeleted === '1';
  result = await User.findAll({
    where: {
      isDeleted: isDeletedFilter,
      [Op.or]: [
        { username: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
        { mobile: { [Op.like]: `%${keyword}%` } },
        { country: { [Op.like]: `%${keyword}%` } },
        { city: { [Op.like]: `%${keyword}%` } },
        { status: { [Op.like]: `%${keyword}%` } },
        { role: { [Op.like]: `%${keyword}%` } },
      ],
    },
  });
  break;
}

case 'invoice': {
  const isDeletedFilter = req.query.isDeleted === '1';
  result = await Invoice.findAll({
    where: {
      isDeleted: isDeletedFilter,
      [Op.or]: [
        { invoiceNumber: { [Op.like]: `%${keyword}%` } },
        { invoiceAmount: { [Op.like]: `%${keyword}%` } },
        { invoiceStatus: { [Op.like]: `%${keyword}%` } },
        { userId: { [Op.like]: `%${keyword}%` } },
        { vehicleId: { [Op.like]: `%${keyword}%` } },
        { bookingId: { [Op.like]: `%${keyword}%` } },
        { companyId: { [Op.like]: `%${keyword}%` } },
        { vendorId: { [Op.like]: `%${keyword}%` } },
        { paymentId: { [Op.like]: `%${keyword}%` } },
      ],
    },
  });
  break;
}
      default:
        return res.status(400).json({ message: 'Invalid model specified' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Global Search Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};



import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { Booking } from '../models/booking';
import { User } from '../models/user';
import { Drivers } from '../models/drivers';
import { Vehicle } from '../models/vehicle';
import { VehicleType } from '../models/vehicleType';
import { VehicleMaster } from '../models/vehicleMaster';
import { Payment } from '../models/payment';

/**
 * Builds where clause for dates and filters.
 */
function buildDateWhereClause(query: any) {
  const { datePreset, startDate, endDate, bookingStatus, paymentStatus, driverId, vehicleId, userId, search } = query;
  const where: any = {};

  // Date range filtering
  const now = dayjs();
  let start: Date | null = null;
  let end: Date | null = null;

  if (datePreset === 'today') {
    start = now.startOf('day').toDate();
    end = now.endOf('day').toDate();
  } else if (datePreset === 'yesterday') {
    start = now.subtract(1, 'day').startOf('day').toDate();
    end = now.subtract(1, 'day').endOf('day').toDate();
  } else if (datePreset === 'this_week') {
    start = now.startOf('week').toDate();
    end = now.endOf('day').toDate();
  } else if (datePreset === 'this_month') {
    start = now.startOf('month').toDate();
    end = now.endOf('day').toDate();
  } else if (startDate && endDate) {
    start = dayjs(startDate).startOf('day').toDate();
    end = dayjs(endDate).endOf('day').toDate();
  } else if (startDate) {
    start = dayjs(startDate).startOf('day').toDate();
    end = now.endOf('day').toDate();
  }

  if (start && end) {
    where.createdAt = {
      [Op.between]: [start, end]
    };
  }

  // Booking Status filter
  if (bookingStatus && bookingStatus !== 'ALL') {
    where.bookingStatus = bookingStatus;
  }

  // Payment Status filter
  if (paymentStatus && paymentStatus !== 'ALL') {
    where.paymentStatus = paymentStatus;
  }

  // Driver filter
  if (driverId && driverId !== 'ALL') {
    where.driverId = driverId;
  }

  // Vehicle filter
  if (vehicleId && vehicleId !== 'ALL') {
    where.vehicleId = vehicleId;
  }

  // User filter
  if (userId && userId !== 'ALL') {
    where.userId = userId;
  }

  // Search filter
  if (search && typeof search === 'string' && search.trim()) {
    const s = `%${search.trim()}%`;
    where[Op.or] = [
      { bookingCode: { [Op.like]: s } },
      { pickupPoint: { [Op.like]: s } },
      { dropPoint: { [Op.like]: s } },
      { pickupArea: { [Op.like]: s } },
      { dropLocation: { [Op.like]: s } },
      { behalfOfName: { [Op.like]: s } },
      { behalfOfPhone: { [Op.like]: s } },
      { riderName: { [Op.like]: s } },
      { riderPhone: { [Op.like]: s } }
    ];
  }

  return where;
}

/**
 * Preload VehicleMaster lookup maps to dynamically resolve registration numbers
 */
async function getVehicleMasterLookupMaps() {
  const masters = await VehicleMaster.findAll({ where: { isDeleted: 0 } });
  const byMasterId = new Map<string, string>();
  const byVehicleId = new Map<string, string>();
  const byTypeId = new Map<string, string>();
  const byName = new Map<string, string>();

  for (const m of masters) {
    const num = (m.vehicleNumber || '').trim();
    if (!num) continue;
    if (m.vehicleMasterId) byMasterId.set(m.vehicleMasterId, num);
    if (m.vehicleId) byVehicleId.set(m.vehicleId, num);
    if (m.vehicleTypeId) byTypeId.set(m.vehicleTypeId, num);
    if (m.vehicleModelName) byName.set(m.vehicleModelName.trim().toLowerCase(), num);
    if (m.vehicleType) byName.set(m.vehicleType.trim().toLowerCase(), num);
  }

  return { byMasterId, byVehicleId, byTypeId, byName };
}

/**
 * Resolve dynamic vehicle registration number with full database fallbacks
 */
function resolveVehicleNumberFromLookup(
  b: any,
  lookup: {
    byMasterId: Map<string, string>;
    byVehicleId: Map<string, string>;
    byTypeId: Map<string, string>;
    byName: Map<string, string>;
  }
): string {
  if (b.vehicleMaster?.vehicleNumber && b.vehicleMaster.vehicleNumber.trim() && b.vehicleMaster.vehicleNumber !== 'N/A') {
    return b.vehicleMaster.vehicleNumber.trim();
  }
  if (b.vehicle?.vehicleMaster?.vehicleNumber && b.vehicle.vehicleMaster.vehicleNumber.trim() && b.vehicle.vehicleMaster.vehicleNumber !== 'N/A') {
    return b.vehicle.vehicleMaster.vehicleNumber.trim();
  }
  if (b.vehicleMasterId && lookup.byMasterId.has(b.vehicleMasterId)) {
    return lookup.byMasterId.get(b.vehicleMasterId)!;
  }
  if (b.vehicleId && lookup.byVehicleId.has(b.vehicleId)) {
    return lookup.byVehicleId.get(b.vehicleId)!;
  }
  const typeId = b.vehicleTypeId || b.vehicle?.vehicleTypeId;
  if (typeId && lookup.byTypeId.has(typeId)) {
    return lookup.byTypeId.get(typeId)!;
  }
  const nameKey = (b.vehicle?.vehicleName || b.preferredType || '').trim().toLowerCase();
  if (nameKey && lookup.byName.has(nameKey)) {
    return lookup.byName.get(nameKey)!;
  }
  if ((b as any).vehicleNumber && typeof (b as any).vehicleNumber === 'string' && (b as any).vehicleNumber.trim() && (b as any).vehicleNumber !== 'N/A') {
    return (b as any).vehicleNumber.trim();
  }
  return 'Not Added';
}

/**
 * 1. Overall Financial & Operational Summary
 */
export async function getReportSummary(req: Request, res: Response) {
  try {
    const where = buildDateWhereClause(req.query);

    // Fetch all matching bookings
    const bookings = await Booking.findAll({
      where,
      attributes: [
        'bookingId',
        'bookingStatus',
        'paymentStatus',
        'finalFare',
        'distanceKm',
        'driverTripStatus'
      ],
      include: [
        {
          model: Payment,
          as: 'payment',
          attributes: ['paymentId', 'amount', 'status'],
          required: false
        }
      ]
    });

    let totalBookings = bookings.length;
    let completedTrips = 0;
    let cancelledTrips = 0;
    let totalRevenue = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalDistanceKm = 0;

    for (const b of bookings) {
      const isCompleted = b.bookingStatus === 'COMPLETED' || b.driverTripStatus === 'TRIP_COMPLETED';
      const isCancelled = b.bookingStatus === 'CANCELLED' || b.driverTripStatus === 'TRIP_CANCELLED';
      const fare = Number(b.finalFare) || 0;
      const distance = Number(b.distanceKm) || 0;

      totalDistanceKm += distance;

      if (isCompleted) {
        completedTrips++;
      } else if (isCancelled) {
        cancelledTrips++;
      }

      // Financials: Do NOT add cancelled bookings to revenue
      if (!isCancelled) {
        totalRevenue += fare;

        const isPaid = b.paymentStatus === 'PAID' || b.payment?.status === 'PAID' || b.payment?.status === 'SUCCESS';
        if (isPaid) {
          const paidAmount = fare;
          totalPaid += paidAmount;
        } else {
          totalPending += fare;
        }
      }
    }

    const outstandingBalance = Math.max(0, totalRevenue - totalPaid);

    return res.status(200).json({
      success: true,
      data: {
        totalBookings,
        completedTrips,
        cancelledTrips,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalPending: Math.round(totalPending * 100) / 100,
        outstandingBalance: Math.round(outstandingBalance * 100) / 100,
        totalDistanceKm: Math.round(totalDistanceKm * 100) / 100
      }
    });
  } catch (error: any) {
    console.error('Error fetching report summary:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 2. Booking-wise Paginated Report
 */
export async function getBookingsReport(req: Request, res: Response) {
  try {
    const where = buildDateWhereClause(req.query);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    const lookup = await getVehicleMasterLookupMaps();

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'username', 'email', 'mobile'],
          required: false
        },
        {
          model: Drivers,
          as: 'driver',
          attributes: ['driverId', 'driverName', 'phno'],
          required: false
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['vehicleId', 'vehicleName', 'vehicleTypeId'],
          required: false,
          include: [
            {
              model: VehicleMaster,
              as: 'vehicleMaster',
              attributes: ['vehicleMasterId', 'vehicleNumber'],
              required: false
            }
          ]
        },
        {
          model: VehicleMaster,
          as: 'vehicleMaster',
          attributes: ['vehicleMasterId', 'vehicleNumber'],
          required: false
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['paymentId', 'amount', 'status', 'paymentMode', 'transactionId'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const formattedBookings = bookings.map(b => {
      const finalFare = Number(b.finalFare) || 0;
      const isPaid = b.paymentStatus === 'PAID' || b.payment?.status === 'PAID' || b.payment?.status === 'SUCCESS';
      const paidAmount = isPaid ? finalFare : (Number(b.payment?.amount) || 0);
      const balance = Math.max(0, finalFare - paidAmount);

      const customerName = b.user?.username || (b as any).riderName || b.behalfOfName || 'N/A';
      const customerPhone = b.user?.mobile || (b as any).riderPhone || b.behalfOfPhone || 'N/A';
      const driverName = b.driver?.driverName || 'Unassigned';
      const driverPhone = b.driver?.phno || 'N/A';
      const vehicleName = b.vehicle?.vehicleName || b.preferredType || 'N/A';
      const vehicleNumber = resolveVehicleNumberFromLookup(b, lookup);

      return {
        bookingId: b.bookingId,
        bookingCode: b.bookingCode || b.bookingId,
        createdAt: b.createdAt,
        bookingDate: b.bookingDate,
        bookingTime: b.bookingTime,
        pickup: b.pickupPoint || b.pickupArea || 'N/A',
        drop: b.dropPoint || (b as any).dropLocation || 'N/A',
        customerName,
        customerPhone,
        customerEmail: b.user?.email || 'N/A',
        driverName,
        driverPhone,
        vehicle: {
          name: vehicleName,
          vehicleNumber
        },
        vehicleName,
        vehicleNumber,
        distanceKm: Number(b.distanceKm) || 0,
        baseFare: Number(b.baseFare) || 0,
        perKmRate: Number(b.perKmRate) || 0,
        finalFare,
        paidAmount,
        balance,
        paymentStatus: isPaid ? 'PAID' : (b.paymentStatus || 'PENDING'),
        bookingStatus: b.bookingStatus || 'PENDING',
        driverTripStatus: b.driverTripStatus || 'PENDING',
        paymentMethod: b.paymentMethod || b.payment?.paymentMode || 'N/A',
        transactionId: b.paymentTransactionId || b.payment?.transactionId || 'N/A'
      };
    });


    return res.status(200).json({
      success: true,
      data: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        bookings: formattedBookings
      }
    });
  } catch (error: any) {
    console.error('Error fetching bookings report:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 3. User / Customer-wise Report
 */
export async function getUserReports(req: Request, res: Response) {
  try {
    const where = buildDateWhereClause(req.query);

    const bookings = await Booking.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'username', 'email', 'mobile'],
          required: false
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['paymentId', 'amount', 'status'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const userMap = new Map<string, any>();

    for (const b of bookings) {
      const userId = b.userId || b.behalfOfPhone || (b as any).riderPhone || 'GUEST';
      const customerName = b.user?.username || (b as any).riderName || b.behalfOfName || 'Guest User';
      const customerPhone = b.user?.mobile || (b as any).riderPhone || b.behalfOfPhone || 'N/A';
      const customerEmail = b.user?.email || 'N/A';

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          customerName,
          customerPhone,
          customerEmail,
          totalBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalPending: 0,
          outstandingBalance: 0
        });
      }

      const u = userMap.get(userId);
      u.totalBookings++;

      const isCompleted = b.bookingStatus === 'COMPLETED' || b.driverTripStatus === 'TRIP_COMPLETED';
      const isCancelled = b.bookingStatus === 'CANCELLED' || b.driverTripStatus === 'TRIP_CANCELLED';
      const fare = Number(b.finalFare) || 0;

      if (isCompleted) {
        u.completedBookings++;
      } else if (isCancelled) {
        u.cancelledBookings++;
      }

      if (!isCancelled) {
        u.totalAmount += fare;
        const isPaid = b.paymentStatus === 'PAID' || b.payment?.status === 'PAID' || b.payment?.status === 'SUCCESS';
        if (isPaid) {
          u.totalPaid += fare;
        } else {
          u.totalPending += fare;
        }
      }
    }

    const userList = Array.from(userMap.values()).map(u => ({
      ...u,
      totalAmount: Math.round(u.totalAmount * 100) / 100,
      totalPaid: Math.round(u.totalPaid * 100) / 100,
      totalPending: Math.round(u.totalPending * 100) / 100,
      outstandingBalance: Math.max(0, Math.round((u.totalAmount - u.totalPaid) * 100) / 100)
    }));

    return res.status(200).json({
      success: true,
      data: userList
    });
  } catch (error: any) {
    console.error('Error fetching user reports:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 3b. Customer Booking History Detail
 */
export async function getCustomerBookingHistory(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    const where: any = {};
    if (userId.includes('-')) {
      where.userId = userId;
    } else {
      where[Op.or] = [
        { userId },
        { behalfOfPhone: userId },
        { riderPhone: userId }
      ];
    }

    const lookup = await getVehicleMasterLookupMaps();

    const bookings = await Booking.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'username', 'email', 'mobile'],
          required: false
        },
        {
          model: Drivers,
          as: 'driver',
          attributes: ['driverId', 'driverName', 'phno'],
          required: false
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['vehicleId', 'vehicleName', 'vehicleTypeId'],
          required: false,
          include: [
            {
              model: VehicleMaster,
              as: 'vehicleMaster',
              attributes: ['vehicleMasterId', 'vehicleNumber'],
              required: false
            }
          ]
        },
        {
          model: VehicleMaster,
          as: 'vehicleMaster',
          attributes: ['vehicleMasterId', 'vehicleNumber'],
          required: false
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['paymentId', 'amount', 'status', 'paymentMode', 'transactionId'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formatted = bookings.map(b => {
      const finalFare = Number(b.finalFare) || 0;
      const isPaid = b.paymentStatus === 'PAID' || b.payment?.status === 'PAID' || b.payment?.status === 'SUCCESS';
      const paidAmount = isPaid ? finalFare : (Number(b.payment?.amount) || 0);
      const balance = Math.max(0, finalFare - paidAmount);
      const vehicleName = b.vehicle?.vehicleName || b.preferredType || 'N/A';
      const vehicleNumber = resolveVehicleNumberFromLookup(b, lookup);

      return {
        bookingId: b.bookingId,
        bookingCode: b.bookingCode || b.bookingId,
        createdAt: b.createdAt,
        bookingDate: b.bookingDate,
        bookingTime: b.bookingTime,
        pickup: b.pickupPoint || b.pickupArea || 'N/A',
        drop: b.dropPoint || (b as any).dropLocation || 'N/A',
        driverName: b.driver?.driverName || 'Unassigned',
        driverPhone: b.driver?.phno || 'N/A',
        vehicle: {
          name: vehicleName,
          vehicleNumber
        },
        vehicleName,
        vehicleNumber,
        distanceKm: Number(b.distanceKm) || 0,
        finalFare,
        paidAmount,
        balance,
        paymentStatus: isPaid ? 'PAID' : (b.paymentStatus || 'PENDING'),
        bookingStatus: b.bookingStatus || 'PENDING',
        driverTripStatus: b.driverTripStatus || 'PENDING'
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error: any) {
    console.error('Error fetching customer booking history:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 4. Driver-wise Report
 */
export async function getDriverReports(req: Request, res: Response) {
  try {
    const where = buildDateWhereClause(req.query);

    const bookings = await Booking.findAll({
      where: {
        ...where,
        driverId: { [Op.ne]: null }
      },
      include: [
        {
          model: Drivers,
          as: 'driver',
          attributes: ['driverId', 'driverName', 'phno'],
          required: true
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['paymentId', 'amount', 'status'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const driverMap = new Map<string, any>();

    for (const b of bookings) {
      const driverId = b.driverId!;
      const driverName = b.driver?.driverName || 'Unknown Driver';
      const driverPhone = b.driver?.phno || 'N/A';

      if (!driverMap.has(driverId)) {
        driverMap.set(driverId, {
          driverId,
          driverName,
          driverPhone,
          totalTrips: 0,
          completedTrips: 0,
          cancelledTrips: 0,
          totalTripAmount: 0,
          totalPaid: 0,
          totalPending: 0
        });
      }

      const d = driverMap.get(driverId);
      d.totalTrips++;

      const isCompleted = b.bookingStatus === 'COMPLETED' || b.driverTripStatus === 'TRIP_COMPLETED';
      const isCancelled = b.bookingStatus === 'CANCELLED' || b.driverTripStatus === 'TRIP_CANCELLED';
      const fare = Number(b.finalFare) || 0;

      if (isCompleted) {
        d.completedTrips++;
      } else if (isCancelled) {
        d.cancelledTrips++;
      }

      if (!isCancelled) {
        d.totalTripAmount += fare;
        const isPaid = b.paymentStatus === 'PAID' || b.payment?.status === 'PAID' || b.payment?.status === 'SUCCESS';
        if (isPaid) {
          d.totalPaid += fare;
        } else {
          d.totalPending += fare;
        }
      }
    }

    const driverList = Array.from(driverMap.values()).map(d => ({
      ...d,
      totalTripAmount: Math.round(d.totalTripAmount * 100) / 100,
      totalPaid: Math.round(d.totalPaid * 100) / 100,
      totalPending: Math.round(d.totalPending * 100) / 100
    }));

    return res.status(200).json({
      success: true,
      data: driverList
    });
  } catch (error: any) {
    console.error('Error fetching driver reports:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 5. Vehicle-wise Report
 */
export async function getVehicleReports(req: Request, res: Response) {
  try {
    const where = buildDateWhereClause(req.query);
    const lookup = await getVehicleMasterLookupMaps();

    const bookings = await Booking.findAll({
      where,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['vehicleId', 'vehicleName', 'vehicleTypeId'],
          required: false,
          include: [
            {
              model: VehicleMaster,
              as: 'vehicleMaster',
              attributes: ['vehicleMasterId', 'vehicleNumber'],
              required: false
            }
          ]
        },
        {
          model: VehicleMaster,
          as: 'vehicleMaster',
          attributes: ['vehicleMasterId', 'vehicleNumber'],
          required: false
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['paymentId', 'amount', 'status'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const vehicleMap = new Map<string, any>();

    for (const b of bookings) {
      const vehicleName = b.vehicle?.vehicleName || b.preferredType || 'Standard Vehicle';
      const vehicleNumber = resolveVehicleNumberFromLookup(b, lookup);
      const vehicleKey = `${vehicleName}__${vehicleNumber}`;

      if (!vehicleMap.has(vehicleKey)) {
        vehicleMap.set(vehicleKey, {
          vehicleName,
          vehicleNumber,
          totalTrips: 0,
          totalDistance: 0,
          totalRevenue: 0,
          totalPaid: 0,
          totalPending: 0
        });
      }

      const v = vehicleMap.get(vehicleKey);
      v.totalTrips++;
      v.totalDistance += Number(b.distanceKm) || 0;

      const isCancelled = b.bookingStatus === 'CANCELLED' || b.driverTripStatus === 'TRIP_CANCELLED';
      const fare = Number(b.finalFare) || 0;

      if (!isCancelled) {
        v.totalRevenue += fare;
        const isPaid = b.paymentStatus === 'PAID' || b.payment?.status === 'PAID' || b.payment?.status === 'SUCCESS';
        if (isPaid) {
          v.totalPaid += fare;
        } else {
          v.totalPending += fare;
        }
      }
    }

    const vehicleList = Array.from(vehicleMap.values()).map(v => ({
      ...v,
      totalDistance: Math.round(v.totalDistance * 100) / 100,
      totalRevenue: Math.round(v.totalRevenue * 100) / 100,
      totalPaid: Math.round(v.totalPaid * 100) / 100,
      totalPending: Math.round(v.totalPending * 100) / 100
    }));

    return res.status(200).json({
      success: true,
      data: vehicleList
    });
  } catch (error: any) {
    console.error('Error fetching vehicle reports:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 6. Get Invoice Details for Modal & PDF Generation
 */
export async function getBookingInvoiceData(req: Request, res: Response) {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({
      where: {
        [Op.or]: [
          { bookingId },
          { bookingCode: bookingId }
        ]
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'username', 'email', 'mobile'],
          required: false
        },
        {
          model: Drivers,
          as: 'driver',
          attributes: ['driverId', 'driverName', 'phno'],
          required: false
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['vehicleId', 'vehicleName', 'vehicleTypeId'],
          required: false,
          include: [
            {
              model: VehicleMaster,
              as: 'vehicleMaster',
              attributes: ['vehicleMasterId', 'vehicleNumber'],
              required: false
            }
          ]
        },
        {
          model: VehicleMaster,
          as: 'vehicleMaster',
          attributes: ['vehicleMasterId', 'vehicleNumber'],
          required: false
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['paymentId', 'amount', 'status', 'paymentMode', 'transactionId'],
          required: false
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const lookup = await getVehicleMasterLookupMaps();
    const vehicleNumber = resolveVehicleNumberFromLookup(booking, lookup);
    const vehicleName = booking.vehicle?.vehicleName || booking.preferredType || 'EasyRide Standard';

    const finalFare = Number(booking.finalFare) || 0;
    const isPaid = booking.paymentStatus === 'PAID' || booking.payment?.status === 'PAID' || booking.payment?.status === 'SUCCESS';
    const paidAmount = isPaid ? finalFare : (Number(booking.payment?.amount) || 0);
    const balance = Math.max(0, finalFare - paidAmount);

    const baseFare = Number(booking.baseFare) || 0;
    const distanceKm = Number(booking.distanceKm) || 0;
    const perKmRate = Number(booking.perKmRate) || 0;
    const distanceCharge = Math.max(0, finalFare - baseFare);

    const invoiceData = {
      bookingId: booking.bookingId,
      bookingCode: booking.bookingCode || booking.bookingId,
      invoiceDate: dayjs(booking.createdAt).format('DD MMM YYYY'),
      bookingDate: booking.bookingDate ? dayjs(booking.bookingDate).format('DD MMM YYYY') : dayjs(booking.createdAt).format('DD MMM YYYY'),
      bookingTime: booking.bookingTime || 'Scheduled',
      customerName: booking.user?.username || (booking as any).riderName || booking.behalfOfName || 'Valued Customer',
      customerPhone: booking.user?.mobile || (booking as any).riderPhone || booking.behalfOfPhone || 'N/A',
      customerEmail: booking.user?.email || 'N/A',
      pickup: booking.pickupPoint || booking.pickupArea || 'N/A',
      drop: booking.dropPoint || (booking as any).dropLocation || 'N/A',
      driverName: booking.driver?.driverName || 'Unassigned',
      driverPhone: booking.driver?.phno || 'N/A',
      vehicle: {
        name: vehicleName,
        vehicleNumber
      },
      vehicleName,
      vehicleNumber,
      distanceKm,
      baseFare,
      perKmRate,
      distanceCharge,
      finalFare,
      paidAmount,
      balance,
      paymentStatus: isPaid ? 'PAID' : (booking.paymentStatus || 'PENDING'),
      paymentMethod: booking.paymentMethod || booking.payment?.paymentMode || 'N/A',
      transactionId: booking.paymentTransactionId || booking.payment?.transactionId || 'N/A',
      bookingStatus: booking.bookingStatus || 'PENDING'
    };

    return res.status(200).json({
      success: true,
      data: invoiceData
    });
  } catch (error: any) {
    console.error('Error fetching invoice data:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 7. Excel Export API (.xlsx)
 */
export async function exportReportExcel(req: Request, res: Response) {
  try {
    const where = buildDateWhereClause(req.query);
    const mode = (req.query.mode as string) || 'bookings'; // 'bookings' | 'overall' | 'customer'
    const lookup = await getVehicleMasterLookupMaps();

    const bookings = await Booking.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'username', 'email', 'mobile'],
          required: false
        },
        {
          model: Drivers,
          as: 'driver',
          attributes: ['driverId', 'driverName', 'phno'],
          required: false
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['vehicleId', 'vehicleName', 'vehicleTypeId'],
          required: false,
          include: [
            {
              model: VehicleMaster,
              as: 'vehicleMaster',
              attributes: ['vehicleMasterId', 'vehicleNumber'],
              required: false
            }
          ]
        },
        {
          model: VehicleMaster,
          as: 'vehicleMaster',
          attributes: ['vehicleMasterId', 'vehicleNumber'],
          required: false
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['paymentId', 'amount', 'status', 'paymentMode', 'transactionId'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const wb = XLSX.utils.book_new();

    // Map bookings rows
    const bookingRows = bookings.map(b => {
      const finalFare = Number(b.finalFare) || 0;
      const isPaid = b.paymentStatus === 'PAID' || b.payment?.status === 'PAID' || b.payment?.status === 'SUCCESS';
      const paidAmount = isPaid ? finalFare : (Number(b.payment?.amount) || 0);
      const balance = Math.max(0, finalFare - paidAmount);
      const vehicleName = b.vehicle?.vehicleName || b.preferredType || 'N/A';
      const vehicleNumber = resolveVehicleNumberFromLookup(b, lookup);

      return {
        'Booking ID': b.bookingCode || b.bookingId,
        'Booking Date': b.bookingDate ? dayjs(b.bookingDate).format('YYYY-MM-DD') : dayjs(b.createdAt).format('YYYY-MM-DD'),
        'Customer Name': b.user?.username || (b as any).riderName || b.behalfOfName || 'N/A',
        'Customer Phone': b.user?.mobile || (b as any).riderPhone || b.behalfOfPhone || 'N/A',
        'Pickup': b.pickupPoint || b.pickupArea || 'N/A',
        'Drop': b.dropPoint || (b as any).dropLocation || 'N/A',
        'Vehicle': vehicleName,
        'Vehicle Number': vehicleNumber,
        'Driver': b.driver?.driverName || 'Unassigned',
        'Distance (km)': Number(b.distanceKm) || 0,
        'Final Amount (₹)': finalFare,
        'Paid Amount (₹)': paidAmount,
        'Balance (₹)': balance,
        'Payment Status': isPaid ? 'PAID' : (b.paymentStatus || 'PENDING'),
        'Booking Status': b.bookingStatus || 'PENDING'
      };
    });



    if (mode === 'overall') {
      // Sheet 1: Summary
      let totalRevenue = 0;
      let totalPaid = 0;
      let totalPending = 0;
      let completedCount = 0;
      let cancelledCount = 0;

      bookings.forEach(b => {
        const isCompleted = b.bookingStatus === 'COMPLETED' || b.driverTripStatus === 'TRIP_COMPLETED';
        const isCancelled = b.bookingStatus === 'CANCELLED' || b.driverTripStatus === 'TRIP_CANCELLED';
        const fare = Number(b.finalFare) || 0;
        if (isCompleted) completedCount++;
        if (isCancelled) cancelledCount++;
        if (!isCancelled) {
          totalRevenue += fare;
          const isPaid = b.paymentStatus === 'PAID' || b.payment?.status === 'PAID' || b.payment?.status === 'SUCCESS';
          if (isPaid) totalPaid += fare;
          else totalPending += fare;
        }
      });

      const summaryData = [
        { 'Metric': 'Total Bookings', 'Value': bookings.length },
        { 'Metric': 'Completed Trips', 'Value': completedCount },
        { 'Metric': 'Cancelled Trips', 'Value': cancelledCount },
        { 'Metric': 'Total Revenue (₹)', 'Value': Math.round(totalRevenue * 100) / 100 },
        { 'Metric': 'Total Paid Amount (₹)', 'Value': Math.round(totalPaid * 100) / 100 },
        { 'Metric': 'Total Pending Amount (₹)', 'Value': Math.round(totalPending * 100) / 100 },
        { 'Metric': 'Total Outstanding Balance (₹)', 'Value': Math.max(0, Math.round((totalRevenue - totalPaid) * 100) / 100) }
      ];

      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Sheet 2: Bookings
      const wsBookings = XLSX.utils.json_to_sheet(bookingRows);
      XLSX.utils.book_append_sheet(wb, wsBookings, 'Bookings');

      // Sheet 3: Customers
      const userMap = new Map<string, any>();
      bookings.forEach(b => {
        const key = b.userId || b.behalfOfPhone || 'GUEST';
        if (!userMap.has(key)) {
          userMap.set(key, {
            'Customer Name': b.user?.username || (b as any).riderName || b.behalfOfName || 'Guest User',
            'Phone': b.user?.mobile || (b as any).riderPhone || b.behalfOfPhone || 'N/A',
            'Total Bookings': 0,
            'Total Amount (₹)': 0,
            'Paid (₹)': 0,
            'Balance (₹)': 0
          });
        }
        const u = userMap.get(key);
        u['Total Bookings']++;
        if (b.bookingStatus !== 'CANCELLED') {
          const fare = Number(b.finalFare) || 0;
          u['Total Amount (₹)'] += fare;
          const isPaid = b.paymentStatus === 'PAID' || b.payment?.status === 'PAID';
          if (isPaid) u['Paid (₹)'] += fare;
          else u['Balance (₹)'] += fare;
        }
      });
      const wsUsers = XLSX.utils.json_to_sheet(Array.from(userMap.values()));
      XLSX.utils.book_append_sheet(wb, wsUsers, 'Customers');

      // Sheet 4: Drivers
      const driverMap = new Map<string, any>();
      bookings.forEach(b => {
        if (!b.driverId) return;
        if (!driverMap.has(b.driverId)) {
          driverMap.set(b.driverId, {
            'Driver Name': b.driver?.driverName || 'Unknown',
            'Phone': b.driver?.phno || 'N/A',
            'Total Trips': 0,
            'Trip Revenue (₹)': 0,
            'Paid (₹)': 0,
            'Pending (₹)': 0
          });
        }
        const d = driverMap.get(b.driverId);
        d['Total Trips']++;
        if (b.bookingStatus !== 'CANCELLED') {
          const fare = Number(b.finalFare) || 0;
          d['Trip Revenue (₹)'] += fare;
          const isPaid = b.paymentStatus === 'PAID' || b.payment?.status === 'PAID';
          if (isPaid) d['Paid (₹)'] += fare;
          else d['Pending (₹)'] += fare;
        }
      });
      const wsDrivers = XLSX.utils.json_to_sheet(Array.from(driverMap.values()));
      XLSX.utils.book_append_sheet(wb, wsDrivers, 'Drivers');

      // Sheet 5: Vehicles
      const vehicleSheetMap = new Map<string, any>();
      bookings.forEach(b => {
        const vehicleName = b.vehicle?.vehicleName || b.preferredType || 'Standard Vehicle';
        const vehicleNumber = b.vehicleMaster?.vehicleNumber || (b as any).vehicleNumber || 'Not Added';
        const key = `${vehicleName}__${vehicleNumber}`;
        if (!vehicleSheetMap.has(key)) {
          vehicleSheetMap.set(key, {
            'Vehicle Name': vehicleName,
            'Vehicle Number': vehicleNumber,
            'Total Trips': 0,
            'Total Distance (km)': 0,
            'Total Revenue (₹)': 0,
            'Paid (₹)': 0,
            'Pending (₹)': 0
          });
        }
        const v = vehicleSheetMap.get(key);
        v['Total Trips']++;
        v['Total Distance (km)'] += Number(b.distanceKm) || 0;
        if (b.bookingStatus !== 'CANCELLED') {
          const fare = Number(b.finalFare) || 0;
          v['Total Revenue (₹)'] += fare;
          const isPaid = b.paymentStatus === 'PAID' || b.payment?.status === 'PAID';
          if (isPaid) v['Paid (₹)'] += fare;
          else v['Pending (₹)'] += fare;
        }
      });
      const wsVehicles = XLSX.utils.json_to_sheet(Array.from(vehicleSheetMap.values()));
      XLSX.utils.book_append_sheet(wb, wsVehicles, 'Vehicles');
    } else {
      // Single sheet export for filtered bookings or single customer
      const ws = XLSX.utils.json_to_sheet(bookingRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
    }


    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="EasyRide_Report_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx"`);
    return res.send(buffer);
  } catch (error: any) {
    console.error('Error exporting Excel report:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

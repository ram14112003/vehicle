// bookingController.ts
import { Request, Response } from 'express';
import { ORDER } from '../utils/costants';
import { getOrdersByStatus } from '../services/bookingServices';
import { USERS } from "../utils/costants";
const { ROLES } = USERS;

const handleOrderStatus = async (req: Request, res: Response, status: number) => {
  try {
    const role = (req as any).role;

    // Authorization: only Admins or SuperAdmins can access
    if (role === ROLES.USER) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to view orders.',
      });
    }

    // Fetch orders by status
    const orders = await getOrdersByStatus(status);

    return res.status(200).json({
      success: true,
      message: `Orders with status "${status}" retrieved successfully.`,
      data: orders,
    });

  } catch (error) {
    console.error(`[GET_ORDERS_${status}_ERROR]:`, error);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve ${status} orders.`,
      error: (error as Error).message,
    });
  }
};

// Specific controller functions
export const getConfirmedOrders = (req: Request, res: Response) =>
  handleOrderStatus(req, res, ORDER.STATUS.CONFIRMED);

export const getPendingOrders = (req: Request, res: Response) =>
  handleOrderStatus(req, res, ORDER.STATUS.PENDING);

export const getClosedOrders = (req: Request, res: Response) =>
  handleOrderStatus(req, res, ORDER.STATUS.CLOSED);

export const getCompletedOrders = (req: Request, res: Response) =>
  handleOrderStatus(req, res, ORDER.STATUS.COMPLETED);

export const getPaymentCompletedOrders = (req: Request, res: Response) =>
  handleOrderStatus(req, res, ORDER.STATUS.PAYMENTCOMPLETED);
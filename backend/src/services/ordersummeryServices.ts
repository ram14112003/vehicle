// import { Response } from 'express';
// import { orderSummery } from '../models/ordersummery';
// import { Company } from '../models/company';
// import { Invoice } from '../models/invoice';
// import { Tax } from '../models/tax';
// import { USERS } from "../utils/costants";
// import { Op } from 'sequelize';
// const { ROLES } = USERS;

// // Create Order Summary
// export const createOrderSummary = async (req: any, res: Response) => {
//   const { companyId, invoiceId, taxId } = req.body;
  
//   try {
//     const role = req.role;
//     if (role === ROLES.USER) {
//       return res.status(403).json({ message: 'Not Authorized' });
//     }

//     // Check if order summary already exists for this invoice
//     const existing = await orderSummery.findOne({ 
//       where: { invoiceId } 
//     });
//     if (existing) {
//       return res.status(400).json({ message: 'Order summary already exists for this invoice' });
//     }

//     const orderSummary = await orderSummery.create({
//       companyId,
//       invoiceId,
//       taxId
//     });

//     res.status(201).json({
//       message: 'Order summary created successfully',
//       orderSummary
//     });
//     return;

//   } catch (err) {
//     res.status(500).json({ error: err });
//   }
// };

// // Get Order Summary Dashboard Data
// export const getOrderSummaryDashboard = async (req: any, res: Response) => {
//   const { fromDate, toDate } = req.query;
  
//   try {
//     const role = req.role;
//     if (role === ROLES.USER) {
//       return res.status(403).json({ message: 'Not Authorized' });
//     }

//     // Build date filter
//     let dateFilter = {};
//     if (fromDate && toDate) {
//       dateFilter = {
//         createdAt: {
//           [Op.between]: [new Date(fromDate as string), new Date(toDate as string)]
//         }
//       };
//     }

//     // Get all order summaries with company, invoice and tax data
//     const orderSummaries = await orderSummery.findAll({
//       where: dateFilter,
//       include: [
//         {
//           model: Company,
//           attributes: ['companyId', 'companyName']
//         },
//         {
//           model: Invoice,
//           attributes: ['invoiceId', 'invoiceAmount', 'startDate', 'endDate']
//         },
//         {
//           model: Tax,
//           where: { isActive: true },
//           attributes: ['taxId', 'taxName', 'taxPercent']
//         }
//       ]
//     });

//     // Group by company and calculate totals
//     const companyTotals = {};
    
//     orderSummaries.forEach(summary => {
//       const companyId = summary.companyId;
//       const companyName = summary.company?.companyName || 'Unknown Company';
//       const invoiceAmount = summary.invoice?.invoiceAmount || 0;
//       const taxPercent = summary.tax?.taxPercent || 0;

//       if (!companyTotals[companyId]) {
//         companyTotals[companyId] = {
//           companyName,
//           totalAmount: 0,
//           paidAmount: 0, // You might want to add payment logic here
//           taxAmount: 0,
//           invoiceCount: 0
//         };
//       }

//       const taxAmount = (invoiceAmount * taxPercent) / 100;
//       const totalWithTax = invoiceAmount + taxAmount;

//       companyTotals[companyId].totalAmount += totalWithTax;
//       companyTotals[companyId].paidAmount += invoiceAmount; // Assuming invoice amount is paid amount
//       companyTotals[companyId].taxAmount += taxAmount;
//       companyTotals[companyId].invoiceCount += 1;
//     });

//     // Convert to array format for response
//     const dashboardData = Object.values(companyTotals).map((company: any) => ({
//       companyName: company.companyName,
//       totalAmount: parseFloat(company.totalAmount.toFixed(2)),
//       paidAmount: parseFloat(company.paidAmount.toFixed(2)),
//       taxAmount: parseFloat(company.taxAmount.toFixed(2)),
//       invoiceCount: company.invoiceCount
//     }));

//     res.status(200).json({
//       message: 'Order summary dashboard data retrieved successfully',
//       data: dashboardData,
//       summary: {
//         totalCompanies: dashboardData.length,
//         totalRevenue: dashboardData.reduce((sum, item) => sum + item.totalAmount, 0),
//         totalTax: dashboardData.reduce((sum, item) => sum + item.taxAmount, 0)
//       }
//     });
//     return;

//   } catch (err) {
//     res.status(500).json({ error: err });
//   }
// };

// // Get Order Summary by Company ID
// export const getOrderSummaryByCompany = async (req: any, res: Response) => {
//   const { companyId } = req.params;
  
//   try {
//     const role = req.role;
//     if (role === ROLES.USER) {
//       return res.status(403).json({ message: 'Not Authorized' });
//     }

//     const orderSummaries = await orderSummery.findAll({
//       where: { companyId },
//       include: [
//         {
//           model: Company,
//           attributes: ['companyId', 'companyName']
//         },
//         {
//           model: Invoice,
//           attributes: ['invoiceId', 'invoiceNumber', 'invoiceAmount', 'startDate', 'endDate']
//         },
//         {
//           model: Tax,
//           where: { isActive: true },
//           attributes: ['taxId', 'taxName', 'taxPercent']
//         }
//       ]
//     });

//     if (orderSummaries.length === 0) {
//       return res.status(404).json({ message: 'No order summaries found for this company' });
//     }

//     // Calculate totals
//     let totalInvoiceAmount = 0;
//     let totalTaxAmount = 0;
    
//     const invoiceDetails = orderSummaries.map(summary => {
//       const invoiceAmount = summary.invoice?.invoiceAmount || 0;
//       const taxPercent = summary.tax?.taxPercent || 0;
//       const taxAmount = (invoiceAmount * taxPercent) / 100;
      
//       totalInvoiceAmount += invoiceAmount;
//       totalTaxAmount += taxAmount;

//       return {
//         invoiceId: summary.invoice?.invoiceId,
//         invoiceNumber: summary.invoice?.invoiceNumber,
//         invoiceAmount,
//         taxAmount,
//         totalAmount: invoiceAmount + taxAmount,
//         startDate: summary.invoice?.startDate,
//         endDate: summary.invoice?.endDate
//       };
//     });

//     const result = {
//       company: {
//         companyId: orderSummaries[0].company?.companyId,
//         companyName: orderSummaries[0].company?.companyName
//       },
//       totals: {
//         totalInvoiceAmount: parseFloat(totalInvoiceAmount.toFixed(2)),
//         totalTaxAmount: parseFloat(totalTaxAmount.toFixed(2)),
//         grandTotal: parseFloat((totalInvoiceAmount + totalTaxAmount).toFixed(2))
//       },
//       invoiceDetails
//     };

//     res.status(200).json({
//       message: 'Company order summary retrieved successfully',
//       data: result
//     });
//     return;

//   } catch (err) {
//     res.status(500).json({ error: err });
//   }
// };

// // List all Order Summaries
// export const listOrderSummaries = async (req: any, res: Response) => {
//   try {
//     const role = req.role;
//     if (role === ROLES.USER) {
//       return res.status(403).json({ message: 'Not Authorized' });
//     }

//     const orderSummaries = await orderSummery.findAll({
//       include: [
//         {
//           model: Company,
//           attributes: ['companyId', 'companyName']
//         },
//         {
//           model: Invoice,
//           attributes: ['invoiceId', 'invoiceNumber', 'invoiceAmount']
//         },
//         {
//           model: Tax,
//           where: { isActive: true },
//           attributes: ['taxId', 'taxName', 'taxPercent']
//         }
//       ],
//       order: [['createdAt', 'DESC']]
//     });

//     res.status(200).json({
//       message: 'Order summaries retrieved successfully',
//       data: orderSummaries
//     });
//     return;

//   } catch (err) {
//     res.status(500).json({ error: err });
//   }
// };
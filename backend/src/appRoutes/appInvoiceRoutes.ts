import express from 'express';
import { generateInvoicePDF,downloadInvoicePDF} from '../appServices/appInvoiceServices';
import { authMiddleware } from '../middleware/authMiddleware';
import path from 'path';
import jwt from "jsonwebtoken";
import { monthGenerateInvoicePDF, monthDownloadInvoicePDF } from '../appServices/monthInvoiceServices';
import fs from "fs";
import { Request, Response } from "express";
console.log("✅ appInvoiceRoutes loaded");


const router = express.Router();

// Route to generate PDF invoice
router.post('/generate-invoice-pdf', generateInvoicePDF);

// Route to download PDF invoice
//router.get('/download/invoice',authMiddleware, downloadInvoicePDF);

router.get("/download/invoice/:fileName", async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

    // verify token
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // check token matches the requested file
    if (payload.fileName !== fileName) {
      return res.status(403).json({ message: "Token not valid for this file" });
    }

    const filePath = path.join(process.cwd(), "uploads", "invoices", fileName);
    console.log("path ",filePath," name ",fileName);
    const downloadName = payload.downloadName || fileName;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${downloadName}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);

    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Error sending regular invoice inline:", err);
        if (!res.headersSent) {
          res.status(404).send("Invoice not found");
        }
      }
    });
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route to generate monthly invoice PDF
router.post('/month-generate-invoice-pdf', authMiddleware, monthGenerateInvoicePDF);
 
// Route to download monthly invoice PDF
router.get("/download/month-invoice/:fileName", async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    const { token } = req.query;
   const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

    if (!token || typeof token !== "string") {
      console.error("Missing or invalid token");
      return res.status(401).json({ message: "Missing or invalid token" });
    }
 
    // Verify token
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.error("Token verification failed:", err);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
 
    // Check token matches the requested file
    if (payload.fileName !== fileName) {
      console.error(`Token fileName mismatch. Token: ${payload.fileName}, Requested: ${fileName}`);
      return res.status(403).json({ message: "Token not valid for this file" });
    }
 
    // ✅ FIX: Monthly invoices are in 'monthly' subfolder
    const filePath = path.join(process.cwd(), "uploads", "invoices", "monthly", fileName);
   
    console.log(`Attempting to download file from: ${filePath}`);
 
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found at path: ${filePath}`);
      return res.status(404).json({
        message: "Monthly invoice file not found",
        path: filePath
      });
    }
 
    console.log(`File found, size: ${fs.statSync(filePath).size} bytes`);
 
    // Set headers for inline PDF viewing
    const downloadName = payload.downloadName || fileName;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${downloadName}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);
 
    // Send file inline
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Error sending monthly invoice inline:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error sending monthly invoice inline" });
        }
      } else {
        console.log(`✅ Monthly invoice sent inline successfully: ${fileName}`);
      }
    });
  } catch (error) {
    console.error("Monthly invoice download error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: (error as Error).message
      });
    }
  }
});

// Route to download oncall invoice PDF
router.get("/download/oncall-invoice/:fileName", async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (payload.fileName !== fileName) {
      return res.status(403).json({ message: "Token not valid for this file" });
    }

    const filePath = path.join(process.cwd(), "uploads", "oncallinvoice", fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("OnCall Invoice not found");
    }

    const downloadName = payload.downloadName || fileName;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${downloadName}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);

    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Error sending OnCall invoice inline:", err);
        if (!res.headersSent) {
          res.status(404).send("Invoice not found");
        }
      }
    });
  } catch (error) {
    console.error("Download error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
});
 
//export default router;

export default router;
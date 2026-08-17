import { Request, Response } from 'express';
import { Configuration, EmailConfiguration } from '../models';
import { USERS } from "../utils/costants";
import nodemailer from "nodemailer";
import config from "../config/config";  
import SMTPTransport from "nodemailer/lib/smtp-transport";
const { ROLES } = USERS;
import fs from 'fs';
import { SentMessageInfo } from "nodemailer";

// ---------------- Utility ----------------
function replacePlaceholders(template: string, data: Record<string, string>) {
  return Object.keys(data).reduce((acc, key) => {
    const regex = new RegExp(`###${key}###`, "g");
    return acc.replace(regex, data[key] ?? "");
  }, template);
}

// export const sendEmailFromTemplate = async (
//   idOrCode: string | number,
//   data: Record<string, string>,
//   attachments: Array<{ path: string; filename: string }> = []
// ) => {
//   // Load email template
//   let emailConf;
//   if (typeof idOrCode === "number") {
//     emailConf = await EmailConfiguration.findByPk(idOrCode);
//   } else {
//     emailConf = await EmailConfiguration.findOne({ where: { emailCode: idOrCode } });
//   }
//   if (!emailConf) throw new Error("Email template not found");

//   // Build final message/subject
//   const finalMessage = replacePlaceholders(emailConf.message, data);
//   const finalSubject = replacePlaceholders(emailConf.subject, data);

//   // Load SMTP configuration and sanitize
//   const conf = await Configuration.findOne();
//   const portNum = Number(conf?.smtpEmailPort) || 587;
//   const smtpHost = (conf?.smtpServer || "").trim();
//   const smtpUser = (conf?.smtpEmailAddress || "").trim();
//   const smtpPass = (conf?.smtpEmailPassword || "").trim();
//   console.log(smtpUser," passss ",smtpPass)
//   if (!smtpHost || !smtpUser || !smtpPass) {
//     throw new Error("SMTP configuration incomplete");
//   }

//   // Prepare recipients array
//   const recipients: string[] = [];
//   if (data?.UserEmail) recipients.push(String(data.UserEmail).trim());
//   if (data?.EmployeeEmail) recipients.push(String(data.EmployeeEmail).trim());
//   if (data?.to) {
//     recipients.push(
//       ...String(data.to)
//         .split(",")
//         .map(s => s.trim())
//         .filter(Boolean)
//     );
//   }
//   if (recipients.length === 0) {
//     throw new Error("No recipients specified for email");
//   }

//   const normalizeToCRLF = (s: any) =>
//     String(s == null ? "" : s)
//       .replace(/\r\n/g, "\n") // normalize CRLF -> LF
//       .replace(/\r/g, "\n") // convert lone CR -> LF
//       .replace(/\n/g, "\r\n"); // convert LF -> CRLF

//   // Friendly From header and envelope
//   const headerFrom = `${emailConf.fromName || "No-Reply"} <${emailConf.fromAddress || smtpUser}>`;
//   const safeHeaderFrom = normalizeToCRLF(headerFrom);
//   const safeSubject = normalizeToCRLF(finalSubject);
//   const safeMessage = normalizeToCRLF(finalMessage);

//   // parse BCC from emailConf.emailBcc (robustly)
//   const bccList: string[] = emailConf.emailBcc
//     ? String(emailConf.emailBcc)
//         .split(",")
//         .map(s => s.trim())
//         .filter(Boolean)
//     : [];

//   // dedupe and filter recipients
//   const allRecipients = Array.from(
//     new Set([...recipients.map(r => r.trim()).filter(Boolean)])
//   );

//   const mailOptions: any = {
//     from: safeHeaderFrom,
//     to: allRecipients.join(", "),
//     // set bcc as an array (clearer)
//     bcc: bccList.length > 0 ? bccList : undefined,
//     subject: safeSubject,
//     html: safeMessage,
//     attachments: attachments.length > 0 ? attachments : undefined,
//     // include bcc in envelope too so SMTP will actually deliver to them
//     envelope: {
//       from: smtpUser,
//       to: [...allRecipients, ...bccList]
//     },
//     replyTo: emailConf.fromAddress || smtpUser
//   };

//   // Create transporter (no debug/logger)
//   const transporter = nodemailer.createTransport({
//     host: smtpHost,
//     port: portNum,
//     secure: portNum === 465,
//     auth: { user: smtpUser, pass: smtpPass },
//     tls: { rejectUnauthorized: false },
//     newline: "windows"
//   } as SMTPTransport.Options);

//   // Fire-and-forget: verify then start the send and return immediately.
//   transporter
//     .verify()
//     .then(() => {
//       transporter
//         .sendMail(mailOptions)
//         .then((info) => {
//           // log accepted/rejected/envelope for diagnostics
//           try {
//             console.log("EMAIL SEND INFO:", {
//               accepted: info.accepted,
//               rejected: info.rejected,
//               envelope: info.envelope,
//               messageId: info.messageId
//             });
//           } catch (e) {
//             // ignore logging errors
//           }

//           // cleanup attachments AFTER successful send
//           if (attachments.length > 0) {
//             attachments.forEach((attachment) => {
//               try {
//                 if (fs.existsSync(attachment.path)) {
//                   fs.unlinkSync(attachment.path);
//                 }
//               } catch (err) {
//                 // keep quiet in background; optionally log to a monitoring system
//               }
//             });
//           }
//           // optionally you can persist info to DB or monitoring here
//         })
//         .catch((err) => {
//           // log sendMail error
//           console.error("EMAIL SEND ERROR (sendMail):", err);
//         });
//     })
//     .catch((err) => {
//       // transporter.verify failed; log and still attempt to send (to preserve current behavior)
//       console.error("SMTP VERIFY FAILED:", err);
//       transporter
//         .sendMail(mailOptions)
//         .then((info) => {
//           try {
//             console.log("EMAIL SEND INFO (after verify fail):", {
//               accepted: info.accepted,
//               rejected: info.rejected,
//               envelope: info.envelope,
//               messageId: info.messageId
//             });
//           } catch (e) {}
//           if (attachments.length > 0) {
//             attachments.forEach((attachment) => {
//               try {
//                 if (fs.existsSync(attachment.path)) {
//                   fs.unlinkSync(attachment.path);
//                 }
//               } catch (err) {}
//             });
//           }
//         })
//         .catch((err2) => {
//           console.error("EMAIL SEND ERROR (sendMail after verify):", err2);
//         });
//     });

//   // return immediately so caller (createBooking) finishes fast
//   return { queued: true };
// };




// ---------------- Create ----------------
export const sendEmailFromTemplate = async (
  idOrCode: string | number,
  data: Record<string, string>,
  attachments: Array<{ path: string; filename: string;  }> = []
) => {
  // Load email template
  let emailConf;
  if (typeof idOrCode === "number") {
    emailConf = await EmailConfiguration.findByPk(idOrCode);
  } else {
    emailConf = await EmailConfiguration.findOne({ where: { emailCode: idOrCode } });
  }
  if (!emailConf) throw new Error("Email template not found");

  // Build final message/subject
  const finalMessage = replacePlaceholders(emailConf.message, data);
  const finalSubject = replacePlaceholders(emailConf.subject, data);

  // Load SMTP configuration
  const conf = await Configuration.findOne();
  const portNum = Number(conf?.smtpEmailPort) || 587;
  const smtpHost = (conf?.smtpServer || "").trim();
  const smtpUser = (conf?.smtpEmailAddress || "").trim();
  const smtpPass = (conf?.smtpEmailPassword || "").trim();
  console.log("SMTP CONFIG:", { smtpHost, smtpUser, portNum, smtpPass });
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("SMTP configuration incomplete");
  }

  // Prepare recipients
  const recipients: string[] = [];
  if (data?.UserEmail) recipients.push(String(data.UserEmail).trim());
  if (data?.EmployeeEmail) recipients.push(String(data.EmployeeEmail).trim());
  if (data?.to) {
    recipients.push(
      ...String(data.to).split(",").map(s => s.trim()).filter(Boolean)
    );
  }
  if (recipients.length === 0) {
    throw new Error("No recipients specified for email");
  }

  const normalizeToCRLF = (s: any) =>
    String(s ?? "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n/g, "\r\n");

  // Headers
  // const headerFrom = `${emailConf.fromName || "No-Reply"} <${emailConf.fromAddress || smtpUser}>`;
  const headerFrom =
  `${emailConf.fromName || "GraceCabs"} <${smtpUser}>`;

  const bccList: string[] = emailConf.emailBcc
    ? String(emailConf.emailBcc).split(",").map(s => s.trim()).filter(Boolean)
    : [];

  const allRecipients = Array.from(new Set(recipients));

  const mailOptions = {
    from: normalizeToCRLF(headerFrom),
    to: allRecipients.join(", "),
    bcc: bccList.length ? bccList : undefined,
    subject: normalizeToCRLF(finalSubject),
    html: normalizeToCRLF(finalMessage),
    attachments: attachments.length ? attachments : undefined,
  //   envelope: {
  // //    from: smtpUser,
  //     to: [...allRecipients, ...bccList]
  //   },
    replyTo: smtpUser
  };

  // Create transporter
 const transporter = nodemailer.createTransport({
  host: smtpHost,
//    host: "smtpout.secureserver.net",
  port: 587,
  secure: false,
  auth: {
    user: smtpUser,       // traveldesk@gracecabs.com
    pass: smtpPass
  },
  tls: {
    rejectUnauthorized: false
//    rejectUnauthorized: true   
  }
});

  // ✅ SEND MAIL (ONLY ONCE)
  try {
   // const info = await transporter.sendMail(mailOptions);
const info: SentMessageInfo = await transporter.sendMail(mailOptions);

    console.log("EMAIL SENT SUCCESSFULLY:", {
      accepted: info.accepted,
      messageId: info.messageId
    });

    // cleanup attachments
    if (attachments.length > 0) {
      attachments.forEach(a => {
        if (fs.existsSync(a.path)) fs.unlinkSync(a.path);
      });
    }

    return { sent: true };

  } catch (err) {
    console.error("EMAIL SEND FAILED:", err);
    throw err;
  }
};


export const createEmailConf = async (req: any, res: Response) => {
  try {
    const { title, emailCode, subject, message, fromName, fromAddress, emailBcc } = req.body;

    if (req.role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const existing = await EmailConfiguration.findOne({ where: { title } });
    if (existing) {
      return res.status(400).json({ message: 'EmailConfiguration with this title already exists' });
    }

    const emailConf = await EmailConfiguration.create({
      title,
      emailCode,
      subject,
      message,
      fromName,
      fromAddress,
      emailBcc
    });

    return res.status(201).json({
      message: 'Email configuration created successfully',
      emailConf
    });

  } catch (err: any) {
    console.error('Create emailConf Error:', err);
    return res.status(500).json({
      error: err.message || 'Something went wrong while creating Email Configuration'
    });
  }
};

// ---------------- Get All ----------------
export const fetchAllEmailConfs = async () => {
  return await EmailConfiguration.findAll({
    order: [['createdAt', 'DESC']]
  });
};
export const getAllEmailConf = async (req: any, res: Response) => {
  try {
    if (req.role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    const emailConfs = await fetchAllEmailConfs();

    res.status(200).json({
      message: 'Email configurations retrieved successfully',
      emailConfs,
      count: emailConfs.length
    });

  } catch (err: any) {
    console.error('Get all emailConf Error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
};


// ---------------- Update ----------------
export const updateEmailConf = async (req: any, res: Response) => {
  const { id } = req.params;
  const { title, emailCode, subject, message, fromName, fromAddress, emailBcc } = req.body;

  try {
    if (req.role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    if (!id) {
      return res.status(400).json({ message: 'Email configuration ID is required' });
    }

    const emailConf = await EmailConfiguration.findByPk(id);
    if (!emailConf) {
      return res.status(404).json({ message: 'Email configuration not found' });
    }

    if (title && title !== emailConf.title) {
      const existingTitle = await EmailConfiguration.findOne({ where: { title } });
      if (existingTitle) {
        return res.status(400).json({ message: 'Email configuration with this title already exists' });
      }
    }

    const updateData: any = {
      title, emailCode, subject, message, fromName, fromAddress, emailBcc
    };

    await emailConf.update(updateData);

    const updatedEmailConf = await EmailConfiguration.findByPk(id);

    res.status(200).json({
      message: 'Email configuration updated successfully',
      emailConf: updatedEmailConf
    });

  } catch (err: any) {
    console.error('Update emailConf Error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
};

// ---------------- Get By ID ----------------
export const getEmailConfById = async (req: any, res: Response) => {
  const { id } = req.params;

  try {
    if (req.role === ROLES.USER) {
      return res.status(403).json({ message: 'Not Authorized' });
    }

    if (!id) {
      return res.status(400).json({ message: 'Email configuration ID is required' });
    }

    const emailConf = await EmailConfiguration.findByPk(id);
    if (!emailConf) {
      return res.status(404).json({ message: 'Email configuration not found' });
    }

    res.status(200).json({
      message: 'Email configuration retrieved successfully',
      emailConf: emailConf
    });

  } catch (err: any) {
    console.error('Get emailConf by ID Error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
};

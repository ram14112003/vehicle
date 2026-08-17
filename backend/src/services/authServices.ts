import { Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import { Company,Employee, Vendor } from '../models';
import { Security } from '../utils/Security';
import config from '../config/config';
import { User } from '../models/user';
import { Drivers } from '../models/drivers';
import { OTP } from '../models/otp';
import { USERS } from "../utils/costants";
import { Op } from 'sequelize';
import { sendEmailFromTemplate, fetchAllEmailConfs } from "../services/emailConfServices";
const { ROLES } = USERS;
import {normalizeManagerEmails } from '../utils/email';


// Helper function to find user by mobile and return user data with type
const findUserByMobile = async (mobile: string) => {
  // Check in User table
  let user;
  user = await User.findOne({ where: { mobile } });
  if (user) {
    return {
      user,
     role: 'user',
      userId: user.userId,
      userData: {
        id: user.userId,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    };
  }

  // Check in Vendor table (phno field)
  user = await Vendor.findOne({ where: { phno: mobile } });
  if (user) {
    return {
      user,
     role: 'vendor',
      userId: user.vendorId,
      userData: {
        id: user.vendorId,
        username: user.vendorName,
        email: user.email,
        mobile: user.phno,
        role: user.role
      }
    };
  }

  // Check in Drivers table (phno field)
  user = await Drivers.findOne({ where: { phno: mobile } });
  if (user) {
    return {
      user,
     role: 'driver',
      userId: user.driverId,
      userData: {
        id: user.driverId,
        username: user.driverName,
        email: user.driverEmail,
        mobile: user.phno,
        role: 'driver'
      }
    };
  }

  return null;
};



// Existing employee registration
export const empRegister = async (req: Request, res: Response) => {
  const { username, email, phno, password, empManager } = req.body;
  try {
    const role = ROLES.SUPERADMIN;
   // const normalEmail = email.toLowerCase();
    //const normalPass = password.toLowerCase();
    
    const existing = await Employee.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    
    const hashedPassword = await Security.hash(password, 10);
    const employee = await Employee.create({ username, email, phno, password: hashedPassword, role, empManager });

     res.status(201).json({ message: 'Registered successfully', employee })
    } catch (err) {
    res.status(500).json({ error: err });
  }
};
export const empLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // const normalEmail = email.toLowerCase();
    // const normalpass = password.toLowerCase();

    // 🔹 1️⃣ Check if it's an employee
    const employee = await Employee.findOne({ where: { email } });
    if (employee) {
      const isMatch = await bcrypt.compare(password, employee.password);
      if (!isMatch)
        return res.status(401).json({ message: "Invalid credentials" });

      return res.status(200).json({
        id: employee.employeeId,
        email: employee.email,
        role: employee.role,
        accessToken: Security.generateJwtToken(
          { userId: employee.employeeId, roles: employee.role },
          config.security.jwtSecret,
          config.security.accessTokenExpiry
        ),
      });
    }

    const vendor = await Vendor.findOne({ where: { email } });
      if (vendor) {
      const isMatch = await bcrypt.compare(password, vendor.password );
      if (!isMatch)
        return res.status(401).json({ message: "Invalid credentials" });

      return res.status(200).json({
        id: vendor.vendorId,
        email: vendor.email,
        role: vendor.role,              //admin
        accessToken: Security.generateJwtToken(
          { userId: vendor.vendorId, roles: vendor.role },          //roles:admin
          config.security.jwtSecret,
          config.security.accessTokenExpiry
        ),
      });
    }

    // Check if it's a user (or manager)
    const user = await User.findOne({ where: { email } });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(401).json({ message: "Invalid credentials" });

      // Determine Role based on isManager
      // const userRole = user.isManager ? "manager" : "user";
      const userRole = user.companyManager ? "manager" : "user";

      return res.status(200).json({
        id: user.userId,
        name: user.username,
        companyId: user.companyId,
        email: user.email,
        role: userRole, // 👈 manager or user
        accessToken: Security.generateJwtToken(
          { 
            userId: user.userId, 
            roles: userRole, 
            companyId: user.companyId 
          },
          config.security.jwtSecret,
          config.security.accessTokenExpiry
        ),
      });
    }

    //  If no employee or user found
    return res.status(404).json({ message: "Email not registered" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const norm = (v?: string) => (v || '').trim().toLowerCase();

// export const registerUser = async (req: Request, res: Response) => {
//   try {
//     const {
//       username,
//       email,
//       mobile,
//       password,
//       role,
//       gender,
//       country,
//       city,
//       companyId,
//       status,
//       isConfirmed,
//       userAddress,
//       presentAddress,
//       state,
//       pinCode,
//       isManager
//     } = req.body;

//     const hashedPassword = await Security.hash(password, 10);

//     const existingUserByEmail = await User.findOne({ where: { email } });
//     if (existingUserByEmail) {
//       return res.status(400).json({ success: false, message: "User with this email already exists" });
//     }

//     // const existingUserByMobile = await User.findOne({ where: { mobile } });
//     // if (existingUserByMobile) {
//     //   return res.status(400).json({ success: false, message: "User with this mobile number already exists" });
//     // }

//     //  Validate company
//     const company = await Company.findByPk(companyId);
//     if (!company) {
//       return res.status(400).json({ success: false, message: "Company not found with the provided companyId" });
//     }

//     //  Normalize for comparison (handles array or JSON-string)
//     const managerEmails: string[] = normalizeManagerEmails(company.managerEmail as any);
//     const normalizedEmail = String(email || "").trim().toLowerCase();
//     const isCompanyManager = managerEmails.includes(normalizedEmail);

//     const newUser = await User.create({
//       username,
//       email,
//       mobile,
//       password: hashedPassword,
//       role,
//       gender,
//       country,
//       city,
//       companyId,
//       status: status || "active",
//       isPayHolder: false,
//       isConfirmed : isConfirmed || 0,
//       userAddress,
//       presentAddress: presentAddress || null,
//       companyManager: isCompanyManager ? 1 : 0, // ← 1 if matches a manager email
//       isManager,
//       state,
//       pinCode
//     });

//     const createdUser = await User.findByPk(newUser.userId, {
//       include: [{ model: Company, attributes: ["companyId", "companyName"] }],
//     });

//     try {
//       await sendEmailFromTemplate("USER_REGISTRATION_EMAIL_TO_USER", {
//         UserName: username,
//         UserEmail: email,
//         Password: password,
//       });
//       console.log("✅ Registration email sent to:", email);
//     } catch (emailErr) {
//       console.error("❌ Error sending registration email:", emailErr);
//     }

//     return res.status(201).json({
//       success: true,
//       message: "User registered successfully and email sent",
//       User: createdUser,
//     });
//   } catch (error: any) {
//     console.error("Register user error:", error);
//     return res.status(400).json({
//       success: false,
//       message: "Error registering user",
//       error: error.message,
//     });
//   }
// };


// // Existing user login

export const registerUser = async (req: Request, res: Response) => {
  try {
    const {
      username,
      email,
      mobile,
      role,
      gender,
      country,
      city,
      companyId,
      userAddress,
      presentAddress,
      state,
      pinCode,
      isManager,
     danfossuserId,
 managerId,
 managerEmail, 
 costCenter
    } = req.body;

    const normalizedEmail = String(email || "").trim().toLowerCase();

    const existingUserByEmail = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }
const existingUserByMobile = await User.findOne({ where: { mobile } });

if (existingUserByMobile) {
  return res.status(400).json({
    success: false,
    message: "Phone number already exists"
  });
}
    const company = await Company.findByPk(companyId, {
      attributes: ["companyId", "companyName", "managerEmail"]
    });

    if (!company) {
      return res.status(400).json({
        success: false,
        message: "Company not found with the provided companyId"
      });
    }

    const isDanfoss = company.companyName?.toLowerCase().includes("danfoss");

    if (isDanfoss) {
      if (!normalizedEmail.endsWith("@danfoss.com")) {
        return res.status(400).json({
          success: false,
          message: "For Danfoss company, email must be @danfoss.com only."
        });
      }
    }

    const managerEmails: string[] = normalizeManagerEmails(company.managerEmail as any);
    let isCompanyManager = managerEmails.includes(normalizedEmail);
    if(isManager) {
      isCompanyManager = isManager;
    }
    console.log("ismanager: ",isManager," iscompmanager: ", isCompanyManager)
    // ✅ Auto-generate 6 digit password
    const generatedPassword = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ Hash the generated password before storing in DB
    const hashedPassword = await Security.hash(generatedPassword, 10);

    const newUser = await User.create({
      username,
      email: normalizedEmail,
      mobile,
      password: hashedPassword,
      role: role || "user",
      gender,
      country,
      city,
      companyId,
      status: "active",
      isPayHolder: false,
      isConfirmed: 1,
      userAddress,
      presentAddress: presentAddress || null,
      companyManager: isCompanyManager ? 1 : 0,
      isManager,
      state,
      pinCode,
         danfossuserId: danfossuserId || null,
  managerId: managerId || null,
  managerEmail: managerEmail || null,
  costCenter

    });

    const createdUser = await User.findByPk(newUser.userId, {
      include: [{ model: Company, attributes: ["companyId", "companyName"] }],
    });

    try {
      await sendEmailFromTemplate("USER_REGISTRATION_EMAIL_TO_USER", {
        UserName: username,
        UserEmail: normalizedEmail,
        Password: generatedPassword,
      });
      console.log("✅ Registration email sent to:", normalizedEmail);
    } catch (emailErr) {
      console.error("❌ Error sending registration email:", emailErr);
    }

    return res.status(201).json({
      success: true,
      message: "User registered successfully and password sent to email",
      User: createdUser,
    });

  } catch (error: any) {
    console.error("Register user error:", error);
    return res.status(400).json({
      success: false,
      message: "User with this Ph_no already exists",
      error: error.message,
    });
  }
};

export const userLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  try {
    // Validate input
    if (!email || !password) {
      res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
      return;
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
      return;
    }

    // Check if user has a password (in case it's null)
    if (!user.password) {
      res.status(500).json({ 
        success: false,
        message: 'User password not found in database' 
      });
      return;
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
      return;
    }

    // Generate JWT token
    const accessToken = Security.generateJwtToken(
      { 
        userId: user.userId,
        roles: user.role
      },
      config.security.jwtSecret,
      config.security.accessTokenExpiry
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      User: user,
      accessToken
    });

  } catch (err: any) {
    console.error('User login error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: err.message 
    });
  }
};

export const CompanyLogin = async (req: Request, res: Response) => {
  const { email, password, seoUrl } = req.body;

  try {
    if (!email || !password || !seoUrl) {
      return res.status(400).json({
        success: false,
        message: "Email, password and company URL are required",
      });
    }

    //  Find company by SEO URL
    const company = await Company.findOne({ where: { seoUrl } });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Invalid company URL",
      });
    }

    //  Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    //  Check if user belongs to that company
    if (user.companyId !== company.companyId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to login for this company",
      });
    }

    //  Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    //  Assign role dynamically
    // let updatedRole = user.isManager ? "manager" : "user";
    let updatedRole = user.companyManager ? "manager" : "user";

    // If DB role doesn't match current logic, update it
    if (user.role !== updatedRole) {
      user.role = updatedRole;
      await user.save();
    }

    //  Generate JWT token
    const accessToken = Security.generateJwtToken(
      {
        userId: user.userId,
        roles: updatedRole,
      },
      config.security.jwtSecret,
      config.security.accessTokenExpiry
    );

    //  Response
    res.status(200).json({
      success: true,
      message: "Login successful",
      User: {
        ...user.toJSON(),
        role: updatedRole,
      },
      accessToken,
    });
  } catch (err: any) {
    console.error("User login error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};


// Existing vendor login
export const vendorLogin = async (req: Request, res: Response) => {
  const { email, password, fcm_token } = req.body;
  try {
    const vendor = await Vendor.findOne({ where: { email } });
    if (!vendor) {
        res.status(404).json({ message: 'vendor not found' });
        return;
    }  

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
    }

   
         const updateResult = await vendor.update(
          { fcm_token: fcm_token },
          {
            where: {
              email: email
            }
          }
        );

        console.log("vendor fcm token status: ",updateResult)
  
    
    res.status(200).json({
      id: vendor.vendorId,
      username: vendor.vendorName,
      email: vendor.email,
      accessToken: Security.generateJwtToken(
        { 
          userId: vendor.vendorId,
          roles: vendor.role 
        },
        config.security.jwtSecret,
        config.security.accessTokenExpiry
      )});
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

// Existing owner register
export const ownerRegister = async (req: Request, res: Response) => {
  const { vendorName, email, phno, address, country, state, city } = req.body;
  try {
    const existing = await Vendor.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const owner = await Vendor.create({ vendorName, email, phno, address, country, state, city });

     res.status(201).json({ message: 'Registered successfully', owner })
    } catch (err) {
    res.status(500).json({ error: err });
  }
};

// ========== NEW OTP-BASED LOGIN FUNCTIONS ==========

// Generate and send OTP
export const sendOTP = async (req: Request, res: Response) => {
  const { mobile } = req.body;

  try {
    if (!mobile) {
      res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
      return;
    }

    // Find user by mobile number
    const userResult = await findUserByMobile(mobile);
    
    if (!userResult) {
      res.status(404).json({
        success: false,
        message: 'Mobile number not registered'
      });
      return;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTP for this user
    // await OTP.destroy({
    //   where: {
    //     id: userResult.userId
    //   }
    // });

    // Create new OTP record
    await OTP.create({
      otp,
      id: userResult.userId,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
    });

    // Here you would integrate with SMS service to send OTP
    // For now, we'll just log it (remove this in production)
    console.log(`OTP for ${mobile}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
     role: userResult.role,
    });

  } catch (error: any) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending OTP',
      error: error.message
    });
  }
};

// Verify OTP and login
export const verifyOTPLogin = async (req: Request, res: Response) => {
  const { mobile, otp } = req.body;

  try {
    if (!mobile || !otp) {
      res.status(400).json({
        success: false,
        message: 'Mobile number and OTP are required'
      });
      return;
    }

    // Find user by mobile number first
    const userResult = await findUserByMobile(mobile);
    
    if (!userResult) {
      res.status(404).json({
        success: false,
        message: 'Mobile number not registered'
      });
      return;
    }

    // Find and verify OTP
    const otpRecord = await OTP.findOne({
      where: {
        id: userResult.userId,
        otp: otp,
        expiresAt: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!otpRecord) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
      return;
    }

    // Delete the used OTP
    await OTP.destroy({
      where: {
        otpId: otpRecord.otpId
      }
    });

    // Generate JWT token
    const tokenPayload = {
      userId: userResult.userData.id,
      roles: userResult.userData.role
    };

    const accessToken = Security.generateJwtToken(
      tokenPayload,
      config.security.jwtSecret,
      config.security.accessTokenExpiry
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        ...userResult.userData,
       role: userResult.role
      },
      accessToken
    });

  } catch (error: any) {
    console.error('Verify OTP login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    });
  }
};

// Resend OTP
export const resendOTP = async (req: Request, res: Response) => {
  const { mobile } = req.body;

  try {
    if (!mobile) {
      res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
      return;
    }

    // Find user by mobile number
    const userResult = await findUserByMobile(mobile);
    
    if (!userResult) {
      res.status(404).json({
        success: false,
        message: 'Mobile number not registered'
      });
      return;
    }

    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTP for this user
    await OTP.destroy({
      where: {
        id: userResult.userId
      }
    });

    // Create new OTP record
    await OTP.create({
      otp,
      id: userResult.userId,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
    });

    // Here you would integrate with SMS service to send OTP
    console.log(`Resent OTP for ${mobile}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      // Remove this in production
      otp: otp
    });

  } catch (error: any) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending OTP',
      error: error.message
    });
  }
};

const findUserByEmail = async (email: string) => {
  // Check in User table
  let user;
  user = await User.findOne({ where: { email } });
  if (user) {
    return {
      user,
      userId: user.userId,
      userData: {
        id: user.userId,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    };
  }

  // Check in Vendor table (phno field)
  user = await Vendor.findOne({ where: { email: email } });
  if (user) {
    return {
      user,
      userId: user.vendorId,
      userData: {
        id: user.vendorId,
        username: user.vendorName,
        email: user.email,
        mobile: user.phno,
        role: user.role
      }
    };
  }

  // Check in Drivers table (phno field)
  user = await Employee.findOne({ where: { email: email } });
  if (user) {
    return {
      user,
      userId: user.employeeId,
      userData: {
        id: user.employeeId,
        username: user.username,
        email: user.email,
        mobile: user.phno,
        role: user.role
      }
    };
  }

  return null;
};

export const forgetPasswordSendOtp = async (req: Request, res: Response) => {
  const norm = (v?: string) => (v || "").trim().toLowerCase();
  const email = norm(req.body.email);

  try {
    const emailConfigs = await fetchAllEmailConfs();
    const otpConf = emailConfigs.find((conf: any) => conf.emailCode === "FORGET_PASSWORD_OTP");

    // await, and bail out (generic) if no account
    const userResult = await findUserByEmail(email);
    if (!userResult) {
      // Respond generically to avoid enumeration; do NOT create OTP
      return res.status(200).json({ success: true, message: "If the email exists, an OTP has been sent." });
    }

    const loginId = userResult.userId; // userId | vendorId | employeeId
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // delete old rows by loginId
    await OTP.destroy({ where: { loginId } });

    //  use correct column name loginId
    await OTP.create({
      otp,
      loginId,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    // Send email if template exists
    if (otpConf) {
      await sendEmailFromTemplate(otpConf.emailCode, {
        UserName: userResult.userData.username ?? "",
        UserEmail: userResult.userData.email ?? email,
        OTP: otp,
        WEB_SITE_NAME: "www.gracecabs.com",
        WEB_SITE_EMAIL: "traveldesk@gracecabs.com",
        CONTACT_NO: "+91 98417 22675",
      });
    }
    console.log("otp",otp);
    return res.status(200).json({ success: true, message: "If the email exists, an OTP has been sent." });
  } catch (error: any) {
    console.error("forgetPasswordSendOtp error:", error);
    return res.status(500).json({ success: false, message: "Error sending OTP" });
  }
};

export const verifyOtpPassword = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required." });
    }

    // Find the account (to get loginId)
    const userResult = await findUserByEmail(email);
    if (!userResult) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    const loginId = userResult.userId;

    // Find OTP record
    const record = await OTP.findOne({ where: { loginId } });
    if (!record) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    // Check expiry
    if (new Date(record.expiresAt) < new Date()) {
      await OTP.destroy({ where: { loginId } });
      return res.status(400).json({ success: false, message: "OTP expired." });
    }

    // Match OTP
    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    // Mark OTP as verified (clear it)
    await OTP.update({ otp: null }, { where: { loginId } });

    return res.status(200).json({ success: true, message: "OTP verified successfully." });
  } catch (error: any) {
    console.error("verifyOtpPassword error:", error);
    return res.status(500).json({ success: false, message: "Error verifying OTP" });
  }
};


export const forgetPassword = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // Find account to get loginId
    const userResult = await findUserByEmail(email);
    if (!userResult) {
      return res.status(200).json({ success: true, message: "No matching email found." });
    }

    const loginId = userResult.userId;

    // Check verified OTP marker
    const marker = await OTP.findOne({ where: { loginId } });
    if (!marker || marker.otp !== null || new Date(marker.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: "OTP not verified or expired." });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(password, 10);
    let updated = 0;

    const [emp] = await Employee.update({ password: hashedPassword }, { where: { email } });
    updated += emp;

    if (!updated) {
      const [usr] = await User.update({ password: hashedPassword }, { where: { email } });
      updated += usr;
    }

    if (!updated) {
      const [ven] = await Vendor.update({ password: hashedPassword }, { where: { email } });
      updated += ven;
    }

    // Delete OTP after use
    await OTP.destroy({ where: { loginId } });

    if (!updated) {
      return res.status(200).json({ success: true, message: "No matching email found." });
    }

    return res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (error: any) {
    console.error("forgetPassword error:", error);
    return res.status(500).json({ success: false, message: "Error updating password" });
  }
};


export const changePassword = async (req:Request, res:Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required" });

    const user = await User.findOne({ where: { email } });

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
} catch (err: any) {
  res.status(500).json({ success: false, message: "Error updating password", error: err.message });
}
};


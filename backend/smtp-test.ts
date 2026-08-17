import nodemailer from "nodemailer";

(async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtpout.secureserver.net",
      port: 587,
      secure: false,
      auth: {
        user: "traveldesk@gracecabs.com",
        pass: "gracecabs@2026"
      }
    });

    const info = await transporter.sendMail({
      from: "traveldesk@gracecabs.com",
      to: "test@gmail.com",
      subject: "SMTP Test",
      text: "Hello from GoDaddy SMTP"
    });

    console.log("MAIL SENT:", info.response);
  } catch (err) {
    console.error("SMTP TEST FAILED:", err);
  }
})();

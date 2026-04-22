import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function testEmail() {
  try {
    console.log("Testing email with user:", process.env.EMAIL_USER);
    await transporter.verify();
    console.log("Transporter verification successful!");
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "Test Email from Samvaad AI",
      text: "If you are reading this, the email setup is working correctly!"
    });
    console.log("Test email sent:", info.messageId);
  } catch (error) {
    console.error("Test email failed:", error);
  }
}

testEmail();

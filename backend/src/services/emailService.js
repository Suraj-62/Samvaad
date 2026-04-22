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

/**
 * Sends a pending registration email to the student.
 */
export const sendPendingEmail = async (details) => {
  const { name, email, role, topic, slot } = details;
  const mailOptions = {
    from: `"Samvaad AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Interview Request Pending: ${topic}`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
        <h2 style="color: #f59e0b;">Booking Request Received</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your request for a mock interview has been received. We are currently waiting for the assigned interviewer to confirm the slot.</p>
        
        <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fef3c7;">
          <p style="margin: 0;"><strong>Round:</strong> ${topic}</p>
          <p style="margin: 0;"><strong>Role:</strong> ${role}</p>
          <p style="margin: 0;"><strong>Requested Time:</strong> ${slot}</p>
          <p style="margin: 10px 0 0 0; color: #b45309; font-weight: bold;">Status: PENDING CONFIRMATION</p>
        </div>

        <p>You will receive another email with the <strong>Join Link</strong> once the interviewer accepts your request. Please keep an eye on your inbox.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.8rem; color: #999;">Samvaad AI | Intelligent Mock Interviews</p>
      </div>
    `
  };
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) await transporter.sendMail(mailOptions);
    else console.log("[MOCK PENDING EMAIL]", email);
  } catch (err) { console.error(err); }
};

/**
 * Sends a confirmation email to the student once the interviewer accepts.
 */
export const sendConfirmationEmail = async (details) => {
  const { name, email, slot, meetingId, meetingPassword } = details;
  const meetingLink = `http://localhost:5173/human-mock?name=${encodeURIComponent(name)}&mid=${meetingId}`;

  const mailOptions = {
    from: `"Samvaad AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Interview CONFIRMED: ${slot}`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
        <h2 style="color: #10b981;">Your Interview is Confirmed!</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Great news! Your interviewer has accepted your request. Your session is now officially scheduled.</p>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #dcfce7;">
          <p style="margin: 0;"><strong>Scheduled Time:</strong> ${slot}</p>
          <p style="margin: 0;"><strong>Meeting ID:</strong> <span style="font-family: monospace;">${meetingId}</span></p>
          <p style="margin: 0;"><strong>Password:</strong> <span style="font-family: monospace;">${meetingPassword}</span></p>
        </div>

        <p>You can join the meeting using the button below:</p>
        <a href="${meetingLink}" style="display: inline-block; background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Meeting Now</a>
        
        <p style="font-size: 0.9rem; color: #666; margin-top: 20px;"><em>Please be ready 5 minutes before the scheduled time.</em></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.8rem; color: #999;">Samvaad AI | Premium Interview Intelligence</p>
      </div>
    `
  };
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) await transporter.sendMail(mailOptions);
    else console.log("[MOCK CONFIRM EMAIL]", email);
  } catch (err) { console.error(err); }
};

/**
 * Sends an alert to the interviewer when a student requests a slot.
 */
export const sendInterviewerAlertEmail = async (interviewerEmail, details) => {
  const { name, email, role, topic, slot, bookingId } = details;
  const confirmLink = `http://localhost:5000/api/interview/public/confirm-booking/${bookingId}`;
  const rejectLink = `http://localhost:5000/api/interview/public/reject-booking/${bookingId}`;
  const dashboardLink = `http://localhost:5173/interviewer-dashboard`;

  const mailOptions = {
    from: `"Samvaad AI - Action Required" <${process.env.EMAIL_USER}>`,
    to: interviewerEmail,
    subject: `Action Required: New Interview Request from ${name}`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
        <h2 style="color: #4f46e5;">New Booking Request</h2>
        <p>A student has requested a mock interview during one of your available slots.</p>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
          <p style="margin: 0;"><strong>Student:</strong> ${name}</p>
          <p style="margin: 0;"><strong>Role:</strong> ${role}</p>
          <p style="margin: 0;"><strong>Type:</strong> ${topic}</p>
          <p style="margin: 0;"><strong>Time:</strong> ${slot}</p>
        </div>

        <p>Please take an action below to process this request immediately:</p>
        
        <div style="margin: 30px 0; display: flex; gap: 15px;">
          <a href="${confirmLink}" style="display: inline-block; background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">Accept Interview</a>
          <a href="${rejectLink}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reject Request</a>
        </div>

        <p style="font-size: 0.9rem; color: #666;">Or you can manage all your bookings from your dashboard:</p>
        <a href="${dashboardLink}" style="color: #4f46e5; text-decoration: underline;">Open Interviewer Dashboard</a>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.8rem; color: #999;">This is an automated request from Samvaad AI.</p>
      </div>
    `
  };
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) await transporter.sendMail(mailOptions);
    else console.log("[MOCK ALERT EMAIL]", interviewerEmail);
  } catch (err) { console.error(err); }
};

// ... keep existing sendRegistrationEmail and sendApprovalEmail if needed
export const sendRegistrationEmail = async (email, name) => {
  const mailOptions = {
    from: `"Samvaad Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Registration Received",
    html: `<h1>Hello, ${name}!</h1><p>Thank you for registering as an interviewer. Your account is pending admin approval.</p>`,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error(err);
  }
};

export const sendApprovalEmail = async (email, name) => {
  const mailOptions = {
    from: `"Samvaad Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Account Approved",
    html: `<h1>Welcome, ${name}!</h1><p>Your interviewer account has been approved. You can now log in and add slots.</p>`,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error(err);
  }
};

export const sendGroupInvitationEmail = async (details) => {
  const { hostName, email, topic, meetingId, meetingPassword } = details;
  const meetingLink = `http://localhost:5173/group-discussion?mid=${meetingId}`;

  const mailOptions = {
    from: `"Samvaad Group Discussion" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Invitation: Group Discussion with ${hostName}`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
        <h2 style="color: #8b5cf6;">Group Discussion Invitation</h2>
        <p>Hello,</p>
        <p><strong>${hostName}</strong> has invited you to join a Group Discussion session on Samvaad.</p>
        
        <div style="background: #f5f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ddd6fe;">
          <p style="margin: 0;"><strong>Topic:</strong> ${topic}</p>
          <p style="margin: 0;"><strong>Meeting ID:</strong> <span style="font-family: monospace;">${meetingId}</span></p>
          <p style="margin: 0;"><strong>Password:</strong> <span style="font-family: monospace;">${meetingPassword}</span></p>
        </div>

        <p>You can join the discussion using the button below:</p>
        <a href="${meetingLink}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Discussion Now</a>
        
        <p style="font-size: 0.9rem; color: #666; margin-top: 20px;"><em>Make sure you have a working microphone and camera.</em></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.8rem; color: #999;">Samvaad | Collaborative Interview Prep</p>
      </div>
    `
  };
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) await transporter.sendMail(mailOptions);
  } catch (err) { console.error(err); }
};

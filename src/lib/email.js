import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
};

// Verify configuration
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️  Email credentials not configured. Email features will not work.');
}

// Create reusable transporter
let transporter = null;

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport(emailConfig);
    }
    return transporter;
}

/**
 * Send email using configured SMTP
 */
export async function sendEmail({ to, subject, html, text }) {
    try {
        const transporter = getTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'AI Interviewer <noreply@aiinterviewer.com>',
            to,
            subject,
            text,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email send error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send OTP verification email
 */
export async function sendOTPEmail(email, name, otp) {
    const subject = 'Verify Your Email - AI Interviewer';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          display: inline-block;
          padding: 12px 20px;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          color: white;
          font-size: 24px;
          font-weight: bold;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        h1 {
          color: #1e293b;
          font-size: 28px;
          margin: 0 0 10px 0;
        }
        .otp-box {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-code {
          font-size: 42px;
          font-weight: bold;
          color: #2563eb;
          letter-spacing: 8px;
          margin: 10px 0;
          font-family: 'Courier New', monospace;
        }
        .otp-label {
          font-size: 14px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
        }
        .content {
          color: #475569;
          font-size: 16px;
          line-height: 1.8;
        }
        .warning {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🧠 AI Interviewer</div>
          <h1>Verify Your Email</h1>
        </div>
        
        <div class="content">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Thank you for registering with AI Interviewer! To complete your registration, please verify your email address.</p>
        </div>

        <div class="otp-box">
          <div class="otp-label">Your Verification Code</div>
          <div class="otp-code">${otp}</div>
          <p style="margin: 10px 0 0 0; color: #64748b; font-size: 14px;">
            Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes
          </p>
        </div>

        <div class="content">
          <p>Enter this code in the verification page to activate your account and start uploading your resume.</p>
        </div>

        <div class="warning">
          <strong>⚠️ Security Note:</strong> Never share this code with anyone. Our team will never ask for your verification code.
        </div>

        <div class="footer">
          <p>If you didn't create an account, please ignore this email.</p>
          <p style="margin-top: 20px;">
            <strong>AI Interviewer</strong><br>
            Your AI-Powered Interview Platform
          </p>
          <p style="margin-top: 20px; font-size: 12px;">
            © ${new Date().getFullYear()} AI Interviewer. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

    const text = `
    Hi ${name},
    
    Thank you for registering with AI Interviewer!
    
    Your verification code is: ${otp}
    
    This code will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.
    
    If you didn't create an account, please ignore this email.
    
    Best regards,
    AI Interviewer Team
  `;

    return await sendEmail({ to: email, subject, html, text });
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(email, name) {
    const subject = 'Welcome to AI Interviewer! 🎉';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 40px;
          border-radius: 8px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          display: inline-block;
          padding: 12px 20px;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          color: white;
          font-size: 24px;
          font-weight: bold;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        h1 {
          color: #1e293b;
          font-size: 28px;
        }
        .content {
          color: #475569;
          font-size: 16px;
          line-height: 1.8;
        }
        .next-steps {
          background: #f8fafc;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .step {
          margin: 15px 0;
          padding-left: 30px;
          position: relative;
        }
        .step-number {
          position: absolute;
          left: 0;
          top: 0;
          background: #3b82f6;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🧠 AI Interviewer</div>
          <h1>Welcome Aboard! 🎉</h1>
        </div>
        
        <div class="content">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Congratulations! Your email has been verified successfully. You're now ready to experience the future of interviews with AI.</p>
          
          <div class="next-steps">
            <h3 style="margin-top: 0; color: #1e293b;">Next Steps:</h3>
            
            <div class="step">
              <div class="step-number">1</div>
              <strong>Upload Your Resume</strong><br>
              <span style="color: #64748b;">Upload your resume in PDF format for automatic parsing</span>
            </div>
            
            <div class="step">
              <div class="step-number">2</div>
              <strong>Review Parsed Information</strong><br>
              <span style="color: #64748b;">Check and edit your automatically extracted details</span>
            </div>
            
            <div class="step">
              <div class="step-number">3</div>
              <strong>Start Taking Interviews</strong><br>
              <span style="color: #64748b;">Begin your AI-powered interview journey</span>
            </div>
          </div>

          <p style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Go to Dashboard</a>
          </p>

          <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 14px;">
          <p>Happy interviewing!</p>
          <p><strong>The AI Interviewer Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;

    const text = `
    Welcome to AI Interviewer, ${name}!
    
    Your email has been verified successfully.
    
    Next Steps:
    1. Upload your resume in PDF format
    2. Review the parsed information
    3. Start taking AI-powered interviews
    
    Visit your dashboard: ${process.env.NEXTAUTH_URL}/dashboard
    
    Best regards,
    AI Interviewer Team
  `;

    return await sendEmail({ to: email, subject, html, text });
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig() {
    try {
        const transporter = getTransporter();
        await transporter.verify();
        console.log('✅ Email server is ready to send messages');
        return true;
    } catch (error) {
        console.error('❌ Email server verification failed:', error);
        return false;
    }
}

export default {
    sendEmail,
    sendOTPEmail,
    sendWelcomeEmail,
    verifyEmailConfig,
};

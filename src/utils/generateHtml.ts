export function generateHtml(name:string, otp:number) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>OTP Verification</title>
      <style>
        body {
          font-family: 'Segoe UI', sans-serif;
          background: #f4f4f4;
          padding: 0;
          margin: 0;
        }

        .email-container {
          max-width: 500px;
          margin: 40px auto;
          background: white;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }

        .header {
          background: #2f80ed;
          color: white;
          padding: 20px;
          text-align: center;
        }

        .header h1 {
          margin: 0;
          font-size: 22px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .content {
          padding: 30px 20px;
          color: #333;
          font-size: 16px;
          line-height: 1.6;
          text-align: center;
        }

        .otp {
          display: inline-block;
          background: #f0f4ff;
          color: #2f80ed;
          font-weight: bold;
          font-size: 28px;
          padding: 12px 24px;
          border-radius: 10px;
          margin: 20px 0;
          letter-spacing: 5px;
        }

        .footer {
          padding: 20px;
          text-align: center;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          background-color: rgba(255, 255, 255, 0.1);
          color: #555;
        }

        .footer p {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>QUICKCHAT OTP VERIFICATION</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>To complete your verification, please use the OTP below:</p>
          <div class="otp">${otp}</div>
          <p>This OTP will expire in 2 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>✨ Thank you for using QuickChat ✨</p>
        </div>
      </div>
    </body>
  </html>
  `;
}


export const template = (code, name, subject) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:10px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #dddddd;">
          <tr>
            <td style="background-color:#007BFF; color:#ffffff; text-align:center; padding:20px;">
              <h1 style="margin:0; font-size:24px;">${subject}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px; color:#333333; line-height:1.6;">
              <h2 style="color:#007BFF; margin-top:0;">Hello ${name},</h2>
              <p>Thank you for signing up with Saraha. To complete your registration and start using your account, please use the code below:</p>
              <div style="display:inline-block; background-color:#007BFF; color:#ffffff; text-decoration:none; padding:10px 20px; border-radius:5px; font-size:16px; margin:20px 0; font-weight:bold;">
                ${code}                
              </div>
              <p style="font-weight:bold;">Code will expire in ${
                process.env.OTP_EXPIRATION / 60000
              } minutes</p>
              <p>If you did not sign up for this account, please ignore this email.</p>
              <p>Best regards,<br>Saraha Team</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f4f4f4; text-align:center; padding:15px; font-size:14px; color:#777777;">
              &copy; 2024 Saraha. All rights reserved.
              <br>
              <a href="[SupportLink]" style="color:#007BFF; text-decoration:none;">Contact Support</a> | 
              <a href="[UnsubscribeLink]" style="color:#007BFF; text-decoration:none;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

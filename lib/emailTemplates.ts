export function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function welcomeHtml(name: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Welcome to 5GM Gold</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:48px 24px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="padding-bottom:32px;border-bottom:1px solid rgba(255,255,255,0.07);text-align:center;">
            <img src="https://5gmgold.com/logo.png" alt="5GM Gold" width="84" height="84" style="width:84px;height:84px;display:block;margin:0 auto;" />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 0;">
            <p style="margin:0 0 16px;font-size:24px;font-weight:600;color:#f5f5f7;">Welcome${name ? `, ${name}` : ''}.</p>
            <p style="margin:0 0 24px;font-size:15px;color:#8e8e9a;line-height:1.7;">You're in. Your account is active and your private command centre is ready. Head to the dashboard to access live sessions, trade reviews, and the full programme.</p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:linear-gradient(135deg,#b8932e,#e8c96d,#c9a84c);border-radius:6px;">
                  <a href="https://5gmgold.com/dashboard" style="display:inline-block;padding:12px 28px;color:#0a0a0b;font-size:14px;font-weight:600;text-decoration:none;">Go to Dashboard</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="border-top:1px solid rgba(255,255,255,0.07);padding-top:32px;">
          <p style="margin:0;font-size:12px;color:#5a5a66;line-height:1.6;">
            If you have any questions, reply to this email.<br/>
            5GM Gold &mdash; Built for serious traders.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function inviteHtml(email: string, tempPassword: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>5GM Gold — Access Granted</title></head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:48px 24px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td style="padding-bottom:32px;border-bottom:1px solid rgba(255,255,255,0.07);text-align:center;">
            <img src="https://5gmgold.com/logo.png" alt="5GM Gold" width="84" height="84" style="width:84px;height:84px;display:block;margin:0 auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:40px 0;">
            <p style="margin:0 0 16px;font-size:22px;font-weight:600;color:#f5f5f7;">You've been granted access.</p>
            <p style="margin:0 0 24px;font-size:15px;color:#8e8e9a;line-height:1.7;">An account has been created for <strong style="color:#f5f5f7;">${email}</strong>. Use the credentials below to log in, then change your password from the dashboard.</p>
            <table cellpadding="0" cellspacing="0" style="background:#111113;border:1px solid rgba(201,168,76,0.28);border-radius:8px;padding:20px 24px;margin-bottom:24px;">
              <tr><td>
                <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;color:#5a5a66;">TEMPORARY PASSWORD</p>
                <p style="margin:0;font-size:18px;font-weight:600;color:#c9a84c;font-family:'Courier New',monospace;">${tempPassword}</p>
              </td></tr>
            </table>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:linear-gradient(135deg,#b8932e,#e8c96d,#c9a84c);border-radius:6px;">
                  <a href="https://5gmgold.com/login" style="display:inline-block;padding:12px 28px;color:#0a0a0b;font-size:14px;font-weight:600;text-decoration:none;">Log In Now</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="border-top:1px solid rgba(255,255,255,0.07);padding-top:32px;">
          <p style="margin:0;font-size:12px;color:#5a5a66;">If you didn't expect this email, ignore it.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// title/body are expected pre-escaped by the caller when they come from
// free-text admin input — kept as a separate step so a live client-side
// preview can render the exact same markup the sent email will use.
export function announcementHtml(title: string, body: string, bannerUrl?: string | null) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:48px 24px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        ${bannerUrl ? `<!-- Banner -->
        <tr>
          <td style="padding-bottom:24px;">
            <img src="${escapeHtml(bannerUrl)}" alt="" width="560" style="width:100%;max-width:560px;height:auto;display:block;border-radius:12px;border:1px solid rgba(201,168,76,0.18);" />
          </td>
        </tr>` : ''}

        <!-- Header -->
        <tr>
          <td style="padding-bottom:32px;border-bottom:1px solid rgba(255,255,255,0.07);text-align:center;">
            <p style="margin:0 0 16px;font-size:11px;letter-spacing:5px;color:#5a5a66;text-transform:uppercase;">New Announcement</p>
            <img src="https://5gmgold.com/logo.png" alt="5GM Gold" width="84" height="84" style="width:84px;height:84px;display:block;margin:0 auto;" />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 0;">
            <p style="margin:0 0 16px;font-size:22px;font-weight:600;color:#f5f5f7;">${title}</p>
            <p style="margin:0 0 24px;font-size:15px;color:#8e8e9a;line-height:1.7;white-space:pre-wrap;">${body}</p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:linear-gradient(135deg,#b8932e,#e8c96d,#c9a84c);border-radius:6px;">
                  <a href="https://5gmgold.com/dashboard/announcements" style="display:inline-block;padding:12px 28px;color:#0a0a0b;font-size:14px;font-weight:600;text-decoration:none;">View on Dashboard</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="border-top:1px solid rgba(255,255,255,0.07);padding-top:32px;">
          <p style="margin:0;font-size:12px;color:#5a5a66;line-height:1.6;">
            You're receiving this because you have a 5GM Gold account.<br/>
            5GM Gold &mdash; Built for serious traders.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

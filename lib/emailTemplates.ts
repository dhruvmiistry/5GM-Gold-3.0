export function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ── Mentor call booking emails ─────────────────────────────────────────
// Shared skeleton (same header/footer/CTA-button skeleton as the other
// templates in this file) so the 7 booking-lifecycle emails don't each
// repeat ~30 lines of identical table markup.

interface BookingEmailOptions {
  title: string
  eyebrow?: string
  headline: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
}

function bookingEmailSkeleton({ title, eyebrow, headline, bodyHtml, ctaLabel, ctaUrl }: BookingEmailOptions) {
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

        <!-- Header -->
        <tr>
          <td style="padding-bottom:32px;border-bottom:1px solid rgba(255,255,255,0.07);text-align:center;">
            ${eyebrow ? `<p style="margin:0 0 16px;font-size:11px;letter-spacing:5px;color:#5a5a66;text-transform:uppercase;">${eyebrow}</p>` : ''}
            <img src="https://5gmgold.com/logo.png" alt="5GM Gold" width="84" height="84" style="width:84px;height:84px;display:block;margin:0 auto;" />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 0;">
            <p style="margin:0 0 16px;font-size:22px;font-weight:600;color:#f5f5f7;">${headline}</p>
            ${bodyHtml}
            ${ctaLabel && ctaUrl ? `<table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:linear-gradient(135deg,#b8932e,#e8c96d,#c9a84c);border-radius:6px;">
                  <a href="${ctaUrl}" style="display:inline-block;padding:12px 28px;color:#0a0a0b;font-size:14px;font-weight:600;text-decoration:none;">${ctaLabel}</a>
                </td>
              </tr>
            </table>` : ''}
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

// A dark "fact table" block used across the booking emails for the
// mentor/date/time/duration summary — kept as one helper so every email
// lays this out identically.
function detailsBlockHtml(rows: Array<[string, string]>) {
  return `<table cellpadding="0" cellspacing="0" style="background:#111113;border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:20px 24px;margin:0 0 24px;width:100%;">
    ${rows.map(([label, value]) => `<tr><td style="padding:6px 0;">
      <span style="display:inline-block;width:110px;font-size:11px;letter-spacing:1px;color:#5a5a66;text-transform:uppercase;vertical-align:top;">${escapeHtml(label)}</span>
      <span style="font-size:14px;color:#f5f5f7;">${value}</span>
    </td></tr>`).join('')}
  </table>`
}

// Formats a UTC instant into recipient-appropriate wall-clock text.
// Native Intl.DateTimeFormat handles the IANA-timezone conversion — no
// extra dependency needed for display-only formatting (as opposed to the
// wall-time -> UTC direction in lib/mentorCalls/availability.ts, which
// does need date-fns-tz).
export function formatBookingTime(date: Date, timezone: string) {
  const dateLabel = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeZone: timezone }).format(date)
  const timeLabel = new Intl.DateTimeFormat('en-GB', { timeStyle: 'short', timeZone: timezone }).format(date)
  const tzLabel = new Intl.DateTimeFormat('en-GB', { timeZoneName: 'short', timeZone: timezone })
    .formatToParts(date).find(p => p.type === 'timeZoneName')?.value ?? timezone
  return { dateLabel, timeLabel: `${timeLabel} ${tzLabel}` }
}

interface BookingSummary {
  recipientName: string
  otherPartyName: string // mentor name (member's email) or member name (mentor's email)
  otherPartyLabel: string // "Mentor" or "Member"
  startAt: Date
  durationMinutes: number
  timezone: string // recipient-appropriate — member default (Europe/London
                    // until Phase B stores a per-member preference) or the
                    // mentor's own configured timezone
  manageUrl: string
}

function summaryRows(b: BookingSummary): Array<[string, string]> {
  const { dateLabel, timeLabel } = formatBookingTime(b.startAt, b.timezone)
  return [
    [b.otherPartyLabel, escapeHtml(b.otherPartyName)],
    ['Date', dateLabel],
    ['Time', timeLabel],
    ['Duration', `${b.durationMinutes} minutes`],
  ]
}

// Light acknowledgment sent at submission — the real confirmation follows
// once admin assigns a mentor (bookingConfirmedHtml below).
export function requestReceivedHtml(b: Omit<BookingSummary, 'otherPartyName' | 'otherPartyLabel'>) {
  const { dateLabel, timeLabel } = formatBookingTime(b.startAt, b.timezone)
  return bookingEmailSkeleton({
    title: 'Request received — 5GM Gold',
    eyebrow: 'Mentor Call',
    headline: `Thanks, ${escapeHtml(b.recipientName)} — we've got your request.`,
    bodyHtml: `<p style="margin:0 0 24px;font-size:15px;color:#8e8e9a;line-height:1.7;">
        Your call is booked for <strong style="color:#f5f5f7;">${dateLabel} at ${timeLabel}</strong>.
        We're matching you with a mentor now — you'll get a confirmation email as soon as one's assigned.
      </p>`,
    ctaLabel: 'View My Calls',
    ctaUrl: b.manageUrl,
  })
}

// The real confirmation — sent once admin assigns a mentor.
export function bookingConfirmedHtml(b: BookingSummary) {
  return bookingEmailSkeleton({
    title: "You're confirmed — 5GM Gold",
    eyebrow: 'Mentor Call Confirmed',
    headline: `You're confirmed, ${escapeHtml(b.recipientName)}.`,
    bodyHtml: `<p style="margin:0 0 24px;font-size:15px;color:#8e8e9a;line-height:1.7;">
        Your mentor call is locked in. Joining details will follow separately before the call.
      </p>
      ${detailsBlockHtml(summaryRows(b))}`,
    ctaLabel: 'View Booking',
    ctaUrl: b.manageUrl,
  })
}

// To the mentor, once assigned — includes the member's optional context.
export function mentorAssignedHtml(b: BookingSummary, context: { tradingExperience?: string | null; mainChallenge?: string | null; discussTopic?: string | null }) {
  const contextRows: string[] = []
  if (context.tradingExperience) contextRows.push(`<p style="margin:0 0 8px;font-size:13px;color:#8e8e9a;"><strong style="color:#f5f5f7;">Experience:</strong> ${escapeHtml(context.tradingExperience)}</p>`)
  if (context.mainChallenge) contextRows.push(`<p style="margin:0 0 8px;font-size:13px;color:#8e8e9a;"><strong style="color:#f5f5f7;">Main challenge:</strong> ${escapeHtml(context.mainChallenge)}</p>`)
  if (context.discussTopic) contextRows.push(`<p style="margin:0 0 8px;font-size:13px;color:#8e8e9a;"><strong style="color:#f5f5f7;">Wants to discuss:</strong> ${escapeHtml(context.discussTopic)}</p>`)

  return bookingEmailSkeleton({
    title: 'New call assigned — 5GM Gold',
    eyebrow: 'New Assignment',
    headline: `You've been assigned a call.`,
    bodyHtml: `${detailsBlockHtml(summaryRows(b))}
      ${contextRows.length ? contextRows.join('') : ''}`,
    ctaLabel: 'View in Mentor Portal',
    ctaUrl: b.manageUrl,
  })
}

export function meetingDetailsHtml(b: BookingSummary, meetingUrl: string, meetingId?: string | null, passcode?: string | null) {
  const rows = summaryRows(b)
  return bookingEmailSkeleton({
    title: 'Joining details — 5GM Gold',
    eyebrow: 'Joining Details',
    headline: `Here's how to join your call.`,
    bodyHtml: `${detailsBlockHtml(rows)}
      <table cellpadding="0" cellspacing="0" style="background:#111113;border:1px solid rgba(201,168,76,0.28);border-radius:8px;padding:20px 24px;margin:0 0 24px;width:100%;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;color:#5a5a66;text-transform:uppercase;">Meeting Link</p>
          <p style="margin:0 0 16px;font-size:14px;"><a href="${escapeHtml(meetingUrl)}" style="color:#c9a84c;">${escapeHtml(meetingUrl)}</a></p>
          ${meetingId ? `<p style="margin:0 0 4px;font-size:13px;color:#8e8e9a;">Meeting ID: <span style="color:#f5f5f7;">${escapeHtml(meetingId)}</span></p>` : ''}
          ${passcode ? `<p style="margin:0;font-size:13px;color:#8e8e9a;">Passcode: <span style="color:#f5f5f7;">${escapeHtml(passcode)}</span></p>` : ''}
        </td></tr>
      </table>`,
    ctaLabel: 'View Booking',
    ctaUrl: b.manageUrl,
  })
}

export function bookingCancellationHtml(b: BookingSummary, refunded: boolean) {
  return bookingEmailSkeleton({
    title: 'Call cancelled — 5GM Gold',
    eyebrow: 'Cancelled',
    headline: 'Your call has been cancelled.',
    bodyHtml: `${detailsBlockHtml(summaryRows(b))}
      <p style="margin:0 0 24px;font-size:15px;color:#8e8e9a;line-height:1.7;">
        ${refunded ? 'Your call credit has been refunded and is available to book another time.' : 'This cancellation was inside the notice window, so the call credit was not refunded.'}
      </p>`,
    ctaLabel: 'Book Another Call',
    ctaUrl: b.manageUrl,
  })
}

export function bookingRescheduleHtml(b: BookingSummary) {
  return bookingEmailSkeleton({
    title: 'Call rescheduled — 5GM Gold',
    eyebrow: 'Rescheduled',
    headline: 'Your call has a new time.',
    bodyHtml: `${detailsBlockHtml(summaryRows(b))}
      <p style="margin:0 0 24px;font-size:15px;color:#8e8e9a;line-height:1.7;">No extra credit was charged for this change.</p>`,
    ctaLabel: 'View Booking',
    ctaUrl: b.manageUrl,
  })
}

export function bookingReminderHtml(b: BookingSummary, leadLabel: '24 hours' | '1 hour', meetingUrl?: string | null) {
  return bookingEmailSkeleton({
    title: `Reminder — call in ${leadLabel}`,
    eyebrow: 'Reminder',
    headline: `Your call is in ${leadLabel}.`,
    bodyHtml: `${detailsBlockHtml(summaryRows(b))}
      ${meetingUrl
        ? `<p style="margin:0 0 24px;font-size:15px;color:#8e8e9a;line-height:1.7;">Join here: <a href="${escapeHtml(meetingUrl)}" style="color:#c9a84c;">${escapeHtml(meetingUrl)}</a></p>`
        : `<p style="margin:0 0 24px;font-size:15px;color:#8e8e9a;line-height:1.7;">Joining details haven't been added yet — check back closer to the call.</p>`}`,
    ctaLabel: 'View Booking',
    ctaUrl: b.manageUrl,
  })
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

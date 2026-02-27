import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

// Lazy-initialize so the client is only created at request time, not build time
let _resend: Resend | null = null;
function getResend(): Resend {
	if (!_resend) _resend = new Resend(env.RESEND_API_KEY);
	return _resend;
}

export interface BookingConfirmationData {
	to: string;
	name: string;
	bookingRef: string;
	date: string;
	startTime: string;
	endTime: string;
	adults: number;
	kids: number;
}

export async function sendBookingConfirmation(data: BookingConfirmationData) {
	return getResend().emails.send({
		from: env.FROM_EMAIL,
		to: data.to,
		subject: `Booking Confirmed – The Russell Farm (${data.bookingRef})`,
		html: buildConfirmationHtml(data)
	});
}

export async function sendBookingCancelled(data: BookingConfirmationData) {
	return getResend().emails.send({
		from: env.FROM_EMAIL,
		to: data.to,
		subject: `Booking Cancelled – The Russell Farm (${data.bookingRef})`,
		html: buildCancelledHtml(data)
	});
}

function buildCancelledHtml(data: BookingConfirmationData): string {
	return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f5ee;font-family:Georgia,serif;color:#2c2c2c;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td>
      <table width="600" align="center" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:8px;overflow:hidden;max-width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#8b1a1a;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#f9f5ee;font-size:26px;font-family:Georgia,serif;">
              The Russell Farm
            </h1>
            <p style="margin:6px 0 0;color:#f0a0a0;font-size:14px;font-family:sans-serif;">
              Booking Cancellation
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="color:#8b1a1a;margin-top:0;font-family:Georgia,serif;">
              Your booking has been cancelled
            </h2>
            <p style="font-family:sans-serif;line-height:1.6;">
              Hi ${data.name},
            </p>
            <p style="font-family:sans-serif;line-height:1.6;">
              We're sorry to let you know that your booking has been cancelled.
              Please contact us if you have any questions or would like to rebook.
            </p>

            <!-- Booking details box -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f9f5ee;border-radius:6px;border-left:4px solid #8b1a1a;margin:24px 0;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="6" cellspacing="0"
                    style="font-family:sans-serif;font-size:15px;">
                    <tr>
                      <td style="color:#6b6355;width:40%;">Booking Reference</td>
                      <td style="font-weight:bold;color:#8b1a1a;font-size:17px;">${data.bookingRef}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b6355;">Date</td>
                      <td style="font-weight:600;">${data.date}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b6355;">Time</td>
                      <td style="font-weight:600;">${data.startTime} – ${data.endTime}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="font-family:sans-serif;line-height:1.6;color:#6b6355;font-size:14px;">
              Questions? Simply reply to this email and we'll get back to you.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#ede6d6;padding:20px 40px;text-align:center;
            font-family:sans-serif;font-size:13px;color:#6b6355;
            border-top:1px solid #d4c9b0;">
            <p style="margin:0;">
              — The Russell Family
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildConfirmationHtml(data: BookingConfirmationData): string {
	return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f5ee;font-family:Georgia,serif;color:#2c2c2c;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td>
      <table width="600" align="center" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:8px;overflow:hidden;max-width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#2d5a27;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#f9f5ee;font-size:26px;font-family:Georgia,serif;">
              The Russell Farm
            </h1>
            <p style="margin:6px 0 0;color:#a8d5a0;font-size:14px;font-family:sans-serif;">
              Christmas Tree Experience
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="color:#2d5a27;margin-top:0;font-family:Georgia,serif;">
              Your booking is confirmed! 🌲
            </h2>
            <p style="font-family:sans-serif;line-height:1.6;">
              Hi ${data.name},
            </p>
            <p style="font-family:sans-serif;line-height:1.6;">
              We can't wait to welcome your family to The Russell Farm.
              Bring your boots and your holiday spirit — it's going to be a wonderful time!
            </p>

            <!-- Booking details box -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f9f5ee;border-radius:6px;border-left:4px solid #2d5a27;margin:24px 0;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="6" cellspacing="0"
                    style="font-family:sans-serif;font-size:15px;">
                    <tr>
                      <td style="color:#6b6355;width:40%;">Booking Reference</td>
                      <td style="font-weight:bold;color:#2d5a27;font-size:17px;">${data.bookingRef}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b6355;">Date</td>
                      <td style="font-weight:600;">${data.date}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b6355;">Time</td>
                      <td style="font-weight:600;">${data.startTime} – ${data.endTime}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b6355;">Adults</td>
                      <td>${data.adults}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b6355;">Children</td>
                      <td>${data.kids}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="font-family:sans-serif;line-height:1.6;">
              Please save your booking reference number. You may be asked for it when you arrive.
            </p>
            <p style="font-family:sans-serif;line-height:1.6;color:#6b6355;font-size:14px;">
              Questions? Simply reply to this email and we'll get back to you.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#ede6d6;padding:20px 40px;text-align:center;
            font-family:sans-serif;font-size:13px;color:#6b6355;
            border-top:1px solid #d4c9b0;">
            <p style="margin:0;">
              See you soon! — The Russell Family
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

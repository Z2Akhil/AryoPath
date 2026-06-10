import fs from 'fs/promises';
import path from 'path';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const PORTAL_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/doctor`;

const FROM = `${process.env.SMTP_FROM_NAME || 'Ayropath'} <${process.env.FROM_EMAIL || 'admin@ayropath.com'}>`;

function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

function getSmtpTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || '465'),
    secure: (process.env.SMTP_PORT || '465') === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });
}

async function sendMail(to: string, subject: string, html: string, attempt = 1): Promise<void> {
  if (!to) return;
  try {
    const { data, error } = await getResend().emails.send({ from: FROM, to, subject, html });
    if (error) throw error;
    console.log(`[Email/Resend] Sent to ${to}: ${data?.id}`);
  } catch (resendErr: any) {
    const isRateLimit = resendErr?.statusCode === 429 || /rate.?limit|too many/i.test(resendErr?.message ?? '');
    if (isRateLimit && attempt < 3) {
      await new Promise(r => setTimeout(r, 300 * attempt));
      return sendMail(to, subject, html, attempt + 1);
    }
    console.warn(`[Email/Resend] Failed (attempt ${attempt}), falling back to SMTP:`, resendErr?.message ?? resendErr);
    try {
      const r = await getSmtpTransporter().sendMail({ from: FROM, to, subject, html });
      console.log(`[Email/SMTP] Sent to ${to}: ${r.messageId}`);
    } catch (smtpErr) {
      console.error(`[Email/SMTP] Also failed to ${to}:`, smtpErr);
    }
  }
}

function formatTime12h(time: string): string {
  if (/AM|PM/i.test(time)) return time;
  const m = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return time;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const meridiem = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${min} ${meridiem}`;
}

async function render(name: string, vars: Record<string, string>): Promise<string> {
  const filePath = path.join(process.cwd(), 'lib/templates/email', `${name}.html`);
  let html = await fs.readFile(filePath, 'utf-8');
  for (const [key, val] of Object.entries(vars)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val ?? '');
  }
  return html;
}

function buildItemsHtml(items: any[]): string {
  return items.map(it => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${it.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:13px;">${it.quantity ?? it.qty ?? 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px;">₹${Number(it.offerPrice ?? it.price ?? 0).toLocaleString('en-IN')}</td>
    </tr>`).join('');
}

function buildPrescriptionHtml(prescription: any): string {
  if (!prescription?.medicines?.length) return '';
  const rows = prescription.medicines.map((m: any) => `
    <tr>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;font-weight:600;font-size:13px;">${m.name}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;font-size:13px;">${m.dose || '—'}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;font-size:13px;">${m.frequency || '—'}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;font-size:13px;">${m.duration || '—'}</td>
    </tr>`).join('');
  return `
    <div style="margin-top:24px;border-top:1px solid #e9ecef;padding-top:20px;">
      <h3 style="color:#2c5aa0;margin:0 0 12px;font-size:15px;">Prescription</h3>
      ${prescription.notes ? `<p style="background:#f0f7ff;border-left:4px solid #2c5aa0;padding:10px 14px;border-radius:0 6px 6px 0;color:#444;margin:0 0 14px;font-size:13px;">${prescription.notes}</p>` : ''}
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f8f9fa;">
          <th style="padding:8px 10px;text-align:left;color:#555;font-size:12px;font-weight:600;">Medicine</th>
          <th style="padding:8px 10px;text-align:left;color:#555;font-size:12px;font-weight:600;">Dose</th>
          <th style="padding:8px 10px;text-align:left;color:#555;font-size:12px;font-weight:600;">Frequency</th>
          <th style="padding:8px 10px;text-align:left;color:#555;font-size:12px;font-weight:600;">Duration</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ── Consultation ──────────────────────────────────────────────────────────────

export async function sendConsultBookedEmail(appt: any): Promise<void> {
  if (!appt.patientEmail) return;
  const meetLinkHtml = appt.meetLink
    ? `<div style="text-align:center;margin:20px 0;"><a href="${appt.meetLink}" style="display:inline-block;background:#2c5aa0;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Join Video Consultation</a></div>`
    : '';
  const html = await render('consult-booked', {
    patientName: appt.patientName,
    doctorName: appt.doctorName,
    date: appt.appointmentDate,
    time: formatTime12h(appt.appointmentTime),
    mode: appt.consultationMode === 'video' ? 'Video Call' : 'Audio Call',
    meetLinkHtml,
    bookingId: String(appt._id).slice(-8).toUpperCase(),
    amount: `₹${appt.finalAmount ?? appt.consultationFee ?? 0}`,
  });
  await sendMail(appt.patientEmail, 'Booking Received – Ayropath Consultation', html);
}

export async function sendConsultConfirmedEmail(appt: any): Promise<void> {
  if (!appt.patientEmail) return;
  const meetLinkHtml = appt.meetLink
    ? `<div style="text-align:center;margin:20px 0;"><a href="${appt.meetLink}" style="display:inline-block;background:#2c5aa0;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Join Video Consultation</a></div>`
    : '';
  const html = await render('consult-confirmed', {
    patientName: appt.patientName,
    doctorName: appt.doctorName,
    date: appt.appointmentDate,
    time: formatTime12h(appt.appointmentTime),
    mode: appt.consultationMode === 'video' ? 'Video Call' : 'Audio Call',
    meetLinkHtml,
    bookingId: String(appt._id).slice(-8).toUpperCase(),
    amount: `₹${appt.finalAmount ?? appt.consultationFee ?? 0}`,
  });
  await sendMail(appt.patientEmail, 'Appointment Confirmed – Ayropath', html);
}

export async function sendConsultCancelledEmail(appt: any): Promise<void> {
  if (!appt.patientEmail) return;
  const html = await render('consult-cancelled', {
    patientName: appt.patientName,
    doctorName: appt.doctorName,
    date: appt.appointmentDate,
    time: formatTime12h(appt.appointmentTime),
    bookingId: String(appt._id).slice(-8).toUpperCase(),
  });
  await sendMail(appt.patientEmail, 'Appointment Cancelled – Ayropath', html);
}

export async function sendConsultRefundInitiatedEmail(appt: any): Promise<void> {
  if (!appt.patientEmail) return;
  const amount = `₹${Number(appt.payment?.refundAmount || appt.finalAmount || 0).toLocaleString('en-IN')}`;
  const html = await render('consult-refund-initiated', {
    patientName: appt.patientName,
    doctorName: appt.doctorName,
    date: appt.appointmentDate,
    time: formatTime12h(appt.appointmentTime),
    bookingId: String(appt._id).slice(-8).toUpperCase(),
    refundAmount: amount,
  });
  await sendMail(appt.patientEmail, `Refund Initiated – Ayropath Consultation`, html);
}

export async function sendConsultCompletedEmail(appt: any): Promise<void> {
  if (!appt.patientEmail) return;
  const html = await render('consult-completed', {
    patientName: appt.patientName,
    doctorName: appt.doctorName,
    bookingId: String(appt._id).slice(-8).toUpperCase(),
    prescriptionHtml: buildPrescriptionHtml(appt.prescription),
  });
  await sendMail(appt.patientEmail, 'Consultation Completed – Ayropath', html);
}

// ── Doctor Notifications ──────────────────────────────────────────────────────

async function getDoctorEmail(doctorId: any): Promise<string> {
  try {
    const Doctor = (await import('@/lib/models/Doctor')).default;
    const doc = await Doctor.findById(doctorId).select('email').lean();
    return (doc as any)?.email || '';
  } catch { return ''; }
}

export async function sendDoctorNewAppointmentEmail(appt: any): Promise<void> {
  const toEmail = await getDoctorEmail(appt.doctorId);
  if (!toEmail) return;
  const meetLinkHtml = appt.meetLink
    ? `<div style="text-align:center;margin:20px 0;"><a href="${appt.meetLink}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Join Video Call</a></div>`
    : '';
  const html = await render('doctor-new-appointment', {
    doctorName: appt.doctorName,
    patientName: appt.patientName,
    patientMobile: appt.patientMobile,
    date: appt.appointmentDate,
    time: formatTime12h(appt.appointmentTime),
    mode: appt.consultationMode === 'video' ? 'Video Call' : 'Audio Call',
    meetLinkHtml,
    bookingId: String(appt._id).slice(-8).toUpperCase(),
    portalUrl: PORTAL_URL,
  });
  await sendMail(toEmail, `New Appointment – ${appt.patientName} on ${appt.appointmentDate}`, html);
}

export async function sendDoctorAppointmentCancelledEmail(appt: any): Promise<void> {
  const toEmail = await getDoctorEmail(appt.doctorId);
  if (!toEmail) return;
  const html = await render('doctor-appointment-cancelled', {
    doctorName: appt.doctorName,
    patientName: appt.patientName,
    date: appt.appointmentDate,
    time: formatTime12h(appt.appointmentTime),
    bookingId: String(appt._id).slice(-8).toUpperCase(),
    portalUrl: PORTAL_URL,
  });
  await sendMail(toEmail, `Appointment Cancelled – ${appt.patientName}`, html);
}

// ── Medicine Orders ───────────────────────────────────────────────────────────

export async function getMedicineOrderEmail(order: any): Promise<string> {
  if (order.shippingAddress?.email) return order.shippingAddress.email;
  try {
    const User = (await import('@/lib/models/User')).default;
    const user = await User.findById(order.userId).select('email').lean();
    return (user as any)?.email || '';
  } catch { return ''; }
}

export async function sendMedicineConfirmedEmail(order: any, toEmail: string): Promise<void> {
  if (!toEmail) return;
  const prescriptionNote = order.requiresPrescription
    ? '<p style="background:#fff8e1;border-left:4px solid #f59e0b;padding:10px 14px;border-radius:0 6px 6px 0;margin:16px 0;color:#7c5b00;font-size:13px;"><strong>Prescription Required</strong> — Please upload your prescription via the app to proceed with fulfilment.</p>'
    : '';
  const html = await render('medicine-confirmed', {
    fullName: order.shippingAddress?.fullName ?? '',
    orderId: order.orderId,
    itemsHtml: buildItemsHtml(order.items ?? []),
    totalAmount: `₹${Number(order.grandTotal ?? order.totalAmount ?? 0).toLocaleString('en-IN')}`,
    prescriptionNote,
    deliveryDays: '3–5',
  });
  await sendMail(toEmail, `Order Confirmed #${order.orderId} – Ayropath`, html);
}

export async function sendMedicineShippedEmail(order: any, toEmail: string): Promise<void> {
  if (!toEmail) return;
  const trackingUrl = (order as any).trackingUrl || '';
  const trackingBtn = trackingUrl
    ? `<div style="text-align:center;margin:20px 0;"><a href="${trackingUrl}" style="display:inline-block;background:#2c5aa0;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Track Your Order</a></div>`
    : '';
  const estimated = order.estimatedDelivery
    ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '3–5 business days';
  const html = await render('medicine-shipped', {
    fullName: order.shippingAddress?.fullName ?? '',
    orderId: order.orderId,
    awb: (order as any).awb ?? '—',
    courierPartner: (order as any).courierPartner ?? 'Delhivery',
    trackingBtn,
    estimatedDelivery: estimated,
  });
  await sendMail(toEmail, `Order Shipped #${order.orderId} – Ayropath`, html);
}

export async function sendMedicineDeliveredEmail(order: any, toEmail: string): Promise<void> {
  if (!toEmail) return;
  const html = await render('medicine-delivered', {
    fullName: order.shippingAddress?.fullName ?? '',
    orderId: order.orderId,
    totalAmount: `₹${Number(order.grandTotal ?? order.totalAmount ?? 0).toLocaleString('en-IN')}`,
  });
  await sendMail(toEmail, `Order Delivered #${order.orderId} – Ayropath`, html);
}

export async function sendMedicineCancelledEmail(order: any, toEmail: string): Promise<void> {
  if (!toEmail) return;
  const paid = (order as any).payment?.status === 'paid';
  const refundNote = paid
    ? 'Your refund will be processed to the original payment method within 5–7 business days.'
    : 'No payment was charged for this order.';
  const html = await render('medicine-cancelled', {
    fullName: order.shippingAddress?.fullName ?? '',
    orderId: order.orderId,
    cancellationReason: order.cancellationReason || 'Cancelled by Ayropath',
    refundNote,
  });
  await sendMail(toEmail, `Order Cancelled #${order.orderId} – Ayropath`, html);
}

export async function sendMedicineReturnApprovedEmail(order: any, toEmail: string, returnAwb?: string): Promise<void> {
  if (!toEmail) return;
  const awbLine = returnAwb
    ? `<p style="margin:8px 0;font-size:14px;color:#333;"><strong>Return AWB:</strong> ${returnAwb}</p>`
    : '';
  const html = await render('medicine-return-approved', {
    fullName: order.shippingAddress?.fullName ?? '',
    orderId: order.orderId,
    awbLine,
    pickupAddress: [
      order.shippingAddress?.addressLine1,
      order.shippingAddress?.city,
      order.shippingAddress?.state,
      order.shippingAddress?.pincode,
    ].filter(Boolean).join(', '),
  });
  await sendMail(toEmail, `Return Approved – Keep Items Ready #${order.orderId}`, html);
}

export async function sendMedicineReturnRequestedEmail(order: any, toEmail: string): Promise<void> {
  if (!toEmail) return;
  const html = await render('medicine-return-requested', {
    fullName: order.shippingAddress?.fullName ?? '',
    orderId: order.orderId,
    reason: order.returnRequest?.reason || '',
  });
  await sendMail(toEmail, `Return Request Received #${order.orderId} – Ayropath`, html);
}

export async function sendMedicineRefundInitiatedEmail(order: any, toEmail: string): Promise<void> {
  if (!toEmail) return;
  const amount = `₹${Number((order.payment as any)?.refundAmount || order.grandTotal || 0).toLocaleString('en-IN')}`;
  const html = await render('medicine-refund-initiated', {
    fullName: order.shippingAddress?.fullName ?? '',
    orderId: order.orderId,
    refundAmount: amount,
  });
  await sendMail(toEmail, `Refund Initiated #${order.orderId} – Ayropath`, html);
}

// Cashfree Payment Links — create a shareable/auto-notified payment link.
// Docs: POST {base}/pg/links · x-api-version 2025-01-01
// Cashfree auto-sends the link via SMS/email when link_notify flags are true,
// so we don't build any templates. The account-level webhook receives
// PAYMENT_LINK_EVENT which we handle in /api/webhooks/cashfree.

const CF_BASE = process.env.CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com'
  : 'https://sandbox.cashfree.com';

const LINK_API_VERSION = '2025-01-01';

function headers() {
  return {
    'x-client-id':     process.env.CASHFREE_APP_ID     || '',
    'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
    'x-api-version':   LINK_API_VERSION,
    'Content-Type':    'application/json',
  };
}

export interface CreatePaymentLinkInput {
  linkId: string;        // our order id — used as reconciliation key (alphanumeric + - _, ≤ 50)
  amount: number;
  purpose: string;       // shown to customer (≤ 500 chars)
  customerName: string;
  customerPhone: string; // required by Cashfree
  customerEmail?: string;
  expiryHours?: number;  // default 48h
  notifySms?: boolean;
  notifyEmail?: boolean;
}

export interface CreatePaymentLinkResult {
  success: boolean;
  linkId?: string;
  cfLinkId?: string;
  url?: string;
  expiresAt?: Date;
  error?: string;
}

// Cashfree link_id: alphanumeric with only - and _ allowed, max 50 chars.
function sanitizeLinkId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
}

export async function createPaymentLink(input: CreatePaymentLinkInput): Promise<CreatePaymentLinkResult> {
  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    return { success: false, error: 'Cashfree credentials not configured' };
  }
  if (!/^\d{10}$/.test(input.customerPhone)) {
    return { success: false, error: 'Valid 10-digit customer phone required for payment link' };
  }

  const hours = input.expiryHours ?? 48;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  const body: any = {
    link_id:       sanitizeLinkId(input.linkId),
    link_amount:   Number(input.amount.toFixed(2)),
    link_currency: 'INR',
    link_purpose:  input.purpose.slice(0, 500),
    customer_details: {
      customer_name:  input.customerName,
      customer_phone: input.customerPhone,
      ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
    },
    link_notify: {
      send_sms:   input.notifySms ?? true,
      send_email: input.notifyEmail ?? !!input.customerEmail,
    },
    link_expiry_time: expiresAt.toISOString(),
    link_auto_reminders: true,
  };

  try {
    const res = await fetch(`${CF_BASE}/pg/links`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
    const json = await res.json();

    if (!res.ok || !json?.link_url) {
      console.error('[Cashfree link] create failed:', JSON.stringify(json));
      return { success: false, error: json?.message || json?.error?.message || `HTTP ${res.status}` };
    }

    return {
      success: true,
      linkId: json.link_id,
      cfLinkId: String(json.cf_link_id ?? ''),
      url: json.link_url,
      expiresAt,
    };
  } catch (err: any) {
    console.error('[Cashfree link] create error:', err);
    return { success: false, error: err.message };
  }
}

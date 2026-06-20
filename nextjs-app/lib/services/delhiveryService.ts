// ─── Delhivery service ───────────────────────────────────────────────────────
// Base URL is env-driven so we can point at staging vs prod without code change.
//   DELHIVERY_BASE_URL=https://staging-express.delhivery.com   → test env (no real shipments)
//   DELHIVERY_BASE_URL=https://track.delhivery.com             → PROD (real, billable)
//   DELHIVERY_MOCK=true                                        → no API call at all (fake AWBs)
// Default base = staging, so nothing hits prod unless explicitly configured.

const BASE_URL = process.env.DELHIVERY_BASE_URL || 'https://staging-express.delhivery.com';
const IS_MOCK  = process.env.DELHIVERY_MOCK === 'true';

function authHeaders() {
  return {
    Authorization: `Token ${process.env.DELHIVERY_TOKEN}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export interface DelhiveryEvent {
  status: string;
  activity: string;
  location: string;
  timestamp: Date;
}

export interface DelhiveryTrackResult {
  latestStatus: string;
  events: DelhiveryEvent[];
  trackingUrl: string;
}

export interface ReversePickupResult {
  success: boolean;
  returnAwb: string;
  error?: string;
}

export interface CreateShipmentResult {
  success: boolean;
  awb: string;
  trackingUrl: string;
  error?: string;
}

export interface PickupResult {
  success: boolean;
  pickupId?: string;
  error?: string;
}

export interface CancelResult {
  success: boolean;
  error?: string;
}

interface ShipmentOrder {
  orderId: string;
  shippingAddress: {
    fullName: string;
    mobile: string;
    addressLine1: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
    email?: string;
  };
  items: { name: string; quantity: number }[];
  grandTotal: number;
  paymentMode: 'Prepaid' | 'COD';
  weightGrams?: number;
}

function warehouse() {
  return {
    name:    process.env.DELHIVERY_WAREHOUSE_NAME || '',
    phone:   process.env.DELHIVERY_WAREHOUSE_PHONE || '',
    address: process.env.DELHIVERY_WAREHOUSE_ADDRESS || '',
    city:    process.env.DELHIVERY_WAREHOUSE_CITY || '',
    state:   process.env.DELHIVERY_WAREHOUSE_STATE || '',
    pincode: process.env.DELHIVERY_WAREHOUSE_PINCODE || '',
  };
}

// ─── Forward shipment creation ───────────────────────────────────────────────
/**
 * Create a forward (outbound) shipment. Delhivery assigns the AWB.
 * Uses the standard CMU create-order API.
 */
export async function createShipment(order: ShipmentOrder): Promise<CreateShipmentResult> {
  if (IS_MOCK) {
    const fakeAwb = `MOCK${Date.now()}`;
    console.log(`[Delhivery] MOCK mode — fake forward AWB: ${fakeAwb}`);
    return { success: true, awb: fakeAwb, trackingUrl: `https://www.delhivery.com/track/package/${fakeAwb}` };
  }

  const token = process.env.DELHIVERY_TOKEN;
  if (!token) return { success: false, awb: '', trackingUrl: '', error: 'DELHIVERY_TOKEN not set' };

  const wh = warehouse();
  if (!wh.name) return { success: false, awb: '', trackingUrl: '', error: 'DELHIVERY_WAREHOUSE_NAME not set (pickup location)' };

  const addr = order.shippingAddress;
  const productsDesc = order.items.map(i => `${i.name} x${i.quantity}`).join(', ').slice(0, 250);
  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
  const isCod = order.paymentMode === 'COD';

  const shipment = {
    name:          addr.fullName,
    add:           [addr.addressLine1, addr.landmark].filter(Boolean).join(', '),
    pin:           addr.pincode,
    city:          addr.city,
    state:         addr.state,
    country:       'India',
    phone:         addr.mobile,
    order:         order.orderId,
    payment_mode:  isCod ? 'COD' : 'Prepaid',
    return_pin:    wh.pincode,
    return_city:   wh.city,
    return_phone:  wh.phone,
    return_add:    wh.address,
    return_state:  wh.state,
    return_country:'India',
    products_desc: productsDesc,
    cod_amount:    isCod ? String(order.grandTotal) : '0',
    order_date:    new Date().toISOString().split('T')[0],
    total_amount:  String(order.grandTotal),
    seller_add:    wh.address,
    seller_name:   wh.name,
    seller_inv:    order.orderId,
    quantity:      String(totalQty),
    waybill:       '',                                 // Delhivery assigns
    shipment_width:  '10',
    shipment_height: '10',
    weight:        String(order.weightGrams ?? 500),   // grams
    shipping_mode: 'Surface',
    address_type:  'home',
  };

  try {
    const formData = new URLSearchParams();
    formData.append('format', 'json');
    formData.append('data', JSON.stringify({
      shipments: [shipment],
      pickup_location: { name: wh.name },
    }));

    const res = await fetch(`${BASE_URL}/api/cmu/create.json`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: formData.toString(),
    });

    const json = await res.json();
    console.log('[Delhivery] createShipment response:', JSON.stringify(json));

    if (!res.ok) {
      return { success: false, awb: '', trackingUrl: '', error: `HTTP ${res.status}` };
    }

    // Delhivery returns { success, packages: [{ waybill, status, remarks }] }
    const pkg = json?.packages?.[0];
    const awb = pkg?.waybill ?? '';

    if (json?.success === false || !awb) {
      const remarks = pkg?.remarks?.join?.(', ') || json?.rmk || json?.error || 'No AWB returned';
      return { success: false, awb: '', trackingUrl: '', error: remarks };
    }

    return {
      success: true,
      awb,
      trackingUrl: `https://www.delhivery.com/track/package/${awb}`,
    };
  } catch (err: any) {
    console.error('[Delhivery] createShipment error:', err);
    return { success: false, awb: '', trackingUrl: '', error: err.message };
  }
}

// ─── Forward pickup request ──────────────────────────────────────────────────
/**
 * Schedule a warehouse pickup so Delhivery collects outbound packages.
 * pickup_date format: YYYY-MM-DD, pickup_time: HH:MM:SS
 */
export async function schedulePickup(opts?: {
  pickupDate?: string;
  pickupTime?: string;
  expectedPackages?: number;
}): Promise<PickupResult> {
  if (IS_MOCK) {
    console.log('[Delhivery] MOCK mode — fake pickup scheduled');
    return { success: true, pickupId: `MOCKPICKUP${Date.now()}` };
  }

  const token = process.env.DELHIVERY_TOKEN;
  if (!token) return { success: false, error: 'DELHIVERY_TOKEN not set' };

  const wh = warehouse();
  if (!wh.name) return { success: false, error: 'DELHIVERY_WAREHOUSE_NAME not set' };

  // Default: tomorrow 14:00, packages count = 1
  const date = opts?.pickupDate ?? new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const time = opts?.pickupTime ?? '14:00:00';

  try {
    const res = await fetch(`${BASE_URL}/fm/request/new/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        pickup_location:   wh.name,
        pickup_date:       date,
        pickup_time:       time,
        expected_package_count: opts?.expectedPackages ?? 1,
      }),
    });

    const json = await res.json();
    console.log('[Delhivery] schedulePickup response:', JSON.stringify(json));

    if (!res.ok || json?.success === false) {
      return { success: false, error: json?.error || json?.rmk || `HTTP ${res.status}` };
    }

    return { success: true, pickupId: String(json?.pickup_id ?? json?.id ?? '') };
  } catch (err: any) {
    console.error('[Delhivery] schedulePickup error:', err);
    return { success: false, error: err.message };
  }
}

// ─── Cancel pickup slot ──────────────────────────────────────────────────────
/**
 * Cancel a scheduled warehouse pickup by pickup_id.
 * Called when a shipped (but not yet picked) order is cancelled.
 */
export async function cancelPickup(pickupId: string): Promise<CancelResult> {
  if (!pickupId) return { success: false, error: 'No pickupId provided' };

  if (IS_MOCK) {
    console.log(`[Delhivery] MOCK mode — fake cancel for pickupId ${pickupId}`);
    return { success: true };
  }

  const token = process.env.DELHIVERY_TOKEN;
  if (!token) return { success: false, error: 'DELHIVERY_TOKEN not set' };

  try {
    const res = await fetch(`${BASE_URL}/fm/request/cancel/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ id: pickupId }),
    });

    const json = await res.json().catch(() => ({}));
    console.log('[Delhivery] cancelPickup response:', JSON.stringify(json));

    if (!res.ok || json?.success === false || json?.status === false) {
      return { success: false, error: json?.error || json?.rmk || `HTTP ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Delhivery] cancelPickup error:', err);
    return { success: false, error: err.message };
  }
}

// ─── Cancel shipment ─────────────────────────────────────────────────────────
/**
 * Cancel a forward shipment by AWB. Delhivery edit API with cancellation flag.
 */
export async function cancelShipment(awb: string): Promise<CancelResult> {
  if (!awb) return { success: false, error: 'No AWB provided' };

  if (IS_MOCK) {
    console.log(`[Delhivery] MOCK mode — fake cancel for AWB ${awb}`);
    return { success: true };
  }

  const token = process.env.DELHIVERY_TOKEN;
  if (!token) return { success: false, error: 'DELHIVERY_TOKEN not set' };

  try {
    const res = await fetch(`${BASE_URL}/api/p/edit`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ waybill: awb, cancellation: 'true' }),
    });

    const json = await res.json();
    console.log('[Delhivery] cancelShipment response:', JSON.stringify(json));

    if (!res.ok || json?.status === false || json?.success === false) {
      return { success: false, error: json?.error || json?.rmk || `HTTP ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Delhivery] cancelShipment error:', err);
    return { success: false, error: err.message };
  }
}

// ─── Reverse pickup (returns) ────────────────────────────────────────────────
/**
 * Schedule a reverse pickup (return) with Delhivery.
 * Requires DELHIVERY_TOKEN + warehouse address env vars.
 * Delhivery account must have reverse logistics enabled.
 */
export async function scheduleReversePickup(order: {
  orderId: string;
  awb: string;
  shippingAddress: {
    fullName: string;
    mobile: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
  };
  grandTotal: number;
}): Promise<ReversePickupResult> {
  // Mock mode for local/dev testing — set DELHIVERY_MOCK=true in .env
  if (IS_MOCK) {
    const fakeAwb = `MOCK${Date.now()}`;
    console.log(`[Delhivery] MOCK mode — fake reverse AWB: ${fakeAwb}`);
    return { success: true, returnAwb: fakeAwb };
  }

  const token = process.env.DELHIVERY_TOKEN;
  if (!token) return { success: false, returnAwb: '', error: 'DELHIVERY_TOKEN not set' };

  const wh = warehouse();
  if (!wh.pincode) return { success: false, returnAwb: '', error: 'Warehouse env vars not configured' };

  const addr = order.shippingAddress;

  // Delhivery reverse pickup shipment payload
  const shipment = {
    name:          addr.fullName,
    add:           addr.addressLine1,
    city:          addr.city,
    state:         addr.state,
    pin:           addr.pincode,
    phone:         addr.mobile,
    order:         `RET-${order.orderId}`,
    payment_mode:  'Pickup',
    return_name:   wh.name,
    return_add:    wh.address,
    return_city:   wh.city,
    return_state:  wh.state,
    return_pin:    wh.pincode,
    return_phone:  wh.phone,
    products_desc: 'Medicine Return',
    hsn_code:      '',
    cod_amount:    '0',
    order_date:    new Date().toISOString().split('T')[0],
    total_amount:  String(order.grandTotal),
    shipment_type: 'reverse',          // key flag for reverse pickup
    quantity:      '1',
    weight:        '500',              // grams — approximate for medicines
    seller_add:    wh.address,
    seller_name:   wh.name,
    seller_cst_no: '',
    seller_tin_no: '',
    seller_gst_tin: '',
    invoice:       `RET-${order.orderId}`,
    waybill:       '',                 // Delhivery assigns AWB
    shipping_mode: 'Surface',
  };

  try {
    const formData = new URLSearchParams();
    formData.append('format', 'json');
    formData.append('data', JSON.stringify({ shipments: [shipment], pickup_location: { name: wh.name } }));

    const res = await fetch(`${BASE_URL}/api/backend/clientReverse/create/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const json = await res.json();
    console.log('[Delhivery] Reverse pickup response:', JSON.stringify(json));

    if (!res.ok || json?.status === false) {
      return { success: false, returnAwb: '', error: json?.error || json?.rmk || 'Delhivery API error' };
    }

    const packages = json?.packages ?? [];
    const returnAwb = packages[0]?.waybill ?? '';

    if (!returnAwb) {
      return { success: false, returnAwb: '', error: 'No AWB in Delhivery response' };
    }

    return { success: true, returnAwb };
  } catch (err: any) {
    console.error('[Delhivery] Reverse pickup error:', err);
    return { success: false, returnAwb: '', error: err.message };
  }
}

// ─── Pincode serviceability ──────────────────────────────────────────────────
/**
 * Check if Delhivery services a pincode. Returns true if serviceable.
 */
export async function checkPincodeServiceable(pincode: string): Promise<boolean> {
  if (IS_MOCK) return true;

  const token = process.env.DELHIVERY_TOKEN;
  if (!token) return false;

  try {
    const res = await fetch(`${BASE_URL}/c/api/pin-codes/json/?filter_codes=${encodeURIComponent(pincode)}`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const json = await res.json();
    const codes = json?.delivery_codes ?? [];
    return codes.length > 0;
  } catch {
    return false;
  }
}

// ─── Tracking ────────────────────────────────────────────────────────────────
export async function trackShipment(awb: string): Promise<DelhiveryTrackResult | null> {
  const token = process.env.DELHIVERY_TOKEN;
  if (!token) return null;

  try {
    const url = `${BASE_URL}/api/v1/packages/json/?waybill=${encodeURIComponent(awb)}&token=${token}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;

    const json = await res.json();
    const shipmentData = json?.ShipmentData?.[0]?.Shipment;
    if (!shipmentData) return null;

    const scans: DelhiveryEvent[] = (shipmentData.Scans ?? [])
      .map((s: any) => {
        const d = s.ScanDetail ?? s;
        return {
          status:    d.Scan        ?? d.Status     ?? '',
          activity:  d.Instructions ?? d.Activity   ?? '',
          location:  d.City         ?? d.Location   ?? '',
          timestamp: new Date(d.ScanDateTime ?? d.StatusDateTime ?? Date.now()),
        };
      })
      .filter((e: DelhiveryEvent) => e.status)
      .sort((a: DelhiveryEvent, b: DelhiveryEvent) => b.timestamp.getTime() - a.timestamp.getTime());

    const latestStatus = shipmentData.Status?.Status ?? scans[0]?.status ?? '';

    return {
      latestStatus,
      events: scans,
      trackingUrl: `https://www.delhivery.com/track/package/${awb}`,
    };
  } catch {
    return null;
  }
}

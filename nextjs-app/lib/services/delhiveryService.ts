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
  if (process.env.DELHIVERY_MOCK === 'true') {
    const fakeAwb = `MOCK${Date.now()}`;
    console.log(`[Delhivery] MOCK mode — fake reverse AWB: ${fakeAwb}`);
    return { success: true, returnAwb: fakeAwb };
  }

  const token = process.env.DELHIVERY_TOKEN;
  if (!token) return { success: false, returnAwb: '', error: 'DELHIVERY_TOKEN not set' };

  // Warehouse (return destination) — must be set in env
  const warehouseName    = process.env.DELHIVERY_WAREHOUSE_NAME || '';
  const warehousePhone   = process.env.DELHIVERY_WAREHOUSE_PHONE || '';
  const warehouseAddress = process.env.DELHIVERY_WAREHOUSE_ADDRESS || '';
  const warehouseCity    = process.env.DELHIVERY_WAREHOUSE_CITY || '';
  const warehouseState   = process.env.DELHIVERY_WAREHOUSE_STATE || '';
  const warehousePincode = process.env.DELHIVERY_WAREHOUSE_PINCODE || '';

  if (!warehousePincode) return { success: false, returnAwb: '', error: 'Warehouse env vars not configured' };

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
    return_name:   warehouseName,
    return_add:    warehouseAddress,
    return_city:   warehouseCity,
    return_state:  warehouseState,
    return_pin:    warehousePincode,
    return_phone:  warehousePhone,
    products_desc: 'Medicine Return',
    hsn_code:      '',
    cod_amount:    '0',
    order_date:    new Date().toISOString().split('T')[0],
    total_amount:  String(order.grandTotal),
    shipment_type: 'reverse',          // key flag for reverse pickup
    quantity:      '1',
    weight:        '500',              // grams — approximate for medicines
    seller_add:    warehouseAddress,
    seller_name:   warehouseName,
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
    formData.append('data', JSON.stringify({ shipments: [shipment], pickup_location: { name: warehouseName } }));

    const res = await fetch('https://track.delhivery.com/api/backend/clientReverse/create/', {
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

export async function trackShipment(awb: string): Promise<DelhiveryTrackResult | null> {
  const token = process.env.DELHIVERY_TOKEN;
  if (!token) return null;

  try {
    const url = `https://track.delhivery.com/api/v1/packages/json/?waybill=${encodeURIComponent(awb)}&token=${token}`;
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

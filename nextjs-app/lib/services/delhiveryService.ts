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

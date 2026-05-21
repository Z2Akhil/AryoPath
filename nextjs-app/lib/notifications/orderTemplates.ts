/**
 * Medicine order WhatsApp notification templates.
 *
 * Template bodies (submit these to MC for Meta approval):
 * ─────────────────────────────────────────────────────────────────────────────
 * order_confirmed_patient:
 *   "Hi {{1}}, your medicine order #{{2}} ({{3}} item(s)) for ₹{{4}} is
 *    confirmed. Expected delivery in {{5}} business days. - AyroPath"
 *   Variables: name, orderId, itemCount, amount, days
 *
 * order_shipped_patient:
 *   "AyroPath: Your order #{{1}} has been shipped! Tracking ID: {{2}}.
 *    Expected delivery by {{3}}. Track on the AyroPath app."
 *   Variables: orderId, trackingId, estimatedDate
 *
 * order_delivered_patient:
 *   "AyroPath: Your order #{{1}} has been delivered successfully. Thank you
 *    for shopping with AyroPath, {{2}}! Rate your experience on the app."
 *   Variables: orderId, name
 *
 * order_cancelled_patient:
 *   "AyroPath: Your order #{{1}} has been cancelled. Reason: {{2}}.
 *    Refund (if applicable) will be processed in 5-7 business days."
 *   Variables: orderId, reason
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NotificationPayload } from '@/lib/services/notificationService';

const TEMPLATES = {
  ORDER_CONFIRMED:  'order_confirmed_patient',
  ORDER_SHIPPED:    'order_shipped_patient',
  ORDER_DELIVERED:  'order_delivered_patient',
  ORDER_CANCELLED:  'order_cancelled_patient',
} as const;

function clean(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.slice(-10);
}

function wa(mobile: string, templateName: string, variables: string[]): NotificationPayload {
  return { channel: 'whatsapp', mobile: clean(mobile), templateName, variables };
}

// ── Data types ────────────────────────────────────────────────────────────────

export interface OrderConfirmedData {
  patientName: string;
  patientMobile: string;
  orderId: string;
  itemCount: number;
  grandTotal: number;
  estimatedDays?: number;
}

export interface OrderShippedData {
  patientMobile: string;
  orderId: string;
  trackingId: string;
  estimatedDate: string;   // e.g. "25 May"
}

export interface OrderDeliveredData {
  patientName: string;
  patientMobile: string;
  orderId: string;
}

export interface OrderCancelledData {
  patientMobile: string;
  orderId: string;
  reason?: string;
}

// ── Template functions ────────────────────────────────────────────────────────

export function orderConfirmedNotification(data: OrderConfirmedData): NotificationPayload[] {
  return [
    wa(data.patientMobile, TEMPLATES.ORDER_CONFIRMED, [
      data.patientName,
      data.orderId,
      String(data.itemCount),
      String(data.grandTotal),
      String(data.estimatedDays ?? 5),
    ]),
  ];
}

export function orderShippedNotification(data: OrderShippedData): NotificationPayload[] {
  return [
    wa(data.patientMobile, TEMPLATES.ORDER_SHIPPED, [
      data.orderId,
      data.trackingId,
      data.estimatedDate,
    ]),
  ];
}

export function orderDeliveredNotification(data: OrderDeliveredData): NotificationPayload[] {
  return [
    wa(data.patientMobile, TEMPLATES.ORDER_DELIVERED, [
      data.orderId,
      data.patientName,
    ]),
  ];
}

export function orderCancelledNotification(data: OrderCancelledData): NotificationPayload[] {
  return [
    wa(data.patientMobile, TEMPLATES.ORDER_CANCELLED, [
      data.orderId,
      data.reason || 'Requested by customer',
    ]),
  ];
}

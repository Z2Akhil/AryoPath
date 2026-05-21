/**
 * NotificationService — channel-agnostic notification dispatcher.
 *
 * Currently supports: whatsapp
 * Future channels: add a new case to the switch — templates and callers stay unchanged.
 *
 * Usage:
 *   import NotificationService from '@/lib/services/notificationService';
 *   import { confirmationNotifications } from '@/lib/notifications/consultTemplates';
 *
 *   // Non-blocking (use in API routes — doesn't delay the response)
 *   NotificationService.sendAsync(confirmationNotifications({ ... }));
 *
 *   // Awaitable (use when you need to know if it succeeded)
 *   const results = await NotificationService.sendBulk(reminderNotifications({ ... }));
 */

import WhatsAppService, { WhatsAppSendResult } from './whatsappService';

export interface NotificationPayload {
  channel: 'whatsapp';           // extend union when adding SMS/email/push
  mobile: string;                // 10-digit Indian number
  templateName: string;          // exact MC template name (post-approval)
  variables: string[];           // values for {{1}}, {{2}}, ... in order
}

export interface NotificationResult extends WhatsAppSendResult {
  mobile: string;
  channel: string;
}

class NotificationService {
  /** Send a single notification on any channel. */
  static async send(payload: NotificationPayload): Promise<NotificationResult> {
    let result: WhatsAppSendResult;

    switch (payload.channel) {
      case 'whatsapp':
        result = await WhatsAppService.send(payload.mobile, payload.templateName, payload.variables);
        break;
      default:
        result = { success: false, message: `Unsupported channel: ${payload.channel}` };
    }

    return { ...result, mobile: payload.mobile, channel: payload.channel };
  }

  /**
   * Send multiple notifications concurrently (one per recipient).
   * Never throws — per-recipient failures are captured in the result array.
   */
  static async sendBulk(payloads: NotificationPayload[]): Promise<NotificationResult[]> {
    if (!payloads.length) return [];

    const settled = await Promise.allSettled(payloads.map((p) => this.send(p)));

    return settled.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      console.error(`[NotificationService] Failed for ${payloads[i].mobile}:`, r.reason);
      return {
        mobile: payloads[i].mobile,
        channel: payloads[i].channel,
        success: false,
        message: r.reason instanceof Error ? r.reason.message : 'Unknown error',
      };
    });
  }

  /**
   * Fire-and-forget — does not block the caller.
   * Use this in API route handlers so notifications don't add latency.
   */
  static sendAsync(payloads: NotificationPayload[]): void {
    this.sendBulk(payloads).catch((err) =>
      console.error('[NotificationService] Async send error:', err)
    );
  }
}

export default NotificationService;

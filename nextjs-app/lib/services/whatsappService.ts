/**
 * WhatsApp notification service via Message Central WhatsApp Now API.
 *
 * Reuses the auth token mechanism from smsService (same MC account, same endpoint).
 * All sends use BROADCAST mode (business-initiated) with Meta-approved templates.
 *
 * Template variable rules:
 *  - Variables in template body: {{1}}, {{2}}, {{3}} ...
 *  - bodyValue = space-separated values in the SAME order as placeholders
 *  - Number of values MUST exactly match the number of {{N}} slots in the template
 *
 * Before using any template in production:
 *  1. Submit it via POST /verification/v3/template
 *  2. Wait for Meta approval (hours to ~2 days)
 *  3. Use the exact template name returned by MC in the response
 */

import axios from 'axios';
import SMSService from './smsService';

export interface WhatsAppSendResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

class WhatsAppService {
  private static get BASE_URL() {
    return 'https://cpaas.messagecentral.com';
  }

  private static get SENDER_ID() {
    return process.env.MC_WA_SENDER_ID || '';
  }

  /** Clean a mobile number to 10 digits (strips country code, spaces, dashes). */
  static cleanMobile(mobile: string): string {
    const digits = mobile.replace(/\D/g, '');
    // Strip leading 91 if 12 digits
    return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.slice(-10);
  }

  /**
   * Send a WhatsApp BROADCAST message using a Meta-approved template.
   *
   * @param mobile      10-digit Indian mobile number
   * @param templateName  Exact name as returned by MC on template creation
   * @param variables   Array of string values matching {{1}}, {{2}}, ... slots in order
   */
  static async send(
    mobile: string,
    templateName: string,
    variables: string[]
  ): Promise<WhatsAppSendResult> {
    try {
      if (!this.SENDER_ID) {
        throw new Error('MC_WA_SENDER_ID is not configured');
      }

      const clean = this.cleanMobile(mobile);
      if (clean.length !== 10) {
        return { success: false, message: `Invalid mobile number: ${mobile}` };
      }

      const authToken = await SMSService.generateAuthToken();

      // bodyValue = space-separated variable values in placeholder order
      const bodyValue = variables.join(' ');

      const response = await axios.post(
        `${this.BASE_URL}/verification/v3/send`,
        null,
        {
          params: {
            countryCode: '91',
            flowType: 'WHATSAPP',
            type: 'BROADCAST',
            mobileNumber: clean,
            senderId: this.SENDER_ID,
            templateName,
            bodyValue,
            langId: 'en_US',
          },
          headers: { authToken, accept: '*/*' },
          timeout: 30000,
        }
      );

      if (response.data.responseCode === 200) {
        console.log('[WhatsAppService] Sent:', JSON.stringify(response.data, null, 2));
        return {
          success: true,
          message: 'WhatsApp message sent',
          transactionId: response.data.data?.transactionId,
        };
      }

      console.warn('[WhatsAppService] Non-200 responseCode:', response.data);
      throw new Error(response.data.message || 'MC API returned non-200');
    } catch (error) {
      const axiosError = error as { response?: { data?: unknown; status?: number }; message: string };
      console.error('[WhatsAppService] Send failed:', {
        mobile,
        templateName,
        status: axiosError.response?.status,
        body: axiosError.response?.data,
        error: axiosError.message,
      });
      const responseData = axiosError.response?.data;
      const msg =
        responseData && typeof responseData === 'object' && 'message' in responseData
          ? String((responseData as { message: unknown }).message)
          : axiosError.message;
      return { success: false, message: msg };
    }
  }

  /**
   * Submit a new template to Message Central for Meta approval.
   * Call this once per template during setup — not on every send.
   *
   * After submission, poll the MC dashboard or use the list endpoint to check
   * approval status. Only APPROVED templates can be used in send().
   */
  static async createTemplate(params: {
    name: string;            // lowercase_underscores, e.g. "appt_confirmation_patient"
    category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
    body: string;            // message text with {{1}} {{2}} placeholders
    header?: string;         // optional header text
    footer?: string;         // optional footer text
    language?: string;       // default "en"
  }): Promise<{ success: boolean; templateName?: string; message: string; detail?: unknown }> {
    try {
      const authToken = await SMSService.generateAuthToken();

      const response = await axios.post(
        `${this.BASE_URL}/verification/v3/template`,
        null,
        {
          params: {
            senderId: this.SENDER_ID,
            name: params.name,
            category: params.category,
            body: params.body,
            ...(params.header ? { header: params.header, headerFormat: 'TEXT' } : {}),
            ...(params.footer ? { footer: params.footer } : {}),
            language: params.language || 'en_US',
          },
          headers: { authToken, accept: '*/*' },
          timeout: 30000,
        }
      );

      if (response.data.responseCode === 200) {
        // MC reformats the name — always use the name from the response
        const returnedName = response.data.data?.name || params.name;
        return { success: true, templateName: returnedName, message: 'Template submitted for Meta approval' };
      }

      throw new Error(response.data.message || 'Template creation failed');
    } catch (error) {
      const axiosError = error as { response?: { data?: unknown }; message: string };
      const errBody = axiosError.response?.data;
      console.error('[WhatsAppService] Template creation failed:', errBody || axiosError.message);
      const errMsg = errBody && typeof errBody === 'object' && 'message' in errBody
        ? String((errBody as { message: unknown }).message)
        : axiosError.message;
      return { success: false, message: errMsg, detail: errBody };
    }
  }
}

export default WhatsAppService;

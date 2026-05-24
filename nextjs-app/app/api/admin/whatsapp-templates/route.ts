/**
 * One-time admin route to register all WhatsApp templates in the WhatsApp Now API.
 * Hit GET /api/admin/whatsapp-templates to submit all templates for Meta approval.
 * Delete or secure this route after use.
 */

import { NextResponse } from 'next/server';
import WhatsAppService from '@/lib/services/whatsappService';

const TEMPLATES = [
  {
    name: 'appt_confirmation_patient_video',
    category: 'UTILITY' as const,
    body: 'Dear {{1}}, your video consultation with Dr. {{2}} is confirmed for {{3}} at {{4}}. Join meeting: {{5}}. Booking ID: {{6}}. Amount: Rs.{{7}}. Be ready 2 mins early. - AyroPath',
  },
  {
    name: 'appt_confirmation_patient_audio',
    category: 'UTILITY' as const,
    body: 'Dear {{1}}, your audio consultation with Dr. {{2}} is confirmed for {{3}} at {{4}}. Booking ID: {{5}}. Amount: Rs.{{6}}. Doctor will call you at your registered number. - AyroPath',
  },
  {
    name: 'appt_confirmation_doctor_video',
    category: 'UTILITY' as const,
    body: 'AyroPath: New video appointment. Patient: {{1}} ({{2}}), Date: {{3}}, Time: {{4}}. Join: {{5}}. Booking: {{6}}. Please be available on time.',
  },
  {
    name: 'appt_confirmation_doctor_audio',
    category: 'UTILITY' as const,
    body: 'AyroPath: New audio appointment. Patient: {{1}}, Mobile: {{2}}, Date: {{3}}, Time: {{4}}. Booking: {{5}}. Call patient at scheduled time.',
  },
  {
    name: 'appt_reminder_patient_video',
    category: 'UTILITY' as const,
    body: 'Reminder: Your video consultation with Dr. {{1}} starts in 5 minutes at {{2}}. Join here: {{3}}. Booking ID: {{4}}. - AyroPath',
  },
  {
    name: 'appt_reminder_patient_audio',
    category: 'UTILITY' as const,
    body: 'Reminder: Your audio consultation with Dr. {{1}} starts in 5 minutes at {{2}}. Doctor will call shortly. Booking ID: {{3}}. - AyroPath',
  },
  {
    name: 'appt_reminder_doctor_video',
    category: 'UTILITY' as const,
    body: 'AyroPath Reminder: {{1}} has a video consultation in 5 minutes at {{2}}. Join: {{3}}. Booking: {{4}}. Please be ready.',
  },
  {
    name: 'appt_reminder_doctor_audio',
    category: 'UTILITY' as const,
    body: 'AyroPath Reminder: {{1}} has an audio consultation in 5 minutes at {{2}}. Call {{3}}. Booking: {{4}}. Please be ready.',
  },
  {
    name: 'appt_cancelled_patient',
    category: 'UTILITY' as const,
    body: 'Dear {{1}}, your appointment with Dr. {{2}} on {{3}} at {{4}} has been cancelled. Booking ID: {{5}}. Contact support for assistance. - AyroPath',
  },
];

export async function GET() {
  const results: any[] = [];

  for (const tpl of TEMPLATES) {
    const result = await WhatsAppService.createTemplate({
      name: tpl.name,
      category: tpl.category,
      body: tpl.body,
      language: 'en_US',
    });

    results.push({
      requested: tpl.name,
      ...result,
    });

    // Small delay to avoid hammering the API
    await new Promise((r) => setTimeout(r, 500));
  }

  return NextResponse.json({ results });
}

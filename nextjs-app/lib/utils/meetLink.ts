/**
 * Generates a Jitsi Meet link tied to the appointment ID.
 * No API, no credentials, no cost — anyone with the link can join as a guest.
 */
export function generateMeetLink(appointmentId: string): string {
  return `https://meet.jit.si/AyroPath-${appointmentId}`;
}

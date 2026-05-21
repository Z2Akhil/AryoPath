const CHARS = 'abcdefghijklmnopqrstuvwxyz';

function randomSegment(len: number): string {
  return Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}

export function generateMeetLink(): string {
  return `https://meet.google.com/${randomSegment(3)}-${randomSegment(4)}-${randomSegment(3)}`;
}

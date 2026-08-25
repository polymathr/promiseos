export type CalendarPromise = {
  id: number;
  title: string;
  promisor: string;
  recipient: string;
  due: string;
  completion: string;
  context: string;
};

const escapeIcsText = (value: string) => value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

const formatIcsDate = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function buildPromiseCalendar(promise: CalendarPromise, generatedAt = new Date()) {
  const start = new Date(`${promise.due}T12:00:00`);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const description = `PromiseOS shared commitment\nPromisor: ${promise.promisor}\nRecipient: ${promise.recipient}\nCompletion: ${promise.completion}\nContext: ${promise.context}`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PromiseOS//Private Commitment Export//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:promiseos-${promise.id}-${generatedAt.getTime()}@local`,
    `DTSTAMP:${formatIcsDate(generatedAt)}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(`Promise: ${promise.title}`)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

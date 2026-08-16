const ARGENTINA_UTC_OFFSET_HOURS = 3;
const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function parseArgentinaDateTimeLocal(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute] = match;
  const utcDate = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour) + ARGENTINA_UTC_OFFSET_HOURS,
      Number(minute),
      0,
      0,
    ),
  );

  return Number.isNaN(utcDate.getTime()) ? null : utcDate;
}

export function formatArgentinaDateTimeLocalInput(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const shifted = new Date(date.getTime() - ARGENTINA_UTC_OFFSET_HOURS * 60 * 60 * 1000);

  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}

export function formatArgentinaDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: ARGENTINA_TIME_ZONE,
  }).format(date);
}

export function formatArgentinaTimeRange(start: string | Date, end: string | Date) {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "";
  }

  const formatter = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: ARGENTINA_TIME_ZONE,
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

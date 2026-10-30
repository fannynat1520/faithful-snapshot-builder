export const HOURS_24 = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
export const MINUTES = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, "0"));

export function updateTimePart(value: string, part: "hour" | "minute", next: string): string {
  const [hour, minute] = value.split(":");
  return part === "hour" ? `${next}:${minute || "00"}` : `${hour || "00"}:${next}`;
}
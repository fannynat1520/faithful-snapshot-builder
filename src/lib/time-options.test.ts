import { describe, expect, it } from "vitest";
import { HOURS_24, MINUTES, updateTimePart } from "./time-options";

describe("24-hour form selector", () => {
  it("offers exactly the hours 00 through 23", () => {
    expect(HOURS_24).toEqual([
      "00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11",
      "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23",
    ]);
  });

  it("preserves every minute and supports every HH:mm combination", () => {
    expect(MINUTES).toHaveLength(60);
    for (const [index, minute] of MINUTES.entries()) {
      expect(minute).toBe(String(index).padStart(2, "0"));
      for (const hour of HOURS_24) {
        expect(updateTimePart(`${hour}:00`, "minute", minute)).toBe(`${hour}:${minute}`);
      }
    }
    expect(updateTimePart("10:37", "hour", "23")).toBe("23:37");
    expect(updateTimePart("", "hour", "00")).toBe("00:00");
    expect(updateTimePart("", "minute", "59")).toBe("00:59");
  });
});
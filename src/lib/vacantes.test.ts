import { describe, expect, it } from "vitest";
import { hasPendingEvent, isAntigua, statusTone, type Vacante } from "./vacantes";

const base: Vacante = {
  id: "1", empresa: "A", puesto: "B", medio: "C", reclutador: "D",
  grupo: "Concluida", estado: "Descartado",
};

describe("vacantes rules", () => {
  it("descartado goes to antiguas", () => expect(isAntigua(base)).toBe(true));
  it("oferta stays active", () => expect(isAntigua({ ...base, estado: "Oferta" })).toBe(false));
  it("oferta is green", () => expect(statusTone({ ...base, estado: "Oferta" })).toBe("green"));
  it("future pending event alerts, completed does not", () => {
    const now = new Date("2026-01-01T10:00");
    const ev = { id: "e", vacanteId: "1", tipo: "Otro", fecha: "2026-01-02", hora: "09:00" };
    expect(hasPendingEvent("1", [ev], now)).toBe(true);
    expect(hasPendingEvent("1", [{ ...ev, completado: true }], now)).toBe(false);
    expect(hasPendingEvent("1", [{ ...ev, fecha: "2025-12-31" }], now)).toBe(false);
  });
});

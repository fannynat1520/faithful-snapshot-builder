export const STATUS_GROUPS = {
  "Primer contacto": ["Contacto del reclutador", "Agenda de entrevista"],
  "En proceso": ["Entrevista(s)", "Psicométricos", "Referencias o documentos"],
  Concluida: ["Oferta", "Descartado"],
} as const;

export type Group = keyof typeof STATUS_GROUPS;
export const EVENT_TYPES = ["Entrevista", "Entrega de documentos", "Envío de información", "Otro"];

export interface Feedback {
  ocurrio: string;
  falto: string;
  mejorar: string;
}

export interface Vacante {
  id: string;
  empresa: string;
  puesto: string;
  medio: string;
  reclutador: string;
  grupo: Group;
  estado: string;
  feedback?: Feedback | undefined;
}

export interface Evento {
  id: string;
  vacanteId: string;
  tipo: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM
  completado?: boolean;
}

export const isAntigua = (v: Vacante) => v.estado === "Descartado";

export const isFeedbackEmpty = (f: Feedback) => !f.ocurrio.trim() && !f.falto.trim() && !f.mejorar.trim();

export const statusTone = (v: Vacante) =>
  v.grupo === "Primer contacto"
    ? "orange"
    : v.grupo === "En proceso"
      ? "yellow"
      : v.estado === "Oferta"
        ? "green"
        : "gray";

export function hasPendingEvent(vacanteId: string, eventos: Evento[], now = new Date()) {
  return eventos.some(
    (e) => e.vacanteId === vacanteId && !e.completado && new Date(`${e.fecha}T${e.hora}`) > now,
  );
}

export function matches(v: Vacante, q: string) {
  const s = q.trim().toLowerCase();
  return !s || v.empresa.toLowerCase().includes(s) || v.puesto.toLowerCase().includes(s);
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Plus, Search, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/form-select";
import { HOURS_24, MINUTES, updateTimePart } from "@/lib/time-options";
import { cn } from "@/lib/utils";
import {
  EVENT_TYPES, STATUS_GROUPS, hasPendingEvent, isAntigua, isFeedbackEmpty, matches, statusTone,
  type Evento, type Feedback, type Group, type Vacante,
} from "@/lib/vacantes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mis vacantes — Seguimiento de postulaciones" },
      { name: "description", content: "Organiza tus postulaciones laborales, entrevistas y retroalimentación en un solo lugar." },
      { property: "og:title", content: "Mis vacantes" },
      { property: "og:description", content: "Organiza tus postulaciones laborales, entrevistas y retroalimentación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function useStored<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw) setVal(JSON.parse(raw));
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (ready) localStorage.setItem(key, JSON.stringify(val));
  }, [key, val, ready]);
  return [val, setVal] as const;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const toneBorder = { orange: "border-st-orange", yellow: "border-st-yellow", green: "border-st-green", gray: "border-st-gray" };
const toneBg = { orange: "bg-st-orange", yellow: "bg-st-yellow", green: "bg-st-green", gray: "bg-st-gray" };

function Index() {
  const [vacantes, setVacantes] = useStored<Vacante[]>("mv-vacantes", []);
  const [eventos, setEventos] = useStored<Evento[]>("mv-eventos", []);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"apps" | "cal">("apps");
  const [sub, setSub] = useState<"activas" | "antiguas">("activas");
  const [editing, setEditing] = useState<Vacante | null | "new">(null);
  const [feedbackFor, setFeedbackFor] = useState<Vacante | null>(null);
  const [viewOld, setViewOld] = useState<Vacante | null>(null);

  const list = vacantes.filter((v) => matches(v, q) && (sub === "antiguas" ? isAntigua(v) : !isAntigua(v)));

  const saveVacante = (v: Vacante) => {
    const prev = vacantes.find((x) => x.id === v.id);
    setVacantes((all) => (prev ? all.map((x) => (x.id === v.id ? v : x)) : [...all, v]));
    setEditing(null);
    if (v.estado === "Descartado" && prev?.estado !== "Descartado") setFeedbackFor(v);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col items-center gap-5 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Mis vacantes</h1>
        <div className="glass flex w-full max-w-xl items-center gap-2 rounded-full px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por empresa o vacante"
            className="h-12 w-full bg-transparent text-sm outline-none"
          />
        </div>
        <Button size="lg" className="rounded-full px-6 shadow-glass" onClick={() => setEditing("new")}>
          <Plus /> Agregar vacante
        </Button>
      </header>

      <nav className="glass mx-auto mt-10 flex w-fit rounded-full p-1">
        {(["apps", "cal"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-semibold transition",
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "apps" ? "Aplicaciones" : "Calendario"}
          </button>
        ))}
      </nav>

      {tab === "apps" ? (
        <section className="mt-8">
          <div className="mb-6 flex gap-6 border-b border-border">
            {(["activas", "antiguas"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSub(s)}
                className={cn(
                  "-mb-px border-b-2 pb-2 text-sm font-semibold capitalize",
                  sub === s ? "border-primary text-foreground" : "border-transparent text-muted-foreground",
                )}
              >
                {s} ({vacantes.filter((v) => (s === "antiguas" ? isAntigua(v) : !isAntigua(v))).length})
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <p className="glass rounded-3xl p-10 text-center text-muted-foreground">
              {vacantes.length === 0 ? "Aún no tienes vacantes. Agrega la primera." : "No hay vacantes aquí."}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((v) => (
                <VacanteCard
                  key={v.id}
                  v={v}
                  alert={!isAntigua(v) && hasPendingEvent(v.id, eventos)}
                  onClick={() => (isAntigua(v) ? setViewOld(v) : setEditing(v))}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <Calendar vacantes={vacantes} eventos={eventos} setEventos={setEventos} />
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="form-glass max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-3xl">
          {editing !== null && (
            <VacanteForm
              initial={editing === "new" ? undefined : editing}
              onSave={saveVacante}
              onDelete={(id) => {
                setVacantes((a) => a.filter((x) => x.id !== id));
                setEventos((a) => a.filter((e) => e.vacanteId !== id));
                setEditing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!feedbackFor} onOpenChange={(o) => !o && setFeedbackFor(null)}>
        <DialogContent className="form-glass max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-3xl">
          {feedbackFor && (
            <FeedbackForm
              v={feedbackFor}
              onCancel={() => setFeedbackFor(null)}
              onSave={(fb) => {
                setVacantes((a) => a.map((x) => (x.id === feedbackFor.id ? { ...x, feedback: isFeedbackEmpty(fb) ? undefined : fb } : x)));
                setFeedbackFor(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewOld} onOpenChange={(o) => !o && setViewOld(null)}>
        <DialogContent className="form-glass max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-3xl">
          {viewOld && (
            <>
              <DialogHeader>
                <DialogTitle>{viewOld.puesto}</DialogTitle>
                <DialogDescription>{viewOld.empresa}</DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Info k="Reclutador" v={viewOld.reclutador} />
                <Info k="Medio" v={viewOld.medio} />
                <Info k="Estado" v={`${viewOld.grupo} · ${viewOld.estado}`} />
              </dl>
              <div className="space-y-3 rounded-2xl border border-form-edge bg-form-field p-4 text-sm">
                <h3 className="font-semibold">Retroalimentación</h3>
                {viewOld.feedback ? (
                  <>
                    <Info k="¿Cuál fue el motivo comunicado por la empresa para descartar mi candidatura?" v={viewOld.feedback.ocurrio} />
                    <Info k="¿En que parte del proceso me sentí menos preparada?" v={viewOld.feedback.falto} />
                    <Info k="Habilidad(es) técnica(s) o blandas que no logré demostrar" v={viewOld.feedback.mejorar} />
                  </>
                ) : (
                  <p className="text-muted-foreground">Sin retroalimentación registrada.</p>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => { setFeedbackFor(viewOld); setViewOld(null); }}>
                  {viewOld.feedback ? "Editar retroalimentación" : "Agregar retroalimentación"}
                </Button>
                <Button onClick={() => { setEditing(viewOld); setViewOld(null); }}>Editar datos</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{k}</dt>
      <dd className="whitespace-pre-wrap">{v || "—"}</dd>
    </div>
  );
}

function VacanteCard({ v, alert, onClick }: { v: Vacante; alert: boolean; onClick: () => void }) {
  const tone = statusTone(v);
  const filled = v.grupo === "Concluida";
  return (
    <button
      onClick={onClick}
      className={cn(
        "glass relative rounded-3xl border-2 p-5 text-left transition hover:-translate-y-0.5",
        toneBorder[tone],
        filled && toneBg[tone],
      )}
    >
      {alert && (
        <AlertCircle className="absolute right-4 top-4 size-6 fill-destructive text-background" aria-label="Evento próximo" />
      )}
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{v.empresa}</p>
      <h3 className="mt-1 pr-8 text-lg font-bold leading-tight">{v.puesto}</h3>
      <div className="mt-4 space-y-1 text-sm text-muted-foreground">
        <p>👤 {v.reclutador}</p>
        <p>💬 {v.medio}</p>
      </div>
      <span className={cn("mt-4 inline-block rounded-full px-3 py-1 text-xs font-semibold", toneBg[tone])}>
        {v.estado}
      </span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function VacanteForm({ initial, onSave, onDelete }: { initial?: Vacante | undefined; onSave: (v: Vacante) => void; onDelete: (id: string) => void }) {
  const [f, setF] = useState<Vacante>(
    initial ?? { id: uid(), empresa: "", puesto: "", medio: "", reclutador: "", grupo: "" as Group, estado: "" },
  );
  const set = (k: keyof Vacante) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(f); }} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{initial ? "Editar vacante" : "Agregar vacante"}</DialogTitle>
      </DialogHeader>
      <Field label="Empresa"><Input required value={f.empresa} onChange={set("empresa")} /></Field>
      <Field label="Nombre de la vacante"><Input required value={f.puesto} onChange={set("puesto")} /></Field>
      <Field label="Medio de contacto"><Input required placeholder="LinkedIn, correo, WhatsApp…" value={f.medio} onChange={set("medio")} /></Field>
      <Field label="Nombre del reclutador"><Input required value={f.reclutador} onChange={set("reclutador")} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Estado del proceso">
          <FormSelect label="Estado del proceso" value={f.grupo}
            onValueChange={(grupo) => setF({ ...f, grupo: grupo as Group, estado: "" })}
            options={Object.keys(STATUS_GROUPS)} />
        </Field>
        <Field label="Estado específico">
          <FormSelect label="Estado específico" value={f.estado} disabled={!f.grupo}
            onValueChange={(estado) => setF({ ...f, estado })}
            options={f.grupo ? STATUS_GROUPS[f.grupo] : []} />
        </Field>
      </div>
      <div className="flex justify-between gap-2 pt-2">
        {initial ? (
          <Button type="button" variant="ghost" className="text-destructive" onClick={() => confirm("¿Eliminar vacante?") && onDelete(f.id)}>
            <Trash2 /> Eliminar
          </Button>
        ) : <span />}
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
}

function FeedbackForm({ v, onSave, onCancel }: { v: Vacante; onSave: (f: Feedback) => void; onCancel: () => void }) {
  const [f, setF] = useState<Feedback>(v.feedback ?? { ocurrio: "", falto: "", mejorar: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(f); }} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Retroalimentación del proceso</DialogTitle>
        <DialogDescription>{v.puesto} · {v.empresa}</DialogDescription>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">Las respuestas son opcionales: puedes guardar o cerrar sin completar ningún campo.</p>
      <Field label=" ¿Cuál fue el motivo comunicado por la empresa para descartar mi candidatura?"><Textarea value={f.ocurrio} onChange={(e) => setF({ ...f, ocurrio: e.target.value })} /></Field>
      <Field label="¿En que parte del proceso me sentí menos preparada?"><Textarea value={f.falto} onChange={(e) => setF({ ...f, falto: e.target.value })} /></Field>
      <Field label="Habilidad(es) técnica(s) o blandas que no logré demostrar"><Textarea value={f.mejorar} onChange={(e) => setF({ ...f, mejorar: e.target.value })} /></Field>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cerrar sin guardar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
}

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const pad = (n: number) => String(n).padStart(2, "0");

function Calendar({ vacantes, eventos, setEventos }: { vacantes: Vacante[]; eventos: Evento[]; setEventos: (fn: (e: Evento[]) => Evento[]) => void }) {
  const today = new Date();
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [editing, setEditing] = useState<Evento | null | "new">(null);
  const [noVacantes, setNoVacantes] = useState(false);

  const cells = useMemo(() => {
    const first = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7;
    const days = new Date(ym.y, ym.m + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  }, [ym]);
  const shift = (d: number) => setYm(({ y, m }) => { const n = new Date(y, m + d, 1); return { y: n.getFullYear(), m: n.getMonth() }; });
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => shift(-1)} aria-label="Mes anterior"><ChevronLeft /></Button>
          <h2 className="min-w-44 text-center text-xl font-bold">{MONTHS[ym.m]} {ym.y}</h2>
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => shift(1)} aria-label="Mes siguiente"><ChevronRight /></Button>
        </div>
        <Button className="rounded-full" onClick={() => (vacantes.length ? setEditing("new") : setNoVacantes(true))}>
          <Plus /> Agregar evento
        </Button>
      </div>
      {noVacantes && (
        <p className="mb-4 rounded-2xl bg-st-amber/40 p-3 text-sm">Primero debes agregar una vacante para poder crear eventos.</p>
      )}
      <div className="glass overflow-hidden rounded-3xl">
        <div className="grid grid-cols-7 border-b border-border text-center text-xs font-semibold text-muted-foreground">
          {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const date = d ? `${ym.y}-${pad(ym.m + 1)}-${pad(d)}` : "";
            const evs = d ? eventos.filter((e) => e.fecha === date).sort((a, b) => a.hora.localeCompare(b.hora)) : [];
            return (
              <div key={i} className="min-h-20 border-b border-r border-border/60 p-1 sm:min-h-28 sm:p-2">
                {d && (
                  <span className={cn("inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold", date === todayStr && "bg-primary text-primary-foreground")}>{d}</span>
                )}
                <div className="mt-1 space-y-1">
                  {evs.map((e) => {
                    const v = vacantes.find((x) => x.id === e.vacanteId);
                    return (
                      <button key={e.id} onClick={() => setEditing(e)}
                        className={cn("block w-full truncate rounded-md bg-accent px-1 py-0.5 text-left text-[10px] font-medium sm:text-xs", e.completado && "opacity-50 line-through")}>
                        {e.hora} {v?.empresa ?? "—"}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="form-glass max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-3xl">
          {editing !== null && (
            <EventoForm
              vacantes={vacantes}
              initial={editing === "new" ? undefined : editing}
              onSave={(ev) => { setEventos((a) => (a.some((x) => x.id === ev.id) ? a.map((x) => (x.id === ev.id ? ev : x)) : [...a, ev])); setEditing(null); }}
              onDelete={(id) => { setEventos((a) => a.filter((x) => x.id !== id)); setEditing(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function EventoForm({ vacantes, initial, onSave, onDelete }: { vacantes: Vacante[]; initial?: Evento | undefined; onSave: (e: Evento) => void; onDelete: (id: string) => void }) {
  const [f, setF] = useState<Evento>(initial ?? { id: uid(), vacanteId: "", tipo: "", fecha: "", hora: "" });
  const empresas = [...new Set(vacantes.map((v) => v.empresa))];
  const [empresa, setEmpresa] = useState(vacantes.find((v) => v.id === f.vacanteId)?.empresa ?? "");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(f); }} className="space-y-4">
      <DialogHeader><DialogTitle>{initial ? "Detalle del evento" : "Agregar evento"}</DialogTitle></DialogHeader>
      <Field label="Nombre de la empresa">
        <FormSelect label="Nombre de la empresa" value={empresa} options={empresas}
          onValueChange={(value) => { setEmpresa(value); setF({ ...f, vacanteId: "" }); }} />
      </Field>
      <Field label="Nombre de la vacante">
        <FormSelect label="Nombre de la vacante" value={f.vacanteId} disabled={!empresa}
          onValueChange={(vacanteId) => setF({ ...f, vacanteId })}
          options={vacantes.filter((v) => v.empresa === empresa).map((v) => ({ value: v.id, label: v.puesto }))} />
      </Field>
      <Field label="Tipo de evento">
        <FormSelect label="Tipo de evento" value={f.tipo} options={EVENT_TYPES}
          onValueChange={(tipo) => setF({ ...f, tipo })} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fecha"><Input required type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} /></Field>
        <Field label="Hora">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1">
            <FormSelect label="Hora (00–23)" placeholder="HH" value={f.hora.split(":")[0] || ""}
              options={HOURS_24} onValueChange={(hour) => setF({ ...f, hora: updateTimePart(f.hora, "hour", hour) })} />
            <span aria-hidden="true" className="text-muted-foreground">:</span>
            <FormSelect label="Minutos" placeholder="mm" value={f.hora.split(":")[1] || ""}
              options={MINUTES} onValueChange={(minute) => setF({ ...f, hora: updateTimePart(f.hora, "minute", minute) })} />
          </div>
        </Field>
      </div>
      {initial && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!f.completado} onChange={(e) => setF({ ...f, completado: e.target.checked })} />
          Marcar como completado
        </label>
      )}
      <div className="flex justify-between gap-2">
        {initial ? (
          <Button type="button" variant="ghost" className="text-destructive" onClick={() => onDelete(f.id)}><Trash2 /> Eliminar</Button>
        ) : <span />}
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
}

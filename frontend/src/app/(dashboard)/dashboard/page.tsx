"use client";

import React, { useEffect, useState, useCallback } from "react";
import api from "@/services/api";
import Modal from "@/components/ui/Modal";
import { toast } from "sonner";
import { startOfWeek, format, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface MiembroInfo {
  attendance_id: string;
  member_id: string | null;
  academy_id: string | null;
  nombre: string;
  dni: string;
  hora_entrada: string;
  tipo: string;
}

interface UbicacionEstado {
  nombre: string;
  tipo: string;
  ocupado: boolean;
  miembros: MiembroInfo[];
}

interface Stats {
  asistencias_hoy: number;
  asistencias_semana: number;
  asistencias_mes: number;
  miembros_activos: number;
  total_academias: number;
  ubicaciones: UbicacionEstado[];
}

interface TodayAttendee {
  id: string;
  member_id: string | null;
  academy_id: string | null;
  tipo: string;
  nombre: string;
  dni: string;
  hora_entrada: string;
  ubicaciones: string[];
}

const DIAS_LABELS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [cronograma, setCronograma] = useState<any[]>([]);
  const [semanaInicio, setSemanaInicio] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedUb, setSelectedUb] = useState<UbicacionEstado | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [ubicacionesList, setUbicacionesList] = useState<{ nombre: string; tipo: string }[]>([]);
  const [showAgregar, setShowAgregar] = useState(false);
  const [todayAttendees, setTodayAttendees] = useState<TodayAttendee[]>([]);
  const [selectedForAdd, setSelectedForAdd] = useState<string[]>([]);

  const fetchStats = useCallback(async () => {
    const { data } = await api.get("/dashboard/stats");
    setStats(data);
    api.get("/pool-config/").then(({ data: cfg }) => {
      setUbicacionesList(cfg.ubicaciones || []);
    });
  }, []);

  const fetchCronograma = useCallback(async () => {
    try {
      const ds = format(semanaInicio, "yyyy-MM-dd");
      const { data } = await api.get("/dashboard/cronograma-semanal", { params: { semana_inicio: ds } });
      setCronograma(data.slots || []);
    } catch {}
  }, [semanaInicio]);

  const fetchTodayAttendees = useCallback(async () => {
    try {
      const { data } = await api.get("/dashboard/today-attendees");
      setTodayAttendees(data);
    } catch {}
  }, []);

  useEffect(() => { fetchStats(); fetchCronograma(); fetchTodayAttendees(); }, [fetchStats, fetchCronograma, fetchTodayAttendees]);

  const handleDrop = async (ev: React.DragEvent, targetNombre: string) => {
    ev.preventDefault();
    if (!editMode) return;
    try {
      const data = JSON.parse(ev.dataTransfer.getData("text/plain"));
      await api.put(`/attendances/${data.attendance_id}/ubicaciones`, { ubicaciones: [targetNombre] });
      toast.success(`${data.nombre} movido a ${targetNombre}`);
      fetchStats();
    } catch { toast.error("Error al mover"); }
  };

  const openAgregar = () => {
    setSelectedForAdd([]);
    fetchTodayAttendees();
    setShowAgregar(true);
  };

  const toggleAddAttendee = (id: string) => {
    setSelectedForAdd((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleAddToUbicacion = async () => {
    if (!selectedUb || selectedForAdd.length === 0) return;
    try {
      for (const attId of selectedForAdd) {
        const att = todayAttendees.find((a) => a.id === attId);
        if (!att) continue;
        const currentUbs = att.ubicaciones || [];
        if (!currentUbs.includes(selectedUb.nombre)) {
          await api.put(`/attendances/${attId}/ubicaciones`, {
            ubicaciones: [...currentUbs, selectedUb.nombre],
          });
        }
      }
      toast.success("Asignados a " + selectedUb.nombre);
      setShowAgregar(false);
      fetchStats();
      fetchTodayAttendees();
    } catch { toast.error("Error al asignar"); }
  };

  const handleQuitarDeCarril = async (attId: string, ubNombre: string) => {
    try {
      const att = todayAttendees.find((a) => a.id === attId);
      const currentUbs = att?.ubicaciones || [];
      const newUbs = currentUbs.filter((u) => u !== ubNombre);
      await api.put(`/attendances/${attId}/ubicaciones`, { ubicaciones: newUbs });
      toast.success(`Quitado de ${ubNombre}`);
      setSelectedUb(null);
      fetchStats();
      fetchTodayAttendees();
    } catch { toast.error("Error"); }
  };

  const handleLiberar = async (attendanceId: string, nombre: string) => {
    if (!confirm(`Liberar a "${nombre}" de todas las ubicaciones?`)) return;
    try {
      await api.post(`/dashboard/liberar/${attendanceId}`);
      toast.success(`${nombre} liberado.`);
      setSelectedUb(null);
      fetchStats();
      fetchTodayAttendees();
    } catch { toast.error("Error al liberar"); }
  };

  const prevWeek = () => setSemanaInicio((d) => addDays(d, -7));
  const nextWeek = () => setSemanaInicio((d) => addDays(d, 7));

  if (!stats) return <div className="text-gray-500">Cargando...</div>;

  const cards = [
    { label: "Asistencias hoy", value: stats.asistencias_hoy },
    { label: "Esta semana", value: stats.asistencias_semana },
    { label: "Este mes", value: stats.asistencias_mes },
    { label: "Miembros activos", value: stats.miembros_activos },
    { label: "Academias", value: stats.total_academias },
  ];

  const carriles = stats.ubicaciones.filter((u) => u.tipo === "carril");
  const piscinas = stats.ubicaciones.filter((u) => u.tipo === "piscina");
  const maxMiembros = Math.max(1, ...stats.ubicaciones.map((u) => u.miembros.length));
  const cardHeight = 80 + Math.min(maxMiembros, 6) * 32;

  const semanaDias = Array.from({ length: 7 }, (_, i) => addDays(semanaInicio, i));

  const notInThisUb = todayAttendees.filter(
    (a) => !a.ubicaciones.includes(selectedUb?.nombre || "")
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => { fetchStats(); fetchCronograma(); fetchTodayAttendees(); }}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Actualizar</button>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <span className="text-gray-500">Editar</span>
            <button type="button" onClick={() => setEditMode(!editMode)}
              className={"relative w-10 h-5 rounded-full transition-colors " + (editMode ? "bg-blue-600" : "bg-gray-300")}>
              <span className={"absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform " + (editMode ? "translate-x-5" : "")} />
            </button>
          </label>
        </div>
      </div>
      {editMode && <p className="text-xs text-blue-600 mb-3">Arrastre un miembro de una ubicacion a otra para moverlo.</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-4">Carriles</h2>
          {carriles.length === 0 ? <p className="text-gray-400 text-sm">No hay carriles configurados.</p> : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 auto-rows-auto">
              {carriles.map((c) => (
                <div key={c.nombre}
                  onDragOver={editMode ? (e) => { e.preventDefault(); } : undefined}
                  onDrop={(e) => handleDrop(e, c.nombre)}
                  onClick={() => { if (!editMode) setSelectedUb(c); }}
                  className={"rounded-xl border-2 p-3 text-center transition-all min-h-[80px] " + (editMode ? "cursor-default" : "cursor-pointer hover:shadow-md") + " " + (c.ocupado ? "border-green-400 bg-green-50" : "border-gray-200 bg-gray-50")}
                  style={{ minHeight: cardHeight + "px" }}>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{c.nombre}</div>
                  {c.miembros.length > 0 ? c.miembros.map((m) => (
                    <div key={m.attendance_id} draggable={editMode}
                      onDragStart={(e) => { e.dataTransfer.setData("text/plain", JSON.stringify(m)); }}
                      className={"text-sm font-medium truncate px-2 py-1 rounded mt-1 transition-colors " + (editMode ? "cursor-grab active:cursor-grabbing bg-green-100 hover:bg-green-200" : "text-green-700")}>
                      {m.nombre}
                    </div>
                  )) : <div className="text-xs text-gray-400 mt-4">Libre</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-4">Piscinas pequeñas</h2>
          {piscinas.length === 0 ? <p className="text-gray-400 text-sm">No hay piscinas configuradas.</p> : (
            <div className="grid grid-cols-1 gap-3">
              {piscinas.map((p) => (
                <div key={p.nombre}
                  onDragOver={editMode ? (e) => { e.preventDefault(); } : undefined}
                  onDrop={(e) => handleDrop(e, p.nombre)}
                  onClick={() => { if (!editMode) setSelectedUb(p); }}
                  className={"rounded-xl border-2 p-3 text-center transition-all min-h-[80px] " + (editMode ? "cursor-default" : "cursor-pointer hover:shadow-md") + " " + (p.ocupado ? "border-teal-400 bg-teal-50" : "border-gray-200 bg-gray-50")}
                  style={{ minHeight: cardHeight + "px" }}>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{p.nombre}</div>
                  {p.miembros.length > 0 ? p.miembros.map((m) => (
                    <div key={m.attendance_id} draggable={editMode}
                      onDragStart={(e) => { e.dataTransfer.setData("text/plain", JSON.stringify(m)); }}
                      className={"text-sm font-medium truncate px-2 py-1 rounded mt-1 transition-colors " + (editMode ? "cursor-grab active:cursor-grabbing bg-teal-100 hover:bg-teal-200 mb-1" : "text-teal-700")}>
                      {m.nombre}
                    </div>
                  )) : <div className="text-xs text-gray-400 mt-4">Libre</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Cronograma semanal</h2>
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">&larr;</button>
            <span className="text-sm font-medium">{format(semanaInicio, "d MMM", { locale: es })} - {format(addDays(semanaInicio, 6), "d MMM yyyy", { locale: es })}</span>
            <button onClick={nextWeek} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">&rarr;</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[70px_repeat(7,1fr)] gap-px bg-gray-200 rounded-lg overflow-hidden text-xs">
              <div className="bg-gray-50 px-2 py-2 text-center font-semibold text-gray-500">Hora</div>
              {semanaDias.map((d, i) => (
                <div key={i} className="bg-gray-50 px-2 py-2 text-center font-semibold text-gray-500">
                  {format(d, "EEE d", { locale: es })}
                </div>
              ))}
              {cronograma.length === 0 ? (
                <div className="col-span-8 bg-white px-4 py-8 text-center text-gray-400">No hay horarios asignados esta semana.</div>
              ) : cronograma.map((slot: any, si: number) => (
                <React.Fragment key={si}>
                  <div className="bg-white px-2 py-3 text-center text-gray-500 font-medium border-t border-gray-100">{slot.hora}</div>
                  {DIAS_LABELS.map((dia, di) => {
                    const items = slot[dia] || [];
                    return (
                      <div key={`${si}-${di}`} className="bg-white px-1 py-1 border-t border-gray-100 min-h-[60px]">
                        {items.map((item: any, ii: number) => (
                          <div key={ii}
                            className="text-[10px] px-1 py-0.5 rounded mb-0.5 text-white font-medium leading-tight"
                            style={{ backgroundColor: item.edad?.color || "#3b82f6" }}>
                            <div className="truncate font-semibold">{item.mostrar || item.nombre}</div>
                            {item.edad?.nombre && item.edad?.nombre !== "Academia" && (
                              <div className="truncate opacity-80">{item.edad.nombre}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal open={!!selectedUb} onClose={() => setSelectedUb(null)}
        title={selectedUb ? selectedUb.nombre : ""}>
        {selectedUb && (
          <div className="space-y-4">
            {selectedUb.miembros.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedUb.miembros.map((m) => (
                  <div key={m.attendance_id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{m.nombre}</p>
                        <p className="text-xs text-gray-400">{m.tipo === "academy" ? "Academia" : `DNI: ${m.dni}`}</p>
                        <p className="text-[10px] text-gray-300">{new Date(m.hora_entrada).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleQuitarDeCarril(m.attendance_id, selectedUb.nombre)}
                          className="text-xs text-orange-500 hover:text-orange-700 font-medium">Quitar</button>
                        <button onClick={() => handleLiberar(m.attendance_id, m.nombre)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium">Liberar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4 text-sm">Ubicacion libre.</p>
            )}
            <button onClick={openAgregar}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              + Agregar
            </button>
          </div>
        )}
      </Modal>

      <Modal open={showAgregar} onClose={() => setShowAgregar(false)}
        title={`Agregar a ${selectedUb?.nombre || ""}`}>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notInThisUb.length === 0 ? (
            <p className="text-gray-400 text-center py-4 text-sm">Todos ya estan asignados a esta ubicacion.</p>
          ) : (
            notInThisUb.map((a) => (
              <label key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={selectedForAdd.includes(a.id)}
                  onChange={() => toggleAddAttendee(a.id)} className="rounded border-gray-300" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{a.nombre}</p>
                  <p className="text-xs text-gray-400">{a.tipo === "academy" ? "Academia" : `DNI: ${a.dni}`} &middot; {new Date(a.hora_entrada).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div className="flex gap-1 flex-wrap max-w-[160px]">
                  {a.ubicaciones.map((ub) => (
                    <span key={ub} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">{ub}</span>
                  ))}
                </div>
              </label>
            ))
          )}
        </div>
        {selectedForAdd.length > 0 && (
          <button onClick={handleAddToUbicacion}
            className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
            Asignar {selectedForAdd.length} a {selectedUb?.nombre}
          </button>
        )}
      </Modal>
    </div>
  );
}

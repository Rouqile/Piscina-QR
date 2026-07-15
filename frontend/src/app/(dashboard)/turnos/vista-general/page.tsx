"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parse, addDays } from "date-fns";
import { es } from "date-fns/locale";
import Modal from "@/components/ui/Modal";
import { toast } from "sonner";
import type { Academy } from "@/types";

interface Member {
  id: string;
  dni: string;
  nombre: string;
  apellidos: string | null;
}

interface CalendarioEvento {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  member_id: string | null;
  academy_id: string | null;
  tipo: string;
  member_nombre: string;
  horario_nombre: string;
  horario_id?: string | null;
  assignment_id?: string;
  dia_semana: number;
}

const calHeaders = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

async function refreshEvents(month: Date, memberIds: string[], academyIds: string[], setEvents: (e: any) => void) {
  const params: Record<string, string> = {
    fecha_inicio: format(startOfMonth(month), "yyyy-MM-dd"),
    fecha_fin: format(endOfMonth(month), "yyyy-MM-dd"),
  };
  if (memberIds.length > 0) params.member_ids = memberIds.join(",");
  if (academyIds.length > 0) params.academy_ids = academyIds.join(",");
  if (memberIds.length === 0 && academyIds.length === 0) { setEvents([]); return; }
  const { data } = await api.get("/shift-assignments/calendario", { params });
  setEvents(data);
}

export default function VistaGeneralPage() {
  const router = useRouter();
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allAcademies, setAllAcademies] = useState<Academy[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedAcademyIds, setSelectedAcademyIds] = useState<string[]>([]);
  const [searchMembers, setSearchMembers] = useState("");
  const [searchAcademies, setSearchAcademies] = useState("");
  const [events, setEvents] = useState<CalendarioEvento[]>([]);
  const [month, setMonth] = useState(() => new Date());
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarioEvento | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [newForm, setNewForm] = useState({ member_id: "", academy_id: "", tipo: "member" as "member" | "academy", hora_inicio: "07:00", hora_fin: "08:00" });
  const [editForm, setEditForm] = useState({ fecha: "", hora_inicio: "", hora_fin: "" });
  const [showExport, setShowExport] = useState(false);
  const [exportInicio, setExportInicio] = useState("");
  const [exportFin, setExportFin] = useState("");
  const [exportData, setExportData] = useState<{ fecha: string; eventos: CalendarioEvento[] }[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    api.get("/members/").then(({ data }) => setAllMembers(data));
    api.get("/academies/").then(({ data }) => setAllAcademies(data));
  }, []);
  useEffect(() => { refreshEvents(month, selectedMemberIds, selectedAcademyIds, setEvents); }, [selectedMemberIds, selectedAcademyIds, month]);

  useEffect(() => {
    if (editingEvent) {
      setEditForm({
        fecha: editingEvent.fecha,
        hora_inicio: editingEvent.hora_inicio,
        hora_fin: editingEvent.hora_fin,
      });
    }
  }, [editingEvent]);

  const toggleMember = (id: string) => setSelectedMemberIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleAcademy = (id: string) => setSelectedAcademyIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const filteredMembers = allMembers.filter(
    (m) => m.nombre.toLowerCase().includes(searchMembers.toLowerCase()) ||
      m.apellidos?.toLowerCase().includes(searchMembers.toLowerCase()) || m.dni.includes(searchMembers)
  );
  const filteredAcademies = allAcademies.filter(
    (a) => a.nombre.toLowerCase().includes(searchAcademies.toLowerCase())
  );

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const getEventsForDay = (date: Date) => events.filter((e) => e.fecha === format(date, "yyyy-MM-dd"));
  const goToMember = (dni: string) => router.push(`/miembros?search=${dni}`);
  const modalEvents = modalDate ? getEventsForDay(modalDate) : [];

  const handleDeleteAssignment = async (event: CalendarioEvento) => {
    if (!confirm("Eliminar esta asignacion?")) return;
    try {
      await api.delete(`/shift-assignments/${event.assignment_id}`);
      toast.success("Eliminada");
      await refreshEvents(month, selectedMemberIds, selectedAcademyIds, setEvents);
      setEditingEvent(null);
    } catch (e) { toast.error("Error al eliminar"); }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    try {
      const newDate = parse(editForm.fecha, "yyyy-MM-dd", new Date());
      const pyDay = (getDay(newDate) + 6) % 7;
      await api.put(`/shift-assignments/${editingEvent.assignment_id}`, {
        hora_inicio: editForm.hora_inicio,
        hora_fin: editForm.hora_fin,
        dia_semana: pyDay,
        fecha_inicio: editForm.fecha,
        fecha_fin: editForm.fecha,
      });
      toast.success("Horario actualizado");
      await refreshEvents(month, selectedMemberIds, selectedAcademyIds, setEvents);
      setEditingEvent(null);
    } catch (err: any) {
      const d = err.response?.data?.detail;
      toast.error(Array.isArray(d) ? d.map((x: any) => x.msg).join(". ") : d || "Error");
    }
  };

  const openAddNew = () => {
    setNewForm({ member_id: "", academy_id: "", tipo: "member", hora_inicio: "07:00", hora_fin: "08:00" });
    setAddingNew(true);
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalDate) return;
    if (newForm.tipo === "member" && !newForm.member_id) return;
    if (newForm.tipo === "academy" && !newForm.academy_id) return;
    try {
      const ds = format(modalDate, "yyyy-MM-dd");
      const payload: Record<string, any> = {
        tipo: newForm.tipo,
        hora_inicio: newForm.hora_inicio,
        hora_fin: newForm.hora_fin,
        dias_semana: [(getDay(modalDate) + 6) % 7],
        fecha_inicio: ds,
        fecha_fin: ds,
      };
      if (newForm.tipo === "member") payload.member_id = newForm.member_id;
      else payload.academy_id = newForm.academy_id;
      await api.post("/shift-assignments/batch", payload);
      toast.success("Asignado");
      await refreshEvents(month, selectedMemberIds, selectedAcademyIds, setEvents);
      setAddingNew(false);
    } catch (err: any) {
      const d = err.response?.data?.detail;
      toast.error(Array.isArray(d) ? d.map((x: any) => x.msg).join(". ") : d || "Error");
    }
  };

  const handleDragStart = (ev: React.DragEvent, event: CalendarioEvento) => {
    if (!editMode) return;
    ev.dataTransfer.setData("text/plain", JSON.stringify(event));
    ev.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (ev: React.DragEvent, dayStr: string) => {
    if (!editMode) return;
    ev.preventDefault();
    setDragOverDay(dayStr);
  };

  const handleDragLeave = () => setDragOverDay(null);

  const handleDrop = async (ev: React.DragEvent, targetDayStr: string) => {
    ev.preventDefault();
    setDragOverDay(null);
    if (!editMode) return;
    try {
      const source = JSON.parse(ev.dataTransfer.getData("text/plain")) as CalendarioEvento;
      if (source.fecha === targetDayStr) return;
      const targetDate = parse(targetDayStr, "yyyy-MM-dd", new Date());
      const pyDay = (getDay(targetDate) + 6) % 7;
      await api.put(`/shift-assignments/${source.assignment_id}`, {
        dia_semana: pyDay,
        fecha_inicio: targetDayStr,
        fecha_fin: targetDayStr,
      });
      toast.success("Horario movido");
      await refreshEvents(month, selectedMemberIds, selectedAcademyIds, setEvents);
    } catch (err: any) {
      const d = err.response?.data?.detail;
      toast.error(Array.isArray(d) ? d.map((x: any) => x.msg).join(". ") : d || "Error");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Seleccione miembros y academias. Click en dia para ver detalle.</p>
        <div className="flex items-center gap-3">
          <button onClick={() => { setExportInicio(format(startOfMonth(month), "yyyy-MM-dd")); setExportFin(format(endOfMonth(month), "yyyy-MM-dd")); setExportData([]); setShowExport(true); }}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Exportar</button>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <span className="text-gray-500">Modo edicion</span>
            <button type="button" onClick={() => setEditMode(!editMode)}
              className={`relative w-10 h-5 rounded-full transition-colors ${editMode ? "bg-blue-600" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${editMode ? "translate-x-5" : ""}`} />
            </button>
          </label>
        </div>
      </div>
      {editMode && <p className="text-xs text-blue-600 mb-3">Arrastre un horario a otro dia para moverlo.</p>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Filtrar miembros</h3>
            <input type="text" placeholder="Buscar..." value={searchMembers} onChange={(e) => setSearchMembers(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-3" />
            <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm mb-1 border-b border-gray-100 pb-2">
              <input type="checkbox"
                checked={selectedMemberIds.length === filteredMembers.length && filteredMembers.length > 0}
                onChange={() => {
                  if (selectedMemberIds.length === filteredMembers.length) setSelectedMemberIds([]);
                  else setSelectedMemberIds(filteredMembers.map((m) => m.id));
                }}
                className="rounded border-gray-300" />
              <span className="font-medium text-gray-700">Todos los miembros</span>
              <span className="text-gray-400 text-xs ml-auto">{filteredMembers.length}</span>
            </label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {filteredMembers.map((m) => (
                <label key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm">
                  <input type="checkbox" checked={selectedMemberIds.includes(m.id)} onChange={() => toggleMember(m.id)} className="rounded border-gray-300" />
                  <span>{m.nombre} {m.apellidos || ""}</span>
                  <span className="text-gray-400 text-xs ml-auto">{m.dni}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Filtrar academias</h3>
            <input type="text" placeholder="Buscar..." value={searchAcademies} onChange={(e) => setSearchAcademies(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-3" />
            <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm mb-1 border-b border-gray-100 pb-2">
              <input type="checkbox"
                checked={selectedAcademyIds.length === filteredAcademies.length && filteredAcademies.length > 0}
                onChange={() => {
                  if (selectedAcademyIds.length === filteredAcademies.length) setSelectedAcademyIds([]);
                  else setSelectedAcademyIds(filteredAcademies.map((a) => a.id));
                }}
                className="rounded border-gray-300" />
              <span className="font-medium text-gray-700">Todas las academias</span>
              <span className="text-gray-400 text-xs ml-auto">{filteredAcademies.length}</span>
            </label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {filteredAcademies.map((a) => (
                <label key={a.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm">
                  <input type="checkbox" checked={selectedAcademyIds.includes(a.id)} onChange={() => toggleAcademy(a.id)} className="rounded border-gray-300" />
                  <span>{a.nombre}</span>
                  <span className="text-gray-400 text-xs ml-auto">{a.num_estudiantes} est.</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">&larr; Anterior</button>
              <h2 className="text-lg font-semibold capitalize">{format(month, "MMMM yyyy", { locale: es })}</h2>
              <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Siguiente &rarr;</button>
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {calHeaders.map((d) => (
                <div key={d} className="bg-gray-50 px-2 py-2 text-center text-xs font-semibold text-gray-500">{d}</div>
              ))}
              {Array.from({ length: days[0] ? getDay(days[0]) : 0 }).map((_, i) => (
                <div key={`e${i}`} className="bg-white min-h-[80px]" />
              ))}
              {days.map((day) => {
                const ds = format(day, "yyyy-MM-dd");
                const dayEvents = getEventsForDay(day);
                const isOver = dragOverDay === ds;
                return (
                  <div key={ds}
                    onDragOver={(e) => handleDragOver(e, ds)} onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, ds)}
                    onClick={() => { if (!editMode) setModalDate(day); }}
                    className={`bg-white min-h-[80px] p-1 border-t border-gray-100 transition-colors ${editMode ? (isOver ? "bg-blue-100" : "cursor-default") : "cursor-pointer hover:bg-blue-50"}`}>
                    <span className="text-xs text-gray-400 font-medium">{format(day, "d")}</span>
                    {dayEvents.map((ev, i) => (
                      <div key={i} draggable={editMode}
                        onDragStart={(e) => handleDragStart(e, ev)}
                        title={`${ev.member_nombre} (${ev.hora_inicio} - ${ev.hora_fin})`}
                        className={`mt-1 text-[10px] px-1 py-0.5 rounded truncate ${ev.tipo === "academy" ? "bg-purple-100 text-purple-700" : ""} ${editMode ? "cursor-grab active:cursor-grabbing bg-blue-200 text-blue-800" : (ev.tipo === "academy" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}`}>
                        {ev.member_nombre.split(" ")[0]} {ev.hora_inicio}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Modal open={!!modalDate && !editingEvent && !addingNew} onClose={() => setModalDate(null)}
        title={modalDate ? format(modalDate, "EEEE d 'de' MMMM yyyy", { locale: es }) : ""}>
        {modalEvents.length === 0 ? <p className="text-gray-400 text-center py-4">Sin horarios este dia.</p> : (
          <div className="space-y-2 mb-4">
            {modalEvents.map((ev, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 hover:bg-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{ev.member_nombre}</p>
                  <p className="text-xs text-gray-400">{ev.hora_inicio} - {ev.hora_fin} {ev.tipo === "academy" && "(Academia)"}</p>
                </div>
                <button onClick={() => setEditingEvent(ev)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Excepcion</button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <button onClick={openAddNew} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">+ Asignar nuevo horario</button>
        </div>
      </Modal>

      <Modal open={!!editingEvent} onClose={() => setEditingEvent(null)}
        title={editingEvent ? `Editar: ${editingEvent.member_nombre}` : ""}>
        <form onSubmit={handleEditSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input type="date" value={editForm.fecha}
              onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Hora ingreso</label>
              <input type="time" value={editForm.hora_inicio}
                onChange={(e) => setEditForm({ ...editForm, hora_inicio: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Hora salida</label>
              <input type="time" value={editForm.hora_fin}
                onChange={(e) => setEditForm({ ...editForm, hora_fin: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" required /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Guardar</button>
            <button type="button" onClick={() => editingEvent && handleDeleteAssignment(editingEvent)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">Eliminar</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!addingNew} onClose={() => setAddingNew(false)}
        title={modalDate ? `Nuevo - ${format(modalDate, "EEEE d 'de' MMMM", { locale: es })}` : ""}>
        <form onSubmit={handleAddNew} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
              <button type="button" onClick={() => setNewForm({ ...newForm, tipo: "member", academy_id: "" })}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  newForm.tipo === "member" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500"
                }`}>Miembro</button>
              <button type="button" onClick={() => setNewForm({ ...newForm, tipo: "academy", member_id: "" })}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  newForm.tipo === "academy" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500"
                }`}>Academia</button>
            </div>
          </div>
          {newForm.tipo === "member" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Miembro</label>
              <select value={newForm.member_id} onChange={(e) => setNewForm({ ...newForm, member_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                <option value="">Seleccionar...</option>
                {allMembers.map((m) => (<option key={m.id} value={m.id}>{m.nombre} {m.apellidos || ""} ({m.dni})</option>))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academia</label>
              <select value={newForm.academy_id} onChange={(e) => setNewForm({ ...newForm, academy_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                <option value="">Seleccionar...</option>
                {allAcademies.map((a) => (<option key={a.id} value={a.id}>{a.nombre}</option>))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Hora ingreso</label>
              <input type="time" value={newForm.hora_inicio} onChange={(e) => setNewForm({ ...newForm, hora_inicio: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Hora salida</label>
              <input type="time" value={newForm.hora_fin} onChange={(e) => setNewForm({ ...newForm, hora_fin: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" required /></div>
          </div>
          <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Asignar</button>
        </form>
      </Modal>

      <Modal open={!!showExport} onClose={() => setShowExport(false)} title="Exportar horarios">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
              <input type="date" value={exportInicio} onChange={(e) => setExportInicio(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
              <input type="date" value={exportFin} onChange={(e) => setExportFin(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          </div>
          <button onClick={async () => {
            if (!exportInicio || !exportFin) return;
            setExportLoading(true);
            try {
              const params: Record<string, string> = { fecha_inicio: exportInicio, fecha_fin: exportFin };
              if (selectedMemberIds.length > 0) params.member_ids = selectedMemberIds.join(",");
              if (selectedAcademyIds.length > 0) params.academy_ids = selectedAcademyIds.join(",");
              const { data } = await api.get("/shift-assignments/calendario", { params });
              const grouped: Record<string, CalendarioEvento[]> = {};
              for (const ev of data) { if (!grouped[ev.fecha]) grouped[ev.fecha] = []; grouped[ev.fecha].push(ev); }
              const sorted = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
              setExportData(sorted.map(([fecha, eventos]) => ({ fecha, eventos })));
            } catch (e) { toast.error("Error al cargar datos"); }
            finally { setExportLoading(false); }
          }} disabled={exportLoading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
            {exportLoading ? "Cargando..." : "Generar vista"}
          </button>
          {exportData.length > 0 && (
            <>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {exportData.map(({ fecha, eventos }) => (
                  <div key={fecha} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700">
                      {format(parse(fecha, "yyyy-MM-dd", new Date()), "EEEE d 'de' MMMM", { locale: es })}
                    </div>
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-100 text-gray-500 text-xs">
                        <th className="text-left px-3 py-1.5">Nombre</th><th className="text-left px-3 py-1.5">Tipo</th><th className="text-left px-3 py-1.5">Ingreso</th><th className="text-left px-3 py-1.5">Salida</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {eventos.map((ev, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-1.5 font-medium">{ev.member_nombre}</td>
                            <td className="px-3 py-1.5 text-xs">{ev.tipo === "academy" ? "Academia" : "Miembro"}</td>
                            <td className="px-3 py-1.5">{ev.hora_inicio}</td>
                            <td className="px-3 py-1.5">{ev.hora_fin}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => {
                  const token = sessionStorage.getItem("access_token");
                  const params = new URLSearchParams({ fecha_inicio: exportInicio, fecha_fin: exportFin });
                  if (selectedMemberIds.length > 0) params.set("member_ids", selectedMemberIds.join(","));
                  if (selectedAcademyIds.length > 0) params.set("academy_ids", selectedAcademyIds.join(","));
                  fetch(api.defaults.baseURL + "/reports/export-detalle-excel?" + params, {
                    headers: { Authorization: "Bearer " + token },
                  }).then(r => r.blob()).then(blob => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "horarios_" + exportInicio + "_" + exportFin + ".xlsx"; a.click(); }).catch(() => toast.error("Error"));
                }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">Exportar Excel</button>
                <button onClick={() => {
                  const token = sessionStorage.getItem("access_token");
                  const params = new URLSearchParams({ fecha_inicio: exportInicio, fecha_fin: exportFin });
                  if (selectedMemberIds.length > 0) params.set("member_ids", selectedMemberIds.join(","));
                  if (selectedAcademyIds.length > 0) params.set("academy_ids", selectedAcademyIds.join(","));
                  fetch(api.defaults.baseURL + "/reports/export-detalle-pdf?" + params, {
                    headers: { Authorization: "Bearer " + token },
                  }).then(r => r.blob()).then(blob => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "horarios_" + exportInicio + "_" + exportFin + ".pdf"; a.click(); }).catch(() => toast.error("Error"));
                }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">Exportar PDF</button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import api from "@/services/api";
import type { Attendance } from "@/types";
import Modal from "@/components/ui/Modal";
import { toast } from "sonner";

export default function AsistenciasPage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [observacion, setObservacion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [modo, setModo] = useState<"hoy" | "historial">("hoy");

  const fetchAttendances = async () => {
    if (modo === "hoy") {
      const params = search ? { search } : {};
      const { data } = await api.get("/attendances/today", { params });
      setAttendances(data);
    } else {
      const params: Record<string, string> = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;
      const { data } = await api.get("/attendances/", { params });
      setAttendances(data);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [search, modo]);

  const handleUpdate = async (id: string) => {
    try {
      await api.put(`/attendances/${id}`, { observacion });
      toast.success("Observacion actualizada");
      setSelectedId(null);
      setObservacion("");
      fetchAttendances();
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar esta asistencia? Esta accion no se puede deshacer.")) return;
    try {
      await api.delete(`/attendances/${id}`);
      toast.success("Asistencia eliminada");
      fetchAttendances();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Asistencias</h1>
        <button onClick={fetchAttendances}
          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
          Actualizar
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button type="button" onClick={() => setModo("hoy")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              modo === "hoy" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>Hoy</button>
          <button type="button" onClick={() => setModo("historial")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              modo === "historial" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>Historial</button>
        </div>

        {modo === "hoy" ? (
          <input type="text" placeholder="Buscar por nombre, DNI o academia..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg" />
        ) : (
          <div className="flex gap-2 items-center flex-wrap">
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <span className="text-gray-400">a</span>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <button onClick={fetchAttendances}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Filtrar</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hora</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">DNI</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ubicacion</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Observacion</th>
              <th className="text-left px-4 py-3.5"></th>
              <th className="text-left px-4 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {attendances.map((a) => (
              <tr key={a.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="px-4 py-3.5 text-gray-500 text-xs">{format(new Date(a.fecha), "dd/MM/yyyy")}</td>
                <td className="px-4 py-3.5">{format(new Date(a.hora_entrada), "HH:mm")}</td>
                <td className="px-4 py-3.5 font-medium">
                  {a.member_nombre || a.member_id?.slice(0, 8) || "Academia"}
                  {a.tipo === "academy" && (
                    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">A</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-gray-500">{a.member_dni || "-"}</td>
                <td className="px-4 py-3.5">
                  {a.ubicacion ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {(() => { try { const u = JSON.parse(a.ubicacion); return Array.isArray(u) ? u.join(", ") : a.ubicacion; } catch { return a.ubicacion; } })()}
                    </span>
                  ) : "-"}
                </td>
                <td className="px-4 py-3.5 text-gray-500">{a.observacion || "-"}</td>
                <td className="px-4 py-3.5">
                  <button onClick={() => { setSelectedId(a.id); setObservacion(a.observacion || ""); }}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium">Editar obs.</button>
                </td>
                <td className="px-4 py-3.5">
                  <button onClick={() => handleDelete(a.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                </td>
              </tr>
            ))}
            {attendances.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">No hay asistencias registradas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!selectedId} onClose={() => setSelectedId(null)} title="Editar observacion">
        <div className="space-y-4">
          <textarea value={observacion} onChange={(e) => setObservacion(e.target.value)}
            placeholder="Ej: Ingreso 30 min tarde"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg h-24 resize-none" />
          <button onClick={() => selectedId && handleUpdate(selectedId)}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
        </div>
      </Modal>
    </div>
  );
}

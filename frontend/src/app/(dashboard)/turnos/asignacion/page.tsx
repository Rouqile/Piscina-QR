"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import type { Academy } from "@/types";
import { toast } from "sonner";

const DIAS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

interface Member {
  id: string;
  dni: string;
  nombre: string;
  apellidos: string | null;
}

export default function AsignacionPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [tipo, setTipo] = useState<"member" | "academy">("member");
  const [memberId, setMemberId] = useState("");
  const [academyId, setAcademyId] = useState("");
  const [horaInicio, setHoraInicio] = useState("07:00");
  const [horaFin, setHoraFin] = useState("08:00");
  const [dias, setDias] = useState<number[]>([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  useEffect(() => {
    api.get("/members/").then(({ data }) => setMembers(data));
    api.get("/academies/").then(({ data }) => setAcademies(data));
  }, []);

  const toggleDia = (i: number) => {
    setDias((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dias.length === 0 || !fechaInicio || !fechaFin) {
      toast.error("Complete todos los campos");
      return;
    }
    if (tipo === "member" && !memberId) {
      toast.error("Seleccione un miembro");
      return;
    }
    if (tipo === "academy" && !academyId) {
      toast.error("Seleccione una academia");
      return;
    }
    try {
      const payload: Record<string, any> = {
        tipo,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        dias_semana: dias,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      };
      if (tipo === "member") {
        payload.member_id = memberId;
      } else {
        payload.academy_id = academyId;
      }
      await api.post("/shift-assignments/batch", payload);
      toast.success("Turnos asignados correctamente");
      setDias([]);
      setFechaInicio("");
      setFechaFin("");
    } catch (err: any) {
      const d = err.response?.data?.detail;
      toast.error(Array.isArray(d) ? d.map((x: any) => x.msg).join(". ") : d || "Error al asignar");
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Seleccione un miembro o academia, defina el horario, los dias de la semana y el rango de fechas.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de asignacion</label>
          <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
            <button type="button" onClick={() => { setTipo("member"); setAcademyId(""); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tipo === "member" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>Miembro</button>
            <button type="button" onClick={() => { setTipo("academy"); setMemberId(""); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tipo === "academy" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>Academia</button>
          </div>
        </div>

        {tipo === "member" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Miembro</label>
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
              <option value="">Seleccionar...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre} {m.apellidos || ""} ({m.dni})</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academia</label>
            <select value={academyId} onChange={(e) => setAcademyId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
              <option value="">Seleccionar...</option>
              {academies.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre} ({a.num_estudiantes} estudiantes)</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora de ingreso</label>
            <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora de salida</label>
            <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dias de la semana</label>
          <div className="flex gap-2 flex-wrap">
            {DIAS.map((d, i) => (
              <button key={i} type="button" onClick={() => toggleDia(i)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  dias.includes(i)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                }`}>{d}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
        </div>

        <button type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          Asignar turnos
        </button>
      </form>
    </div>
  );
}

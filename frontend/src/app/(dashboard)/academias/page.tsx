"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import type { Academy } from "@/types";
import Modal from "@/components/ui/Modal";
import { PlusIcon, EditIcon, DeleteIcon, DownloadIcon } from "@/components/ui/Icons";
import { toast } from "sonner";

const DEFAULT_COLORS = ["#a855f7", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#6b7280"];

export default function AcademiasPage() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Academy | null>(null);
  const [form, setForm] = useState({ codigo: "", nombre: "", num_estudiantes: 0, color: "#a855f7" });
  const [loading, setLoading] = useState(false);

  const fetchAcademies = async () => {
    const { data } = await api.get("/academies/");
    setAcademies(data);
  };

  useEffect(() => { fetchAcademies(); }, []);

  const openCreate = () => {
    const used = academies.map((a) => a.color);
    const next = DEFAULT_COLORS.find((c) => !used.includes(c)) || "#a855f7";
    setEditing(null);
    setForm({ codigo: "", nombre: "", num_estudiantes: 0, color: next });
    setShowModal(true);
  };

  const openEdit = (a: Academy) => {
    setEditing(a);
    setForm({ codigo: a.codigo, nombre: a.nombre, num_estudiantes: a.num_estudiantes, color: a.color });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/academies/${editing.id}`, form);
        toast.success("Academia actualizada");
      } else {
        await api.post("/academies/", form);
        toast.success("Academia creada");
      }
      setShowModal(false);
      fetchAcademies();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error");
    } finally {
      setLoading(false);
    }
  };

  const downloadQr = async (id: string) => {
    const response = await api.get(`/academies/${id}/qr`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-academia-${id.slice(0, 8)}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`Eliminar la academia "${nombre}"?`)) return;
    try {
      await api.delete(`/academies/${id}`);
      toast.success("Academia eliminada");
      fetchAcademies();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academias</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion de academias. El codigo se usa para generar el QR y hacer check-in.</p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <PlusIcon className="w-4 h-4" />
          Nueva academia
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Color</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Codigo</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estudiantes</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">QR</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {academies.map((a) => (
              <tr key={a.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="px-4 py-3.5">
                  <span className="w-5 h-5 rounded-full inline-block align-middle" style={{ backgroundColor: a.color }} />
                </td>
                <td className="px-4 py-3.5 font-mono text-xs font-medium text-gray-700">{a.codigo}</td>
                <td className="px-4 py-3.5 font-medium text-gray-900">{a.nombre}</td>
                <td className="px-4 py-3.5 text-gray-700">{a.num_estudiantes}</td>
                <td className="px-4 py-3.5">
                  <button onClick={() => downloadQr(a.id)}
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors">
                    <DownloadIcon className="w-3.5 h-3.5" />
                    QR
                  </button>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(a)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(a.id, a.nombre)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                      <DeleteIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {academies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">No hay academias registradas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editing ? "Editar academia" : "Nueva academia"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Codigo unico *</label>
            <p className="text-xs text-gray-400 mb-1">Este codigo se usa para generar el QR y hacer check-in.</p>
            <input type="text" placeholder="Ej: OLIMPO-2026" value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm" required />
          </div>
          <input type="text" placeholder="Nombre de la academia *" value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          <input type="number" placeholder="Numero de estudiantes inscritos" value={form.num_estudiantes}
            onChange={(e) => setForm({ ...form, num_estudiantes: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" min={0} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-10 h-10 p-0.5 border border-gray-300 rounded cursor-pointer" />
              <div className="flex gap-1 flex-wrap">
                {DEFAULT_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      form.color === c ? "border-gray-800 scale-110" : "border-transparent"
                    }`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: form.color }} />
            <span className="text-sm font-medium">{form.nombre || "Vista previa"}</span>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Guardando..." : editing ? "Guardar cambios" : "Crear academia"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

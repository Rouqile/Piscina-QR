"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/services/api";
import type { Member, Categoria } from "@/types";
import Modal from "@/components/ui/Modal";
import { EditIcon, DeleteIcon, DownloadIcon, PlusIcon } from "@/components/ui/Icons";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

function MiembrosContent() {
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [form, setForm] = useState({
    dni: "", codigo_unico: "", nombre: "", apellidos: "", email: "", telefono: "",
    fecha_nacimiento: "", categoria_id: "",
    observaciones_medicas: "", otras_observaciones: "", is_active: true,
  });
  const [editForm, setEditForm] = useState({
    dni: "", codigo_unico: "", nombre: "", apellidos: "", email: "", telefono: "",
    fecha_nacimiento: "", categoria_id: "",
    observaciones_medicas: "", otras_observaciones: "", is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [qrDni, setQrDni] = useState<string | null>(null);
  const [qrBlobUrl, setQrBlobUrl] = useState<string | null>(null);
  const isAdmin = useAuthStore((s) => s.isAdmin());

  const fetchMembers = async () => {
    const params = search ? { query: search } : {};
    const { data } = await api.get("/members/", { params });
    setMembers(data);
  };

  useEffect(() => {
    fetchMembers();
    api.get("/age-ranges/").then(({ data }) => setCategorias(data)).catch(() => {});
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Record<string, any> = {
        dni: form.dni, nombre: form.nombre, is_active: form.is_active,
      };
      if (form.codigo_unico) payload.codigo_unico = form.codigo_unico;
      if (form.apellidos) payload.apellidos = form.apellidos;
      payload.email = form.email || null;
      payload.telefono = form.telefono || null;
      if (form.fecha_nacimiento) payload.fecha_nacimiento = form.fecha_nacimiento;
      payload.categoria_id = form.categoria_id || null;
      if (form.observaciones_medicas) payload.observaciones_medicas = form.observaciones_medicas;
      if (form.otras_observaciones) payload.otras_observaciones = form.otras_observaciones;

      const { data } = await api.post("/members/", payload);
      setShowCreateModal(false);
      setForm({
        dni: "", codigo_unico: "", nombre: "", apellidos: "", email: "", telefono: "",
        fecha_nacimiento: "", categoria_id: "",
        observaciones_medicas: "", otras_observaciones: "", is_active: true,
      });
      setQrDni(data.dni);
      const qrResp = await api.get(`/members/${data.dni}/qr`, { responseType: "blob" });
      setQrBlobUrl(URL.createObjectURL(qrResp.data));
      toast.success("Miembro creado exitosamente");
      fetchMembers();
    } catch (err: any) {
      toast.error(getErrMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (m: Member) => {
    setEditMember(m);
    setEditForm({
      dni: m.dni, codigo_unico: m.codigo_unico || "", nombre: m.nombre,
      apellidos: m.apellidos || "", email: m.email || "", telefono: m.telefono || "",
      fecha_nacimiento: m.fecha_nacimiento ? m.fecha_nacimiento.split("T")[0] : "",
      categoria_id: m.categoria_id || "",
      observaciones_medicas: m.observaciones_medicas || "",
      otras_observaciones: m.otras_observaciones || "",
      is_active: m.is_active,
    });
    setShowEditModal(true);
  };

  const getErrMsg = (err: any) => {
    const detail = err.response?.data?.detail;
    if (Array.isArray(detail)) return detail.map((d: any) => d.msg).join(". ");
    if (typeof detail === "string") return detail;
    return "Error inesperado";
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMember) return;
    setLoading(true);
    try {
      const payload: Record<string, any> = { nombre: editForm.nombre, is_active: editForm.is_active };
      if (editForm.dni) payload.dni = editForm.dni;
      payload.codigo_unico = editForm.codigo_unico || null;
      payload.apellidos = editForm.apellidos || null;
      payload.email = editForm.email || null;
      payload.telefono = editForm.telefono || null;
      if (editForm.fecha_nacimiento) payload.fecha_nacimiento = editForm.fecha_nacimiento;
      else payload.fecha_nacimiento = null;
      payload.categoria_id = editForm.categoria_id || null;
      payload.observaciones_medicas = editForm.observaciones_medicas || null;
      payload.otras_observaciones = editForm.otras_observaciones || null;
      await api.put(`/members/${editMember.id}`, payload);
      toast.success("Miembro actualizado");
      setShowEditModal(false);
      setEditMember(null);
      fetchMembers();
    } catch (err: any) {
      toast.error(getErrMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`Eliminar permanentemente a "${nombre}"? Se borraran todos sus datos (horarios, asistencias, etc.).`)) return;
    try {
      await api.delete(`/members/${id}`);
      toast.success("Miembro eliminado");
      fetchMembers();
    } catch (err: any) {
      toast.error(getErrMsg(err));
    }
  };

  const downloadQr = async (dni: string) => {
    const response = await api.get(`/members/${dni}/qr`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${dni}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoriaColor = (catId: string | null) => {
    if (!catId) return null;
    return categorias.find((c) => c.id === catId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Miembros</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion de personas registradas en el sistema</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors">
            <PlusIcon className="w-4 h-4" />
            Nuevo miembro
          </button>
        )}
      </div>

      <div className="relative mb-4 max-w-md">
        <input type="text" placeholder="Buscar por nombre o DNI..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">DNI</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Codigo</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Apellidos</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Telefono</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">QR</th>
              {isAdmin && <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {members.map((m) => {
              const cat = getCategoriaColor(m.categoria_id);
              return (
                <tr key={m.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      m.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${m.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                      {m.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-gray-900">{m.dni}</td>
                  <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{m.codigo_unico || "-"}</td>
                  <td className="px-4 py-3.5 text-gray-700">{m.nombre}</td>
                  <td className="px-4 py-3.5 text-gray-400">{m.apellidos || "-"}</td>
                  <td className="px-4 py-3.5 text-gray-400">{m.email || "-"}</td>
                  <td className="px-4 py-3.5 text-gray-400">{m.telefono || "-"}</td>
                  <td className="px-4 py-3.5">
                    {cat ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: cat.color }}>
                        {cat.nombre}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => downloadQr(m.dni)}
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors">
                      <DownloadIcon className="w-3.5 h-3.5" />
                      QR
                    </button>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(m)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(m.id, m.nombre)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                          <DeleteIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {members.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 10 : 9} className="px-4 py-12 text-center text-gray-400">
                  No se encontraron miembros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nuevo miembro">
        <form onSubmit={handleCreate} className="space-y-4">
          <input type="text" placeholder="DNI *" value={form.dni}
            onChange={(e) => setForm({ ...form, dni: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          <input type="text" placeholder="Codigo unico (opcional)" value={form.codigo_unico}
            onChange={(e) => setForm({ ...form, codigo_unico: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Nombre *" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            <input type="text" placeholder="Apellidos" value={form.apellidos}
              onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="email" placeholder="Email (opcional)" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            <input type="tel" placeholder="Telefono (opcional)" value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <input type="date" placeholder="Fecha de nacimiento" value={form.fecha_nacimiento}
            onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="">Sin categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.edad_min}-{c.edad_max} años)
                </option>
              ))}
            </select>
          </div>
          <textarea placeholder="Observaciones medicas (opcional)" value={form.observaciones_medicas}
            onChange={(e) => setForm({ ...form, observaciones_medicas: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg h-20 resize-none" />
          <textarea placeholder="Otras observaciones (opcional)" value={form.otras_observaciones}
            onChange={(e) => setForm({ ...form, otras_observaciones: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg h-20 resize-none" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
              <button type="button" onClick={() => setForm({ ...form, is_active: true })}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  form.is_active ? "bg-green-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>Activo</button>
              <button type="button" onClick={() => setForm({ ...form, is_active: false })}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  !form.is_active ? "bg-red-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>Inactivo</button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Creando..." : "Crear miembro"}
          </button>
        </form>
      </Modal>

      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setEditMember(null); }}
        title={`Editar: ${editMember?.nombre || ""}`}>
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="DNI" value={editForm.dni}
              onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            <input type="text" placeholder="Codigo unico" value={editForm.codigo_unico}
              onChange={(e) => setEditForm({ ...editForm, codigo_unico: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Nombre" value={editForm.nombre}
              onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            <input type="text" placeholder="Apellidos" value={editForm.apellidos}
              onChange={(e) => setEditForm({ ...editForm, apellidos: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="email" placeholder="Email" value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            <input type="tel" placeholder="Telefono" value={editForm.telefono}
              onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <input type="date" value={editForm.fecha_nacimiento}
            onChange={(e) => setEditForm({ ...editForm, fecha_nacimiento: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select value={editForm.categoria_id} onChange={(e) => setEditForm({ ...editForm, categoria_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="">Sin categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.edad_min}-{c.edad_max} años)
                </option>
              ))}
            </select>
          </div>
          <textarea placeholder="Observaciones medicas" value={editForm.observaciones_medicas}
            onChange={(e) => setEditForm({ ...editForm, observaciones_medicas: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg h-20 resize-none" />
          <textarea placeholder="Otras observaciones" value={editForm.otras_observaciones}
            onChange={(e) => setEditForm({ ...editForm, otras_observaciones: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg h-20 resize-none" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
              <button type="button" onClick={() => setEditForm({ ...editForm, is_active: true })}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  editForm.is_active ? "bg-green-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>Activo</button>
              <button type="button" onClick={() => setEditForm({ ...editForm, is_active: false })}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  !editForm.is_active ? "bg-red-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>Inactivo</button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </Modal>

      <Modal open={!!qrDni} onClose={() => { setQrDni(null); setQrBlobUrl(null); }} title="QR generado">
        {qrDni && (
          <div className="text-center space-y-4">
            {qrBlobUrl ? (
              <img src={qrBlobUrl} alt="QR" className="mx-auto w-48 h-48" />
            ) : (
              <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">Cargando...</div>
            )}
            <p className="text-sm text-gray-500">DNI: {qrDni}</p>
            <button onClick={() => downloadQr(qrDni)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Descargar QR</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function MiembrosPage() {
  return (
    <Suspense fallback={<div className="text-gray-500">Cargando...</div>}>
      <MiembrosContent />
    </Suspense>
  );
}

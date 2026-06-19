"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import Modal from "@/components/ui/Modal";
import { DeleteIcon, EditIcon, PlusIcon } from "@/components/ui/Icons";
import { toast } from "sonner";

interface SystemUser {
  id: string;
  username: string;
  email: string;
  nombre: string;
  rol: string;
  is_active: boolean;
  created_at: string;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<SystemUser | null>(null);
  const [createForm, setCreateForm] = useState({ username: "", email: "", password: "", nombre: "", rol: "recepcionista" });
  const [editForm, setEditForm] = useState({ username: "", email: "", nombre: "", rol: "recepcionista", password: "", is_active: true });
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    const { data } = await api.get("/users/");
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/users/", createForm);
      toast.success("Usuario creado");
      setShowCreateModal(false);
      setCreateForm({ username: "", email: "", password: "", nombre: "", rol: "recepcionista" });
      fetchUsers();
    } catch (err: any) {
      const d = err.response?.data?.detail;
      toast.error(Array.isArray(d) ? d.map((x: any) => x.msg).join(". ") : d || "Error al crear");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (u: SystemUser) => {
    setEditUser(u);
    setEditForm({
      username: u.username,
      email: u.email,
      nombre: u.nombre,
      rol: u.rol,
      password: "",
      is_active: u.is_active,
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setLoading(true);
    try {
      const payload: any = {
        username: editForm.username,
        email: editForm.email,
        nombre: editForm.nombre,
        rol: editForm.rol,
        is_active: editForm.is_active,
      };
      if (editForm.password.trim()) payload.password = editForm.password;
      await api.put(`/users/${editUser.id}`, payload);
      toast.success("Usuario actualizado");
      setShowEditModal(false);
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      const d = err.response?.data?.detail;
      toast.error(Array.isArray(d) ? d.map((x: any) => x.msg).join(". ") : d || "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (u: SystemUser) => {
    if (!confirm(`Eliminar permanentemente a "${u.nombre}"? Esta accion no se puede deshacer.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success("Usuario eliminado");
      fetchUsers();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios del sistema</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion de personas con acceso al sistema</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors">
          <PlusIcon className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="px-4 py-3.5 font-medium text-gray-900">{u.username}</td>
                <td className="px-4 py-3.5 text-gray-700">{u.nombre}</td>
                <td className="px-4 py-3.5 text-gray-400">{u.email}</td>
                <td className="px-4 py-3.5">
                  <span className="capitalize text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {u.rol === "admin" ? "Administrador" : "Asistencia"}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    u.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                    {u.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(u)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar">
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(u)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar">
                      <DeleteIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    No hay usuarios registrados
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nuevo usuario">
        <form onSubmit={handleCreate} className="space-y-4">
          <input type="text" placeholder="Usuario *" value={createForm.username}
            onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
          <input type="text" placeholder="Nombre completo *" value={createForm.nombre}
            onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
          <input type="email" placeholder="Email *" value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
          <input type="password" placeholder="Contrasena *" value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select value={createForm.rol} onChange={(e) => setCreateForm({ ...createForm, rol: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="admin">Administrador</option>
              <option value="recepcionista">Asistencia (solo Check-in)</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors">
            {loading ? "Creando..." : "Crear usuario"}
          </button>
        </form>
      </Modal>

      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setEditUser(null); }}
        title={editUser ? `Editar: ${editUser.nombre}` : ""}>
        <form onSubmit={handleEdit} className="space-y-4">
          <input type="text" placeholder="Usuario *" value={editForm.username}
            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
          <input type="text" placeholder="Nombre completo *" value={editForm.nombre}
            onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
          <input type="email" placeholder="Email *" value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select value={editForm.rol} onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="admin">Administrador</option>
              <option value="recepcionista">Asistencia (solo Check-in)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contrasena <span className="text-gray-400 font-normal">(dejar vacio para mantener la actual)</span></label>
            <input type="password" placeholder="Nueva contrasena" value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Estado:</label>
            <button type="button" onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                editForm.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              }`}>
              {editForm.is_active ? "Activo" : "Inactivo"}
            </button>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors">
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

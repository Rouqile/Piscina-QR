"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import type { Categoria } from "@/types";
import Modal from "@/components/ui/Modal";
import { PlusIcon, EditIcon, DeleteIcon } from "@/components/ui/Icons";
import { toast } from "sonner";

interface Ubicacion {
  nombre: string;
  tipo: "carril" | "piscina";
}

const DEFAULT_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#6b7280"];

export default function ConfigPage() {
  const [capacidad, setCapacidad] = useState(30);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [instNombre, setInstNombre] = useState("");
  const [instDireccion, setInstDireccion] = useState("");
  const [instTelefono, setInstTelefono] = useState("");
  const [instEmail, setInstEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Categoria | null>(null);
  const [catForm, setCatForm] = useState({ nombre: "", edad_min: 0, edad_max: 0, color: "#6366f1" });

  useEffect(() => {
    api.get("/pool-config/").then(({ data }) => {
      setCapacidad(data.capacidad_maxima);
      setUbicaciones(data.ubicaciones || []);
      setInstNombre(data.institucion_nombre || "");
      setInstDireccion(data.institucion_direccion || "");
      setInstTelefono(data.institucion_telefono || "");
      setInstEmail(data.institucion_email || "");
    });
    api.get("/age-ranges/").then(({ data }) => setCategorias(data)).catch(() => {});
  }, []);

  const addCarril = () => {
    const num = ubicaciones.filter((u) => u.tipo === "carril").length + 1;
    setUbicaciones([...ubicaciones, { nombre: `Carril ${num}`, tipo: "carril" }]);
  };

  const addPiscina = () => {
    const num = ubicaciones.filter((u) => u.tipo === "piscina").length + 1;
    setUbicaciones([...ubicaciones, { nombre: `Piscina ${num}`, tipo: "piscina" }]);
  };

  const removeUbicacion = (i: number) => {
    setUbicaciones(ubicaciones.filter((_, idx) => idx !== i));
  };

  const renameUbicacion = (i: number, nombre: string) => {
    const newUb = [...ubicaciones];
    newUb[i] = { ...newUb[i], nombre };
    setUbicaciones(newUb);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put("/pool-config/", {
        capacidad_maxima: capacidad,
        ubicaciones: ubicaciones.map((u) => ({ nombre: u.nombre, tipo: u.tipo })),
        institucion_nombre: instNombre || null,
        institucion_direccion: instDireccion || null,
        institucion_telefono: instTelefono || null,
        institucion_email: instEmail || null,
      });
      toast.success("Configuracion actualizada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const openCreateCat = () => {
    const usedColors = categorias.map((c) => c.color);
    const nextColor = DEFAULT_COLORS.find((c) => !usedColors.includes(c)) || "#6366f1";
    setEditingCat(null);
    setCatForm({ nombre: "", edad_min: 0, edad_max: 0, color: nextColor });
    setShowCatModal(true);
  };

  const openEditCat = (cat: Categoria) => {
    setEditingCat(cat);
    setCatForm({ nombre: cat.nombre, edad_min: cat.edad_min, edad_max: cat.edad_max, color: cat.color });
    setShowCatModal(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCat) {
        await api.put(`/age-ranges/${editingCat.id}`, catForm);
        toast.success("Categoria actualizada");
      } else {
        await api.post("/age-ranges/", catForm);
        toast.success("Categoria creada");
      }
      setShowCatModal(false);
      api.get("/age-ranges/").then(({ data }) => setCategorias(data));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error");
    }
  };

  const handleDeleteCat = async (id: string, nombre: string) => {
    if (!confirm(`Eliminar la categoria "${nombre}"?`)) return;
    try {
      await api.delete(`/age-ranges/${id}`);
      toast.success("Categoria eliminada");
      api.get("/age-ranges/").then(({ data }) => setCategorias(data));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configuracion</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Aforo maximo</h2>
          <label className="block text-sm font-medium text-gray-700 mb-2">Capacidad maxima de personas</label>
          <input type="number" min={1} max={500} value={capacidad}
            onChange={(e) => setCapacidad(parseInt(e.target.value) || 1)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Datos de la institucion</h2>
          <p className="text-sm text-gray-500 mb-4">Estos datos apareceran como encabezado en los reportes.</p>
          <div className="space-y-3">
            <input type="text" placeholder="Nombre" value={instNombre}
              onChange={(e) => setInstNombre(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            <input type="text" placeholder="Direccion" value={instDireccion}
              onChange={(e) => setInstDireccion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            <input type="text" placeholder="Telefono" value={instTelefono}
              onChange={(e) => setInstTelefono(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            <input type="email" placeholder="Email" value={instEmail}
              onChange={(e) => setInstEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Ubicaciones</h2>
          <div className="flex gap-2">
            <button onClick={addCarril}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Carril</button>
            <button onClick={addPiscina}
              className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700">+ Piscina</button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-4">Configure los carriles y piscinas que apareceran al registrar la entrada de un miembro.</p>
        <div className="space-y-2">
          {ubicaciones.map((u, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                u.tipo === "carril" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"
              }`}>{u.tipo === "carril" ? "Carril" : "Piscina"}</span>
              <input type="text" value={u.nombre}
                onChange={(e) => renameUbicacion(i, e.target.value)}
                className="flex-1 px-3 py-1 border border-gray-200 rounded bg-white text-sm" />
              <button onClick={() => removeUbicacion(i)}
                className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
            </div>
          ))}
          {ubicaciones.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">No hay ubicaciones configuradas.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Categorias</h2>
          <button onClick={openCreateCat}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Nueva categoria</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Configure las categorias con colores para asignar a los miembros.</p>
        <div className="space-y-2">
          {categorias.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="font-medium text-sm flex-1">{cat.nombre}</span>
              <span className="text-xs text-gray-500">{cat.edad_min} - {cat.edad_max} años</span>
              <button onClick={() => openEditCat(cat)}
                className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors" title="Editar">
                <EditIcon className="w-4 h-4" />
              </button>
              <button onClick={() => handleDeleteCat(cat.id, cat.nombre)}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors" title="Eliminar">
                <DeleteIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
          {categorias.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">No hay categorias configuradas.</p>
          )}
        </div>
      </div>

      <button onClick={handleSave} disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Guardando..." : "Guardar cambios de configuracion"}
      </button>

      <Modal open={showCatModal} onClose={() => setShowCatModal(false)}
        title={editingCat ? "Editar categoria" : "Nueva categoria"}>
        <form onSubmit={handleCatSubmit} className="space-y-4">
          <input type="text" placeholder="Nombre de la categoria *" value={catForm.nombre}
            onChange={(e) => setCatForm({ ...catForm, nombre: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Edad minima</label>
              <input type="number" min={0} max={120} value={catForm.edad_min}
                onChange={(e) => setCatForm({ ...catForm, edad_min: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Edad maxima</label>
              <input type="number" min={0} max={120} value={catForm.edad_max}
                onChange={(e) => setCatForm({ ...catForm, edad_max: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={catForm.color}
                onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                className="w-10 h-10 p-0.5 border border-gray-300 rounded cursor-pointer" />
              <div className="flex gap-1 flex-wrap">
                {DEFAULT_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setCatForm({ ...catForm, color: c })}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      catForm.color === c ? "border-gray-800 scale-110" : "border-transparent"
                    }`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: catForm.color }} />
            <span className="text-sm font-medium">{catForm.nombre || "Vista previa"}</span>
            <span className="text-xs text-gray-500">({catForm.edad_min}-{catForm.edad_max} años)</span>
          </div>
          <button type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {editingCat ? "Guardar cambios" : "Crear categoria"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

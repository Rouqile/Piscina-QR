"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import type { Member, Categoria } from "@/types";

export default function CondicionesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/members/").then(({ data }) => setMembers(data)).catch(() => {});
    api.get("/age-ranges/").then(({ data }) => setCategorias(data)).catch(() => {});
  }, []);

  const conCondicion = members.filter((m) => m.tiene_condicion);

  const filtered = conCondicion.filter((m) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      m.nombre.toLowerCase().includes(q) ||
      (m.apellidos || "").toLowerCase().includes(q) ||
      m.dni.toLowerCase().includes(q) ||
      (m.condicion || "").toLowerCase().includes(q)
    );
  });

  const getCat = (catId: string | null) =>
    catId ? categorias.find((c) => c.id === catId) : undefined;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Condiciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Estudiantes registrados con una condición marcada
          </p>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          {conCondicion.length} con condición
        </span>
      </div>

      <div className="relative mb-4 max-w-md">
        <input type="text" placeholder="Buscar por nombre, DNI o condición..." value={search}
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
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Condición</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Observaciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((m) => {
              const cat = getCat(m.categoria_id);
              return (
                <tr key={m.id} className="hover:bg-amber-50/40 transition-colors">
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
                  <td className="px-4 py-3.5">
                    {cat ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: cat.color }}>
                        {cat.nombre}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="px-4 py-3.5 max-w-md">
                    <span className="inline-flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span className="text-gray-700">{m.condicion || "-"}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 max-w-md text-gray-700">{m.observaciones_medicas || "-"}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  {search
                    ? "No se encontraron resultados"
                    : "No hay estudiantes con condiciones registradas"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

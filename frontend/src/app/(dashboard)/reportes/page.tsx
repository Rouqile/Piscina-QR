"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";

interface Member {
  id: string;
  dni: string;
  nombre: string;
  apellidos: string | null;
}

type Tab = "resumen" | "detalle";

const TABS: { key: Tab; label: string }[] = [
  { key: "resumen", label: "Resumen" },
  { key: "detalle", label: "Detalle de asistencias" },
];

function getErr(err: any) {
  const d = err.response?.data?.detail;
  if (Array.isArray(d)) return d.map((x: any) => x.msg).join(". ");
  if (typeof d === "string") return d;
  return "Error inesperado";
}

function buildExportUrl(base: string, params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  const token = sessionStorage.getItem("access_token");
  fetch(`${api.defaults.baseURL}${base}?${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((r) => r.blob())
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const ext = base.includes("-pdf") ? ".pdf" : ".xlsx";
      a.download = base.split("/").pop() + ext;
      a.click();
    })
    .catch(() => toast.error("Error al exportar"));
}

export default function ReportesPage() {
  const [tab, setTab] = useState<Tab>("resumen");
  const [members, setMembers] = useState<Member[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    api.get("/members/").then(({ data }) => setMembers(data));
  }, []);

  const handleDownloadTemplate = () => {
    const token = sessionStorage.getItem("access_token");
    fetch(api.defaults.baseURL + "/reports/importar/plantilla", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "plantilla_miembros.xlsx";
        a.click();
      })
      .catch(() => toast.error("Error al descargar plantilla"));
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const { data } = await api.post("/reports/importar/subir", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(data);
      if (data.created > 0) {
        toast.success(data.created + " miembros importados");
      }
    } catch (err: any) {
      const d = err.response?.data?.detail;
      toast.error(Array.isArray(d) ? d.map((x: any) => x.msg).join(". ") : d || "Error al importar");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <button onClick={() => { setShowImport(true); setImportFile(null); setImportResult(null); }}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium">
          Importar BD
        </button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              tab === t.key
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumen" && <ResumenTab members={members} />}
      {tab === "detalle" && <DetalleTab members={members} />}

      <Modal open={!!showImport} onClose={() => setShowImport(false)} title="Importar miembros">
        <div className="space-y-5">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-700 mb-1">1. Descargar plantilla</h3>
            <p className="text-xs text-blue-600 mb-3">Descargue el archivo Excel con el formato requerido.</p>
            <button onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              Descargar plantilla
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">2. Subir archivo</h3>
            <p className="text-xs text-gray-500 mb-3">Complete la plantilla y subala aqui.</p>
            <input type="file" accept=".xlsx" onChange={(e) => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-3" />
            <button onClick={handleImport} disabled={!importFile || importLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm">
              {importLoading ? "Importando..." : "Importar miembros"}
            </button>
          </div>
          {importResult && (
            <div className={"rounded-lg p-4 " + (importResult.errors.length > 0 ? "bg-yellow-50" : "bg-green-50")}>
              <p className="text-sm font-semibold mb-1">
                {importResult.created > 0 ? importResult.created + " miembros importados correctamente" : "No se importaron miembros"}
              </p>
              {importResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-yellow-700 mb-1">Errores:</p>
                  <ul className="text-xs text-yellow-600 list-disc list-inside max-h-32 overflow-y-auto">
                    {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function ResumenTab({ members }: { members: Member[] }) {
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split("T")[0]);
  const [memberFilter, setMemberFilter] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [detalle, setDetalle] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = { fecha_inicio: fechaInicio, fecha_fin: fechaFin };
      if (memberFilter) params.member_id = memberFilter;
      const { data } = await api.get("/reports/attendance", { params });
      setSummary(data.summary);
      setDetalle(data.detalle);
    } catch (err) {
      toast.error(getErr(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Miembro</label>
            <select value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Todos</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre} {m.apellidos || ""} ({m.dni})</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={fetchReport} disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
              {loading ? "Generando..." : "Generar"}
            </button>
          </div>
        </div>
        {summary && (
          <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
            <button onClick={() => buildExportUrl("/reports/export-excel", { fecha_inicio: fechaInicio, fecha_fin: fechaFin, ...(memberFilter ? { member_id: memberFilter } : {}) })}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Exportar Excel</button>
            <button onClick={() => buildExportUrl("/reports/export-pdf", { fecha_inicio: fechaInicio, fecha_fin: fechaFin, ...(memberFilter ? { member_id: memberFilter } : {}) })}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Exportar PDF</button>
          </div>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500">Miembros activos</p>
            <p className="text-2xl font-bold">{summary.total_miembros_activos}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500">Asistencias en periodo</p>
            <p className="text-2xl font-bold">{summary.total_asistencias_en_rango}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500">Asistieron</p>
            <p className="text-2xl font-bold text-green-600">{summary.miembros_con_asistencia}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500">No asistieron</p>
            <p className="text-2xl font-bold text-red-600">{summary.miembros_sin_asistencia}</p>
          </div>
        </div>
      )}

      {detalle.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">DNI</th>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Apellidos</th>
                <th className="text-left px-4 py-3">Telefono</th>
                <th className="text-left px-4 py-3">Asistencias</th>
                <th className="text-left px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {detalle.map((row) => (
                <tr key={row.member_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{row.dni}</td>
                  <td className="px-4 py-3">{row.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{row.apellidos || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{row.telefono || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={row.total_asistencias > 0 ? "text-green-600 font-medium" : "text-red-500"}>
                      {row.total_asistencias}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.fechas_asistio?.length > 0 && (
                      <button onClick={() => setSelectedRow(row)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium">Ver fechas</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selectedRow} onClose={() => setSelectedRow(null)}
        title={selectedRow ? `${selectedRow.nombre} ${selectedRow.apellidos || ""}` : ""}>
        {selectedRow && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">DNI: {selectedRow.dni} | Total: {selectedRow.total_asistencias}</p>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {selectedRow.fechas_asistio?.map((f: string, i: number) => (
                <div key={i} className="bg-gray-50 rounded px-3 py-2 text-sm text-gray-700">{f}</div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetalleTab({ members }: { members: Member[] }) {
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split("T")[0]);
  const [memberFilter, setMemberFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = { fecha_inicio: fechaInicio, fecha_fin: fechaFin };
      if (memberFilter) params.member_id = memberFilter;
      if (estadoFilter) params.is_active = estadoFilter === "activo";
      const { data } = await api.get("/reports/attendance-detail", { params });
      setData(data);
    } catch (err) {
      toast.error(getErr(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Datos de cada persona con horarios asignados, entradas y salidas registradas.
      </p>

      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Miembro</label>
            <select value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Todos</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre} {m.apellidos || ""} ({m.dni})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={fetchReport} disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
              {loading ? "Generando..." : "Generar"}
            </button>
          </div>
        </div>
        {data && (
          <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
            <button onClick={() => buildExportUrl("/reports/export-detalle-excel",
              { fecha_inicio: fechaInicio, fecha_fin: fechaFin, ...(memberFilter ? { member_id: memberFilter } : {}), ...(estadoFilter ? { is_active: estadoFilter === "activo" ? "true" : "false" } : {}) })}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Exportar Excel</button>
            <button onClick={() => buildExportUrl("/reports/export-detalle-pdf",
              { fecha_inicio: fechaInicio, fecha_fin: fechaFin, ...(memberFilter ? { member_id: memberFilter } : {}), ...(estadoFilter ? { is_active: estadoFilter === "activo" ? "true" : "false" } : {}) })}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Exportar PDF</button>
          </div>
        )}
      </div>

      {data && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">
              Total asistencias en el periodo: <span className="font-bold text-gray-800">{data.total_asistencias}</span>
            </p>
          </div>

          {data.miembros?.map((mb: any) => (
            <div key={mb.member_id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{mb.nombre} {mb.apellidos || ""}</h3>
                  <p className="text-sm text-gray-500">DNI: {mb.dni} | Telefono: {mb.telefono || "-"} | Email: {mb.email || "-"}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  mb.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>{mb.is_active ? "Activo" : "Inactivo"}</span>
              </div>

              {mb.horarios_asignados?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 font-medium mb-1">Horarios asignados:</p>
                  <div className="flex flex-wrap gap-2">
                    {mb.horarios_asignados.map((h: any, i: number) => (
                      <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                        {h.horario_nombre} ({h.hora_inicio}-{h.hora_fin}) [{h.dias_semana?.join(", ")}]
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {mb.asistencias?.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="text-left px-3 py-2">Fecha</th>
                      <th className="text-left px-3 py-2">Ingreso</th>
                      <th className="text-left px-3 py-2">Salida</th>
                      <th className="text-left px-3 py-2">Duracion</th>
                      <th className="text-left px-3 py-2">Observacion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mb.asistencias.map((a: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{a.fecha}</td>
                        <td className="px-3 py-2">{a.hora_entrada}</td>
                        <td className="px-3 py-2">{a.hora_salida || "-"}</td>
                        <td className="px-3 py-2 text-gray-500">{a.duracion || "-"}</td>
                        <td className="px-3 py-2 text-gray-500">{a.observacion || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-400 italic">Sin asistencias registradas en el periodo.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



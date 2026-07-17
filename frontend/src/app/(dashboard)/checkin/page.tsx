"use client";

import { useState, useRef, useEffect } from "react";
import api from "@/services/api";
import type { CheckinInfo } from "@/types";
import { toast } from "sonner";

interface Ubicacion {
  nombre: string;
  tipo: string;
}

export default function CheckinPage() {
  const [identifier, setIdentifier] = useState("");
  const [info, setInfo] = useState<CheckinInfo | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [selectedUbs, setSelectedUbs] = useState<string[]>([]);
  const scannerRef = useRef<any>(null);
  const scannerContainerId = "qr-reader";

  useEffect(() => {
    api.get("/pool-config/").then(({ data }) => {
      setUbicaciones(data.ubicaciones || []);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    setScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          const scanned = decodedText.trim();
          scanner.stop().catch(() => {});
          setScanning(false);
          setIdentifier(scanned);
          fetchInfo(scanned);
        },
        () => {}
      );
    } catch (err: any) {
      if (err.name === "NotAllowedError") toast.error("Permiso de camara denegado");
      else if (err.name === "NotFoundError") toast.error("No se encontro camara");
      else toast.error("No se pudo acceder a la camara");
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const fetchInfo = async (searchId: string) => {
    try {
      const { data } = await api.get(`/checkin/${searchId}`);
      setInfo(data);
      setSelectedUbs([]);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "No encontrado");
      setInfo(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier.trim()) fetchInfo(identifier.trim());
  };

  const toggleUb = (nombre: string) => {
    setSelectedUbs((prev) =>
      prev.includes(nombre) ? prev.filter((u) => u !== nombre) : [...prev, nombre]
    );
  };

  const handleEntry = async () => {
    if (!info) return;
    setLoading(true);
    try {
      await api.post(`/checkin/${info.dni || info.academy_id}`, {
        ubicaciones: selectedUbs.length > 0 ? selectedUbs : undefined,
      });
      toast.success(`Entrada registrada: ${info.nombre}`);
      setInfo(null);
      setIdentifier("");
      setSelectedUbs([]);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  const carriles = ubicaciones.filter((u) => u.tipo === "carril");
  const piscinas = ubicaciones.filter((u) => u.tipo === "piscina");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Check-in QR</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-4">Escanear QR</h2>

          {!scanning ? (
            <button onClick={startScanner}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4">
              Abrir camara
            </button>
          ) : (
            <div>
              <div id={scannerContainerId} className="w-full max-w-sm mx-auto mb-4" />
              <button onClick={stopScanner}
                className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                Cerrar camara
              </button>
            </div>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-400">o escribir DNI o codigo</span>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input type="text" placeholder="DNI o codigo" value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
            <button type="submit"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Buscar</button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-4">Informacion</h2>

          {!info ? (
            <p className="text-gray-400 text-center py-8">Escanee un QR o busque por DNI</p>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl ${
                  info.tipo === "academy" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-400"
                }`}>{info.nombre.charAt(0)}</div>
                <h3 className="text-xl font-bold">{info.nombre}</h3>
                {info.tipo === "academy" ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 mt-1">Academia</span>
                ) : (
                  <div className="space-y-1">
                    <p className="text-gray-500">Codigo: {info.dni}</p>
                    {info.categoria_nombre && (
                      <p className="text-sm font-medium text-gray-600">Categoria: {info.categoria_nombre}</p>
                    )}
                  </div>
                )}
              </div>

              {info.sin_horario_advertencia && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-center py-2 rounded-lg text-sm">
                  Sin horario asignado hoy. Registro manual permitido.
                </div>
              )}

              {info.inactivo ? (
                <div className="bg-gray-100 text-gray-500 text-center py-3 rounded-lg font-medium">Miembro inactivo</div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carriles / Ubicaciones <span className="text-gray-400 text-xs">(opcional, seleccion multiple)</span>
                    </label>
                    {carriles.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1 font-medium">Carriles</p>
                        <div className="flex flex-wrap gap-2">
                          {carriles.map((u) => (
                            <button key={u.nombre} type="button" onClick={() => toggleUb(u.nombre)}
                              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                selectedUbs.includes(u.nombre)
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                              }`}>{u.nombre}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {piscinas.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1 font-medium">Piscinas</p>
                        <div className="flex flex-wrap gap-2">
                          {piscinas.map((u) => (
                            <button key={u.nombre} type="button" onClick={() => toggleUb(u.nombre)}
                              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                selectedUbs.includes(u.nombre)
                                  ? "bg-teal-600 text-white border-teal-600"
                                  : "bg-white text-gray-600 border-gray-300 hover:border-teal-400"
                              }`}>{u.nombre}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {ubicaciones.length === 0 && (
                      <p className="text-xs text-gray-400">No hay ubicaciones configuradas.</p>
                    )}
                  </div>
                  <button onClick={handleEntry} disabled={loading}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-lg font-semibold">
                    {loading ? "Registrando..." : "Registrar entrada"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="text-lg font-semibold text-gray-800">
        {user?.nombre || "Usuario"}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 capitalize">
          {user?.rol === "admin" ? "Administrador" : "Asistencia"}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-700"
        >
          Cerrar sesion
        </button>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

const allItems = [
  { href: "/dashboard", label: "Dashboard", roles: ["admin"] },
  { href: "/miembros", label: "Miembros", roles: ["admin"] },
  { href: "/academias", label: "Academias", roles: ["admin"] },
  { href: "/turnos", label: "Turnos", roles: ["admin"] },
  { href: "/asistencias", label: "Asistencias", roles: ["admin", "recepcionista"] },
  { href: "/checkin", label: "Check-in QR", roles: ["admin", "recepcionista"] },
  { href: "/reportes", label: "Reportes", roles: ["admin", "recepcionista"] },
  { href: "/usuarios", label: "Usuarios", roles: ["admin"] },
  { href: "/config", label: "Configuracion", roles: ["admin"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const menuItems = allItems.filter((item) => item.roles.includes(user?.rol || ""));

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <div className="text-xl font-bold mb-8 text-blue-600">PiscinaQR</div>
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                active
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

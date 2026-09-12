"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Briefcase, 
  User, 
  Sparkles, 
  Settings, 
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { label: "Mis Postulaciones", href: "/mis-postulaciones", icon: Briefcase },
  { label: "Mi Perfil Maestro", href: "/perfil-maestro", icon: User },
  { label: "Adaptador de CV (IA)", href: "/adaptador", icon: Sparkles },
  { label: "Configuración & Portales", href: "/configuracion", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-surface-container-lowest border-r border-border flex flex-col z-20">
      <div className="p-6 flex items-center gap-3 shrink-0">
        <img src="/altoquecv_logo.png" alt="AltoqueCV Logo" className="h-8 w-auto object-contain" />
        <span className="text-headline-md text-on-surface">AltoqueCV</span>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-button text-label-md transition-colors border-l-4 ${
                isActive 
                  ? "border-primary bg-primary-container/10 text-primary dark:bg-primary/10 dark:text-primary font-semibold" 
                  : "border-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-4 shrink-0">
        <div className="bg-surface-container rounded-container p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-label-md text-on-surface">Plan Copiloto Pro</p>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-2 mb-2">
            <div className="bg-primary h-2 rounded-full w-[45%]"></div>
          </div>
          <p className="text-label-sm text-on-surface-variant">14 días restantes</p>
        </div>
        <Button variant="ghost" className="w-full justify-start text-error hover:bg-error-container hover:text-on-error-container">
          <LogOut size={20} className="mr-3" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
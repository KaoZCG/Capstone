"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Briefcase, User, Sparkles, Settings, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from '@/hooks/use-auth'

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { label: "Mis Postulaciones", href: "/mis-postulaciones", icon: Briefcase },
  { label: "Mi Perfil Maestro", href: "/perfil-maestro", icon: User },
  { label: "Adaptador de CV (IA)", href: "/adaptador", icon: Sparkles },
  { label: "Configuración & Portales", href: "/configuracion", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-surface-container rounded-md border border-border text-on-surface"
      >
        <Menu size={20} />
      </button>

      {/* Overlay mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-surface-container-lowest border-r border-border flex flex-col z-50 transition-transform duration-300 ease-in-out
        md:relative md:inset-auto md:z-auto md:translate-x-0 md:w-64
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img src="/altoquecv_logo.png" alt="AltoqueCV Logo" className="h-8 w-auto object-contain" />
            <span className="text-headline-sm text-on-surface font-semibold">AltoqueCV</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-on-surface-variant">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-button text-label-md transition-colors border-l-4 ${
                  isActive 
                    ? "border-primary bg-primary-container/10 text-primary font-semibold" 
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
          <Button 
            variant="ghost" 
            className="w-full justify-start text-error hover:bg-error-container hover:text-on-error-container"
            onClick={logout}
          >
            <LogOut size={20} className="mr-3" /> Cerrar sesión
          </Button>
        </div>
      </aside>
    </>
  );
}
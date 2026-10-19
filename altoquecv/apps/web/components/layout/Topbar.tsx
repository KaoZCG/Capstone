'use client';

import { Bell, Search } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { useProfileAvatar } from '@/hooks/use-profile-avatar';

export function Topbar() {
  const { usuario } = useAuth();
  const { profile } = useProfile();
  const displayName = usuario?.nombre ?? 'Usuario';
  const avatarOwnerId = profile?.user_id ?? usuario?.id ?? usuario?.email ?? 'local';
  const { avatarUrl } = useProfileAvatar(avatarOwnerId);

  return (
    <header className="sticky top-0 z-10 h-16 bg-surface-container-lowest border-b border-border flex items-center justify-between px-8">
      <div className="w-96 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
        <Input placeholder="Buscar postulaciones, keywords..." className="pl-10 bg-surface-container-low border-none" />
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <button className="text-on-surface-variant hover:text-on-surface relative" aria-label="Notificaciones">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border border-surface-container-lowest"></span>
        </button>
        <div className="w-px h-6 bg-border mx-2"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-label-md text-on-surface">{displayName}</p>
            <p className="text-label-sm text-on-surface-variant">Candidato Pro</p>
          </div>
          <Avatar src={avatarUrl || undefined} alt={displayName} size="sm" />
        </div>
      </div>
    </header>
  );
}
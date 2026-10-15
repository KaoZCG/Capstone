import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-surface">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />  {/* ← AQUÍ debe estar */}
          <main className="flex-1 overflow-auto p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
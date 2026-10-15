import React from 'react';

import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-container-lowest p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src="/altoquecv_logo.png" alt="AltoqueCV Logo" className="h-10 w-auto object-contain" />
        </div>
        {children}
      </div>
    </div>
  );
}
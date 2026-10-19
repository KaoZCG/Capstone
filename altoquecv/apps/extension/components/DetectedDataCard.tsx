import React, { useEffect, useState } from 'react';
import { CheckCircle2, IdCard, Phone, Wallet, Loader2 } from 'lucide-react';

declare const chrome: any;

export function DetectedDataCard() {
  const [realData, setRealData] = useState<{
    rut: string;
    telefono: string;
    renta: string;
    currency: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealProfile = async () => {
      try {
        // Obtenemos los datos reales guardados en la extensión
        const storage = await chrome.storage.local.get("altoquecv-profile");
        const profile = storage["altoquecv-profile"];

        if (profile && profile.personalData) {
          setRealData({
            rut: profile.personalData.rut || 'No registrado',
            telefono: profile.personalData.teléfono || 'No registrado',
            renta: profile.salaryData?.min || 'No especificada',
            currency: profile.salaryData?.currency || 'CLP'
          });
        }
      } catch (error) {
        console.error("Error cargando el perfil maestro:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealProfile();
  }, []);

  // Refresca el RUT desde el perfil del usuario autenticado; la copia local
  // puede no haberse sincronizado todavía con la extensión.
  useEffect(() => {
    const refreshRut = async () => {
      try {
        const profile: { rut?: string | null; detail?: string } =
          await chrome.runtime.sendMessage({ type: "ALTOQUE_OBTENER_PERFIL" });
        const rut = profile?.rut?.trim();
        if (!rut) {
          if (profile?.detail) console.warn("No se pudo leer el RUT del Perfil Maestro:", profile.detail);
          return;
        }

        setRealData((current) => ({
          rut,
          telefono: current?.telefono ?? "No registrado",
          renta: current?.renta ?? "No especificada",
          currency: current?.currency ?? "CLP",
        }));
      } catch (error) {
        console.warn("No se pudo actualizar el RUT desde el backend.", error);
      }
    };

    void refreshRut();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-6 mb-5 border border-border rounded-xl bg-surface-container-lowest">
        <Loader2 className="animate-spin text-primary" size={20} />
      </div>
    );
  }

  // Si no hay perfil, mostramos una alerta amigable
  if (!realData) {
    return (
      <div className="border border-error/20 rounded-xl p-4 mb-5 bg-error-container/10">
        <p className="text-xs text-error font-medium text-center">
          ⚠️ No se detectó tu Perfil Maestro. Por favor, configúralo en AltoqueCV.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl p-4 mb-5 bg-gradient-to-br from-surface-container-lowest to-surface-container-low shadow-sm">
      <div className="flex justify-between items-center mb-3.5">
        <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle2 size={14} className="text-success" />
          Datos listos para autocompletar
        </h4>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {/* Fila RUT */}
        <div className="flex items-center justify-between bg-surface rounded-lg p-2.5 border border-border/50 hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-2.5 text-on-surface-variant">
            <div className="p-1.5 bg-primary/10 text-primary rounded-md">
              <IdCard size={15} />
            </div>
            <span className="font-medium text-xs">RUT</span>
          </div>
          <span className="text-xs font-bold text-on-surface">{realData.rut}</span>
        </div>

        {/* Fila Teléfono */}
        <div className="flex items-center justify-between bg-surface rounded-lg p-2.5 border border-border/50 hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-2.5 text-on-surface-variant">
            <div className="p-1.5 bg-primary/10 text-primary rounded-md">
              <Phone size={15} />
            </div>
            <span className="font-medium text-xs">Teléfono</span>
          </div>
          <span className="text-xs font-bold text-on-surface">{realData.telefono}</span>
        </div>

        {/* Fila Renta Pretendida */}
        <div className="flex items-center justify-between bg-surface rounded-lg p-2.5 border border-border/50 hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-2.5 text-on-surface-variant">
            <div className="p-1.5 bg-primary/10 text-primary rounded-md">
              <Wallet size={15} />
            </div>
            <span className="font-medium text-xs">Pretensión</span>
          </div>
          <span className="text-xs font-bold text-on-surface bg-success/10 text-success-dark px-2 py-0.5 rounded">
            {realData.renta !== 'No especificada'
              ? `${realData.currency} $${Number(realData.renta).toLocaleString('es-CL')}`
              : 'A convenir'}
          </span>
        </div>
      </div>
    </div>
  );
}

import type { PlasmoCSConfig } from "plasmo";
declare const chrome: any;

export const config: PlasmoCSConfig = {
  matches: ["http://localhost:3000/*", "http://127.0.0.1:3000/*"],
};

const AUTH_STORAGE_KEY = "altoquecv_auth_session";
const PROFILE_STORAGE_KEY = "altoquecv-profile";

window.addEventListener("altoquecv:ai-model-updated", (event) => {
  const detail = (event as CustomEvent<{
    modelId?: string | null;
  }>).detail;
  if (!detail || (detail.modelId !== null && typeof detail.modelId !== "string")) return;

  void chrome.runtime.sendMessage({
    type: "ALTOQUE_CONFIGURAR_MODELO_IA",
    modelId: detail.modelId ?? null,
  }).catch((error: unknown) => console.info("AltoqueCV: No se pudo sincronizar el modelo de IA con la extensión.", error));
});

window.addEventListener("pagehide", () => {
  void chrome.runtime.sendMessage({
    type: "ALTOQUE_CONFIGURAR_MODELO_IA",
    modelId: null,
  }).catch((error: unknown) => console.info("AltoqueCV: No se pudo limpiar el modelo de IA de la extensión.", error));
});

const syncProfileToExtension = () => {
  try {
    const authRaw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (authRaw) {
      const auth = JSON.parse(authRaw);
      if (auth?.token && auth?.expiresAt) {
        chrome.storage.local.set({
          altoquecv_extension_session: {
            email: auth.usuario?.email ?? "",
            accessToken: auth.token,
            expiresAt: new Date(auth.expiresAt).getTime(),
          },
        });
      }
    } else {
      chrome.storage.local.remove("altoquecv_extension_session");
    }

    // 2. Buscamos la llave dinámica de tu Perfil Maestro en el localStorage
    const allKeys = Object.keys(window.localStorage);
    const profileKey = allKeys.find(key => key.startsWith("altoquecv-profile:"));

    if (profileKey) {
      const rawData = window.localStorage.getItem(profileKey);
      if (rawData) {
        const profileData = JSON.parse(rawData);

        // 3. Lo guardamos en la memoria de la extensión con el nombre exacto que busca el Widget
        chrome.storage.local.set({ [PROFILE_STORAGE_KEY]: profileData }, () => {
          console.log("✅ AltoqueCV: Perfil sincronizado con la extensión.");
        });
      }
    }
  } catch (error) {
    console.error("Error sincronizando el perfil maestro:", error);
  }
};

// Sincronizar también si el content script se inyecta después del evento load.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", syncProfileToExtension, { once: true });
} else {
  syncProfileToExtension();
}

// Sincronizar automáticamente si haces clic en "Guardar Cambios" en el Perfil Maestro
window.addEventListener("storage", syncProfileToExtension);
window.addEventListener("altoquecv:auth-session-updated", syncProfileToExtension);

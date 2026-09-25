// Service Worker Placeholder
// Aquí vivirá la lógica de WebSocket o long-polling para mantener
// la sesión sincronizada con la base de datos (Fase Backend).

declare const chrome: any;

chrome.runtime.onInstalled.addListener(() => {
  console.log("[AltoqueCV] Extensión instalada y lista para inyectar widgets.");
});

export {};
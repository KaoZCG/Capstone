declare const chrome: any;

const API_URL = 'http://localhost:8000/api/v1';
const SESSION_KEY = 'altoquecv_extension_session';

chrome.runtime.onInstalled.addListener(() => {
  console.log("[AltoqueCV] Extensión instalada y lista para inyectar widgets.");
});

chrome.runtime.onMessage.addListener((message: any, _sender: unknown, sendResponse: (response: unknown) => void) => {
  const isWarmup = message?.type === 'ALTOQUE_PRECALENTAR_IA';
  const isProfileRequest = message?.type === 'ALTOQUE_OBTENER_PERFIL';
  const isSavedLaborumOfferRequest = message?.type === 'ALTOQUE_OBTENER_OFERTA_LABORUM';
  if (!isWarmup && !isProfileRequest && !isSavedLaborumOfferRequest && message?.type !== 'ALTOQUE_AUTOCOMPLETAR') return false;

  void (async () => {
    const stored = await new Promise<Record<string, any>>((resolve) => {
      chrome.storage.local.get(SESSION_KEY, resolve);
    });
    const session = stored[SESSION_KEY];
    if (!session?.accessToken || session.expiresAt <= Date.now()) {
      sendResponse({ exito: false, detail: 'Inicia sesión desde el popup de AltoqueCV para usar tu Perfil Maestro.' });
      return;
    }

    try {
      const endpoint = isProfileRequest
        ? `${API_URL}/auth/profile`
        : isSavedLaborumOfferRequest
          ? `${API_URL}/auth/ofertas-laborum`
          : `${API_URL}/auth/ia/${isWarmup ? 'precalentar' : 'autocompletar'}`;
      const response = await fetch(endpoint, {
        method: isProfileRequest || isSavedLaborumOfferRequest ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        ...(isWarmup || isProfileRequest || isSavedLaborumOfferRequest ? {} : { body: JSON.stringify({
          preguntas: message.preguntas,
          cargo_postulacion: message.cargo,
          empresa: message.empresa,
          descripcion_oferta: message.descripcion_oferta || '',
        }) }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        sendResponse({ exito: false, detail: body.detail || `Error del servidor (${response.status}).` });
        return;
      }
      if (isWarmup) {
        sendResponse({ exito: true });
      } else if (isSavedLaborumOfferRequest) {
        const canonicalize = (value: string) => {
          try {
            const url = new URL(value);
            url.search = '';
            url.hash = '';
            return url.href;
          } catch {
            return '';
          }
        };
        const requestedUrl = canonicalize(message.url || '');
        const oferta = Array.isArray(body)
          ? body.find((item: any) => canonicalize(item?.url || '') === requestedUrl)
          : null;
        sendResponse({ exito: true, oferta: oferta || null });
      } else {
        sendResponse(body);
      }
    } catch {
      sendResponse({ exito: false, detail: 'No se pudo conectar con el backend local.' });
    }
  })();

  return true;
});

export {};

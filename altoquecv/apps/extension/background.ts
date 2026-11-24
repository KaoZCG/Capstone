declare const chrome: any;

import { getApiUrl } from './runtime-config';

const SESSION_KEY = 'altoquecv_extension_session';
const AI_MODEL_CONFIG_KEY = 'altoquecv_ai_model_config';
let aiModelConfig: {
  modelId: string | null;
} = { modelId: null };

function formatResponseDetail(detail: unknown, fallback: string): string {
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (!Array.isArray(detail)) return fallback;

  const messages = detail.map((item) => {
    if (!item || typeof item !== 'object') return '';
    const issue = item as { loc?: unknown; msg?: unknown };
    const location = Array.isArray(issue.loc)
      ? issue.loc.filter((part) => part !== 'body').map(String).join('.')
      : '';
    const message = typeof issue.msg === 'string' ? issue.msg.trim() : '';
    return [location, message].filter(Boolean).join(': ');
  }).filter(Boolean);

  return messages.length ? messages.join('; ') : fallback;
}

chrome.storage.session.get(AI_MODEL_CONFIG_KEY, (stored: Record<string, any>) => {
  const savedConfig = stored[AI_MODEL_CONFIG_KEY];
  if (savedConfig && (typeof savedConfig.modelId === 'string' || savedConfig.modelId === null)) {
    aiModelConfig = {
      modelId: savedConfig.modelId,
    };
    chrome.storage.session.set({ [AI_MODEL_CONFIG_KEY]: aiModelConfig });
  } else {
    chrome.storage.session.remove(AI_MODEL_CONFIG_KEY);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("[AltoqueCV] Extensión instalada y lista para inyectar widgets.");
});

chrome.runtime.onMessage.addListener((message: any, _sender: unknown, sendResponse: (response: unknown) => void) => {
  if (message?.type === 'ALTOQUE_CONFIGURAR_MODELO_IA') {
    if (message.modelId !== null && typeof message.modelId !== 'string') {
      sendResponse({ exito: false, detail: 'Modelo de IA inválido.' });
      return false;
    }
    aiModelConfig = {
      modelId: message.modelId,
    };
    chrome.storage.session.set({ [AI_MODEL_CONFIG_KEY]: aiModelConfig });
    sendResponse({ exito: true });
    return false;
  }

  const isWarmup = message?.type === 'ALTOQUE_PRECALENTAR_IA';
  const isProfileRequest = message?.type === 'ALTOQUE_OBTENER_PERFIL';
  const isSavedLaborumOfferRequest = message?.type === 'ALTOQUE_OBTENER_OFERTA_LABORUM';
  const isRegisterApplication = message?.type === 'ALTOQUE_REGISTRAR_POSTULACION';
  if (!isWarmup && !isProfileRequest && !isSavedLaborumOfferRequest && !isRegisterApplication && message?.type !== 'ALTOQUE_AUTOCOMPLETAR') return false;

  void (async () => {
    const storedModelConfig = await new Promise<Record<string, any>>((resolve) => {
      chrome.storage.session.get(AI_MODEL_CONFIG_KEY, resolve);
    });
    const savedConfig = storedModelConfig[AI_MODEL_CONFIG_KEY];
    if (savedConfig && (typeof savedConfig.modelId === 'string' || savedConfig.modelId === null)) {
      aiModelConfig = {
      modelId: savedConfig.modelId,
      };
      chrome.storage.session.set({ [AI_MODEL_CONFIG_KEY]: aiModelConfig });
    } else {
      aiModelConfig = { modelId: null };
      chrome.storage.session.remove(AI_MODEL_CONFIG_KEY);
    }

    const stored = await new Promise<Record<string, any>>((resolve) => {
      chrome.storage.local.get(SESSION_KEY, resolve);
    });
    const session = stored[SESSION_KEY];
    if (!session?.accessToken || session.expiresAt <= Date.now()) {
      sendResponse({ exito: false, detail: 'Inicia sesión desde el popup de AltoqueCV para usar tu Perfil Maestro.' });
      return;
    }
    if (!isProfileRequest && !isSavedLaborumOfferRequest && !isRegisterApplication && !aiModelConfig.modelId) {
      sendResponse({ exito: false, detail: 'Selecciona un modelo de OpenRouter en AltoqueCV antes de autocompletar.' });
      return;
    }

    try {
      const apiUrl = getApiUrl();
      const endpoint = isProfileRequest
        ? `${apiUrl}/auth/profile`
        : isSavedLaborumOfferRequest
          ? `${apiUrl}/auth/ofertas-laborum`
          : isRegisterApplication
            ? `${apiUrl}/auth/postulaciones`
          : `${apiUrl}/auth/ia/${isWarmup ? 'precalentar' : 'autocompletar'}`;
      const response = await fetch(endpoint, {
        method: isProfileRequest || isSavedLaborumOfferRequest ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        ...(isWarmup || isProfileRequest || isSavedLaborumOfferRequest ? {} : { body: JSON.stringify(isRegisterApplication ? {
          cargo: message.cargo,
          empresa: message.empresa,
          compatibilidad: message.compatibilidad,
          tipo: message.tipo,
          url_oferta: message.url_oferta,
        } : {
          preguntas: message.preguntas,
          cargo_postulacion: message.cargo,
          empresa: message.empresa,
          tipo: message.tipo,
          url_oferta: message.url_oferta,
          descripcion_oferta: message.descripcion_oferta || '',
        }) }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        sendResponse({
          exito: false,
          detail: formatResponseDetail(body.detail, `Error del servidor (${response.status}).`),
        });
        return;
      }
      if (isWarmup) {
        sendResponse({ exito: true });
      } else if (isRegisterApplication) {
        sendResponse({ exito: true, postulacion: body });
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
    } catch (error) {
      sendResponse({
        exito: false,
        detail: error instanceof Error ? error.message : 'No se pudo conectar con el backend.',
      });
    }
  })();

  return true;
});

export {};

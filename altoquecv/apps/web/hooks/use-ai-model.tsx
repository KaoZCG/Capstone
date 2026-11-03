'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number | null;
}

interface AIModelConfig {
  hasApiKey: boolean;
  models: OpenRouterModel[];
  selectedModel: OpenRouterModel | null;
  isLoading: boolean;
  error: string;
}

interface AIModelContextValue extends AIModelConfig {
  loadOpenRouterModels: (apiKey: string) => Promise<OpenRouterModel[]>;
  verifyOpenRouterModel: (apiKey: string, modelId: string) => Promise<void>;
  connectOpenRouter: (apiKey: string, model: OpenRouterModel, availableModels: OpenRouterModel[]) => Promise<void>;
  selectOpenRouterModel: (model: OpenRouterModel) => Promise<void>;
  disconnectOpenRouter: () => Promise<void>;
}

const AIModelContext = createContext<AIModelContextValue | null>(null);

async function requestJson(path: string, accessToken: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string'
      ? body.detail
      : 'No se pudo cargar la configuración del modelo de IA.';
    throw new Error(detail);
  }
  return body as Record<string, unknown>;
}

function isOpenRouterModel(value: unknown): value is OpenRouterModel {
  if (!value || typeof value !== 'object') return false;
  return 'id' in value
    && typeof value.id === 'string'
    && 'name' in value
    && typeof value.name === 'string'
    && 'context_length' in value
    && (typeof value.context_length === 'number' || value.context_length === null);
}

export function AIModelProvider({ children }: { children: ReactNode }) {
  const { usuario, accessToken } = useAuth();
  const [config, setConfig] = useState<AIModelConfig>({
    hasApiKey: false,
    models: [],
    selectedModel: null,
    isLoading: true,
    error: '',
  });

  const loadModels = useCallback(async (token: string) => {
    const body = await requestJson('/auth/ia/openrouter/models', token);
    return Array.isArray(body.models) ? body.models.filter(isOpenRouterModel) : [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!usuario || !accessToken) {
      setConfig({
        hasApiKey: false,
        models: [],
        selectedModel: null,
        isLoading: false,
        error: '',
      });
      return;
    }

    setConfig((current) => ({ ...current, isLoading: true, error: '' }));
    void (async () => {
      try {
        const settings = await requestJson('/auth/ia/proveedor', accessToken);
        const hasApiKey = settings.has_api_key === true;
        const modelId = typeof settings.model_id === 'string' ? settings.model_id : null;
        const models = hasApiKey ? await loadModels(accessToken) : [];
        if (cancelled) return;
        setConfig({
          hasApiKey,
          models,
          selectedModel: models.find((model) => model.id === modelId) ?? null,
          isLoading: false,
          error: '',
        });
      } catch (error) {
        if (cancelled) return;
        setConfig((current) => ({
          ...current,
          isLoading: false,
          error: error instanceof Error ? error.message : 'No se pudo cargar la configuración de IA.',
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, loadModels, usuario]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('altoquecv:ai-model-updated', {
      detail: { modelId: config.selectedModel?.id ?? null },
    }));
  }, [config.selectedModel]);

  const loadOpenRouterModels = useCallback(async (apiKey: string) => {
    if (!accessToken) throw new Error('Inicia sesión nuevamente para validar tu API key.');
    const body = await requestJson('/auth/ia/openrouter/validar', accessToken, {
      method: 'POST',
      body: JSON.stringify({ api_key: apiKey }),
    });
    const availableModels = Array.isArray(body.models) ? body.models.filter(isOpenRouterModel) : [];
    if (availableModels.length === 0) {
      throw new Error('OpenRouter no tiene modelos gratuitos de texto disponibles.');
    }
    return availableModels;
  }, [accessToken]);

  const verifyOpenRouterModel = useCallback(async (apiKey: string, modelId: string) => {
    if (!accessToken) throw new Error('Inicia sesión nuevamente para probar el modelo.');
    const body = await requestJson('/auth/ia/openrouter/validar', accessToken, {
      method: 'POST',
      body: JSON.stringify({ api_key: apiKey, model_id: modelId }),
    });
    if (body.verified !== true) throw new Error('OpenRouter no confirmó la respuesta del modelo.');
  }, [accessToken]);

  const connectOpenRouter = useCallback(async (
    apiKey: string,
    model: OpenRouterModel,
    availableModels: OpenRouterModel[],
  ) => {
    if (!accessToken) throw new Error('Inicia sesión nuevamente para guardar tu API key.');
    setConfig((current) => ({ ...current, isLoading: true, error: '' }));
    try {
      await requestJson('/auth/ia/proveedor', accessToken, {
        method: 'PUT',
        body: JSON.stringify({ provider: 'openrouter', api_key: apiKey, model_id: model.id }),
      });
      setConfig((current) => ({
        ...current,
        hasApiKey: true,
        models: availableModels,
        selectedModel: model,
        isLoading: false,
        error: '',
      }));
    } catch (error) {
      setConfig((current) => ({
        ...current,
        isLoading: false,
        error: error instanceof Error ? error.message : 'No se pudo conectar con OpenRouter.',
      }));
      throw error;
    }
  }, [accessToken]);

  const selectOpenRouterModel = useCallback(async (model: OpenRouterModel) => {
    if (!accessToken) throw new Error('Inicia sesión nuevamente para guardar el modelo.');
    setConfig((current) => ({ ...current, isLoading: true, error: '' }));
    try {
      await requestJson('/auth/ia/proveedor', accessToken, {
        method: 'PUT',
        body: JSON.stringify({ provider: 'openrouter', model_id: model.id }),
      });
      setConfig((current) => ({
        ...current,
        selectedModel: model,
        isLoading: false,
        error: '',
      }));
    } catch (error) {
      setConfig((current) => ({
        ...current,
        isLoading: false,
        error: error instanceof Error ? error.message : 'No se pudo seleccionar el modelo.',
      }));
      throw error;
    }
  }, [accessToken]);

  const disconnectOpenRouter = useCallback(async () => {
    if (!accessToken) throw new Error('Inicia sesión nuevamente para eliminar la API key.');
    setConfig((current) => ({ ...current, isLoading: true, error: '' }));
    try {
      await requestJson('/auth/ia/proveedor/openrouter', accessToken, { method: 'DELETE' });
      setConfig({
        hasApiKey: false,
        models: [],
        selectedModel: null,
        isLoading: false,
        error: '',
      });
    } catch (error) {
      setConfig((current) => ({
        ...current,
        isLoading: false,
        error: error instanceof Error ? error.message : 'No se pudo desconectar OpenRouter.',
      }));
      throw error;
    }
  }, [accessToken]);

  const value = useMemo<AIModelContextValue>(() => ({
    ...config,
    connectOpenRouter,
    loadOpenRouterModels,
    verifyOpenRouterModel,
    selectOpenRouterModel,
    disconnectOpenRouter,
  }), [config, connectOpenRouter, disconnectOpenRouter, loadOpenRouterModels, selectOpenRouterModel, verifyOpenRouterModel]);

  return <AIModelContext.Provider value={value}>{children}</AIModelContext.Provider>;
}

export function useAIModel(): AIModelContextValue {
  const context = useContext(AIModelContext);
  if (!context) throw new Error('useAIModel debe usarse dentro de AIModelProvider');
  return context;
}

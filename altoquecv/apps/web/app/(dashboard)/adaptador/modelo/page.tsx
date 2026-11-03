'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, KeyRound, LoaderCircle, Sparkles } from 'lucide-react';
import { useAIModel, type OpenRouterModel } from '@/hooks/use-ai-model';
import { useAuth } from '@/hooks/use-auth';

type GuideId = 'new-account' | 'existing-account';

interface GuideStep {
  title: string;
  instructions: string;
  link?: { href: string; label: string };
  image?: { src: string; alt: string; caption: string; width: number; height: number };
  notice?: string;
}

const openRouterStartSteps: GuideStep[] = [
  {
    title: 'Abre OpenRouter',
    instructions: 'Entra a OpenRouter. Desde la página principal podrás iniciar sesión o crear una cuenta.',
    link: { href: 'https://openrouter.ai/', label: 'Abrir OpenRouter' },
    image: {
      src: '/openrouter-guide/01-openrouter-home.png',
      alt: 'Página principal de OpenRouter con las opciones Get API Key y Sign Up destacadas',
      caption: 'Puedes empezar con “Get API Key” o “Sign Up”.',
      width: 1620,
      height: 768,
    },
  },
  {
    title: 'Inicia sesión o crea tu cuenta',
    instructions: 'Elige el método que prefieras: correo, GitHub, Google u otro método disponible. Si ya tienes cuenta, inicia sesión; si no, selecciona Sign up.',
    image: {
      src: '/openrouter-guide/02-signin-signup.png',
      alt: 'Pantalla de OpenRouter para iniciar sesión o crear una cuenta usando correo u otros métodos',
      caption: 'Usa el método que te resulte más cómodo.',
      width: 1639,
      height: 768,
    },
  },
];

const guides: Record<GuideId, { title: string; summary: string; steps: GuideStep[] }> = {
  'new-account': {
    title: 'Crear una cuenta nueva',
    summary: 'Te guiaremos para crear tu cuenta y obtener una clave para usar AltoqueCV.',
    steps: [
      ...openRouterStartSteps,
      {
        title: 'Acepta los términos',
        instructions: 'Al entrar con tu cuenta nueva, revisa y acepta los términos y condiciones de OpenRouter.',
        image: {
          src: '/openrouter-guide/07-terms.png',
          alt: 'Pantalla Legal consent de OpenRouter para aceptar los términos y continuar',
          caption: 'Marca la casilla de aceptación y presiona “Continue”.',
          width: 1900,
          height: 636,
        },
      },
      {
        title: 'Selecciona Individual',
        instructions: 'Elige “Individual” y presiona “Next”.',
        image: {
          src: '/openrouter-guide/08-individual-account.png',
          alt: 'Pantalla de bienvenida a OpenRouter con la opción Individual y el botón Next',
          caption: 'Selecciona “Individual” y continúa con “Next”.',
          width: 948,
          height: 768,
        },
      },
      {
        title: 'Copia tu API key',
        instructions: 'OpenRouter mostrará tu clave completa aquí. Cópiala y guárdala temporalmente: no podrás volver a verla. Si no la copiaste, tendrás que crear otra desde API keys.',
        image: {
          src: '/openrouter-guide/09-onboarding-copy-key.png',
          alt: 'Pantalla Your workspace is ready que muestra la API key por única vez',
          caption: 'Cópiala ahora y mantenla a mano para pegarla en AltoqueCV al final de la guía.',
          width: 917,
          height: 768,
        },
      },
      {
        title: 'Omite el paso de pago',
        instructions: 'No necesitas ingresar una tarjeta para usar modelos gratuitos. Elige “I’ll do this later”. Crear la API key no genera un cobro.',
        image: {
          src: '/openrouter-guide/10-payment-later.png',
          alt: 'Pantalla Add a payment method de OpenRouter con la opción I’ll do this later',
          caption: 'Elige “I’ll do this later” para seguir sin agregar un método de pago.',
          width: 994,
          height: 768,
        },
      },
    ],
  },
  'existing-account': {
    title: 'Ya tengo una cuenta',
    summary: 'Te guiaremos para iniciar sesión y crear una clave para AltoqueCV.',
    steps: [
      ...openRouterStartSteps,
      {
        title: 'Abre API keys',
        instructions: 'En el menú lateral de la pantalla principal, selecciona API keys.',
        link: { href: 'https://openrouter.ai/keys', label: 'Ir a API keys' },
        image: {
          src: '/openrouter-guide/03-dashboard-api-keys.png',
          alt: 'Panel principal de OpenRouter con API keys destacada en el menú lateral',
          caption: 'En el menú de la izquierda, selecciona “API keys”.',
          width: 1622,
          height: 768,
        },
      },
      {
        title: 'Presiona New key',
        instructions: 'En la página API keys, presiona New key para crear una clave nueva para AltoqueCV.',
        link: { href: 'https://openrouter.ai/keys', label: 'Abrir API keys' },
        image: {
          src: '/openrouter-guide/04-new-key.png',
          alt: 'Página API keys de OpenRouter con el botón New key destacado',
          caption: 'Presiona “New key” para crear una clave para AltoqueCV.',
          width: 1639,
          height: 768,
        },
      },
      {
        title: 'Configura la clave',
        instructions: 'Escribe el nombre que quieras (por ejemplo, AltoqueCV). En Expiration elige “No expiration”; en Credit limit, “No limit”. Deja Reset limit como está y presiona “Create”.',
        notice: 'No te preocupes: crear esta clave no genera un cobro. Para evitar cargos por uso, no agregues saldo ni un método de pago y usa modelos gratuitos. “No limit” solo significa que OpenRouter no pone un tope si tu cuenta tiene saldo.',
        image: {
          src: '/openrouter-guide/05-key-settings.png',
          alt: 'Formulario New key de OpenRouter para elegir nombre, expiración y límite de crédito',
          caption: 'Deja Reset limit como está y presiona “Create” al terminar.',
          width: 700,
          height: 717,
        },
      },
      {
        title: 'Copia la API key',
        instructions: 'OpenRouter muestra la clave completa una sola vez. Cópiala ahora; después podrás pegarla en AltoqueCV. Si la pierdes, tendrás que crear otra.',
        image: {
          src: '/openrouter-guide/06-copy-key.png',
          alt: 'Ventana de OpenRouter que muestra la nueva clave y advierte que no volverá a mostrarse',
          caption: 'Copia la clave antes de cerrar esta ventana.',
          width: 668,
          height: 563,
        },
      },
    ],
  },
};

const initialProgress: Record<GuideId, number> = {
  'new-account': 0,
  'existing-account': 0,
};

interface AIModelSelectionPageProps {
  searchParams?: { manage?: string };
}

export default function AIModelSelectionPage({ searchParams }: AIModelSelectionPageProps) {
  const router = useRouter();
  const { accessToken, usuario } = useAuth();
  const {
    hasApiKey,
    selectedModel,
    isLoading: isLoadingSettings,
    error: aiSettingsError,
    loadOpenRouterModels,
    verifyOpenRouterModel,
    connectOpenRouter,
  } = useAIModel();
  const [guideId, setGuideId] = useState<GuideId | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepCompleted, setStepCompleted] = useState(false);
  const [savedProgress, setSavedProgress] = useState(initialProgress);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [progressStorageError, setProgressStorageError] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
  const [candidateModel, setCandidateModel] = useState<OpenRouterModel | null>(null);
  const [testedModelId, setTestedModelId] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isManaging = searchParams?.manage === '1';
  const isConfigured = hasApiKey && selectedModel !== null;
  const progressStorageKey = useMemo(
    () => `altoquecv_openrouter_guides_v2_${usuario?.id ?? 'usuario'}`,
    [usuario?.id],
  );
  const selectedGuide = guideId ? guides[guideId] : null;
  const isConnectionStep = selectedGuide !== null && stepIndex === selectedGuide.steps.length;
  const currentStep = selectedGuide && stepIndex < selectedGuide.steps.length
    ? selectedGuide.steps[stepIndex]
    : null;

  useEffect(() => {
    if (!isLoadingSettings && isConfigured && !isManaging) {
      router.replace('/adaptador');
    }
  }, [isConfigured, isLoadingSettings, isManaging, router]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(progressStorageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (
          parsed
          && typeof parsed === 'object'
          && 'new-account' in parsed
          && 'existing-account' in parsed
        ) {
          const newAccountProgress = parsed['new-account'];
          const existingAccountProgress = parsed['existing-account'];
          if (typeof newAccountProgress === 'number' && typeof existingAccountProgress === 'number'
            && Number.isInteger(newAccountProgress) && Number.isInteger(existingAccountProgress)) {
            setSavedProgress({
              'new-account': Math.min(guides['new-account'].steps.length, Math.max(0, newAccountProgress)),
              'existing-account': Math.min(guides['existing-account'].steps.length, Math.max(0, existingAccountProgress)),
            });
          }
        }
      }
    } catch {
      setProgressStorageError('No fue posible leer el avance guardado en este navegador.');
    } finally {
      setProgressLoaded(true);
    }
  }, [progressStorageKey]);

  const saveProgress = (id: GuideId, nextStep: number) => {
    const updatedProgress = { ...savedProgress, [id]: nextStep };
    setSavedProgress(updatedProgress);
    try {
      localStorage.setItem(progressStorageKey, JSON.stringify(updatedProgress));
      setProgressStorageError('');
    } catch {
      setProgressStorageError('No fue posible guardar el avance en este navegador.');
    }
  };

  const chooseGuide = (id: GuideId) => {
    setGuideId(id);
    setStepIndex(savedProgress[id]);
    setStepCompleted(false);
    setErrorMessage('');
  };

  const returnToGuideChoices = () => {
    setGuideId(null);
    setStepIndex(0);
    setStepCompleted(false);
    setApiKeyInput('');
    setAvailableModels([]);
    setCandidateModel(null);
    setTestedModelId(null);
    setErrorMessage('');
  };

  const goToPreviousStep = () => {
    if (!guideId || stepIndex === 0) {
      returnToGuideChoices();
      return;
    }
    const previousStep = stepIndex - 1;
    setStepIndex(previousStep);
    setStepCompleted(false);
    setApiKeyInput('');
    setAvailableModels([]);
    setCandidateModel(null);
    setTestedModelId(null);
    setErrorMessage('');
    saveProgress(guideId, previousStep);
  };

  const goToNextStep = () => {
    if (!guideId || !stepCompleted || stepIndex >= guides[guideId].steps.length) return;
    const nextStep = stepIndex + 1;
    setStepIndex(nextStep);
    setStepCompleted(false);
    setErrorMessage('');
    saveProgress(guideId, nextStep);
  };

  const verifyKey = async () => {
    const key = apiKeyInput.trim();
    if (!key) {
      setErrorMessage('Pega la API key que acabas de copiar desde OpenRouter.');
      return;
    }
    if (!accessToken) {
      setErrorMessage('Tu sesión expiró. Inicia sesión nuevamente para probar el proveedor.');
      return;
    }

    setErrorMessage('');
    setIsLoadingModels(true);
    setAvailableModels([]);
    setCandidateModel(null);
    setTestedModelId(null);
    try {
      const models = await loadOpenRouterModels(key);
      setAvailableModels(models);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo validar la API key.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const testCandidateModel = async () => {
    if (!candidateModel) {
      setErrorMessage('Selecciona el modelo que quieres probar.');
      return;
    }
    setErrorMessage('');
    setIsLoadingModels(true);
    setTestedModelId(null);
    try {
      await verifyOpenRouterModel(apiKeyInput.trim(), candidateModel.id);
      setTestedModelId(candidateModel.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'El modelo no respondió la prueba.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const saveAndUseKey = async () => {
    if (!candidateModel || testedModelId !== candidateModel.id) {
      setErrorMessage('Selecciona y prueba un modelo antes de guardar la API key.');
      return;
    }
    setErrorMessage('');
    setIsLoadingModels(true);
    try {
      await connectOpenRouter(apiKeyInput.trim(), candidateModel, availableModels);
      setApiKeyInput('');
      setAvailableModels([]);
      setCandidateModel(null);
      setTestedModelId(null);
      router.push('/adaptador');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar la configuración.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  if (isLoadingSettings || !progressLoaded || (isConfigured && !isManaging)) {
    return (
      <main className="mx-auto max-w-3xl rounded-container border border-border bg-surface-container-lowest p-6 text-on-surface">
        <p role="status">Comprobando tu conexión de IA...</p>
      </main>
    );
  }

  const stepCount = selectedGuide?.steps.length ?? 0;
  const progressPercent = selectedGuide && stepCount > 0
    ? (Math.min(stepIndex, stepCount) / stepCount) * 100
    : 0;

  return (
    <main className="mx-auto max-w-4xl space-y-6 pb-10">
      <header className="flex items-start gap-3">
        <Sparkles className="mt-1 shrink-0 text-primary" size={28} />
        <div>
          <h1 className="text-headline-lg text-on-surface">
            {isManaging ? 'Cambiar conexión de OpenRouter' : 'Conecta tu cuenta de OpenRouter'}
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {isManaging
              ? 'Sigue los pasos para crear y probar otra clave. Tu conexión actual se mantendrá hasta que la nueva esté lista.'
              : 'Sigue los pasos y, al final, pega tu clave para comprobar que funciona.'}
          </p>
        </div>
      </header>

      {aiSettingsError && (
        <p role="alert" className="flex items-start gap-2 rounded-md border border-error/30 bg-error-container/20 p-3 text-sm text-error">
          <AlertCircle className="mt-0.5 shrink-0" size={16} />
          {aiSettingsError}
        </p>
      )}

      {isConfigured && isManaging && (
        <p className="flex items-center gap-2 rounded-md border border-success/30 bg-success-container p-3 text-body-sm font-medium text-on-success-container">
          <CheckCircle2 size={17} className="shrink-0" />
          La conexión actual ({selectedModel.name}) seguirá activa mientras configuras la nueva.
        </p>
      )}

      {!guideId ? (
        <section aria-labelledby="guide-choice-title" className="space-y-4 rounded-container border border-border bg-surface-container-lowest p-5 sm:p-7">
          <div>
            <h2 id="guide-choice-title" className="text-headline-sm font-semibold text-on-surface">
              Elige cómo quieres empezar
            </h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Selecciona la opción que corresponda. Te mostraremos un paso a la vez.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(Object.entries(guides) as [GuideId, typeof guides[GuideId]][]).map(([id, guide]) => (
              <button
                key={id}
                type="button"
                disabled={!progressLoaded}
                onClick={() => chooseGuide(id)}
                className="rounded-md border border-border bg-surface p-5 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-60"
              >
                <span className="flex items-center gap-2 font-semibold text-on-surface">
                  <KeyRound size={18} className="text-primary" />
                  {guide.title}
                </span>
                <span className="mt-2 block text-body-sm text-on-surface-variant">{guide.summary}</span>
                <span className="mt-4 block text-label-sm font-semibold text-primary">
                  {savedProgress[id] > 0
                    ? `Continuar desde el paso ${Math.min(savedProgress[id] + 1, guide.steps.length)} de ${guide.steps.length}`
                    : `Comenzar guía · ${guide.steps.length} pasos`}
                </span>
              </button>
            ))}
          </div>
          {progressStorageError && <p role="status" className="text-label-sm text-error">{progressStorageError}</p>}
        </section>
      ) : (
        <section aria-labelledby="guide-step-title" className="space-y-5 rounded-container border border-border bg-surface-container-lowest p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-label-sm font-semibold uppercase tracking-wide text-primary">{selectedGuide?.title}</p>
              <h2 id="guide-step-title" className="mt-1 text-headline-sm font-semibold text-on-surface">
                {isConnectionStep ? 'Conecta OpenRouter con AltoqueCV' : currentStep?.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={returnToGuideChoices}
              className="text-sm font-semibold text-on-surface-variant underline hover:text-on-surface"
            >
              Cambiar tipo de guía
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-label-sm text-on-surface-variant">
              <span>{isConnectionStep ? 'Guía completada' : `Paso ${stepIndex + 1} de ${stepCount}`}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div
              role="progressbar"
              aria-label={`Avance de la guía: ${selectedGuide?.title ?? 'OpenRouter'}`}
              aria-valuemin={0}
              aria-valuemax={stepCount}
              aria-valuenow={Math.min(stepIndex, stepCount)}
              className="h-2 overflow-hidden rounded-full bg-surface-container-high"
            >
              <div className="h-full rounded-full bg-success transition-[width]" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {!isConnectionStep && currentStep && (
            <div className="space-y-5 rounded-md border border-border bg-surface p-5">
              <p className="text-body-md text-on-surface">{currentStep.instructions}</p>
              {currentStep.notice && (
                <p className="rounded-md border border-warning/40 bg-warning-container/40 p-3 text-body-sm text-on-warning-container">
                  {currentStep.notice}
                </p>
              )}
              {currentStep.link && (
                <a
                  className="inline-flex rounded-md border border-primary px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
                  href={currentStep.link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {currentStep.link.label}
                </a>
              )}
              {currentStep.image && (
                <figure className="overflow-hidden rounded-md border border-border bg-surface-container-low">
                  <Image
                    src={currentStep.image.src}
                    alt={currentStep.image.alt}
                    width={currentStep.image.width}
                    height={currentStep.image.height}
                    sizes="(max-width: 768px) 100vw, 760px"
                    className="h-auto max-h-[28rem] w-full object-contain object-left-top"
                  />
                  <figcaption className="border-t border-border px-3 py-2 text-label-sm text-on-surface-variant">
                    {currentStep.image.caption}
                  </figcaption>
                </figure>
              )}
              <label className="flex cursor-pointer items-start gap-3 border-t border-border pt-4 text-body-sm font-medium text-on-surface">
                <input
                  type="checkbox"
                  checked={stepCompleted}
                  onChange={(event) => setStepCompleted(event.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-success"
                />
                <span>Ya completé este paso</span>
              </label>
            </div>
          )}

          {isConnectionStep && (
            <div className="space-y-5 rounded-md border border-border bg-surface p-5">
              <p className="text-body-sm text-on-surface-variant">
                Pega la clave que acabas de copiar. Primero comprobaremos que OpenRouter la acepte, luego probarás un modelo. No se guardará hasta confirmar que responde.
              </p>
              <label className="block text-label-sm font-medium text-on-surface-variant">
                API key de OpenRouter
                <input
                  type="password"
                  autoComplete="new-password"
                  spellCheck={false}
                  value={apiKeyInput}
                  onChange={(event) => {
                    setApiKeyInput(event.target.value);
                    setAvailableModels([]);
                    setCandidateModel(null);
                    setTestedModelId(null);
                    setErrorMessage('');
                  }}
                  placeholder="sk-or-v1-..."
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <button
                type="button"
                onClick={() => void verifyKey()}
                disabled={isLoadingModels || isLoadingSettings || !apiKeyInput.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingModels && <LoaderCircle className="animate-spin" size={16} />}
                {isLoadingModels ? 'Comprobando conexión...' : 'Comprobar conexión'}
              </button>

              {availableModels.length > 0 && (
                <div className="space-y-4 border-t border-border pt-4">
                  <p role="status" className="flex items-center gap-2 rounded-md border border-success/30 bg-success-container p-3 text-body-sm font-medium text-on-success-container">
                    <CheckCircle2 size={17} className="shrink-0" />
                    La API key funciona. Ahora selecciona y prueba el modelo que usarás.
                  </p>
                  <fieldset className="space-y-3">
                    <legend className="text-label-sm font-semibold text-on-surface">Modelo gratuito</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {availableModels.map((model) => {
                        const isSelected = candidateModel?.id === model.id;
                        return (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => {
                              setCandidateModel(model);
                              setTestedModelId(null);
                            }}
                            aria-pressed={isSelected}
                            className={`rounded-md border p-4 text-left transition-colors ${
                              isSelected
                                ? 'border-success bg-success-container ring-1 ring-success'
                                : 'border-border bg-surface hover:border-success/70'
                            }`}
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span className="font-semibold text-on-surface">{model.name}</span>
                              {isSelected && (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success px-2 py-1 text-xs font-semibold text-on-success">
                                  <CheckCircle2 size={13} aria-hidden="true" />
                                  Seleccionado
                                </span>
                              )}
                            </span>
                            <span className="mt-1 block break-all text-label-sm text-on-surface-variant">{model.id}</span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void testCandidateModel()}
                      disabled={!candidateModel || isLoadingModels || isLoadingSettings}
                      className="inline-flex items-center gap-2 rounded-md border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoadingModels && <LoaderCircle className="animate-spin" size={16} />}
                      {isLoadingModels ? 'Probando modelo...' : 'Probar modelo'}
                    </button>
                    {testedModelId === candidateModel?.id && (
                      <p role="status" className="flex items-center gap-2 text-body-sm font-medium text-success">
                        <CheckCircle2 size={17} />
                        El modelo respondió correctamente. La clave aún no se ha guardado.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void saveAndUseKey()}
                    disabled={!candidateModel || testedModelId !== candidateModel.id || isLoadingModels || isLoadingSettings}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoadingModels && <LoaderCircle className="animate-spin" size={16} />}
                    {isLoadingModels ? 'Guardando configuración...' : 'Guardar y entrar al Adaptador'}
                  </button>
                </div>
              )}

              {(errorMessage || aiSettingsError) && (
                <p role="alert" className="flex items-start gap-2 rounded-md border border-error/30 bg-error-container/20 p-3 text-sm text-error">
                  <AlertCircle className="mt-0.5 shrink-0" size={16} />
                  {errorMessage || aiSettingsError}
                </p>
              )}
            </div>
          )}

          {!isConnectionStep && errorMessage && (
            <p role="alert" className="flex items-start gap-2 rounded-md border border-error/30 bg-error-container/20 p-3 text-sm text-error">
              <AlertCircle className="mt-0.5 shrink-0" size={16} />
              {errorMessage}
            </p>
          )}

          <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-5">
            <button
              type="button"
              onClick={goToPreviousStep}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
            >
              <ArrowLeft size={16} />
              {stepIndex === 0 ? 'Elegir otra guía' : 'Atrás'}
            </button>
            {!isConnectionStep && (
              <button
                type="button"
                onClick={goToNextStep}
                disabled={!stepCompleted}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {stepIndex === stepCount - 1 ? 'Ir a conexión' : 'Siguiente'}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
          {progressStorageError && <p role="status" className="text-label-sm text-error">{progressStorageError}</p>}
        </section>
      )}
    </main>
  );
}

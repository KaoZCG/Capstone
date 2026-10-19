import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import { useEffect, useState } from "react";
import { CompatibilityWidget } from "../components/CompatibilityWidget";
import type { OfertaDetectada } from "../types/oferta";
import styleText from "data-text:../style.css";

export const config: PlasmoCSConfig = {
  matches: [
    "https://*.trabajando.com/*",
    "https://*.trabajando.cl/*",
    "https://*.laborum.cl/*",
    "https://www.linkedin.com/jobs/*",
    "https://*.chiletrabajos.cl/*",
    "https://*.computrabajo.cl/*",
  ],
  all_frames: true,
};

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style");
  style.textContent = styleText;
  return style;
};

declare const chrome: any;

const matchStopwords = new Set([
  "para", "desde", "sobre", "entre", "hasta", "como", "donde", "cuando", "quien",
  "con", "sin", "una", "uno", "unas", "unos", "las", "los", "del", "por", "que",
  "esta", "este", "estas", "estos", "ser", "estar", "tener", "haber", "experiencia",
  "conocimiento", "deseable", "requisito", "requisitos", "trabajo", "cargo", "empresa",
  "de", "el", "la", "y", "o", "en", "al", "se", "un", "a", "e", "su", "sus",
]);

const normalizeMatchText = (value: string) => value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("es-CL")
  .match(/[a-z0-9+#.]+/g)
  ?.join(" ") || "";

const profileTermCoverage = (values: string[], offerText: string) => {
  const terms = new Set(values.flatMap((value) => normalizeMatchText(value).split(" "))
    .filter((term) => term.length > 1 && !matchStopwords.has(term) && !/^\d+$/.test(term)));
  if (terms.size === 0) return 0;
  const offerTerms = new Set(offerText.split(" "));
  const matchingTerms = [...terms].filter((term) => offerTerms.has(term)).length;
  return Math.round((matchingTerms / terms.size) * 100);
};

type OfferContext = OfertaDetectada;

const extractNonLaborumOfferContext = (sourceDocument: Document, pageUrl: string): OfferContext | null => {
  const url = new URL(pageUrl);

  const titleElement = sourceDocument.querySelector<HTMLElement>(
    'main h1, [data-testid*="job-title" i], h1'
  );
  const title = titleElement?.innerText?.trim();
  if (!title || /^(empleos|bolsa de empleo|resultados de búsqueda)$/i.test(title)) return null;

  const companyElement = sourceDocument.querySelector<HTMLElement>(
    '[data-testid="company-name"], main a[href*="/perfiles/"]'
  );
  const company = companyElement?.innerText?.trim() || "Empresa Confidencial";
  const descriptionHeading = Array.from(sourceDocument.querySelectorAll<HTMLElement>("h2, h3, h4"))
    .find((heading) => /descripci[oó]n del (puesto|empleo)|detalle del empleo/i.test(heading.innerText));
  const descriptionRegion = descriptionHeading?.parentElement?.nextElementSibling as HTMLElement | null;
  const descriptionCandidates = [
    descriptionRegion,
    descriptionHeading?.parentElement?.parentElement?.querySelector<HTMLElement>('[role="region"]') || null,
    ...Array.from(sourceDocument.querySelectorAll<HTMLElement>('main [role="region"]')),
    ...Array.from(sourceDocument.querySelectorAll<HTMLElement>(
      '[data-testid*="description" i], [class*="description" i], [id*="description" i]'
    )),
  ];
  const description = descriptionCandidates
    .filter((element): element is HTMLElement => Boolean(element && element.getClientRects().length > 0))
    .map((element) => element.innerText.trim())
    .filter((text) => text.length >= 80)
    .sort((a, b) => b.length - a.length)[0]
    ?.slice(0, 6000);

  const normalizedPageText = normalizeMatchText(sourceDocument.body?.innerText || "");
  const location = normalizedPageText.includes("hibrido")
    ? "Híbrido"
    : normalizedPageText.includes("remoto")
      ? "Remoto"
      : "Presencial";
  const hostname = url.hostname.toLowerCase();
  const portal: OfertaDetectada["portal"] = hostname.includes("trabajando")
    ? "trabajando"
    : hostname.includes("linkedin")
        ? "linkedin"
        : hostname.includes("chiletrabajos")
          ? "chile-trabajos"
          : "computrabajo";

  return {
    titulo: title,
    empresa: company,
    ubicacion: location,
    portal,
    url: url.href,
    descripcion: description,
  };
};

const calculateMatch = (profile: any, offer: OfferContext) => {
  const experiences = Array.isArray(profile?.experience) ? profile.experience : [];
  const declaredSkills = Array.isArray(profile?.skills)
    ? profile.skills.filter((skill: unknown): skill is string => typeof skill === "string" && skill.trim().length > 0)
    : [];
  const experienceSkills = experiences.flatMap((experience: any) =>
    Array.isArray(experience?.stackTags) ? experience.stackTags : []
  ).filter((skill: unknown): skill is string => typeof skill === "string" && skill.trim().length > 0);
  const skills = [...new Map([...declaredSkills, ...experienceSkills]
    .map((skill) => [normalizeMatchText(skill), skill.trim()] as const)
    .filter(([normalized]) => normalized.length > 0)).values()];
  const offerText = normalizeMatchText(offer.titulo + " " + (offer.descripcion || ""));
  const paddedOfferText = " " + offerText + " ";
  const matchedSkills = skills.filter((skill) => {
    const normalizedSkill = normalizeMatchText(skill);
    return normalizedSkill.length > 0 && paddedOfferText.includes(" " + normalizedSkill + " ");
  });
  const skillCoverageScore = skills.length ? Math.round((matchedSkills.length / skills.length) * 100) : 0;
  // Dos coincidencias verificadas ya sitúan las skills en rango alto; más coincidencias suben el resultado.
  const skillCountScore = matchedSkills.length >= 2
    ? Math.min(97, 85 + (matchedSkills.length - 2) * 3)
    : skillCoverageScore;
  const skillsScore = Math.max(skillCoverageScore, skillCountScore);
  const experienceValues = experiences.flatMap((experience: any) => [
    experience?.role,
    ...(Array.isArray(experience?.stackTags) ? experience.stackTags : []),
  ].filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0));
  const educationValues = Array.isArray(profile?.education)
    ? profile.education.flatMap((education: any) => [
      education?.degree,
      ...(Array.isArray(education?.tags) ? education.tags : []),
    ].filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0))
    : [];
  const experienceScore = profileTermCoverage(experienceValues, offerText);
  const educationScore = educationValues.length ? profileTermCoverage(educationValues, offerText) : undefined;
  const dimensions: { score: number; weight: number }[] = [];
  if (skills.length) dimensions.push({ score: skillsScore, weight: 70 });
  if (experienceValues.length) dimensions.push({ score: experienceScore, weight: 20 });
  if (educationScore !== undefined) dimensions.push({ score: educationScore, weight: 10 });
  const weightTotal = dimensions.reduce((total, dimension) => total + dimension.weight, 0);
  const weightedScore = weightTotal
    ? Math.round(dimensions.reduce((total, dimension) => total + dimension.score * dimension.weight, 0) / weightTotal)
    : 0;
  // Las coincidencias de skills tienen un mínimo alto aunque experiencia o formación bajen el promedio ponderado.
  const matchedSkillsFloor = matchedSkills.length >= 2
    ? Math.min(97, 85 + (matchedSkills.length - 2) * 3)
    : 0;
  const allProfileSkillsMatch = skills.length >= 2 && matchedSkills.length === skills.length;
  const score = Math.max(weightedScore, matchedSkillsFloor, allProfileSkillsMatch ? 95 : 0);

  return {
    score,
    skillsScore,
    experienceScore,
    educationScore,
    mensaje: dimensions.length === 0
      ? "Completa tus habilidades, experiencia o formación en el Perfil Maestro para calcular el match."
      : undefined,
  };
};

export default function JobWidget() {
  const [visible, setVisible] = useState(true);
  const [oferta, setOferta] = useState<OfferContext | null>(null);
  const [compatibilidad, setCompatibilidad] = useState<any>(null);

  useEffect(() => {
    let activeKey = "";
    let observedUrl = "";
    let requestVersion = 0;
    let refreshTimer: number | undefined;
    const isFrame = window !== window.top;

    const hasVisibleApplicationField = () => Array.from(document.querySelectorAll<HTMLElement>(
      'textarea, input:not([type]), input[type="text"], input[type="email"]'
    )).some((field) => field.getClientRects().length > 0 && !field.matches(':disabled, [readonly], [type="hidden"]'));

    const getPage = () => {
      let sourceDocument = document;
      let pageUrl = window.location.href;
      try {
        if (window.top) {
          sourceDocument = window.top.document;
          pageUrl = window.top.location.href;
        }
      } catch {
        // Un iframe cross-origin solo permite leer su propio documento.
      }
      return { sourceDocument, pageUrl };
    };

    const loadMatch = async (currentOffer: OfferContext, key: string) => {
      const version = ++requestVersion;
      if (!isFrame) {
        void chrome.runtime.sendMessage({
          type: "ALTOQUE_PRECALENTAR_IA",
          cargo: currentOffer.titulo,
          empresa: currentOffer.empresa,
          descripcion_oferta: currentOffer.descripcion || "",
        }).catch((error: unknown) => console.info("AltoqueCV: No se pudo precalentar el modelo.", error));
      }

      try {
        const profileResponse = await chrome.runtime.sendMessage({ type: "ALTOQUE_OBTENER_PERFIL" });
        if (version !== requestVersion || activeKey !== key) return;
        if (profileResponse?.exito === false) {
          setCompatibilidad({
            scoreGeneral: 0,
            desglose: { skillsTecnicos: 0, nivelExperiencia: 0, formacionAcademica: 0 },
            mensaje: profileResponse.detail || "Inicia sesión en la extensión para comparar tu Perfil Maestro.",
            mapeoCampos: { total: 0, completados: 0 },
          });
          return;
        }

        const result = calculateMatch(profileResponse, currentOffer);
        setCompatibilidad({
          scoreGeneral: result.score,
          desglose: {
            skillsTecnicos: result.skillsScore,
            nivelExperiencia: result.experienceScore,
            formacionAcademica: result.educationScore,
          },
          mensaje: result.mensaje,
          mapeoCampos: { total: 0, completados: 0 },
        });
      } catch (error) {
        console.error("Error calculando compatibilidad:", error);
        if (version !== requestVersion || activeKey !== key) return;
        setCompatibilidad({
          scoreGeneral: 0,
          desglose: { skillsTecnicos: 0, nivelExperiencia: 0, formacionAcademica: 0 },
          mensaje: "No se pudo cargar tu Perfil Maestro. Verifica tu sesión y que AltoqueCV esté conectado.",
          mapeoCampos: { total: 0, completados: 0 },
        });
      }
    };

    const loadSavedLaborumOffer = async (pageUrl: string, key: string) => {
      try {
        const response = await chrome.runtime.sendMessage({
          type: "ALTOQUE_OBTENER_OFERTA_LABORUM",
          url: pageUrl,
        });
        if (activeKey !== key || !response?.exito || !response.oferta) return;

        const savedOffer = response.oferta;
        const context: OfferContext = {
          titulo: savedOffer.titulo,
          empresa: savedOffer.empresa,
          ubicacion: savedOffer.ubicacion,
          portal: "laborum",
          url: pageUrl,
          descripcion: savedOffer.notas_usuario || undefined,
        };
        setOferta(context);
        setCompatibilidad(null);
        setVisible(true);
        void loadMatch(context, key);
      } catch (error) {
        console.info("AltoqueCV: No se pudo cargar la oferta ingresada manualmente.", error);
      }
    };

    const refresh = () => {
      if (isFrame && !hasVisibleApplicationField()) return;
      const { sourceDocument, pageUrl } = getPage();
      if (pageUrl !== observedUrl) {
        observedUrl = pageUrl;
        activeKey = "";
        requestVersion += 1;
        setOferta(null);
        setCompatibilidad(null);
        setVisible(true);
      }

      let pageHost = "";
      let canonicalPageUrl = pageUrl;
      try {
        const parsedUrl = new URL(pageUrl);
        pageHost = parsedUrl.hostname;
        parsedUrl.search = "";
        parsedUrl.hash = "";
        canonicalPageUrl = parsedUrl.href;
      } catch {
        return;
      }
      // En Laborum solo se muestra una oferta registrada manualmente en AltoqueCV.
      // Esta ruta no lee el título ni la descripción del documento de Laborum.
      if (/(^|\.)laborum\.cl$/i.test(pageHost)) {
        const key = `laborum:${canonicalPageUrl}`;
        if (key === activeKey) return;
        activeKey = key;
        setOferta(null);
        setCompatibilidad(null);
        void loadSavedLaborumOffer(canonicalPageUrl, key);
        return;
      }

      const context = extractNonLaborumOfferContext(sourceDocument, pageUrl);
      if (!context) {
        if (activeKey) {
          activeKey = "";
          requestVersion += 1;
          setOferta(null);
          setCompatibilidad(null);
        }
        return;
      }

      const key = [context.url, context.titulo, context.descripcion?.length || 0].join("|");
      if (key === activeKey) return;
      activeKey = key;
      setOferta(context);
      setCompatibilidad(null);
      setVisible(true);
      void loadMatch(context, key);
    };

    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(refresh, 250);
    };

    refresh();
    const observer = new MutationObserver(scheduleRefresh);
    if (document.documentElement) observer.observe(document.documentElement, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    window.addEventListener("popstate", scheduleRefresh);
    window.addEventListener("hashchange", scheduleRefresh);
    const routePoll = window.setInterval(refresh, 700);

    return () => {
      window.clearTimeout(refreshTimer);
      window.clearInterval(routePoll);
      observer.disconnect();
      window.removeEventListener("popstate", scheduleRefresh);
      window.removeEventListener("hashchange", scheduleRefresh);
      requestVersion += 1;
    };
  }, []);

  if (!visible || !oferta) return null;

  return (
    <CompatibilityWidget
      oferta={oferta}
      compatibilidad={compatibilidad}
      cargando={!compatibilidad}
      onClose={() => setVisible(false)}
    />
  );
}

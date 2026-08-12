"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Cookie, Settings, ShieldCheck, X } from "lucide-react";
import { recordCookieConsent } from "@/modules/cookies/actions/record-cookie-consent";
import {
  COOKIE_CONSENT_COOKIE,
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_MAX_AGE,
  DEFAULT_COOKIE_PREFERENCES,
  type CookiePreferences,
  isSensitiveOnlineRoute,
  readStoredCookieConsent,
} from "@/modules/cookies/cookie-consent";
import { COOKIE_POLICY_VERSION } from "@/modules/legal/terms-versions";

export function CookieConsentBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [functionality, setFunctionality] = useState(false);
  const sensitiveRoute = isSensitiveOnlineRoute(pathname);

  useEffect(() => {
    const stored = readStoredCookieConsent();
    setFunctionality(stored?.functionality ?? false);
    setVisible(!stored);
    const openManager = () => {
      const current = readStoredCookieConsent();
      setFunctionality(current?.functionality ?? false);
      setManaging(true);
      setVisible(true);
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, openManager);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, openManager);
  }, []);

  async function save(preferences: CookiePreferences, action: "ACCEPT_ALL" | "REJECT_NON_ESSENTIAL" | "SAVE_PREFERENCES") {
    setSaving(true);
    const existing = readStoredCookieConsent();
    const consentId = existing?.consentId || crypto.randomUUID();
    const value = { ...preferences, consentId, policyVersion: COOKIE_POLICY_VERSION, savedAt: new Date().toISOString() };
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE_CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Path=/; Max-Age=${COOKIE_CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
    if (!preferences.functionality) {
      localStorage.removeItem("profile_modal_seen");
      localStorage.removeItem("dashboardViewMode");
    }
    try {
      await recordCookieConsent({ consentId, functionality: preferences.functionality, analytics: false, marketing: false, action });
    } finally {
      setSaving(false);
      setManaging(false);
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[120] p-3 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="cookie-consent-title">
      <div className="mx-auto max-w-5xl rounded-2xl border border-white/15 bg-slate-950 p-5 shadow-2xl shadow-black/60 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="hidden rounded-xl bg-[#d73cbe]/15 p-3 text-[#d73cbe] sm:block"><Cookie className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="cookie-consent-title" className="text-lg font-bold text-white">Sua privacidade e suas escolhas</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Usamos cookies essenciais para login e seguranca. A categoria de funcionalidade guarda preferencias do site. Nao usamos cookies de analytics ou publicidade atualmente. Saiba mais na <Link href="/cookies" className="cursor-pointer font-medium text-white underline">Politica de Cookies</Link>.
                </p>
              </div>
              {managing && <button type="button" onClick={() => { if (readStoredCookieConsent()) setVisible(false); setManaging(false); }} aria-label="Fechar preferencias" className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>}
            </div>

            {sensitiveRoute && <p className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs leading-5 text-emerald-200"><ShieldCheck className="mr-1.5 inline h-4 w-4" />Nesta area sensivel do MWC Online, categorias nao essenciais de terceiros permanecem bloqueadas.</p>}

            {managing && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Preference title="Necessarios" description="Login, sessao, seguranca e registro da sua escolha." checked disabled badge="Sempre ativos" />
                <Preference title="Funcionalidade" description="Preferencias locais, como modo do painel e avisos ja vistos." checked={functionality} onChange={setFunctionality} />
                <Preference title="Analiticos" description="Nao instalados na versao atual do site." checked={false} disabled badge="Nao utilizado" />
                <Preference title="Marketing" description="Nao instalados na versao atual do site." checked={false} disabled badge="Nao utilizado" />
              </div>
            )}

            <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
              {!managing && <button type="button" onClick={() => setManaging(true)} className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-bold text-white hover:bg-white/5"><Settings className="h-4 w-4" />Gerenciar</button>}
              <button type="button" disabled={saving} onClick={() => save(DEFAULT_COOKIE_PREFERENCES, "REJECT_NON_ESSENTIAL")} className="min-h-11 cursor-pointer rounded-xl border border-slate-600 bg-slate-700 px-5 text-sm font-bold text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60">Recusar nao essenciais</button>
              {managing ? (
                <button type="button" disabled={saving} onClick={() => save({ ...DEFAULT_COOKIE_PREFERENCES, functionality }, "SAVE_PREFERENCES")} className="min-h-11 cursor-pointer rounded-xl bg-[#d73cbe] px-5 text-sm font-bold text-white hover:bg-[#c22cab] disabled:cursor-not-allowed disabled:opacity-60">Salvar preferencias</button>
              ) : (
                <button type="button" disabled={saving} onClick={() => save({ ...DEFAULT_COOKIE_PREFERENCES, functionality: true }, "ACCEPT_ALL")} className="min-h-11 cursor-pointer rounded-xl bg-[#d73cbe] px-5 text-sm font-bold text-white hover:bg-[#c22cab] disabled:cursor-not-allowed disabled:opacity-60">Aceitar todos</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Preference({ title, description, checked, disabled = false, badge, onChange }: { title: string; description: string; checked: boolean; disabled?: boolean; badge?: string; onChange?: (checked: boolean) => void }) {
  return (
    <label className={`flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
      <span><span className="flex items-center gap-2 text-sm font-bold text-white">{title}{badge && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300">{badge}</span>}</span><span className="mt-1 block text-xs leading-5 text-slate-400">{description}</span></span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange?.(event.target.checked)} className={`mt-1 h-5 w-5 shrink-0 accent-[#d73cbe] ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`} />
    </label>
  );
}

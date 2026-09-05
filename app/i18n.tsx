'use client';
import {createContext, useCallback, useContext, useEffect, useState, type ReactNode} from 'react';
import {messages, type Lang, type MessageKey} from './messages';

export type {Lang} from './messages';

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'model-x-lang';

// Language choice: a saved localStorage preference wins; otherwise the browser
// language decides (zh* → Chinese) and everything else falls back to English.
// State starts as 'en' so server and first client render agree; the effect
// below upgrades to the detected language on mount.
export function LanguageProvider({children}: {children: ReactNode}) {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const detected: Lang = saved === 'zh' || saved === 'en' ? saved : navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
    if (detected !== 'en') setLang(detected);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = messages[lang].appTitle;
  }, [lang]);

  const t = useCallback((key: MessageKey, vars?: Record<string, string | number>) => {
    let text = messages[lang][key] ?? messages.en[key] ?? key;
    if (vars) for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(value));
    return text;
  }, [lang]);

  return <LanguageContext.Provider value={{lang, setLang, t}}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return context;
}

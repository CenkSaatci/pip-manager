import { createContext, useContext, useState, ReactNode } from "react";
import de from "./de.json";
import en from "./en.json";

const LOCALES: Record<string, Record<string, string>> = { de, en };

type LocaleId = keyof typeof LOCALES;

interface I18nCtx {
  locale: LocaleId;
  setLocale: (id: LocaleId) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx>(null!);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<LocaleId>("de");

  const t = (key: string, params?: Record<string, string | number>): string => {
    const dict = LOCALES[locale] ?? LOCALES.de;
    let val = dict[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        val = val.replace(`{${k}}`, String(v));
      }
    }
    return val;
  };

  return (
    <Ctx.Provider value={{ locale, setLocale: setLocale as (id: string) => void, t }}>
      {children}
    </Ctx.Provider>
  );
}

export function useT(): I18nCtx {
  return useContext(Ctx);
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { TRANSLATIONS, type Language } from './translations'

type TranslationKey = keyof (typeof TRANSLATIONS)['fr']

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  toggleLang: () => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang')
    if (saved === 'fr' || saved === 'en') return saved
    return 'fr'
  })

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('app_lang', newLang)
  }

  const toggleLang = () => {
    setLang(lang === 'fr' ? 'en' : 'fr')
  }

  const t = (key: TranslationKey): string => {
    return TRANSLATIONS[lang][key] ?? TRANSLATIONS.fr[key] ?? key
  }

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return ctx
}

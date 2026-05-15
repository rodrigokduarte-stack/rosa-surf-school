'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { pt } from '@/dictionaries/pt'
import { en } from '@/dictionaries/en'

type Language = 'pt' | 'en'
type Dictionary = typeof pt

interface LanguageContextType {
  language: Language
  t: Dictionary
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('pt')

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language') as Language
    if (savedLang === 'en' || savedLang === 'pt') {
      setLanguage(savedLang)
    }
  }, [])

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const newLang = prev === 'pt' ? 'en' : 'pt'
      localStorage.setItem('app_language', newLang)
      return newLang
    })
  }

  const t = language === 'pt' ? pt : en

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage deve ser usado dentro de um LanguageProvider')
  }
  return context
}
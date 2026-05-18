'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { pt } from '@/dictionaries/pt'
import { en } from '@/dictionaries/en'
import { es } from '@/dictionaries/es'

type Language = 'pt' | 'en' | 'es'
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
    if (savedLang === 'en' || savedLang === 'pt' || savedLang === 'es') {
      setLanguage(savedLang)
    }
  }, [])

  const toggleLanguage = () => {
    setLanguage((prev) => {
      // Cria o ciclo: Português -> Inglês -> Espanhol -> volta pro Português
      let newLang: Language = 'pt'
      if (prev === 'pt') newLang = 'en'
      else if (prev === 'en') newLang = 'es'
      else if (prev === 'es') newLang = 'pt'
      
      localStorage.setItem('app_language', newLang)
      return newLang
    })
  }

  // Define qual dicionário usar baseado no estado atual
  const t = language === 'pt' ? pt : language === 'en' ? en : es

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
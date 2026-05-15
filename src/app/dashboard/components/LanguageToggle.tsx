'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage()

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm text-lg"
      title={language === 'pt' ? 'Mudar para Inglês' : 'Switch to Portuguese'}
    >
      {language === 'pt' ? '🇺🇸' : '🇧🇷'}
    </button>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Waves, BookOpen, Receipt, BarChart2, 
  AlertCircle, Package, FileText, Menu, Users 
} from 'lucide-react'
import AulasTab from './components/AulasTab'
import DespesasTab from './components/DespesasTab'
import FinanceiroTab from './components/FinanceiroTab'
import InadimplentesTab from './components/InadimplentesTab'
import PacotesTab from './components/PacotesTab'
import TermosTab from './components/TermosTab'
import ProfessoresTab from './components/ProfessoresTab'

type Tab = 'aulas' | 'despesas' | 'financeiro' | 'pendentes' | 'pacotes' | 'termos' | 'professores'

const MAIN_NAV: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: 'aulas',      icon: BookOpen,  label: 'Agenda' },
  { id: 'pacotes',    icon: Package,   label: 'Pacotes' },
  { id: 'despesas',   icon: Receipt,   label: 'Despesas' },
  { id: 'financeiro', icon: BarChart2, label: 'Finanças' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('aulas')
  const [userName, setUserName] = useState('')
  const [initials, setInitials] = useState('RS')
  const [checking, setChecking] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Cálculos da Data de Hoje para o Header
  const hoje = new Date()
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const diaSemana = dias[hoje.getDay()]
  const diaMes = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}`

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/')
      else {
        const email = data.session.user.email ?? ''
        setUserName(email)
        // Pega as duas primeiras letras do email para o Avatar
        if (email) setInitials(email.substring(0, 2).toUpperCase())
        setChecking(false)
      }
    })
  }, [router])

  async function handleLogout() {
    if(window.confirm('Deseja realmente sair do sistema?')) {
      await supabase.auth.signOut()
      router.replace('/')
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f3ef]">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  function changeTab(newTab: Tab) {
    setTab(newTab)
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#f5f3ef] flex flex-col relative font-sans selection:bg-pink-200 overflow-x-hidden">

      {/* Fundo Wave Premium (Fica por trás de tudo) */}
      <div className="absolute top-0 left-0 right-0 h-[240px] bg-gradient-to-br from-[#0a1628] via-[#0e2347] to-[#1a3a6e] rounded-b-[40px] z-0" />

      {/* Header Premium (Agora sem fundo branco, usa o Wave de fundo) */}
      <header className="relative z-10 flex justify-between items-center px-6 pt-8 pb-4">
        {/* Esquerda: Logo + Data */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Waves size={22} className="text-pink-500" />
            <span className="text-xl font-bold text-white tracking-tight leading-none">Rosa Surf School</span>
          </div>
          <div className="bg-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 w-fit backdrop-blur-sm border border-white/5">
            <span className="text-[11px] text-white/70 font-medium">{diaSemana}</span>
            <span className="text-[11px] text-white font-bold">{diaMes}</span>
          </div>
        </div>

        {/* Direita: Avatar (Logout) */}
        <button
          onClick={handleLogout}
          title={`Logado como ${userName}. Clique para sair.`}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center text-white text-sm font-bold border-2 border-white/20 shadow-lg hover:scale-105 active:scale-95 transition-transform"
        >
          {initials}
        </button>
      </header>

      {/* Conteúdo da aba ativa (Sobreposto ao Wave) */}
      <main className="relative z-10 flex-1 pb-24">
        {tab === 'aulas'       && <AulasTab />}
        {tab === 'despesas'    && <DespesasTab />}
        {tab === 'financeiro'  && <FinanceiroTab />}
        {tab === 'pendentes'   && <InadimplentesTab />}
        {tab === 'pacotes'     && <PacotesTab />}
        {tab === 'termos'      && <TermosTab />}
        {tab === 'professores' && <ProfessoresTab />}
      </main>

      {/* Dropdown Menu Flutuante "Mais" */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-all" 
            onClick={() => setIsMenuOpen(false)} 
          />
          <div className="fixed bottom-24 right-4 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden w-48 py-2 animate-in fade-in slide-in-from-bottom-4">
            <button 
              onClick={() => changeTab('pendentes')} 
              className={`w-full flex items-center gap-3 px-5 py-3 transition-colors ${tab === 'pendentes' ? 'text-pink-600 bg-pink-50' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <AlertCircle size={18} /> <span className="text-sm font-semibold">Pendentes</span>
            </button>
            <button 
              onClick={() => changeTab('termos')} 
              className={`w-full flex items-center gap-3 px-5 py-3 transition-colors ${tab === 'termos' ? 'text-pink-600 bg-pink-50' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <FileText size={18} /> <span className="text-sm font-semibold">Termos</span>
            </button>
            <button 
              onClick={() => changeTab('professores')} 
              className={`w-full flex items-center gap-3 px-5 py-3 transition-colors ${tab === 'professores' ? 'text-pink-600 bg-pink-50' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Users size={18} /> <span className="text-sm font-semibold">Professores</span>
            </button>
          </div>
        </>
      )}

      {/* Bottom Navigation Bar Estilo App Nativo */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 flex h-[72px] px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        {MAIN_NAV.map(({ id, icon: Icon, label }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => changeTab(id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative"
            >
              <Icon 
                size={22} 
                strokeWidth={active ? 2.5 : 2} 
                className={`transition-colors duration-200 ${active ? 'text-pink-600' : 'text-slate-400'}`} 
              />
              <span className={`text-[10px] font-semibold transition-colors duration-200 ${active ? 'text-pink-600' : 'text-slate-400'}`}>
                {label}
              </span>
              {/* Bolinha indicadora de aba ativa */}
              {active && (
                <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-pink-600" />
              )}
            </button>
          )
        })}

        {/* Botão Hamburger (Menu Mais) */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex-1 flex flex-col items-center justify-center gap-1 relative"
        >
          <Menu 
            size={22} 
            strokeWidth={isMenuOpen || ['pendentes', 'termos', 'professores'].includes(tab) ? 2.5 : 2} 
            className={`transition-colors duration-200 ${isMenuOpen || ['pendentes', 'termos', 'professores'].includes(tab) ? 'text-pink-600' : 'text-slate-400'}`} 
          />
          <span className={`text-[10px] font-semibold transition-colors duration-200 ${isMenuOpen || ['pendentes', 'termos', 'professores'].includes(tab) ? 'text-pink-600' : 'text-slate-400'}`}>
            Menu
          </span>
          {['pendentes', 'termos', 'professores'].includes(tab) && !isMenuOpen && (
            <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-pink-600" />
          )}
        </button>
      </nav>

    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Waves, LogOut, BookOpen, Receipt, BarChart2, 
  AlertCircle, Package, FileText, Menu, Users 
} from 'lucide-react'
import AulasTab from './components/AulasTab'
import DespesasTab from './components/DespesasTab'
import FinanceiroTab from './components/FinanceiroTab'
import InadimplentesTab from './components/InadimplentesTab'
import PacotesTab from './components/PacotesTab'
import TermosTab from './components/TermosTab'

type Tab = 'aulas' | 'despesas' | 'financeiro' | 'pendentes' | 'pacotes' | 'termos' | 'professores'

const MAIN_NAV: { id: Tab; icon: React.ElementType }[] = [
  { id: 'aulas',      icon: BookOpen  },
  { id: 'pacotes',    icon: Package   },
  { id: 'despesas',   icon: Receipt   },
  { id: 'financeiro', icon: BarChart2 },
]

export default function DashboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('aulas')
  const [userName, setUserName] = useState('')
  const [checking, setChecking] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/')
      else {
        setUserName(data.session.user.email ?? '')
        setChecking(false)
      }
    })
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Função auxiliar para fechar o menu ao trocar de aba
  function changeTab(newTab: Tab) {
    setTab(newTab)
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Topbar minimalista */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <Waves size={20} className="text-pink-600" />
            <span className="font-bold text-base text-pink-600 leading-tight">Rosa Surf School</span>
          </div>

          {/* Email + Logout */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs hidden sm:block truncate max-w-[160px]">{userName}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-500 hover:text-pink-600 hover:bg-pink-50 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
              title="Sair"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo da aba ativa */}
      <div className="flex-1 pb-20">
        {tab === 'aulas'      && <AulasTab />}
        {tab === 'despesas'   && <DespesasTab />}
        {tab === 'financeiro' && <FinanceiroTab />}
        {tab === 'pendentes'  && <InadimplentesTab />}
        {tab === 'pacotes'    && <PacotesTab />}
        {tab === 'termos'     && <TermosTab />}
        
        {/* Placeholder da tela de Professores enquanto não criamos o arquivo */}
        {tab === 'professores' && (
          <div className="max-w-lg mx-auto p-8 flex flex-col items-center justify-center text-center mt-10">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Users size={32} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-700">Equipe de Professores</h2>
            <p className="text-sm text-slate-500 mt-2">A tela de cadastro será criada aqui!</p>
          </div>
        )}
      </div>

      {/* Dropdown Menu Flutuante "Mais" */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/5" 
            onClick={() => setIsMenuOpen(false)} 
          />
          <div className="fixed bottom-20 right-4 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden w-48 py-2 animate-in fade-in slide-in-from-bottom-4">
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

      {/* Bottom Navigation Bar Minimalista */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex h-16 px-2 pb-safe">
        {MAIN_NAV.map(({ id, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => changeTab(id)}
              className={`flex-1 flex items-center justify-center transition-colors ${
                active ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={24} strokeWidth={active ? 2.5 : 2} />
            </button>
          )
        })}

        {/* Botão Hamburger (Mais) */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex-1 flex items-center justify-center transition-colors ${
            isMenuOpen || ['pendentes', 'termos', 'professores'].includes(tab) 
              ? 'text-pink-600' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Menu size={24} strokeWidth={isMenuOpen || ['pendentes', 'termos', 'professores'].includes(tab) ? 2.5 : 2} />
        </button>
      </nav>

    </div>
  )
}
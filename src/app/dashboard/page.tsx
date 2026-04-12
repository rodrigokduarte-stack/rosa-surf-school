'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Waves, LogOut, BookOpen, Receipt, BarChart2, AlertCircle, Package, FileText } from 'lucide-react'
import AulasTab from './components/AulasTab'
import DespesasTab from './components/DespesasTab'
import FinanceiroTab from './components/FinanceiroTab'
import InadimplentesTab from './components/InadimplentesTab'
import PacotesTab from './components/PacotesTab'
import TermosTab from './components/TermosTab'

type Tab = 'aulas' | 'despesas' | 'financeiro' | 'pendentes' | 'pacotes' | 'termos'

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'aulas',      label: 'Aulas',      icon: BookOpen  },
  { id: 'despesas',   label: 'Despesas',   icon: Receipt   },
  { id: 'financeiro', label: 'Financeiro', icon: BarChart2 },
  { id: 'pendentes',  label: 'Pendentes',  icon: AlertCircle },
  { id: 'pacotes',    label: 'Pacotes',    icon: Package   },
  { id: 'termos',     label: 'Termos',     icon: FileText  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('aulas')
  const [userName, setUserName] = useState('')
  const [checking, setChecking] = useState(true)

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

      {/* Conteúdo da aba ativa — pb-24 para não ficar atrás da bottom nav */}
      <div className="flex-1 pb-24">
        {tab === 'aulas'      && <AulasTab />}
        {tab === 'despesas'   && <DespesasTab />}
        {tab === 'financeiro' && <FinanceiroTab />}
        {tab === 'pendentes'  && <InadimplentesTab />}
        {tab === 'pacotes'    && <PacotesTab />}
        {tab === 'termos'     && <TermosTab />}
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                active ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium leading-tight ${active ? 'text-pink-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </nav>

    </div>
  )
}

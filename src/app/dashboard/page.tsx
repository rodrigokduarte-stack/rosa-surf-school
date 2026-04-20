'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Waves, BookOpen, Receipt, BarChart2, 
  AlertCircle, Package, Menu, UserSquare, Users, Bell, User, X, CheckCircle
} from 'lucide-react'

import AulasTab from './components/AulasTab'
import DespesasTab from './components/DespesasTab'
import FinanceiroTab from './components/FinanceiroTab'
import InadimplentesTab from './components/InadimplentesTab'
import PacotesTab from './components/PacotesTab'
import TermosTab from './components/TermosTab'
import ProfessoresTab from './components/ProfessoresTab'
import AlunosTab from './components/AlunosTab'
import PerfilTab from './components/PerfilTab' 

type Tab = 'aulas' | 'despesas' | 'financeiro' | 'pendentes' | 'pacotes' | 'termos' | 'professores' | 'alunos' | 'perfil'

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
  const [isNotificacoesOpen, setIsNotificacoesOpen] = useState(false)
  const [notificacoes, setNotificacoes] = useState<any[]>([])

  const hoje = new Date()
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const diaSemana = dias[hoje.getDay()]
  const diaMes = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}`

  const carregarNotificacoes = useCallback(async () => {
    const novas: any[] = []
    const hojeStr = new Date().toISOString().split('T')[0]

    const { data: aulas } = await supabase.from('registro_aulas').select('nome_professor').gte('data_aula', hojeStr)
    const semProf = aulas?.filter(a => !a.nome_professor || a.nome_professor.trim() === '' || a.nome_professor.toLowerCase() === 'sem professor') || []
    if (semProf.length > 0) {
      novas.push({ id: 'prof', tipo: 'urgente', titulo: 'Aulas sem Professor', mensagem: `Existem ${semProf.length} aulas sem professor.`, acao: 'aulas' })
    }

    const { data: pAulas } = await supabase.from('registro_aulas').select('id').in('status_pagamento', ['Pendente', 'Parcial'])
    const { data: pPacotes } = await supabase.from('pacotes').select('valor_total, valor_pago')
    const pacDevendo = pPacotes?.filter(p => Number(p.valor_pago) < Number(p.valor_total)) || []
    if ((pAulas?.length || 0) + pacDevendo.length > 0) {
      novas.push({ id: 'fin', tipo: 'alerta', titulo: 'Cobranças Pendentes', mensagem: 'Há pendências no caixa.', acao: 'pendentes' })
    }

    setNotificacoes(novas)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/')
      else {
        const email = data.session.user.email ?? ''
        setUserName(email)
        if (email) setInitials(email.substring(0, 2).toUpperCase())
        setChecking(false)
        carregarNotificacoes()
      }
    })
  }, [router, carregarNotificacoes])

  function changeTab(newTab: Tab) {
    setTab(newTab)
    setIsMenuOpen(false)
    setIsNotificacoesOpen(false) 
  }

  const menuTabs = ['alunos', 'professores', 'pendentes', 'termos', 'perfil']

  if (checking) return <div className="min-h-screen flex items-center justify-center bg-[#f5f3ef]"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-[#f5f3ef] flex flex-col relative font-sans selection:bg-pink-200 overflow-x-hidden">
      <div className="absolute top-0 left-0 right-0 h-[240px] bg-gradient-to-br from-[#0a1628] via-[#0e2347] to-[#1a3a6e] rounded-b-[40px] z-0" />

      <header className="relative z-10 flex justify-between items-center px-6 pt-8 pb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Waves size={22} className="text-pink-500" />
            {/* CORREÇÃO AQUI: De Rosa Surf para Rosa Surf School */}
            <span className="text-xl font-bold text-white tracking-tight leading-none">Rosa Surf School</span>
          </div>
          <div className="bg-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 w-fit backdrop-blur-sm border border-white/5">
            <span className="text-[11px] text-white/70 font-medium">{diaSemana}</span>
            <span className="text-[11px] text-white font-bold">{diaMes}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setIsNotificacoesOpen(true)} className="relative w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-lg transition-transform active:scale-95">
            <Bell size={18} />
            {notificacoes.length > 0 && <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 border-2 border-[#0a1628] rounded-full animate-pulse" />}
          </button>
          
          <button
            onClick={() => changeTab('perfil')}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all shadow-lg ${tab === 'perfil' ? 'bg-white text-pink-600 border-pink-500 scale-110' : 'bg-gradient-to-br from-pink-500 to-rose-400 text-white border-white/20'}`}
          >
            {initials}
          </button>
        </div>
      </header>

      {isNotificacoesOpen && (
        <>
          <div className="fixed inset-0 z-[60] bg-transparent" onClick={() => setIsNotificacoesOpen(false)} />
          <div className="absolute top-20 right-6 z-[70] w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="bg-slate-900 p-4 flex justify-between items-center">
              <h3 className="text-white text-sm font-bold flex items-center gap-2"><Bell size={16} className="text-pink-400"/> Notificações</h3>
              <button onClick={() => setIsNotificacoesOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {notificacoes.length > 0 ? (
                notificacoes.map((notif, idx) => (
                  <div key={idx} onClick={() => changeTab(notif.acao)} className="p-3 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors border-b border-slate-50 last:border-0 flex flex-col gap-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${notif.tipo === 'urgente' ? 'text-rose-500' : 'text-amber-500'}`}>
                      {notif.tipo}
                    </span>
                    <strong className="text-sm text-slate-800">{notif.titulo}</strong>
                    <p className="text-xs text-slate-500 leading-tight">{notif.mensagem}</p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 flex flex-col items-center gap-2">
                  <CheckCircle size={24} className="text-emerald-400 mb-1" />
                  <span className="text-sm font-bold text-slate-600">Tudo em dia!</span>
                  <span className="text-xs">Nenhuma pendência no momento.</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <main className="relative z-10 flex-1 pb-24">
        {tab === 'aulas'       && <AulasTab />}
        {tab === 'despesas'    && <DespesasTab />}
        {tab === 'financeiro'  && <FinanceiroTab />}
        {tab === 'pendentes'   && <InadimplentesTab />}
        {tab === 'pacotes'     && <PacotesTab />}
        {tab === 'termos'      && <TermosTab />}
        {tab === 'professores' && <ProfessoresTab />}
        {tab === 'alunos'      && <AlunosTab />}
        {tab === 'perfil'      && <PerfilTab />}
      </main>

      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed bottom-24 right-4 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden w-48 py-2 animate-in slide-in-from-bottom-4">
            <button onClick={() => changeTab('alunos')} className={`w-full flex items-center gap-3 px-5 py-3 ${tab === 'alunos' ? 'text-pink-600 bg-pink-50' : 'text-slate-600'}`}>
              <UserSquare size={18} /> <span className="text-sm font-semibold">Alunos</span>
            </button>
            <button onClick={() => changeTab('professores')} className={`w-full flex items-center gap-3 px-5 py-3 ${tab === 'professores' ? 'text-pink-600 bg-pink-50' : 'text-slate-600'}`}>
              <Users size={18} /> <span className="text-sm font-semibold">Professores</span>
            </button>
            <button onClick={() => changeTab('pendentes')} className={`w-full flex items-center gap-3 px-5 py-3 ${tab === 'pendentes' ? 'text-pink-600 bg-pink-50' : 'text-slate-600'}`}>
              <AlertCircle size={18} /> <span className="text-sm font-semibold">Pendentes</span>
            </button>
            <button onClick={() => changeTab('perfil')} className={`w-full flex items-center gap-3 px-5 py-3 ${tab === 'perfil' ? 'text-pink-600 bg-pink-50' : 'text-slate-600'}`}>
              <User size={18} /> <span className="text-sm font-semibold">Meu Perfil</span>
            </button>
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 flex h-[72px] px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        {MAIN_NAV.map(({ id, icon: Icon, label }) => {
          const active = tab === id
          return (
            <button key={id} onClick={() => changeTab(id)} className="flex-1 flex flex-col items-center justify-center gap-1 relative">
              <Icon size={22} className={active ? 'text-pink-600' : 'text-slate-400'} />
              <span className={`text-[10px] font-semibold ${active ? 'text-pink-600' : 'text-slate-400'}`}>{label}</span>
            </button>
          )
        })}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex-1 flex flex-col items-center justify-center gap-1 relative">
          <Menu size={22} className={isMenuOpen || menuTabs.includes(tab) ? 'text-pink-600' : 'text-slate-400'} />
          <span className={`text-[10px] font-semibold ${isMenuOpen || menuTabs.includes(tab) ? 'text-pink-600' : 'text-slate-400'}`}>Menu</span>
        </button>
      </nav>
    </div>
  )
}
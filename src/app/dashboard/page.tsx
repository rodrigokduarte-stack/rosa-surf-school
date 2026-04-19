'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Waves, BookOpen, Receipt, BarChart2, 
  AlertCircle, Package, FileText, Menu, Users, UserSquare, Bell, X, Info,
  CheckCircle, DollarSign
} from 'lucide-react'
import AulasTab from './components/AulasTab'
import DespesasTab from './components/DespesasTab'
import FinanceiroTab from './components/FinanceiroTab'
import InadimplentesTab from './components/InadimplentesTab'
import PacotesTab from './components/PacotesTab'
import TermosTab from './components/TermosTab'
import ProfessoresTab from './components/ProfessoresTab'
import AlunosTab from './components/AlunosTab'

type Tab = 'aulas' | 'despesas' | 'financeiro' | 'pendentes' | 'pacotes' | 'termos' | 'professores' | 'alunos'

type Notificacao = {
  id: string
  tipo: 'urgente' | 'alerta' | 'info'
  titulo: string
  mensagem: string
  acao: Tab
}

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
  
  // Controles de Menus e Modais
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotificacoesOpen, setIsNotificacoesOpen] = useState(false)
  
  // Estado das Notificações
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])

  const hoje = new Date()
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const diaSemana = dias[hoje.getDay()]
  const diaMes = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}`

  // Motor Inteligente de Notificações
  const carregarNotificacoes = useCallback(async () => {
    const novasNotificacoes: Notificacao[] = []
    const dataHojeStr = new Date().toISOString().split('T')[0]

    // 1. Aulas Futuras sem Professor
    const { data: aulas } = await supabase
      .from('registro_aulas')
      .select('nome_professor')
      .gte('data_aula', dataHojeStr)
    
    const semProf = aulas?.filter(a => !a.nome_professor || a.nome_professor.trim() === '' || a.nome_professor.toLowerCase() === 'sem professor') || []
    
    if (semProf.length > 0) {
      novasNotificacoes.push({
        id: 'alerta-prof',
        tipo: 'urgente',
        titulo: 'Aulas sem Professor',
        mensagem: `Você tem ${semProf.length} aula(s) agendada(s) aguardando atribuição de professor.`,
        acao: 'aulas'
      })
    }

    // 2. Alunos Inadimplentes (Caixa Pendente)
    const { data: pendentesAula } = await supabase.from('registro_aulas').select('id').in('status_pagamento', ['Pendente', 'Parcial'])
    const { data: pendentesPacote } = await supabase.from('pacotes').select('valor_total, valor_pago')
    
    const pacotesDevendo = pendentesPacote?.filter(p => Number(p.valor_pago) < Number(p.valor_total)) || []
    const totalPendencias = (pendentesAula?.length || 0) + pacotesDevendo.length

    if (totalPendencias > 0) {
      novasNotificacoes.push({
        id: 'alerta-fin',
        tipo: 'alerta',
        titulo: 'Cobranças Pendentes',
        mensagem: `Existem ${totalPendencias} dívidas em aberto aguardando recebimento no caixa.`,
        acao: 'pendentes'
      })
    }

    // 3. Pacotes Acabando (Oportunidade de Venda)
    const { data: pacotesAcabando } = await supabase.from('pacotes').select('id').lte('aulas_restantes', 1)
    
    if (pacotesAcabando && pacotesAcabando.length > 0) {
      novasNotificacoes.push({
        id: 'alerta-pacote',
        tipo: 'info',
        titulo: 'Renovação de Pacotes',
        mensagem: `${pacotesAcabando.length} aluno(s) estão na última aula (ou já zeraram). Ofereça a renovação!`,
        acao: 'pacotes'
      })
    }

    setNotificacoes(novasNotificacoes)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/')
      else {
        const email = data.session.user.email ?? ''
        setUserName(email)
        if (email) setInitials(email.substring(0, 2).toUpperCase())
        setChecking(false)
        carregarNotificacoes() // Carrega os alertas assim que entra
      }
    })
  }, [router, carregarNotificacoes])

  // Recarrega notificações sempre que mudar de aba (para manter atualizado)
  useEffect(() => {
    if (!checking) carregarNotificacoes()
  }, [tab, checking, carregarNotificacoes])

  async function handleLogout() {
    if(window.confirm('Deseja realmente sair do sistema?')) {
      await supabase.auth.signOut()
      router.replace('/')
    }
  }

  function changeTab(newTab: Tab) {
    setTab(newTab)
    setIsMenuOpen(false)
    setIsNotificacoesOpen(false)
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f3ef]">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const menuTabs = ['alunos', 'professores', 'pendentes', 'termos']

  return (
    <div className="min-h-screen bg-[#f5f3ef] flex flex-col relative font-sans selection:bg-pink-200 overflow-x-hidden">

      <div className="absolute top-0 left-0 right-0 h-[240px] bg-gradient-to-br from-[#0a1628] via-[#0e2347] to-[#1a3a6e] rounded-b-[40px] z-0" />

      <header className="relative z-10 flex justify-between items-center px-6 pt-8 pb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Waves size={22} className="text-pink-500" />
            <span className="text-xl font-bold text-white tracking-tight leading-none">Rosa Surf</span>
          </div>
          <div className="bg-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 w-fit backdrop-blur-sm border border-white/5">
            <span className="text-[11px] text-white/70 font-medium">{diaSemana}</span>
            <span className="text-[11px] text-white font-bold">{diaMes}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* SININHO DE NOTIFICAÇÕES */}
          <button
            onClick={() => setIsNotificacoesOpen(true)}
            className="relative w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            <Bell size={18} />
            {notificacoes.length > 0 && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 border-2 border-[#0a1628] rounded-full flex items-center justify-center text-[8px] font-black animate-pulse" />
            )}
          </button>

          <button
            onClick={handleLogout}
            title={`Logado como ${userName}. Clique para sair.`}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center text-white text-sm font-bold border-2 border-white/20 shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            {initials}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 pb-24">
        {tab === 'aulas'       && <AulasTab />}
        {tab === 'despesas'    && <DespesasTab />}
        {tab === 'financeiro'  && <FinanceiroTab />}
        {tab === 'pendentes'   && <InadimplentesTab />}
        {tab === 'pacotes'     && <PacotesTab />}
        {tab === 'termos'      && <TermosTab />}
        {tab === 'professores' && <ProfessoresTab />}
        {tab === 'alunos'      && <AlunosTab />}
      </main>

      {/* MODAL DE NOTIFICAÇÕES (GAVETA) */}
      {isNotificacoesOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsNotificacoesOpen(false)} 
          />
          <div className="relative bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] flex flex-col">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden shrink-0" />
            
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-800">Notificações</h3>
                <p className="text-sm text-slate-500 mt-0.5">{notificacoes.length} alerta(s) no seu radar</p>
              </div>
              <button 
                onClick={() => setIsNotificacoesOpen(false)}
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
              {notificacoes.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={24} />
                  </div>
                  <p className="font-bold text-slate-700">Tudo sob controle!</p>
                  <p className="text-xs text-slate-500 mt-1">Nenhuma pendência ou alerta no momento.</p>
                </div>
              ) : (
                notificacoes.map(notif => {
                  let iconBg, iconColor, Icon;
                  if (notif.tipo === 'urgente') {
                    iconBg = 'bg-rose-100'; iconColor = 'text-rose-600'; Icon = AlertCircle;
                  } else if (notif.tipo === 'alerta') {
                    iconBg = 'bg-amber-100'; iconColor = 'text-amber-600'; Icon = DollarSign;
                  } else {
                    iconBg = 'bg-blue-100'; iconColor = 'text-blue-600'; Icon = Info;
                  }

                  return (
                    <button
                      key={notif.id}
                      onClick={() => changeTab(notif.acao)}
                      className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-pink-200 hover:shadow-md transition-all text-left group active:scale-[0.98]"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 text-[14px] leading-tight group-hover:text-pink-600 transition-colors">{notif.titulo}</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-snug">{notif.mensagem}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MENU INFERIOR EXTRA */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-all" 
            onClick={() => setIsMenuOpen(false)} 
          />
          <div className="fixed bottom-24 right-4 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden w-48 py-2 animate-in fade-in slide-in-from-bottom-4">
            
            <button 
              onClick={() => changeTab('alunos')} 
              className={`w-full flex items-center gap-3 px-5 py-3 transition-colors ${tab === 'alunos' ? 'text-pink-600 bg-pink-50' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <UserSquare size={18} /> <span className="text-sm font-semibold">Alunos</span>
            </button>

            <button 
              onClick={() => changeTab('professores')} 
              className={`w-full flex items-center gap-3 px-5 py-3 transition-colors ${tab === 'professores' ? 'text-pink-600 bg-pink-50' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Users size={18} /> <span className="text-sm font-semibold">Professores</span>
            </button>

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

          </div>
        </>
      )}

      {/* NAVEGAÇÃO BOTTOM */}
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
              {active && (
                <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-pink-600" />
              )}
            </button>
          )
        })}

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex-1 flex flex-col items-center justify-center gap-1 relative"
        >
          <Menu 
            size={22} 
            strokeWidth={isMenuOpen || menuTabs.includes(tab) ? 2.5 : 2} 
            className={`transition-colors duration-200 ${isMenuOpen || menuTabs.includes(tab) ? 'text-pink-600' : 'text-slate-400'}`} 
          />
          <span className={`text-[10px] font-semibold transition-colors duration-200 ${isMenuOpen || menuTabs.includes(tab) ? 'text-pink-600' : 'text-slate-400'}`}>
            Menu
          </span>
          {menuTabs.includes(tab) && !isMenuOpen && (
            <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-pink-600" />
          )}
        </button>
      </nav>

    </div>
  )
}
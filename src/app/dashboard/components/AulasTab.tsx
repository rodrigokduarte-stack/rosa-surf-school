'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { RegistroAula, NovaAula, Pacote } from '@/types'
import { hojeEmBrasilia, formatarValor } from '@/lib/dateUtils'
import {
  Plus, Clock, User, DollarSign,
  ChevronDown, ChevronUp, CheckCircle, 
  Package, Trash2, Calendar, X, GraduationCap, 
  Waves, CalendarDays, AlertCircle, Grid, List
} from 'lucide-react'

const FORMAS_PAGAMENTO = ['Pix', 'Cartão de Crédito', 'Dinheiro', 'Outro']

// GERA OS HORÁRIOS PARA O FORMULÁRIO (06h até 19h completos)
const OPCOES_HORARIOS = Array.from({ length: 27 }, (_, i) => {
  const hora = Math.floor(i / 2) + 6
  const minuto = i % 2 === 0 ? '00' : '30'
  const horaStr = hora.toString().padStart(2, '0')
  return `${horaStr}:${minuto}`
})

type FormData = Omit<NovaAula, 'nome_professor' | 'pacote_id'> & { valor_pago?: number }
type AulaComPagamento = RegistroAula & { valor_pago?: number, pacote_id?: string | null }

function formatarDataHeader(dataStr: string) {
  const [ano, mes, dia] = dataStr.split('-')
  const dataAula = new Date(Number(ano), Number(mes) - 1, Number(dia))
  const amanha = new Date()
  amanha.setDate(amanha.getDate() + 1)
  
  let nomeDia = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dataAula.getDay()]
  
  if (dataAula.getDate() === amanha.getDate() && dataAula.getMonth() === amanha.getMonth()) {
    nomeDia = 'Amanhã'
  }

  return `${nomeDia}, ${dia}/${mes}`
}

// FORMATADOR SEGURO PARA A GRADE
function formatarDataISO(d: Date) {
  const a = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${a}-${m}-${dd}`;
}

export default function AulasTab() {
  const [abaVisivel, setAbaVisivel] = useState<'hoje' | 'programadas' | 'calendario'>('hoje')
  
  const [aulasHoje, setAulasHoje] = useState<AulaComPagamento[]>([])
  const [aulasProgramadas, setAulasProgramadas] = useState<AulaComPagamento[]>([])
  const [loadingAulas, setLoadingAulas] = useState(true)
  const [salvando, setSalvando] = useState(false)
  
  const [modalAberto, setModalAberto] = useState(false)
  const [cardExpandido, setCardExpandido] = useState<string | null>(null)
  const [aulaDetalheGrade, setAulaDetalheGrade] = useState<AulaComPagamento | null>(null)
  
  const [listaProfessores, setListaProfessores] = useState<string[]>([])
  const [professores, setProfessores] = useState<string[]>([])
  
  const [editandoProfId, setEditandoProfId] = useState<string | null>(null)
  const [profsTemporarios, setProfsTemporarios] = useState<string[]>([])
  const [salvandoProf, setSalvandoProf] = useState(false)

  const [pacotes, setPacotes] = useState<Pacote[]>([])
  const [pacoteSelecionado, setPacoteSelecionado] = useState<string>('')
  const [excluindo, setExcluindo] = useState<string | null>(null)

  const [alunosCadastrados, setAlunosCadastrados] = useState<{id: string, nome: string}[]>([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)

  const touchStartY = useRef(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      data_aula: hojeEmBrasilia(),
      status_pagamento: 'Pendente',
      modalidade: 'Aula Particular',
    },
  })

  const statusPagamento = watch('status_pagamento')
  const nomeClienteAtual = watch('nome_cliente') || ''

  const sugestoesAlunos = alunosCadastrados.filter(a => 
    a.nome.toLowerCase().includes(nomeClienteAtual.toLowerCase()) &&
    a.nome.toLowerCase() !== nomeClienteAtual.toLowerCase() 
  )

  const carregarDadosBase = useCallback(async () => {
    const { data: profs } = await supabase
      .from('professores')
      .select('nome')
      .eq('ativo', true) 
      .order('nome', { ascending: true })
    if (profs) setListaProfessores(profs.map(p => p.nome))

    const { data: alunos } = await supabase.from('alunos').select('id, nome').eq('excluido', false).order('nome', { ascending: true })
    if (alunos) setAlunosCadastrados(alunos)
  }, [])

  const carregarAulas = useCallback(async () => {
    setLoadingAulas(true)
    const hoje = hojeEmBrasilia()

    const { data: dataHoje } = await supabase
      .from('registro_aulas')
      .select('*')
      .eq('data_aula', hoje)
      .eq('excluido', false)
      .order('horario', { ascending: true })

    const { data: dataFuturas } = await supabase
      .from('registro_aulas')
      .select('*')
      .gt('data_aula', hoje)
      .eq('excluido', false)
      .order('data_aula', { ascending: true })
      .order('horario', { ascending: true })

    setAulasHoje(dataHoje ?? [])
    setAulasProgramadas(dataFuturas ?? [])
    setLoadingAulas(false)
  }, [])

  const carregarPacotes = useCallback(async () => {
    const { data } = await supabase
      .from('pacotes')
      .select('*')
      .eq('status', 'Ativo')
      .eq('excluido', false)
      .gt('aulas_restantes', 0)
      .order('nome_cliente', { ascending: true })
    setPacotes(data ?? [])
  }, [])

  useEffect(() => { 
    carregarAulas(); carregarPacotes(); carregarDadosBase();
  }, [carregarAulas, carregarPacotes, carregarDadosBase])

  async function excluirAula(aula: AulaComPagamento) {
    if (!window.confirm(`Arquivar a aula de "${aula.nome_cliente}"? (Ela sairá da agenda mas ficará salva no banco)`)) return
    setExcluindo(aula.id)

    if (aula.pacote_id) {
      const { data: pacoteAtual } = await supabase
        .from('pacotes')
        .select('aulas_restantes')
        .eq('id', aula.pacote_id)
        .single()

      if (pacoteAtual) {
        await supabase.from('pacotes').update({
          aulas_restantes: pacoteAtual.aulas_restantes + 1,
          status: 'Ativo' 
        }).eq('id', aula.pacote_id)
      }
    }

    const { error } = await supabase.from('registro_aulas').update({ excluido: true }).eq('id', aula.id)
    
    setExcluindo(null)
    if (!error) {
      setAulasHoje(prev => prev.filter(a => a.id !== aula.id))
      setAulasProgramadas(prev => prev.filter(a => a.id !== aula.id))
      setAulaDetalheGrade(null)
      carregarPacotes() 
    }
  }

  function toggleProfessor(nome: string) {
    setProfessores(prev => prev.includes(nome) ? prev.filter(p => p !== nome) : [...prev, nome])
  }

  function handlePacoteChange(pacoteId: string) {
    setPacoteSelecionado(pacoteId)
    if (pacoteId) {
      setValue('valor_aula', 0)
      setValue('status_pagamento', 'Pago')
      setValue('forma_pagamento', undefined)
    }
  }

  async function onSubmit(dados: FormData) {
    setSalvando(true)

    const nomeDigitado = dados.nome_cliente.trim()
    
    const { data: checkCRM } = await supabase.from('alunos').select('id').ilike('nome', nomeDigitado).limit(1)
    
    if (!checkCRM || checkCRM.length === 0) {
      await supabase.from('alunos').insert([{ nome: nomeDigitado }])
      carregarDadosBase() 
    }

    let valorFinalPago = 0
    if (dados.status_pagamento === 'Pago') valorFinalPago = Number(dados.valor_aula)
    else if (dados.status_pagamento === 'Parcial') valorFinalPago = Number(dados.valor_pago) || 0

    const payload = {
      ...dados,
      nome_cliente: nomeDigitado,
      nome_professor: professores,
      pacote_id: pacoteSelecionado || null,
      valor_pago: valorFinalPago
    }

    const { error } = await supabase.from('registro_aulas').insert([payload])

    if (!error && pacoteSelecionado) {
      const pacote = pacotes.find(p => p.id === pacoteSelecionado)
      if (pacote && pacote.aulas_restantes > 0) {
        const novasRestantes = pacote.aulas_restantes - 1
        await supabase.from('pacotes').update({
          aulas_restantes: novasRestantes,
          status: novasRestantes === 0 ? 'Finalizado' : 'Ativo',
        }).eq('id', pacoteSelecionado)
        carregarPacotes()
      }
    }

    setSalvando(false)
    if (!error) {
      reset({
        data_aula: hojeEmBrasilia(), horario: '', nome_cliente: '', valor_aula: undefined, 
        valor_pago: undefined, modalidade: 'Aula Particular', status_pagamento: 'Pendente', 
        forma_pagamento: undefined, observacoes: ''
      })
      setProfessores([]); setPacoteSelecionado(''); carregarAulas()
      setModalAberto(false) 
    }
  }

  async function salvarEdicaoProfessores(id: string) {
    setSalvandoProf(true)
    const { error } = await supabase.from('registro_aulas').update({ nome_professor: profsTemporarios }).eq('id', id)
    setSalvandoProf(false)
    if (!error) {
      setEditandoProfId(null)
      carregarAulas()
    }
  }

  const totalDia = aulasHoje.reduce((sum, a) => sum + Number(a.valor_aula), 0)
  const totalPago = aulasHoje.reduce((sum, a) => {
    if (a.status_pagamento === 'Pago') return sum + Number(a.valor_aula)
    if (a.status_pagamento === 'Parcial') return sum + Number(a.valor_pago || 0)
    return sum
  }, 0)

  const temPacote = !!pacoteSelecionado

  const aulasAgrupadas = aulasProgramadas.reduce((acc, aula) => {
    if (!acc[aula.data_aula]) acc[aula.data_aula] = []
    acc[aula.data_aula].push(aula)
    return acc
  }, {} as Record<string, AulaComPagamento[]>)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const currentY = e.touches[0].clientY
    const diff = currentY - touchStartY.current
    if (diff > 0) {
      setDragOffset(diff)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (dragOffset > 100) {
      setModalAberto(false)
    }
    setDragOffset(0) 
  }

  // --- LÓGICA DO CALENDÁRIO INTELIGENTE ---
  const [ano, mes, dia] = hojeEmBrasilia().split('-')
  const dataBase = new Date(Number(ano), Number(mes) - 1, Number(dia))
  const diasGrid = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(dataBase)
    d.setDate(d.getDate() + i)
    return d
  })
  const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const todasAulas = [...aulasHoje, ...aulasProgramadas]

  const dataStrSemana = diasGrid.map(d => formatarDataISO(d))
  const aulasNaSemana = todasAulas.filter(a => dataStrSemana.includes(a.data_aula))

  let minHour = 24
  let maxHour = 0

  if (aulasNaSemana.length === 0) {
    // Se a semana está vazia, mostra só a manhã para não ocupar espaço à toa
    minHour = 8
    maxHour = 12
  } else {
    // Escaneia a semana para achar a primeira e a última aula
    aulasNaSemana.forEach(a => {
      if (a.horario) {
        const h = parseInt(a.horario.split(':')[0], 10)
        if (!isNaN(h)) {
          if (h < minHour) minHour = h
          if (h > maxHour) maxHour = h
        }
      }
    })
  }

  // Adiciona 1 hora de margem antes e depois (limitado entre 06h e 19h)
  const startHour = Math.max(6, minHour - 1)
  const endHour = Math.min(19, maxHour + 1)

  // Filtra apenas os horários necessários para a tela do Calendário
  const HORARIOS_VISIVEIS = OPCOES_HORARIOS.filter(horaStr => {
    const h = parseInt(horaStr.split(':')[0], 10)
    return h >= startHour && h <= endHour
  })

  const renderCard = (aula: AulaComPagamento) => {
    const expandido = cardExpandido === aula.id
    
    let arrayProfs: string[] = []
    if (aula.nome_professor) {
      arrayProfs = Array.isArray(aula.nome_professor) ? aula.nome_professor : [aula.nome_professor]
    }
    const semProfessor = arrayProfs.length === 0
    const urgenciaProf = semProfessor && aula.data_aula <= hojeEmBrasilia()

    return (
      <div key={aula.id} className={`bg-white rounded-[24px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] border transition-all ${urgenciaProf ? 'border-red-200 shadow-[0_4px_16px_rgba(239,68,68,0.1)]' : 'border-slate-100'}`}>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Clock size={12} /> {aula.horario}
            </span>
            <div className="flex gap-1.5 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${aula.modalidade === 'Aula Particular' ? 'bg-pink-100 text-pink-700' : 'bg-violet-100 text-violet-700'}`}>
                {aula.modalidade.replace('Aula ', '')}
              </span>
              
              {semProfessor && (
                urgenciaProf ? (
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full animate-pulse">
                    <AlertCircle size={10} /> Atribuir Prof
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    ⏳ A Definir
                  </span>
                )
              )}
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${
            aula.status_pagamento === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 
            aula.status_pagamento === 'Parcial' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {aula.status_pagamento === 'Pago' ? '✓ Pago' : aula.status_pagamento === 'Parcial' ? 'Parcial' : 'Pendente'}
          </span>
        </div>

        <button 
          onClick={() => {
            if (expandido) setEditandoProfId(null) 
            setCardExpandido(expandido ? null : aula.id)
          }}
          className="w-full flex items-center justify-between text-left group"
        >
          <h3 className="text-lg font-black text-slate-800 tracking-tight group-hover:text-pink-600 transition-colors">
            {aula.nome_cliente}
          </h3>
          {expandido ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {expandido && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Professores</span>
              {!editandoProfId && (
                <button 
                  onClick={() => { setProfsTemporarios(arrayProfs); setEditandoProfId(aula.id); }} 
                  className="text-[10px] font-bold text-pink-600 uppercase tracking-wider hover:underline"
                >
                  {semProfessor ? 'Atribuir agora' : 'Alterar'}
                </button>
              )}
            </div>
            
            {editandoProfId === aula.id ? (
              <div className="mb-4 bg-pink-50/50 p-3 rounded-2xl border border-pink-100">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {listaProfessores.map(nome => {
                    const sel = profsTemporarios.includes(nome)
                    return (
                      <label key={nome} className={`flex items-center gap-2 border rounded-xl px-2 py-2.5 cursor-pointer transition-all ${sel ? 'border-pink-500 bg-white shadow-sm' : 'bg-white border-slate-200'}`}>
                        <input type="checkbox" className="sr-only" checked={sel} onChange={() => setProfsTemporarios(prev => prev.includes(nome) ? prev.filter(p => p !== nome) : [...prev, nome])} />
                        <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${sel ? 'bg-pink-600 border-pink-600' : 'border-slate-300'}`}>
                          {sel && <CheckCircle size={8} className="text-white" />}
                        </div>
                        <span className={`text-[11px] font-bold truncate ${sel ? 'text-pink-700' : 'text-slate-600'}`}>{nome.split(' ')[0]}</span>
                      </label>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditandoProfId(null)} className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancelar</button>
                  <button 
                    onClick={() => salvarEdicaoProfessores(aula.id)} 
                    disabled={salvandoProf} 
                    className="flex-1 bg-pink-600 text-white text-xs font-bold py-2.5 rounded-xl flex justify-center items-center shadow-sm disabled:opacity-60"
                  >
                    {salvandoProf ? 'Salvando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {semProfessor ? (
                  <div className="col-span-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl py-3 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-400">Nenhum professor alocado</span>
                  </div>
                ) : (
                  arrayProfs.map(prof => (
                    <div key={prof} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {prof.substring(0,2).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate">{prof.split(' ')[0]}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Valor Total:</span>
                <span className="font-bold text-slate-800">{formatarValor(Number(aula.valor_aula))}</span>
              </div>
              {aula.status_pagamento === 'Parcial' && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Falta Pagar:</span>
                  <span className="font-bold text-amber-600">{formatarValor(Number(aula.valor_aula) - Number(aula.valor_pago || 0))}</span>
                </div>
              )}
              {aula.observacoes && (
                <div className="pt-2 border-t border-slate-200 mt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Notas</span>
                  <p className="text-xs text-slate-600 italic leading-snug">{aula.observacoes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => excluirAula(aula)}
                disabled={excluindo === aula.id}
                className="flex-1 bg-red-50 border border-red-200 text-red-600 font-bold text-xs py-2.5 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
              >
                {excluindo === aula.id ? <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                {excluindo === aula.id ? 'Arquivando...' : 'Arquivar Aula'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="px-4 py-2 flex flex-col gap-6 w-full overflow-x-hidden">

        <div className="flex gap-3 -mt-2">
          <div className="flex-[1.2] bg-gradient-to-br from-pink-500 to-rose-600 rounded-[20px] p-4 flex flex-col shadow-[0_4px_20px_rgba(232,67,106,0.3)] relative overflow-hidden">
            <span className="text-[32px] font-black text-white leading-none">{aulasHoje.length}</span>
            <span className="text-[11px] font-medium text-white/80 mt-1">Aulas hoje</span>
            <div className="mt-2 text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full text-white w-fit font-bold backdrop-blur-md">
              🌊 Ativas
            </div>
            <Waves size={80} className="absolute -bottom-6 -right-4 text-white opacity-10" />
          </div>
          <div className="flex-1 flex flex-col gap-2.5">
            <div className="flex-1 bg-white rounded-[16px] p-3 shadow-sm flex flex-col justify-center border border-slate-100">
              <span className="text-[18px] font-bold text-emerald-600 leading-tight">{formatarValor(totalPago)}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Recebido Hoje</span>
            </div>
            <div className="flex-1 bg-white rounded-[16px] p-3 shadow-sm flex flex-col justify-center border border-slate-100">
              <span className="text-[18px] font-bold text-slate-800 leading-tight">{formatarValor(totalDia)}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Dia</span>
            </div>
          </div>
        </div>

        {/* TABS ATUALIZADAS (Hoje / Agendadas / Calendário) */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-[16px]">
          <button
            onClick={() => setAbaVisivel('hoje')}
            className={`flex-1 py-2.5 rounded-[12px] text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all ${
              abaVisivel === 'hoje' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Waves size={14} strokeWidth={abaVisivel === 'hoje' ? 2.5 : 2} /> Hoje
          </button>
          <button
            onClick={() => setAbaVisivel('programadas')}
            className={`flex-1 py-2.5 rounded-[12px] text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all ${
              abaVisivel === 'programadas' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <List size={14} strokeWidth={abaVisivel === 'programadas' ? 2.5 : 2} /> Agendadas
          </button>
          <button
            onClick={() => setAbaVisivel('calendario')}
            className={`flex-1 py-2.5 rounded-[12px] text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all ${
              abaVisivel === 'calendario' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Grid size={14} strokeWidth={abaVisivel === 'calendario' ? 2.5 : 2} /> Calendário
          </button>
        </div>

        <div>
          {loadingAulas ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : abaVisivel === 'calendario' ? (
            /* VISÃO DE CALENDÁRIO COM ALTURA DINÂMICA */
            <div className="bg-white rounded-[24px] shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col mb-24 animate-in fade-in duration-300">
              <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 text-[13px]">Próximos 7 Dias</h3>
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-slate-200">Arraste 👉</span>
              </div>
              <div className="overflow-x-auto pb-2">
                <div className="min-w-[700px] flex">
                  
                  {/* Coluna de Horas */}
                  <div className="w-14 flex-shrink-0 border-r border-slate-100 bg-slate-50/50">
                    <div className="h-12 border-b border-slate-100" />
                    {HORARIOS_VISIVEIS.map(hora => (
                      <div key={hora} className="h-12 border-b border-slate-100 text-[9px] font-black text-slate-400 flex items-center justify-center relative">
                        {hora.endsWith(':00') ? <span className="-mt-6">{hora}</span> : ''}
                      </div>
                    ))}
                  </div>

                  {/* Colunas dos Dias */}
                  {diasGrid.map((dia, index) => {
                    const dataStr = formatarDataISO(dia)
                    return (
                      <div key={dataStr} className={`flex-1 border-r border-slate-100 relative ${index === 0 ? 'bg-pink-50/30' : ''}`}>
                        <div className={`h-12 border-b border-slate-100 flex flex-col items-center justify-center ${index === 0 ? 'bg-pink-50' : 'bg-white'}`}>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${index === 0 ? 'text-pink-500' : 'text-slate-400'}`}>
                            {index === 0 ? 'Hoje' : nomesDias[dia.getDay()]}
                          </span>
                          <span className={`text-sm font-black ${index === 0 ? 'text-pink-600' : 'text-slate-800'}`}>
                            {dia.getDate().toString().padStart(2, '0')}
                          </span>
                        </div>
                        
                        {HORARIOS_VISIVEIS.map(hora => {
                          const aulasNesteHorario = todasAulas.filter(a => a.data_aula === dataStr && a.horario === hora)
                          
                          return (
                            <div key={hora} className="h-12 border-b border-slate-100/50 p-0.5 flex gap-0.5 relative">
                              {aulasNesteHorario.map(aulaAqui => {
                                const corBg = aulaAqui.status_pagamento === 'Pago' ? 'bg-emerald-100 border-emerald-200 text-emerald-700' :
                                              aulaAqui.status_pagamento === 'Parcial' ? 'bg-amber-100 border-amber-200 text-amber-700' :
                                              'bg-pink-100 border-pink-200 text-pink-700';
                                
                                const arrayProfs = Array.isArray(aulaAqui.nome_professor) ? aulaAqui.nome_professor : aulaAqui.nome_professor ? [aulaAqui.nome_professor] : [];
                                const semProf = arrayProfs.length === 0;

                                return (
                                  <div 
                                    key={aulaAqui.id} 
                                    onClick={() => { 
                                      setAulaDetalheGrade(aulaAqui); 
                                      setCardExpandido(aulaAqui.id); 
                                    }}
                                    className={`flex-1 rounded-[6px] p-1 cursor-pointer border flex flex-col justify-center gap-[1px] shadow-sm overflow-hidden ${corBg} ${semProf ? 'ring-2 ring-red-400 ring-inset' : ''}`}
                                  >
                                    <span className="text-[8px] font-black truncate leading-none">{aulaAqui.nome_cliente}</span>
                                    <span className="text-[7px] font-bold uppercase opacity-70 truncate leading-none">
                                      {semProf ? 'SEM PROF' : arrayProfs[0].split(' ')[0]}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : abaVisivel === 'hoje' ? (
            aulasHoje.length === 0 ? (
              <div className="bg-white rounded-[24px] p-8 shadow-sm text-center border border-slate-100">
                <span className="text-4xl mb-3 block">🏄‍♂️</span>
                <p className="text-slate-500 font-medium text-sm">O mar está calmo.</p>
                <p className="text-slate-400 text-xs mt-1">Nenhuma aula registrada para hoje.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 pb-24">
                {aulasHoje.map(renderCard)}
              </div>
            )
          ) : (
            aulasProgramadas.length === 0 ? (
              <div className="bg-white rounded-[24px] p-8 shadow-sm text-center border border-slate-100">
                <span className="text-4xl mb-3 block">📅</span>
                <p className="text-slate-500 font-medium text-sm">Agenda limpa.</p>
                <p className="text-slate-400 text-xs mt-1">Nenhuma aula agendada para os próximos dias.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 pb-24">
                {Object.entries(aulasAgrupadas).map(([dataStr, aulasDoDia]) => (
                  <div key={dataStr}>
                    <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3 ml-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      {formatarDataHeader(dataStr)}
                    </h3>
                    <div className="flex flex-col gap-4">
                      {aulasDoDia.map(renderCard)}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <button
        onClick={() => setModalAberto(true)}
        className="fixed bottom-[88px] right-5 w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-[0_4px_20px_rgba(232,67,106,0.45)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Modal para adicionar nova aula */}
      {modalAberto && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setModalAberto(false)} />
          
          <div 
            className="relative bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 pb-40 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-full duration-300"
            style={{ transform: `translateY(${dragOffset}px)` }}
          >
            
            <div 
              className="w-full pb-6 pt-2 -mt-4 flex justify-center cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800">Nova Aula</h3>
                <p className="text-sm text-slate-500 mt-0.5">Preencha os dados do aluno</p>
              </div>
              <button onClick={() => setModalAberto(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar size={14}/> Data da Aula
                  </label>
                  <input 
                    type="date" 
                    {...register('data_aula', { required: true })} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-base focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all" 
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock size={14}/> Horário
                  </label>
                  <select 
                    {...register('horario', { required: true })} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-base font-bold text-slate-700 outline-none focus:border-pink-500 appearance-none"
                  >
                    <option value="">Selecione...</option>
                    {OPCOES_HORARIOS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Modalidade</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['Aula Particular', 'Aula Grupo'] as const).map(op => (
                    <label key={op} className="relative cursor-pointer">
                      <input type="radio" value={op} {...register('modalidade')} className="peer sr-only" />
                      <div className="bg-slate-50 border border-slate-200 peer-checked:border-pink-500 peer-checked:bg-pink-50 rounded-xl py-4 text-center font-bold text-sm text-slate-500 peer-checked:text-pink-700 transition-all">
                        {op.replace('Aula ', '')}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><User size={13}/> Aluno Principal</label>
                <input 
                  type="text" 
                  autoComplete="off"
                  placeholder="Nome do cliente/grupo" 
                  {...register('nome_cliente', { required: true })}
                  onFocus={() => setMostrarSugestoes(true)}
                  onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-base focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 relative z-20" 
                />
                
                {mostrarSugestoes && sugestoesAlunos.length > 0 && nomeClienteAtual.length > 0 && (
                  <ul className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] max-h-48 overflow-y-auto top-[76px] divide-y divide-slate-50">
                    {sugestoesAlunos.map(aluno => (
                      <li
                        key={aluno.id}
                        onClick={() => {
                          setValue('nome_cliente', aluno.nome, { shouldValidate: true })
                          setMostrarSugestoes(false)
                        }}
                        className="px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-pink-50 hover:text-pink-700 cursor-pointer transition-colors"
                      >
                        {aluno.nome}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><GraduationCap size={13}/> Professores</label>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Opcional</span>
                </div>
                {listaProfessores.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhum professor ativo encontrado.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {listaProfessores.map(nome => {
                      const sel = professores.includes(nome)
                      return (
                        <label key={nome} className={`flex items-center gap-2 border rounded-xl px-3 py-3 cursor-pointer transition-all ${sel ? 'border-pink-500 bg-pink-50 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                          <input type="checkbox" className="sr-only" checked={sel} onChange={() => toggleProfessor(nome)} />
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${sel ? 'bg-pink-600 border-pink-600' : 'border-slate-300'}`}>
                            {sel && <CheckCircle size={10} className="text-white" />}
                          </div>
                          <span className={`text-sm font-bold truncate ${sel ? 'text-pink-700' : 'text-slate-600'}`}>{nome.split(' ')[0]}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              {pacotes.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Package size={13}/> Pacote (opcional)</label>
                  <select value={pacoteSelecionado} onChange={e => handlePacoteChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-base focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500">
                    <option value="">Nenhum pacote vinculado</option>
                    {pacotes.map(p => (
                      <option key={p.id} value={p.id}>{p.nome_cliente} ({p.aulas_restantes} restantes)</option>
                    ))}
                  </select>
                </div>
              )}

              {!temPacote && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><DollarSign size={13}/> Valor Total</label>
                      <input type="number" step="0.01" min="0" placeholder="0,00" {...register('valor_aula', { required: !temPacote, valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-base focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Pagamento</label>
                      <select {...register('status_pagamento')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-base focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500">
                        <option value="Pendente">Pendente</option>
                        <option value="Parcial">Parcial</option>
                        <option value="Pago">Pago Total</option>
                      </select>
                    </div>
                  </div>
                  
                  {statusPagamento === 'Parcial' && (
                    <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 mt-2">
                      <label className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-1.5 block">Valor de Sinal (Pago)</label>
                      <input type="number" step="0.01" min="0" placeholder="Ex: 50,00" {...register('valor_pago', { required: statusPagamento === 'Parcial', valueAsNumber: true })} className="w-full bg-white border border-sky-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                    </div>
                  )}
                  
                  <div className="mt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Meio de Pagamento</label>
                    <select {...register('forma_pagamento')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-base focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500">
                      <option value="">Não informado</option>
                      {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Observações</label>
                <textarea rows={2} placeholder="Ex: Prancha Longboard..." {...register('observacoes')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 resize-none" />
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-gradient-to-br from-pink-500 to-rose-600 text-white font-bold py-5 rounded-xl text-lg mt-4 shadow-[0_4px_14px_rgba(232,67,106,0.4)] active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {salvando ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={20} />}
                {salvando ? 'Adicionando...' : 'Adicionar Aula'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Janela Flutuante para visualizar/editar aula direto da Grade do Calendário */}
      {aulaDetalheGrade && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={() => setAulaDetalheGrade(null)} />
          <div className="relative w-full max-w-md pb-8 px-4 animate-in slide-in-from-bottom-4 duration-300">
             <div className="flex justify-end mb-3">
               <button 
                  onClick={() => setAulaDetalheGrade(null)} 
                  className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <X size={20} />
                </button>
             </div>
             {renderCard(aulaDetalheGrade)}
          </div>
        </div>
      )}
    </>
  )
}
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { RegistroAula, NovaAula, Pacote } from '@/types'
import { hojeEmBrasilia, formatarValor } from '@/lib/dateUtils'
import {
  Plus, Clock, User, DollarSign,
  ChevronDown, ChevronUp, CheckCircle, 
  Package, Trash2, Calendar, X, GraduationCap, Waves, CalendarDays, AlertCircle
} from 'lucide-react'

const FORMAS_PAGAMENTO = ['Pix', 'Cartão de Crédito', 'Dinheiro', 'Outro']

// GERA OS HORÁRIOS DE 30 EM 30 MINUTOS (06h até 19h)
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

export default function AulasTab() {
  const [abaVisivel, setAbaVisivel] = useState<'hoje' | 'programadas'>('hoje')
  const [aulasHoje, setAulasHoje] = useState<AulaComPagamento[]>([])
  const [aulasProgramadas, setAulasProgramadas] = useState<AulaComPagamento[]>([])
  const [loadingAulas, setLoadingAulas] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [cardExpandido, setCardExpandido] = useState<string | null>(null)
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
    const { data: profs } = await supabase.from('professores').select('nome').eq('ativo', true).order('nome', { ascending: true })
    if (profs) setListaProfessores(profs.map(p => p.nome))
    const { data: alunos } = await supabase.from('alunos').select('id, nome').eq('excluido', false).order('nome', { ascending: true })
    if (alunos) setAlunosCadastrados(alunos)
  }, [])

  const carregarAulas = useCallback(async () => {
    setLoadingAulas(true)
    const hoje = hojeEmBrasilia()
    const { data: dataHoje } = await supabase.from('registro_aulas').select('*').eq('data_aula', hoje).eq('excluido', false).order('horario', { ascending: true })
    const { data: dataFuturas } = await supabase.from('registro_aulas').select('*').gt('data_aula', hoje).eq('excluido', false).order('data_aula', { ascending: true }).order('horario', { ascending: true })
    setAulasHoje(dataHoje ?? [])
    setAulasProgramadas(dataFuturas ?? [])
    setLoadingAulas(false)
  }, [])

  const carregarPacotes = useCallback(async () => {
    const { data } = await supabase.from('pacotes').select('*').eq('status', 'Ativo').eq('excluido', false).gt('aulas_restantes', 0).order('nome_cliente', { ascending: true })
    setPacotes(data ?? [])
  }, [])

  useEffect(() => { carregarAulas(); carregarPacotes(); carregarDadosBase(); }, [carregarAulas, carregarPacotes, carregarDadosBase])

  async function excluirAula(aula: AulaComPagamento) {
    if (!window.confirm(`Arquivar a aula de "${aula.nome_cliente}"?`)) return
    setExcluindo(aula.id)
    if (aula.pacote_id) {
      const { data: pacoteAtual } = await supabase.from('pacotes').select('aulas_restantes').eq('id', aula.pacote_id).single()
      if (pacoteAtual) {
        await supabase.from('pacotes').update({ aulas_restantes: pacoteAtual.aulas_restantes + 1, status: 'Ativo' }).eq('id', aula.pacote_id)
      }
    }
    const { error } = await supabase.from('registro_aulas').update({ excluido: true }).eq('id', aula.id)
    setExcluindo(null)
    if (!error) {
      setAulasHoje(prev => prev.filter(a => a.id !== aula.id))
      setAulasProgramadas(prev => prev.filter(a => a.id !== aula.id))
      carregarPacotes() 
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

    const payload = { ...dados, nome_cliente: nomeDigitado, nome_professor: professores, pacote_id: pacoteSelecionado || null, valor_pago: valorFinalPago }
    const { error } = await supabase.from('registro_aulas').insert([payload])

    if (!error && pacoteSelecionado) {
      const pacote = pacotes.find(p => p.id === pacoteSelecionado)
      if (pacote && pacote.aulas_restantes > 0) {
        const novasRestantes = pacote.aulas_restantes - 1
        await supabase.from('pacotes').update({ aulas_restantes: novasRestantes, status: novasRestantes === 0 ? 'Finalizado' : 'Ativo' }).eq('id', pacoteSelecionado)
        carregarPacotes()
      }
    }

    setSalvando(false)
    if (!error) {
      reset({ data_aula: hojeEmBrasilia(), horario: '', nome_cliente: '', valor_aula: undefined, valor_pago: undefined, modalidade: 'Aula Particular', status_pagamento: 'Pendente', forma_pagamento: undefined, observacoes: '' })
      setProfessores([]); setPacoteSelecionado(''); carregarAulas()
      setModalAberto(false) 
    }
  }

  async function salvarEdicaoProfessores(id: string) {
    setSalvandoProf(true)
    const { error } = await supabase.from('registro_aulas').update({ nome_professor: profsTemporarios }).eq('id', id)
    setSalvandoProf(false)
    if (!error) { setEditandoProfId(null); carregarAulas(); }
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

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; setIsDragging(true); }
  const handleTouchMove = (e: React.TouchEvent) => { if (!isDragging) return; const diff = e.touches[0].clientY - touchStartY.current; if (diff > 0) setDragOffset(diff); }
  const handleTouchEnd = () => { setIsDragging(false); if (dragOffset > 100) setModalAberto(false); setDragOffset(0); }

  const renderCard = (aula: AulaComPagamento) => {
    const expandido = cardExpandido === aula.id
    const arrayProfs = Array.isArray(aula.nome_professor) ? aula.nome_professor : aula.nome_professor ? [aula.nome_professor] : []
    const semProfessor = arrayProfs.length === 0
    const urgenciaProf = semProfessor && aula.data_aula <= hojeEmBrasilia()

    return (
      <div key={aula.id} className={`bg-white rounded-[24px] p-5 shadow-sm border transition-all ${urgenciaProf ? 'border-red-200' : 'border-slate-100'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Clock size={12} /> {aula.horario}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${aula.modalidade === 'Aula Particular' ? 'bg-pink-100 text-pink-700' : 'bg-violet-100 text-violet-700'}`}>{aula.modalidade.replace('Aula ', '')}</span>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${aula.status_pagamento === 'Pago' ? 'bg-emerald-100 text-emerald-700' : aula.status_pagamento === 'Parcial' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{aula.status_pagamento === 'Pago' ? '✓ Pago' : aula.status_pagamento === 'Parcial' ? 'Parcial' : 'Pendente'}</span>
        </div>
        <button onClick={() => setCardExpandido(expandido ? null : aula.id)} className="w-full flex items-center justify-between text-left group">
          <h3 className="text-lg font-black text-slate-800 tracking-tight group-hover:text-pink-600 transition-colors">{aula.nome_cliente}</h3>
          {expandido ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>
        {expandido && (
          <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in zoom-in duration-200">
             <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Professores</span>
              <button onClick={() => { setProfsTemporarios(arrayProfs); setEditandoProfId(aula.id); }} className="text-[10px] font-bold text-pink-600 uppercase tracking-wider hover:underline">Alterar</button>
            </div>
            {editandoProfId === aula.id ? (
              <div className="mb-4 bg-pink-50 p-3 rounded-2xl border border-pink-100">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {listaProfessores.map(nome => {
                    const sel = profsTemporarios.includes(nome)
                    return (
                      <label key={nome} className={`flex items-center gap-2 border rounded-xl px-2 py-2.5 cursor-pointer bg-white ${sel ? 'border-pink-500' : 'border-slate-200'}`}>
                        <input type="checkbox" className="sr-only" checked={sel} onChange={() => setProfsTemporarios(prev => prev.includes(nome) ? prev.filter(p => p !== nome) : [...prev, nome])} />
                        <span className={`text-[11px] font-bold truncate ${sel ? 'text-pink-700' : 'text-slate-600'}`}>{nome.split(' ')[0]}</span>
                      </label>
                    )
                  })}
                </div>
                <button onClick={() => salvarEdicaoProfessores(aula.id)} className="w-full bg-pink-600 text-white text-xs font-bold py-2.5 rounded-xl">Confirmar</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {semProfessor ? <span className="text-xs text-slate-400 italic">A definir</span> : arrayProfs.map(prof => <div key={prof} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700">{prof.split(' ')[0]}</div>)}
              </div>
            )}
            <button onClick={() => excluirAula(aula)} className="w-full bg-red-50 text-red-600 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2"><Trash2 size={14} /> Arquivar Aula</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="px-4 py-2 flex flex-col gap-6 w-full">
        <div className="flex gap-3 -mt-2">
          <div className="flex-[1.2] bg-gradient-to-br from-pink-500 to-rose-600 rounded-[20px] p-4 flex flex-col shadow-xl relative overflow-hidden text-white">
            <span className="text-[32px] font-black leading-none">{aulasHoje.length}</span>
            <span className="text-[11px] font-medium opacity-80 mt-1">Aulas hoje</span>
            <Waves size={80} className="absolute -bottom-6 -right-4 opacity-10" />
          </div>
          <div className="flex-1 flex flex-col gap-2.5">
            <div className="flex-1 bg-white rounded-[16px] p-3 shadow-sm border border-slate-100">
              <span className="text-[18px] font-bold text-emerald-600 leading-tight block">{formatarValor(totalPago)}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Recebido</span>
            </div>
            <div className="flex-1 bg-white rounded-[16px] p-3 shadow-sm border border-slate-100">
              <span className="text-[18px] font-bold text-slate-800 leading-tight block">{formatarValor(totalDia)}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Dia</span>
            </div>
          </div>
        </div>

        <div className="flex bg-slate-200/50 p-1.5 rounded-[16px]">
          <button onClick={() => setAbaVisivel('hoje')} className={`flex-1 py-2.5 rounded-[12px] text-sm font-bold flex items-center justify-center gap-2 ${abaVisivel === 'hoje' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}><Waves size={16} /> Hoje</button>
          <button onClick={() => setAbaVisivel('programadas')} className={`flex-1 py-2.5 rounded-[12px] text-sm font-bold flex items-center justify-center gap-2 ${abaVisivel === 'programadas' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}><CalendarDays size={16} /> Programadas</button>
        </div>

        <div className="flex flex-col gap-4 pb-24">
          {loadingAulas ? <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div> : abaVisivel === 'hoje' ? (aulasHoje.length === 0 ? <div className="bg-white rounded-[24px] p-8 text-center border border-slate-100 text-slate-400 text-sm font-medium">Nenhuma aula hoje.</div> : aulasHoje.map(renderCard)) : (aulasProgramadas.length === 0 ? <div className="bg-white rounded-[24px] p-8 text-center border border-slate-100 text-slate-400 text-sm font-medium">Sem aulas futuras.</div> : Object.entries(aulasAgrupadas).map(([data, aulas]) => (
            <div key={data} className="flex flex-col gap-3">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">{formatarDataHeader(data)}</h3>
              {aulas.map(renderCard)}
            </div>
          )))}
        </div>
      </div>

      <button onClick={() => setModalAberto(true)} className="fixed bottom-[88px] right-5 w-14 h-14 rounded-full bg-slate-900 text-white shadow-2xl flex items-center justify-center z-40 active:scale-95 transition-all"><Plus size={28} /></button>

      {modalAberto && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setModalAberto(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 pb-40 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-full duration-300" style={{ transform: `translateY(${dragOffset}px)` }}>
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} />
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Nova Aula</h3>
              <button onClick={() => setModalAberto(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Data</label>
                  <input type="date" {...register('data_aula', { required: true })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold text-slate-700 outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Horário</label>
                  {/* NOVO: SELECT DE HORÁRIOS DE 30 EM 30 MINUTOS */}
                  <select 
                    {...register('horario', { required: true })} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold text-slate-700 outline-none focus:border-pink-500 appearance-none"
                  >
                    <option value="">Selecione...</option>
                    {OPCOES_HORARIOS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Aluno</label>
                <input type="text" placeholder="Nome do cliente" {...register('nome_cliente', { required: true })} onFocus={() => setMostrarSugestoes(true)} onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold text-slate-700 outline-none focus:border-pink-500" />
                {mostrarSugestoes && sugestoesAlunos.length > 0 && (
                  <ul className="bg-white border rounded-xl mt-1 shadow-lg max-h-40 overflow-y-auto">
                    {sugestoesAlunos.map(a => <li key={a.id} onClick={() => setValue('nome_cliente', a.nome)} className="px-4 py-3 hover:bg-pink-50 font-bold text-sm text-slate-700">{a.nome}</li>)}
                  </ul>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Professores</label>
                <div className="grid grid-cols-2 gap-2">
                  {listaProfessores.map(nome => {
                    const sel = professores.includes(nome)
                    return <label key={nome} className={`border rounded-xl px-3 py-3 cursor-pointer text-center text-xs font-bold ${sel ? 'border-pink-500 bg-pink-50 text-pink-700' : 'bg-slate-50 text-slate-500'}`}><input type="checkbox" className="sr-only" checked={sel} onChange={() => setProfessores(prev => prev.includes(nome) ? prev.filter(p => p !== nome) : [...prev, nome])} />{nome.split(' ')[0]}</label>
                  })}
                </div>
              </div>

              {!temPacote && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Valor</label>
                    <input type="number" step="0.01" {...register('valor_aula', { required: !temPacote })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold text-slate-700 outline-none focus:border-pink-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Pagamento</label>
                    <select {...register('status_pagamento')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold text-slate-700 outline-none focus:border-pink-500">
                      <option value="Pendente">Pendente</option>
                      <option value="Parcial">Parcial</option>
                      <option value="Pago">Pago</option>
                    </select>
                  </div>
                </div>
              )}

              <button type="submit" disabled={salvando} className="w-full bg-pink-600 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all mt-4">{salvando ? 'Salvando...' : 'Confirmar Aula'}</button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
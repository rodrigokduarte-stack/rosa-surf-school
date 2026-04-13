'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { RegistroAula, NovaAula, Pacote } from '@/types'
import { hojeEmBrasilia, formatarValor } from '@/lib/dateUtils'
import {
  PlusCircle, Clock, User, DollarSign,
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, Package, Trash2,
} from 'lucide-react'

const FORMAS_PAGAMENTO = ['Pix', 'Cartão de Crédito', 'Dinheiro', 'Outro']

// Adicionamos valor_pago no FormData para o TypeScript não reclamar
type FormData = Omit<NovaAula, 'nome_professor' | 'pacote_id'> & { valor_pago?: number }

// Adicionamos valor_pago na tipagem local da Aula
type AulaComPagamento = RegistroAula & { valor_pago?: number }

export default function AulasTab() {
  const [aulas, setAulas] = useState<AulaComPagamento[]>([])
  const [loadingAulas, setLoadingAulas] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [formAberto, setFormAberto] = useState(true)
  
  // Estado para guardar a lista oficial de professores vinda do banco
  const [listaProfessores, setListaProfessores] = useState<string[]>([])
  // Estado para guardar quais professores foram selecionados no formulário
  const [professores, setProfessores] = useState<string[]>([])
  const [professorError, setProfessorError] = useState(false)
  
  const [pacotes, setPacotes] = useState<Pacote[]>([])
  const [pacoteSelecionado, setPacoteSelecionado] = useState<string>('')
  const [excluindo, setExcluindo] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      data_aula: hojeEmBrasilia(),
      status_pagamento: 'Pendente',
      modalidade: 'Aula Particular',
    },
  })

  const statusPagamento = watch('status_pagamento')

  // Nova função: Busca os professores cadastrados no Supabase
  const carregarListaProfessores = useCallback(async () => {
    const { data } = await supabase
      .from('professores')
      .select('nome')
      .order('nome', { ascending: true })
    if (data) {
      setListaProfessores(data.map(p => p.nome))
    }
  }, [])

  const carregarAulas = useCallback(async () => {
    setLoadingAulas(true)
    const { data } = await supabase
      .from('registro_aulas')
      .select('*')
      .eq('data_aula', hojeEmBrasilia())
      .order('horario', { ascending: true })
    setAulas(data ?? [])
    setLoadingAulas(false)
  }, [])

  const carregarPacotes = useCallback(async () => {
    const { data } = await supabase
      .from('pacotes')
      .select('*')
      .eq('status', 'Ativo')
      .gt('aulas_restantes', 0)
      .order('nome_cliente', { ascending: true })
    setPacotes(data ?? [])
  }, [])

  useEffect(() => { 
    carregarAulas() 
    carregarPacotes()
    carregarListaProfessores()
  }, [carregarAulas, carregarPacotes, carregarListaProfessores])

  async function excluirAula(id: string, nomeCliente: string) {
    if (!window.confirm(`Excluir a aula de "${nomeCliente}"?`)) return
    setExcluindo(id)
    const { error } = await supabase.from('registro_aulas').delete().eq('id', id)
    setExcluindo(null)
    if (!error) setAulas(prev => prev.filter(a => a.id !== id))
  }

  function toggleProfessor(nome: string) {
    setProfessores(prev =>
      prev.includes(nome) ? prev.filter(p => p !== nome) : [...prev, nome]
    )
    setProfessorError(false)
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
    if (professores.length === 0) {
      setProfessorError(true)
      return
    }
    setProfessorError(false)
    setSalvando(true)

    let valorFinalPago = 0
    if (dados.status_pagamento === 'Pago') {
      valorFinalPago = Number(dados.valor_aula)
    } else if (dados.status_pagamento === 'Parcial') {
      valorFinalPago = Number(dados.valor_pago) || 0
    }

    const payload = {
      ...dados,
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
      setSucesso(true)
      reset({
        data_aula: hojeEmBrasilia(),
        horario: '',
        nome_cliente: '',
        valor_aula: undefined,
        valor_pago: undefined,
        modalidade: 'Aula Particular',
        status_pagamento: 'Pendente',
        forma_pagamento: undefined,
        observacoes: '',
      })
      setProfessores([])
      setPacoteSelecionado('')
      carregarAulas()
      setTimeout(() => setSucesso(false), 3000)
    }
  }

  const totalDia = aulas.reduce((sum, a) => sum + Number(a.valor_aula), 0)
  
  const totalPago = aulas.reduce((sum, a) => {
    if (a.status_pagamento === 'Pago') return sum + Number(a.valor_aula)
    if (a.status_pagamento === 'Parcial') return sum + Number(a.valor_pago || 0)
    return sum
  }, 0)

  const temPacote = !!pacoteSelecionado

  return (
    <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">

      {aulas.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-pink-600">{aulas.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Aulas hoje</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <p className="text-lg font-bold text-emerald-600">{formatarValor(totalPago)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Recebido</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <p className="text-lg font-bold text-slate-700">{formatarValor(totalDia)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setFormAberto(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-2 text-pink-600 font-semibold">
            <PlusCircle size={20} />
            <span>Registrar nova aula</span>
          </div>
          {formAberto
            ? <ChevronUp size={18} className="text-slate-400" />
            : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {formAberto && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="px-5 pb-5 flex flex-col gap-4 border-t border-slate-100 pt-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                <input
                  type="date"
                  {...register('data_aula', { required: true })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
                <input
                  type="time"
                  {...register('horario', { required: true })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                {errors.horario && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Modalidade</label>
              <div className="grid grid-cols-2 gap-3">
                {(['Aula Particular', 'Aula Grupo'] as const).map(op => (
                  <label key={op} className="relative cursor-pointer">
                    <input type="radio" value={op} {...register('modalidade')} className="peer sr-only" />
                    <div className="border-2 border-slate-200 peer-checked:border-pink-500 peer-checked:bg-pink-50 rounded-xl py-3 text-center font-medium text-sm text-slate-600 peer-checked:text-pink-700 transition-all">
                      {op}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1"><User size={14} /> Nome do Cliente</span>
              </label>
              <input
                type="text"
                placeholder="Ex: João Silva"
                {...register('nome_cliente', { required: true })}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              {errors.nome_cliente && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <span className="flex items-center gap-1"><User size={14} /> Professor(es)</span>
              </label>
              
              {listaProfessores.length === 0 ? (
                 <p className="text-xs text-slate-400 italic">Nenhum professor cadastrado ainda.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {listaProfessores.map(nome => {
                    const sel = professores.includes(nome)
                    return (
                      <label
                        key={nome}
                        className={`flex items-center gap-2.5 border-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
                          sel
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={sel}
                          onChange={() => toggleProfessor(nome)}
                        />
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          sel ? 'bg-pink-600 border-pink-600' : 'border-slate-300'
                        }`}>
                          {sel && <CheckCircle size={10} className="text-white" />}
                        </div>
                        <span className={`text-sm font-medium leading-tight ${
                          sel ? 'text-pink-700' : 'text-slate-600'
                        }`}>
                          {nome}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
              {professorError && (
                <p className="text-red-500 text-xs mt-1.5">Selecione ao menos um professor</p>
              )}
            </div>

            {pacotes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <span className="flex items-center gap-1"><Package size={14} /> Pacote (opcional)</span>
                </label>
                <select
                  value={pacoteSelecionado}
                  onChange={e => handlePacoteChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                >
                  <option value="">Sem pacote (aula avulsa)</option>
                  {pacotes.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome_cliente} — {p.aulas_restantes} aula{p.aulas_restantes !== 1 ? 's' : ''} restante{p.aulas_restantes !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                {temPacote && (
                  <p className="text-xs text-pink-600 mt-1.5 font-medium">
                    Aula do pacote: valor será R$ 0,00 e status Pago automaticamente
                  </p>
                )}
              </div>
            )}

            {!temPacote && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <span className="flex items-center gap-1"><DollarSign size={14} /> Valor Total (R$)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...register('valor_aula', { required: !temPacote, valueAsNumber: true })}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    {errors.valor_aula && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status Pagamento</label>
                    <select
                      {...register('status_pagamento')}
                      className="w-full border border-slate-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Parcial">Parcial</option>
                      <option value="Pago">Pago Total</option>
                    </select>
                  </div>
                </div>
                
                {statusPagamento === 'Parcial' && (
                  <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 mt-1">
                    <label className="block text-sm font-medium text-sky-900 mb-1">
                      Quanto o cliente pagou de sinal? (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 50,00"
                      {...register('valor_pago', { required: statusPagamento === 'Parcial', valueAsNumber: true })}
                      className="w-full border border-sky-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    {errors.valor_pago && <p className="text-red-500 text-xs mt-1">Informe o valor parcial pago</p>}
                  </div>
                )}
              </>
            )}

            {!temPacote && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pagamento</label>
                <select
                  {...register('forma_pagamento')}
                  className="w-full border border-slate-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                >
                  <option value="">Não informado</option>
                  {FORMAS_PAGAMENTO.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Observações (opcional)</label>
              <textarea
                rows={2}
                placeholder="Ex: Cliente iniciante, prancha emprestada..."
                {...register('observacoes')}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              />
            </div>

            {sucesso && (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <CheckCircle size={18} />
                <span className="text-sm font-medium">Aula registrada com sucesso!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={salvando}
              className="w-full bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white font-semibold py-4 rounded-xl text-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <PlusCircle size={20} />
              {salvando ? 'Salvando...' : 'Registrar Aula'}
            </button>
          </form>
        )}
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3 px-1 flex items-center gap-2">
          <Clock size={16} className="text-pink-500" />
          Aulas de hoje
        </h2>

        {loadingAulas ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : aulas.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center text-slate-400">
            <p className="text-sm">Nenhuma aula registrada hoje</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {aulas.map(aula => (
              <div key={aula.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 truncate">{aula.nome_cliente}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        aula.modalidade === 'Aula Particular'
                          ? 'bg-pink-100 text-pink-700'
                          : 'bg-violet-100 text-violet-700'
                      }`}>
                        {aula.modalidade}
                      </span>
                      {aula.pacote_id && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-0.5">
                          <Package size={10} /> Pacote
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock size={13} />{aula.horario}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={13} />
                        {Array.isArray(aula.nome_professor)
                          ? aula.nome_professor.join(', ')
                          : aula.nome_professor}
                      </span>
                    </div>
                    {aula.observacoes && (
                      <p className="text-xs text-slate-400 mt-1 italic">{aula.observacoes}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="font-bold text-slate-800">{formatarValor(Number(aula.valor_aula))}</span>
                    
                    {aula.status_pagamento === 'Parcial' && (
                      <span className="text-xs text-sky-600 font-medium -mt-1.5">
                        Falta: {formatarValor(Number(aula.valor_aula) - Number(aula.valor_pago || 0))}
                      </span>
                    )}

                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      aula.status_pagamento === 'Pago'
                        ? 'bg-emerald-100 text-emerald-700'
                        : aula.status_pagamento === 'Parcial'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {aula.status_pagamento === 'Pago' && <><CheckCircle size={11} /> Pago</>}
                      {aula.status_pagamento === 'Parcial' && <><AlertCircle size={11} /> Parcial</>}
                      {aula.status_pagamento === 'Pendente' && <><AlertCircle size={11} /> Pendente</>}
                    </span>
                    {aula.forma_pagamento && (
                      <span className="text-xs text-slate-400">{aula.forma_pagamento}</span>
                    )}
                    <button
                      onClick={() => excluirAula(aula.id, aula.nome_cliente)}
                      disabled={excluindo === aula.id}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Excluir aula"
                    >
                      {excluindo === aula.id
                        ? <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                        : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-4" />
    </div>
  )
}
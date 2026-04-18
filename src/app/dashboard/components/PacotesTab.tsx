'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { Pacote } from '@/types'
import { formatarValor } from '@/lib/dateUtils'
import {
  Plus, Package, User, DollarSign, CheckCircle, X, Layers, CreditCard
} from 'lucide-react'

// Criamos uma interface local para aceitar o novo campo
interface NovoPacoteForm {
  nome_cliente: string
  total_aulas: number
  valor_total: number
  valor_pago?: number
  forma_pagamento?: string
}

const FORMAS_PAGAMENTO = ['Pix', 'Cartão de Crédito', 'Dinheiro', 'Outro']

export default function PacotesTab() {
  const [pacotes, setPacotes] = useState<Pacote[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [finalizando, setFinalizando] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NovoPacoteForm>({
    defaultValues: { total_aulas: 0, valor_total: 0, valor_pago: 0 },
  })

  const carregarPacotes = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('pacotes')
      .select('*')
      .order('created_at', { ascending: false })
    setPacotes(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { carregarPacotes() }, [carregarPacotes])

  async function onSubmit(dados: NovoPacoteForm) {
    setSalvando(true)
    const payload = {
      nome_cliente: dados.nome_cliente,
      total_aulas: dados.total_aulas,
      aulas_restantes: dados.total_aulas,
      valor_total: dados.valor_total,
      valor_pago: dados.valor_pago ?? 0,
      forma_pagamento: dados.forma_pagamento || null,
      status: 'Ativo' as const,
    }
    const { error } = await supabase.from('pacotes').insert([payload])
    setSalvando(false)
    if (!error) {
      reset({ total_aulas: 0, valor_total: 0, valor_pago: 0 })
      carregarPacotes()
      setModalAberto(false) 
    } else {
      alert("Erro ao salvar. Verificou se a coluna 'forma_pagamento' foi criada no Supabase?")
    }
  }

  async function finalizarPacote(id: string) {
    if (!window.confirm('Deseja realmente finalizar este pacote?')) return
    setFinalizando(id)
    await supabase.from('pacotes').update({ status: 'Finalizado' }).eq('id', id)
    setFinalizando(null)
    carregarPacotes()
  }

  const ativos = pacotes.filter(p => p.status === 'Ativo')
  const finalizados = pacotes.filter(p => p.status === 'Finalizado')

  return (
    <div className="px-4 py-2 flex flex-col gap-6 w-full overflow-x-hidden">

      <div className="flex gap-3 -mt-2">
        <div className="flex-[1.2] bg-gradient-to-br from-pink-500 to-rose-600 rounded-[20px] p-4 flex flex-col shadow-[0_4px_20px_rgba(232,67,106,0.3)] relative overflow-hidden">
          <span className="text-[32px] font-black text-white leading-none">{ativos.length}</span>
          <span className="text-[11px] font-medium text-white/80 mt-1">Pacotes ativos</span>
          <Package size={80} className="absolute -bottom-6 -right-4 text-white opacity-10" />
        </div>
        <div className="flex-1 bg-white rounded-[16px] p-4 shadow-sm flex flex-col justify-center border border-slate-100">
          <span className="text-[28px] font-black text-slate-800 leading-none">
            {ativos.reduce((s, p) => s + p.aulas_restantes, 0)}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Aulas Restantes</span>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-black text-white drop-shadow-md flex items-center gap-2 mb-4 tracking-tight">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.6)]" />
          Pacotes em Andamento
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ativos.length === 0 ? (
          <div className="bg-white rounded-[24px] p-8 shadow-sm text-center border border-slate-100">
            <span className="text-4xl mb-3 block">🏄‍♀️</span>
            <p className="text-slate-500 font-medium text-sm">Nenhum pacote ativo.</p>
            <p className="text-slate-400 text-xs mt-1">Venda novos planos para preencher aqui!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ativos.map(pacote => {
              const progresso = pacote.total_aulas > 0 ? ((pacote.total_aulas - pacote.aulas_restantes) / pacote.total_aulas) * 100 : 0
              const saldo = pacote.valor_total - pacote.valor_pago

              return (
                <div key={pacote.id} className="bg-white rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-slate-100 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight">{pacote.nome_cliente}</h3>
                      <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                        {pacote.total_aulas - pacote.aulas_restantes} de {pacote.total_aulas} aulas realizadas
                      </p>
                    </div>
                    <button
                      onClick={() => finalizarPacote(pacote.id)}
                      disabled={finalizando === pacote.id}
                      className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
                    >
                      {finalizando === pacote.id ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <X size={16} strokeWidth={3} />}
                    </button>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4 overflow-hidden">
                    <div className="bg-pink-500 h-full rounded-full transition-all duration-500" style={{ width: `${progresso}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Aulas</span>
                      <span className="font-black text-pink-600 text-base">{pacote.aulas_restantes}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Pago: <span className="text-emerald-600">{formatarValor(pacote.valor_pago)}</span> / {formatarValor(pacote.valor_total)}
                      </p>
                      {/* Mostra a forma de pagamento se existir no banco (para pacotes novos) */}
                      {(pacote as any).forma_pagamento && (
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                          via {(pacote as any).forma_pagamento}
                        </p>
                      )}
                      {saldo > 0 && (
                        <p className="text-xs text-amber-600 font-black mt-0.5">Saldo: {formatarValor(saldo)}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {finalizados.length > 0 && (
        <div className="mt-4">
          <h2 className="text-[13px] font-bold text-slate-400 flex items-center gap-2 mb-4 uppercase tracking-widest">
            Histórico Finalizado
          </h2>
          <div className="flex flex-col gap-2">
            {finalizados.map(pacote => (
              <div key={pacote.id} className="bg-white rounded-[16px] shadow-sm p-4 opacity-75 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-600">{pacote.nome_cliente}</p>
                  <p className="text-xs font-semibold text-slate-400">{pacote.total_aulas} aulas · {formatarValor(pacote.valor_total)}</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
                  Concluído
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setModalAberto(true)}
        className="fixed bottom-[88px] right-5 w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-[0_4px_20px_rgba(232,67,106,0.45)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {modalAberto && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setModalAberto(false)} />
          
          <div className="relative bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 pb-32 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800">Novo Pacote</h3>
                <p className="text-sm text-slate-500 mt-0.5">Venda de plano de aulas</p>
              </div>
              <button onClick={() => setModalAberto(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><User size={14} /> Nome do Cliente</label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  {...register('nome_cliente', { required: true })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                />
                {errors.nome_cliente && <p className="text-red-500 text-xs mt-1">Nome é obrigatório</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Layers size={14} /> Total de Aulas</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 10"
                  {...register('total_aulas', { required: true, valueAsNumber: true, min: 1 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                />
                {errors.total_aulas && <p className="text-red-500 text-xs mt-1">Mínimo de 1 aula</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><DollarSign size={14} /> Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    {...register('valor_total', { required: true, valueAsNumber: true })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                  />
                  {errors.valor_total && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><DollarSign size={14} /> Valor Pago (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    {...register('valor_pago', { valueAsNumber: true })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                  />
                </div>
              </div>

              {/* NOVO CAMPO DE FORMA DE PAGAMENTO */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><CreditCard size={14} /> Meio de Pagamento</label>
                <select
                  {...register('forma_pagamento')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                >
                  <option value="">Não informado</option>
                  {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-gradient-to-br from-pink-500 to-rose-600 text-white font-bold py-5 rounded-xl text-lg mt-4 shadow-[0_4px_14px_rgba(232,67,106,0.4)] active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {salvando ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={20} />}
                {salvando ? 'Salvando...' : 'Criar Pacote'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
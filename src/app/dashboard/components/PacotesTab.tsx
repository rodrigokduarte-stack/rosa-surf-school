'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { Pacote, NovoPacote } from '@/types'
import { formatarValor } from '@/lib/dateUtils'
import {
  PlusCircle, Package, User, DollarSign,
  ChevronDown, ChevronUp, CheckCircle, X,
} from 'lucide-react'

export default function PacotesTab() {
  const [pacotes, setPacotes] = useState<Pacote[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [formAberto, setFormAberto] = useState(true)
  const [finalizando, setFinalizando] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NovoPacote>({
    defaultValues: { status: 'Ativo', aulas_restantes: 0, valor_pago: 0 },
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

  async function onSubmit(dados: NovoPacote) {
    setSalvando(true)
    const payload = {
      ...dados,
      aulas_restantes: dados.total_aulas,
      status: 'Ativo' as const,
      valor_pago: dados.valor_pago ?? 0,
    }
    const { error } = await supabase.from('pacotes').insert([payload])
    setSalvando(false)
    if (!error) {
      setSucesso(true)
      reset({ status: 'Ativo', aulas_restantes: 0, valor_pago: 0 })
      carregarPacotes()
      setTimeout(() => setSucesso(false), 3000)
    }
  }

  async function finalizarPacote(id: string) {
    setFinalizando(id)
    await supabase.from('pacotes').update({ status: 'Finalizado' }).eq('id', id)
    setFinalizando(null)
    carregarPacotes()
  }

  const ativos = pacotes.filter(p => p.status === 'Ativo')
  const finalizados = pacotes.filter(p => p.status === 'Finalizado')

  return (
    <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">

      {/* Resumo */}
      {ativos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-pink-600">{ativos.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Pacotes ativos</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <p className="text-lg font-bold text-slate-700">
              {ativos.reduce((s, p) => s + p.aulas_restantes, 0)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Aulas restantes</p>
          </div>
        </div>
      )}

      {/* Formulário */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setFormAberto(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-2 text-pink-600 font-semibold">
            <PlusCircle size={20} />
            <span>Novo pacote</span>
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
            {/* Cliente */}
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

            {/* Total de aulas */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1"><Package size={14} /> Total de Aulas</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ex: 10"
                {...register('total_aulas', { required: true, valueAsNumber: true, min: 1 })}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              {errors.total_aulas && <p className="text-red-500 text-xs mt-1">Obrigatório (mínimo 1)</p>}
            </div>

            {/* Valor total + valor pago */}
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
                  {...register('valor_total', { required: true, valueAsNumber: true })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                {errors.valor_total && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <span className="flex items-center gap-1"><DollarSign size={14} /> Valor Pago (R$)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  {...register('valor_pago', { valueAsNumber: true })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            {sucesso && (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <CheckCircle size={18} />
                <span className="text-sm font-medium">Pacote criado com sucesso!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={salvando}
              className="w-full bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white font-semibold py-4 rounded-xl text-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <PlusCircle size={20} />
              {salvando ? 'Salvando...' : 'Criar Pacote'}
            </button>
          </form>
        )}
      </div>

      {/* Lista de pacotes ativos */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3 px-1 flex items-center gap-2">
          <Package size={16} className="text-pink-500" />
          Pacotes Ativos
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ativos.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center text-slate-400">
            <p className="text-sm">Nenhum pacote ativo</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ativos.map(pacote => {
              const progresso = pacote.total_aulas > 0
                ? ((pacote.total_aulas - pacote.aulas_restantes) / pacote.total_aulas) * 100
                : 0
              const saldo = pacote.valor_total - pacote.valor_pago

              return (
                <div key={pacote.id} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold text-slate-800">{pacote.nome_cliente}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {pacote.total_aulas - pacote.aulas_restantes} de {pacote.total_aulas} aulas realizadas
                      </p>
                    </div>
                    <button
                      onClick={() => finalizarPacote(pacote.id)}
                      disabled={finalizando === pacote.id}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                      title="Finalizar pacote"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Barra de progresso */}
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                    <div
                      className="bg-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${progresso}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      <span className="font-bold text-pink-600 text-base">{pacote.aulas_restantes}</span> restantes
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        Pago: <span className="font-semibold text-emerald-600">{formatarValor(pacote.valor_pago)}</span>
                        {' / '}{formatarValor(pacote.valor_total)}
                      </p>
                      {saldo > 0 && (
                        <p className="text-xs text-amber-600 font-medium">Saldo: {formatarValor(saldo)}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pacotes finalizados */}
      {finalizados.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-400 mb-3 px-1">Finalizados</h2>
          <div className="flex flex-col gap-2">
            {finalizados.map(pacote => (
              <div key={pacote.id} className="bg-white rounded-2xl shadow-sm p-4 opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-600">{pacote.nome_cliente}</p>
                    <p className="text-xs text-slate-400">{pacote.total_aulas} aulas · {formatarValor(pacote.valor_total)}</p>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                    Finalizado
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  )
}

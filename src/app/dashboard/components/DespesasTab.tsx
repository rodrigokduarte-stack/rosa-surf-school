'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { RegistroCusto, NovoCusto } from '@/types'
import { hojeEmBrasilia, formatarData, formatarValor } from '@/lib/dateUtils'
import {
  Plus, Tag, FileText, DollarSign, Calendar, Trash2, X, TrendingDown, Receipt
} from 'lucide-react'

const CATEGORIAS: { value: string; label: string }[] = [
  { value: 'Equipamentos', label: 'Equipamentos (pranchas, roupas, parafinas)' },
  { value: 'Impostos',     label: 'Impostos e Taxas (MEI, contabilidade)' },
  { value: 'Marketing',    label: 'Marketing (adesivos, tráfego pago)' },
  { value: 'Operacional',  label: 'Operacional (marmita, gasolina, dia a dia)' },
  { value: 'Outros',       label: 'Outros' },
]

export default function DespesasTab() {
  const [custos, setCustos] = useState<RegistroCusto[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  
  // Controle do Modal
  const [modalAberto, setModalAberto] = useState(false)
  const [excluindo, setExcluindo] = useState<string | null>(null)

  const { register, handleSubmit, reset } = useForm<NovoCusto>({
    defaultValues: { data_custo: hojeEmBrasilia(), categoria: 'Equipamentos' },
  })

  const carregarCustos = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('registro_custos')
      .select('*')
      .order('data_custo', { ascending: false })
      .limit(30)
    setCustos(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { carregarCustos() }, [carregarCustos])

  async function onSubmit(dados: NovoCusto) {
    setSalvando(true)
    const { error } = await supabase.from('registro_custos').insert([dados])
    setSalvando(false)
    if (!error) {
      reset({ data_custo: hojeEmBrasilia(), categoria: 'Equipamentos', descricao: '', valor_custo: undefined })
      carregarCustos()
      setModalAberto(false) // Fecha o modal sozinho
    }
  }

  async function excluirCusto(id: string, descricao: string) {
    if (!window.confirm(`Tem certeza que deseja excluir a despesa "${descricao}"?`)) return
    setExcluindo(id)
    const { error } = await supabase.from('registro_custos').delete().eq('id', id)
    setExcluindo(null)
    if (!error) setCustos(prev => prev.filter(c => c.id !== id))
  }

  const totalCustos = custos.reduce((sum, c) => sum + Number(c.valor_custo), 0)

  return (
    <>
      <div className="px-4 py-2 flex flex-col gap-6">

        {/* Faixa de KPIs (Subindo em cima do fundo escuro) */}
        <div className="flex gap-3 -mt-6">
          <div className="flex-[1.2] bg-gradient-to-br from-red-500 to-rose-600 rounded-[20px] p-4 flex flex-col shadow-[0_4px_20px_rgba(239,68,68,0.3)] relative overflow-hidden">
            <span className="text-[26px] font-black text-white leading-tight mt-1">{formatarValor(totalCustos)}</span>
            <span className="text-[11px] font-medium text-white/80 mt-1">Total Despesas</span>
            <div className="mt-2 text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full text-white w-fit font-bold backdrop-blur-md flex items-center gap-1">
              <TrendingDown size={12} /> Últimos 30 dias
            </div>
            <Receipt size={80} className="absolute -bottom-4 -right-4 text-white opacity-10" />
          </div>
          
          <div className="flex-1 bg-white rounded-[16px] p-4 shadow-sm flex flex-col justify-center border border-slate-100">
             <span className="text-[28px] font-black text-slate-800 leading-none">{custos.length}</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Lançamentos</span>
          </div>
        </div>

        {/* Lista de Despesas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Despesas Recentes
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : custos.length === 0 ? (
            <div className="bg-white rounded-[24px] p-8 shadow-sm text-center border border-slate-100">
              <span className="text-4xl mb-3 block">💸</span>
              <p className="text-slate-500 font-medium text-sm">Tudo no verde!</p>
              <p className="text-slate-400 text-xs mt-1">Nenhuma despesa registrada.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {custos.map(custo => (
                <div key={custo.id} className="bg-white rounded-[20px] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-slate-100 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{custo.descricao}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {custo.categoria}
                      </span>
                      <span className="text-xs font-medium text-slate-400">{formatarData(custo.data_custo)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-black text-red-600 text-[15px]">
                      {formatarValor(Number(custo.valor_custo))}
                    </span>
                    <button
                      onClick={() => excluirCusto(custo.id, custo.descricao)}
                      disabled={excluindo === custo.id}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Excluir despesa"
                    >
                      {excluindo === custo.id
                        ? <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                        : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB - Botão Flutuante (Vermelho para Despesas) */}
      <button
        onClick={() => setModalAberto(true)}
        className="fixed bottom-[88px] right-5 w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-[0_4px_20px_rgba(239,68,68,0.45)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* MODAL BOTTOM SHEET: Nova Despesa */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setModalAberto(false)}
          />
          
          <div className="relative bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800">Nova Despesa</h3>
                <p className="text-sm text-slate-500 mt-0.5">Registre uma saída do caixa</p>
              </div>
              <button 
                onClick={() => setModalAberto(false)}
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Calendar size={13} /> Data</label>
                <input type="date" {...register('data_custo', { required: true })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-base focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Tag size={13} /> Categoria</label>
                <select {...register('categoria', { required: true })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-base focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500">
                  {CATEGORIAS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><FileText size={13} /> Descrição</label>
                <input type="text" placeholder="Ex: 2 barras de parafina" {...register('descricao', { required: true })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><DollarSign size={13} /> Valor (R$)</label>
                <input type="number" step="0.01" min="0" placeholder="0,00" {...register('valor_custo', { required: true, valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-gradient-to-br from-red-500 to-rose-600 text-white font-bold py-4 rounded-xl text-lg mt-2 shadow-[0_4px_14px_rgba(239,68,68,0.4)] active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {salvando ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={20} />}
                {salvando ? 'Salvando...' : 'Salvar Despesa'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
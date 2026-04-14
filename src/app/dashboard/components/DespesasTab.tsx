'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { RegistroCusto, NovoCusto } from '@/types'
import { hojeEmBrasilia, formatarData, formatarValor } from '@/lib/dateUtils'
import {
  PlusCircle, Tag, FileText, DollarSign,
  ChevronDown, ChevronUp, CheckCircle, Calendar, Trash2,
} from 'lucide-react'

const CATEGORIAS: { value: string; label: string }[] = [
  { value: 'Equipamentos', label: 'Equipamentos (pranchas, roupas, cordinhas, parafinas)' },
  { value: 'Impostos',     label: 'Impostos e Taxas (MEI, contabilidade)' },
  { value: 'Marketing',    label: 'Marketing (adesivos, tráfego pago)' },
  { value: 'Operacional',  label: 'Operacional (marmita, gasolina, dia a dia)' },
  { value: 'Outros',       label: 'Outros' },
]

export default function DespesasTab() {
  const [custos, setCustos] = useState<RegistroCusto[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  
  // AQUI FOI A MUDANÇA 1: O formulário começa fechado (false)
  const [formAberto, setFormAberto] = useState(false)
  
  const [excluindo, setExcluindo] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NovoCusto>({
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
      setSucesso(true)
      reset({ data_custo: hojeEmBrasilia(), categoria: 'Equipamentos', descricao: '', valor_custo: undefined })
      carregarCustos()
      setFormAberto(false) // AQUI FOI A MUDANÇA 2: Fecha sozinho após salvar
      setTimeout(() => setSucesso(false), 3000)
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
    <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">

      {/* Formulário */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setFormAberto(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-2 text-pink-600 font-semibold">
            <PlusCircle size={20} />
            <span>Registrar despesa</span>
          </div>
          {formAberto
            ? <ChevronUp size={18} className="text-slate-400" />
            : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {formAberto && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            // AQUI FOI A MUDANÇA 3: Adicionada a animação de entrada (animate-in)
            className="px-5 pb-5 flex flex-col gap-4 border-t border-slate-100 pt-4 animate-in slide-in-from-top-2 duration-200"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1"><Calendar size={14} /> Data</span>
              </label>
              <input
                type="date"
                {...register('data_custo', { required: true })}
                className="w-full border border-slate-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1"><Tag size={14} /> Categoria</span>
              </label>
              <select
                {...register('categoria', { required: true })}
                className="w-full border border-slate-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
              >
                {CATEGORIAS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1"><FileText size={14} /> Descrição</span>
              </label>
              <input
                type="text"
                placeholder="Ex: 2 barras de parafina"
                {...register('descricao', { required: true })}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              {errors.descricao && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1"><DollarSign size={14} /> Valor (R$)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                {...register('valor_custo', { required: true, valueAsNumber: true })}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              {errors.valor_custo && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
            </div>

            {sucesso && (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <CheckCircle size={18} />
                <span className="text-sm font-medium">Despesa registrada com sucesso!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={salvando}
              className="w-full bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white font-semibold py-4 rounded-xl text-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <PlusCircle size={20} />
              {salvando ? 'Salvando...' : 'Registrar Despesa'}
            </button>
          </form>
        )}
      </div>

      {/* Lista */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-semibold text-slate-700">Despesas recentes</h2>
          {custos.length > 0 && (
            <span className="text-sm font-bold text-red-600">{formatarValor(totalCustos)}</span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : custos.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center text-slate-400">
            <p className="text-sm">Nenhuma despesa registrada</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {custos.map(custo => (
              <div key={custo.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{custo.descricao}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {custo.categoria}
                      </span>
                      <span className="text-xs text-slate-400">{formatarData(custo.data_custo)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="font-bold text-red-600 text-base">
                      {formatarValor(Number(custo.valor_custo))}
                    </span>
                    <button
                      onClick={() => excluirCusto(custo.id, custo.descricao)}
                      disabled={excluindo === custo.id}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Excluir despesa"
                    >
                      {excluindo === custo.id
                        ? <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                        : <Trash2 size={15} />}
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
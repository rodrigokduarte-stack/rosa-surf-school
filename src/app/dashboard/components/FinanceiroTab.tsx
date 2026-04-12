'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Periodo, formatarValor, parseProfessores, getRange } from '@/lib/dateUtils'
import { TrendingUp, TrendingDown, DollarSign, Clock, Users, BarChart2, RefreshCw, GraduationCap, Package, Tag } from 'lucide-react'
import AcertoProfessores from './AcertoProfessores'

interface DadosFinanceiros {
  faturamentoBruto: number
  aReceber: number
  custoProfessores: number
  custosOperacionais: number
  totalAulas: number
  receitaPacotes: number
  inadimplenciaPacotes: number
  aulasARealizar: number
}

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mês' },
  { id: 'tudo', label: 'Tudo' },
]

const DADOS_VAZIOS: DadosFinanceiros = {
  faturamentoBruto: 0, aReceber: 0,
  custoProfessores: 0, custosOperacionais: 0, totalAulas: 0,
  receitaPacotes: 0, inadimplenciaPacotes: 0, aulasARealizar: 0,
}

export default function FinanceiroTab() {
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [dados, setDados] = useState<DadosFinanceiros>(DADOS_VAZIOS)
  const [breakdownCategorias, setBreakdownCategorias] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  async function fetchDados(p: Periodo) {
    setLoading(true)
    const { inicio, fim } = getRange(p)

    let aulasQ = supabase
      .from('registro_aulas')
      .select('valor_aula, status_pagamento, nome_professor')
    if (inicio) aulasQ = aulasQ.gte('data_aula', inicio)
    if (fim) aulasQ = aulasQ.lte('data_aula', fim)

    let custosQ = supabase.from('registro_custos').select('valor_custo, categoria')
    if (inicio) custosQ = custosQ.gte('data_custo', inicio)
    if (fim) custosQ = custosQ.lte('data_custo', fim)

    const pacotesQ = supabase.from('pacotes').select('valor_total, valor_pago, aulas_restantes')

    const [{ data: aulas }, { data: custos }, { data: pacotes }] = await Promise.all([aulasQ, custosQ, pacotesQ])

    const aulasList = aulas ?? []
    const custosList = custos ?? []
    const pacotesList = pacotes ?? []

    setBreakdownCategorias(
      custosList.reduce((acc, c) => {
        const cat = (c.categoria as string) || 'Outros'
        acc[cat] = (acc[cat] ?? 0) + Number(c.valor_custo)
        return acc
      }, {} as Record<string, number>)
    )

    setDados({
      faturamentoBruto: aulasList
        .filter(a => a.status_pagamento === 'Pago')
        .reduce((s, a) => s + Number(a.valor_aula), 0),
      aReceber: aulasList
        .filter(a => a.status_pagamento === 'Pendente')
        .reduce((s, a) => s + Number(a.valor_aula), 0),
      custoProfessores: aulasList.reduce((s, a) => {
        const n = parseProfessores(a.nome_professor).length || 1
        return s + 100 * n
      }, 0),
      custosOperacionais: custosList.reduce((s, c) => s + Number(c.valor_custo), 0),
      totalAulas: aulasList.length,
      receitaPacotes: pacotesList.reduce((s, p) => s + Number(p.valor_pago), 0),
      inadimplenciaPacotes: pacotesList.reduce((s, p) => s + Math.max(0, Number(p.valor_total) - Number(p.valor_pago)), 0),
      aulasARealizar: pacotesList.reduce((s, p) => s + Number(p.aulas_restantes), 0),
    })

    setLoading(false)
  }

  useEffect(() => { fetchDados(periodo) }, [periodo])

  const lucroLiquido = dados.faturamentoBruto - dados.custoProfessores - dados.custosOperacionais
  const labelPeriodo = PERIODOS.find(p => p.id === periodo)?.label ?? ''

  return (
    <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">

      {/* Título */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={20} className="text-pink-600" />
          <h2 className="text-lg font-bold text-slate-800">Dashboard Financeiro</h2>
        </div>
        <button
          onClick={() => fetchDados(periodo)}
          className="p-2 rounded-xl text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-colors"
          title="Atualizar"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Seletor de período */}
      <div className="bg-white rounded-2xl p-1.5 shadow-sm flex gap-1">
        {PERIODOS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setPeriodo(id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              periodo === id
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-9 h-9 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Calculando...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">

          {dados.totalAulas > 0 && (
            <p className="text-xs text-slate-400 text-center -mb-1">
              Baseado em{' '}
              <span className="font-semibold text-slate-600">
                {dados.totalAulas} aula{dados.totalAulas !== 1 ? 's' : ''}
              </span>{' '}
              no período
            </p>
          )}

          {/* Receitas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-600 rounded-2xl p-4 shadow-sm text-white">
              <div className="flex items-center gap-1.5 mb-3">
                <div className="bg-white/20 p-1.5 rounded-lg"><DollarSign size={14} /></div>
                <span className="text-xs font-semibold opacity-90">Faturamento Bruto</span>
              </div>
              <p className="text-2xl font-bold leading-tight">{formatarValor(dados.faturamentoBruto)}</p>
              <p className="text-xs opacity-60 mt-1.5">Pagamentos recebidos</p>
            </div>
            <div className="bg-amber-500 rounded-2xl p-4 shadow-sm text-white">
              <div className="flex items-center gap-1.5 mb-3">
                <div className="bg-white/20 p-1.5 rounded-lg"><Clock size={14} /></div>
                <span className="text-xs font-semibold opacity-90">A Receber</span>
              </div>
              <p className="text-2xl font-bold leading-tight">{formatarValor(dados.aReceber)}</p>
              <p className="text-xs opacity-60 mt-1.5">Pagamentos pendentes</p>
            </div>
          </div>

          {/* Custos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-center gap-1.5 mb-3">
                <div className="bg-slate-100 p-1.5 rounded-lg">
                  <Users size={14} className="text-slate-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500">Custo Professores</span>
              </div>
              <p className="text-2xl font-bold text-slate-800 leading-tight">{formatarValor(dados.custoProfessores)}</p>
              <p className="text-xs text-slate-400 mt-1.5">R$100 / prof. por aula</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-center gap-1.5 mb-3">
                <div className="bg-slate-100 p-1.5 rounded-lg">
                  <TrendingDown size={14} className="text-slate-600" />
                </div>
                <span className="text-xs font-semibold text-slate-500">Custos Operacionais</span>
              </div>
              <p className="text-2xl font-bold text-slate-800 leading-tight">{formatarValor(dados.custosOperacionais)}</p>
              <p className="text-xs text-slate-400 mt-1.5">Despesas do período</p>
            </div>
          </div>

          {/* Lucro Líquido */}
          <div className={`rounded-2xl p-5 shadow-md text-white ${
            lucroLiquido >= 0
              ? 'bg-gradient-to-br from-pink-700 via-pink-600 to-pink-500'
              : 'bg-gradient-to-br from-red-700 via-red-600 to-red-500'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-2 rounded-xl">
                  {lucroLiquido >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                </div>
                <span className="font-bold text-base">Lucro Líquido</span>
              </div>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">{labelPeriodo}</span>
            </div>
            <p className="text-4xl font-bold mb-3">{formatarValor(lucroLiquido)}</p>
            <div className="border-t border-white/20 pt-3 flex flex-col gap-1">
              <div className="flex justify-between text-xs opacity-75">
                <span>Faturamento</span><span>{formatarValor(dados.faturamentoBruto)}</span>
              </div>
              <div className="flex justify-between text-xs opacity-75">
                <span>− Custo Professores</span><span>{formatarValor(dados.custoProfessores)}</span>
              </div>
              <div className="flex justify-between text-xs opacity-75">
                <span>− Custos Operacionais</span><span>{formatarValor(dados.custosOperacionais)}</span>
              </div>
            </div>
          </div>

          {/* Pacotes */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Package size={17} className="text-pink-600" />
              <h3 className="text-base font-bold text-slate-800">Pacotes</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
                <p className="text-xs font-semibold text-slate-500 mb-1">Receita</p>
                <p className="text-base font-bold text-emerald-600">{formatarValor(dados.receitaPacotes)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">valor pago</p>
              </div>
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
                <p className="text-xs font-semibold text-slate-500 mb-1">Pendente</p>
                <p className="text-base font-bold text-amber-600">{formatarValor(dados.inadimplenciaPacotes)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">a receber</p>
              </div>
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
                <p className="text-xs font-semibold text-slate-500 mb-1">Aulas</p>
                <p className="text-base font-bold text-slate-700">{dados.aulasARealizar}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">a realizar</p>
              </div>
            </div>
          </div>

          {/* Despesas por Categoria */}
          {Object.keys(breakdownCategorias).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Tag size={17} className="text-pink-600" />
                <h3 className="text-base font-bold text-slate-800">Despesas por Categoria</h3>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {Object.entries(breakdownCategorias)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, total], i, arr) => {
                    const max = arr[0][1]
                    const pct = max > 0 ? (total / max) * 100 : 0
                    return (
                      <div
                        key={cat}
                        className={`px-4 py-3 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-700">{cat}</span>
                          <span className="text-sm font-bold text-slate-800">{formatarValor(total)}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-pink-400 h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Acerto com Professores */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <GraduationCap size={17} className="text-pink-600" />
              <h3 className="text-base font-bold text-slate-800">Acerto com Professores</h3>
            </div>
            <AcertoProfessores periodo={periodo} />
          </div>

        </div>
      )}

      <div className="h-4" />
    </div>
  )
}

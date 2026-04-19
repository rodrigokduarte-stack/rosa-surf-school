'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Periodo, formatarValor, parseProfessores, getRange } from '@/lib/dateUtils'
import { 
  TrendingUp, TrendingDown, DollarSign, Clock, Users, BarChart2, 
  RefreshCw, GraduationCap, Package, Tag, Wallet, Activity, 
  ArrowUpRight, ArrowDownRight, CreditCard, Landmark, Banknote, HelpCircle, Download
} from 'lucide-react'
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

const ICONES_PAGAMENTO: Record<string, any> = {
  'Pix': Landmark,
  'Cartão de Crédito': CreditCard,
  'Dinheiro': Banknote,
  'Outro': HelpCircle,
}

export default function FinanceiroTab() {
  const [periodo, setPeriodo] = useState<Periodo>('tudo')
  const [dados, setDados] = useState<DadosFinanceiros>(DADOS_VAZIOS)
  const [breakdownCategorias, setBreakdownCategorias] = useState<Record<string, number>>({})
  const [breakdownPagamentos, setBreakdownPagamentos] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  async function fetchDados(p: Periodo) {
    setLoading(true)
    const { inicio, fim } = getRange(p)

    let aulasQ = supabase
      .from('registro_aulas')
      .select('valor_aula, valor_pago, status_pagamento, nome_professor, forma_pagamento')
    if (inicio) aulasQ = aulasQ.gte('data_aula', inicio)
    if (fim) aulasQ = aulasQ.lte('data_aula', fim)

    let custosQ = supabase.from('registro_custos').select('valor_custo, categoria')
    if (inicio) custosQ = custosQ.gte('data_custo', inicio)
    if (fim) custosQ = custosQ.lte('data_custo', fim)

    const pacotesQ = supabase.from('pacotes').select('valor_total, valor_pago, aulas_restantes, forma_pagamento')
    const profsQ = supabase.from('professores').select('nome, valor_aula')

    const [{ data: aulas }, { data: custos }, { data: pacotes }, { data: profs }] = await Promise.all([aulasQ, custosQ, pacotesQ, profsQ])

    const aulasList = aulas ?? []
    const custosList = custos ?? []
    const pacotesList = pacotes ?? []
    const profsList = profs ?? []

    const profsMap = profsList.reduce((acc, prof) => {
      acc[prof.nome] = Number(prof.valor_aula) || 100
      return acc
    }, {} as Record<string, number>)

    setBreakdownCategorias(
      custosList.reduce((acc, c) => {
        const cat = (c.categoria as string) || 'Outros'
        acc[cat] = (acc[cat] ?? 0) + Number(c.valor_custo)
        return acc
      }, {} as Record<string, number>)
    )

    const pagamentosMap: Record<string, number> = {}
    
    aulasList.forEach(a => {
      if (a.status_pagamento === 'Pago' || a.status_pagamento === 'Parcial') {
        const forma = a.forma_pagamento || 'Não informado'
        const valorEfetivo = a.status_pagamento === 'Parcial' ? Number(a.valor_pago || 0) : Number(a.valor_aula || a.valor_pago || 0)
        
        if (valorEfetivo > 0) {
          pagamentosMap[forma] = (pagamentosMap[forma] ?? 0) + valorEfetivo
        }
      }
    })

    pacotesList.forEach(p => {
      const valorPagoPacote = Number(p.valor_pago || 0)
      if (valorPagoPacote > 0) {
        const forma = (p as any).forma_pagamento || 'Não informado'
        pagamentosMap[forma] = (pagamentosMap[forma] ?? 0) + valorPagoPacote
      }
    })

    setBreakdownPagamentos(pagamentosMap)

    setDados({
      faturamentoBruto: aulasList
        .filter(a => a.status_pagamento === 'Pago')
        .reduce((s, a) => s + Number(a.valor_aula), 0),
      aReceber: aulasList
        .filter(a => a.status_pagamento === 'Pendente')
        .reduce((s, a) => s + Number(a.valor_aula), 0),
      custoProfessores: aulasList.reduce((s, a) => {
        const nomes = parseProfessores(a.nome_professor)
        if (!nomes || nomes.length === 0) return s + 100 
        const custoDessaAula = nomes.reduce((soma, nome) => soma + (profsMap[nome] ?? 100), 0)
        return s + custoDessaAula
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
  const margem = dados.faturamentoBruto > 0 ? Math.round((lucroLiquido / dados.faturamentoBruto) * 100) : 0

  return (
    <div className="px-4 py-2 flex flex-col gap-6" id="relatorio-financeiro">

      <div className="flex items-center justify-between -mt-2">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-md">
            <BarChart2 size={22} className="text-pink-400" />
            Dashboard
          </h2>
        </div>
        
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            title="Exportar PDF"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => fetchDados(periodo)}
            className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="hidden print:block text-center mb-4 border-b pb-4">
        <h1 className="text-2xl font-black text-slate-800">Rosa Surf School</h1>
        <p className="text-slate-500">Relatório Financeiro: {labelPeriodo}</p>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-[16px] p-1.5 shadow-sm border border-slate-100 flex gap-1 print:hidden">
        {PERIODOS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setPeriodo(id)}
            className={`flex-1 py-2.5 rounded-[12px] text-[11px] uppercase tracking-wider font-bold transition-all ${
              periodo === id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 print:hidden">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">

          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[24px] p-6 shadow-xl relative overflow-hidden print:bg-none print:bg-white print:border print:border-slate-200 print:shadow-none print:text-slate-800">
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay print:hidden" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-slate-400 print:text-slate-500" />
                  <span className="text-[11px] font-bold text-slate-400 print:text-slate-500 uppercase tracking-widest">Lucro Líquido ({labelPeriodo})</span>
                </div>
              </div>
              <div className="flex items-end gap-3 mb-2">
                <span className={`text-4xl font-black tracking-tighter ${lucroLiquido >= 0 ? 'text-white print:text-slate-800' : 'text-rose-400 print:text-rose-600'}`}>
                  {formatarValor(lucroLiquido)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${lucroLiquido >= 0 ? 'bg-emerald-500/20 text-emerald-400 print:bg-emerald-100 print:text-emerald-700' : 'bg-rose-500/20 text-rose-400 print:bg-rose-100 print:text-rose-700'}`}>
                  <Activity size={12} />
                  {margem}% Margem
                </div>
                <span className="text-xs font-medium text-slate-500">sobre o faturamento</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] print:shadow-none print:border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <ArrowUpRight size={16} className="text-emerald-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Faturado</span>
              <span className="text-xl font-black text-slate-800 tracking-tight">{formatarValor(dados.faturamentoBruto)}</span>
            </div>
            <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] print:shadow-none print:border-slate-200">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center mb-3">
                <Clock size={16} className="text-amber-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">A Receber</span>
              <span className="text-xl font-black text-slate-800 tracking-tight">{formatarValor(dados.aReceber)}</span>
            </div>
            <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] print:shadow-none print:border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Users size={16} className="text-slate-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Professores</span>
              <span className="text-xl font-black text-slate-800 tracking-tight">{formatarValor(dados.custoProfessores)}</span>
            </div>
            <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] print:shadow-none print:border-slate-200">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center mb-3">
                <ArrowDownRight size={16} className="text-rose-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Custos (Fixos)</span>
              <span className="text-xl font-black text-slate-800 tracking-tight">{formatarValor(dados.custosOperacionais)}</span>
            </div>
          </div>

          {dados.totalAulas > 0 && (
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center mt-2">
              Baseado em {dados.totalAulas} aula{dados.totalAulas !== 1 ? 's' : ''} concluídas
            </p>
          )}

          {Object.keys(breakdownPagamentos).length > 0 && (
            <div className="mt-2">
              <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 print:hidden" /> Como o dinheiro entrou?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(breakdownPagamentos)
                  .sort(([, a], [, b]) => b - a)
                  .map(([forma, total]) => {
                    const Icone = ICONES_PAGAMENTO[forma] || HelpCircle
                    return (
                      <div key={forma} className="bg-white rounded-[20px] border border-slate-100 p-4 shadow-sm print:shadow-none print:border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 print:bg-transparent print:w-auto print:h-auto">
                            <Icone size={14} className="print:hidden" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate print:text-slate-600">{forma}</span>
                        </div>
                        <span className="text-lg font-black text-slate-800 tracking-tight">{formatarValor(total)}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {Object.keys(breakdownCategorias).length > 0 && (
            <div className="mt-2">
              <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-rose-500 print:hidden" /> Onde o dinheiro foi?
              </h3>
              <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-4 flex flex-col gap-4 print:shadow-none print:border-slate-200">
                {Object.entries(breakdownCategorias)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, total], i, arr) => {
                    const max = arr[0][1]
                    const pct = max > 0 ? (total / max) * 100 : 0
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-600">{cat}</span>
                          <span className="text-xs font-black text-slate-800">{formatarValor(total)}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 print:hidden">
                          <div
                            className="bg-gradient-to-r from-pink-400 to-rose-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          <div className="mt-2">
            <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-pink-500 print:hidden" /> Acerto com a Equipe
            </h3>
            <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-2 print:shadow-none print:border-slate-200 print:p-0">
              <AcertoProfessores periodo={periodo} />
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
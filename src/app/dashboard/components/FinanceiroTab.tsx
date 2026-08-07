'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Periodo, formatarValor, parseProfessores, getRange } from '@/lib/dateUtils'
import { useLanguage } from '@/contexts/LanguageContext'
import { 
  TrendingUp, TrendingDown, DollarSign, Clock, Users, BarChart2, 
  RefreshCw, GraduationCap, Package, Tag, Wallet, Activity, 
  ArrowUpRight, ArrowDownRight, CreditCard, Landmark, Banknote, HelpCircle, Download, Send,
  List, X, ArrowUpCircle, ArrowDownCircle
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

// NOVO: Tipo para o Extrato
interface Transacao {
  id: string
  data: string
  tipo: 'entrada' | 'saida'
  descricao: string
  valor: number
  categoriaOuForma: string
}

const DADOS_VAZIOS: DadosFinanceiros = {
  faturamentoBruto: 0, aReceber: 0,
  custoProfessores: 0, custosOperacionais: 0, totalAulas: 0,
  receitaPacotes: 0, inadimplenciaPacotes: 0, aulasARealizar: 0,
}

const ICONES_PAGAMENTO: Record<string, any> = {
  'Pix': Landmark,
  'Cartão de Crédito': CreditCard,
  'Dinheiro': Banknote,
  'Depix': Send,
  'Outro': HelpCircle,
}

type PeriodoFiltro = Periodo | 'ano'

export default function FinanceiroTab() {
  const { t, language } = useLanguage() 
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('tudo')
  const [dados, setDados] = useState<DadosFinanceiros>(DADOS_VAZIOS)
  const [breakdownCategorias, setBreakdownCategorias] = useState<Record<string, number>>({})
  const [breakdownPagamentos, setBreakdownPagamentos] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  
  // NOVO: Estado para o Extrato
  const [extratoAberto, setExtratoAberto] = useState(false)
  const [transacoes, setTransacoes] = useState<Transacao[]>([])

  const textosAno = { pt: 'Ano', en: 'Year', es: 'Año' }
  const labelAno = textosAno[language as keyof typeof textosAno] || 'Ano'

  const textosExtrato = { 
    pt: { btn: 'Ver Extrato Detalhado', titulo: 'Extrato Financeiro', subtitulo: 'Todas as entradas e saídas do período', vazio: 'Nenhuma movimentação neste período.', entrada: 'Entrada', saida: 'Saída' },
    en: { btn: 'View Detailed Statement', titulo: 'Financial Statement', subtitulo: 'All inflows and outflows of the period', vazio: 'No transactions in this period.', entrada: 'Inflow', saida: 'Outflow' },
    es: { btn: 'Ver Extracto Detallado', titulo: 'Extracto Financiero', subtitulo: 'Todas las entradas y salidas del período', vazio: 'No hay movimientos en este período.', entrada: 'Entrada', saida: 'Salida' }
  }
  const tEx = textosExtrato[language as keyof typeof textosExtrato] || textosExtrato.pt

  const periodosList: { id: PeriodoFiltro; label: string }[] = [
    { id: 'hoje', label: t.financeiroTab.periodoHoje },
    { id: 'semana', label: t.financeiroTab.periodoSemana },
    { id: 'mes', label: t.financeiroTab.periodoMes },
    { id: 'ano', label: labelAno },
    { id: 'tudo', label: t.financeiroTab.periodoTudo },
  ]

  async function fetchDados(p: PeriodoFiltro) {
    setLoading(true)
    
    let inicio: string | undefined | null
    let fim: string | undefined | null

    if (p === 'ano') {
      const agora = new Date()
      const a = agora.getFullYear()
      const m = String(agora.getMonth() + 1).padStart(2, '0')
      const d = String(agora.getDate()).padStart(2, '0')
      inicio = `${a}-01-01`
      fim = `${a}-${m}-${d}`
    } else {
      const range = getRange(p)
      inicio = range.inicio
      fim = range.fim
    }

    let aulasQ = supabase
      .from('registro_aulas')
      .select('id, data_aula, valor_aula, valor_pago, status_pagamento, nome_professor, forma_pagamento, nome_cliente')
      .eq('excluido', false)

    if (inicio) aulasQ = aulasQ.gte('data_aula', inicio)
    if (fim) aulasQ = aulasQ.lte('data_aula', fim)

    let custosQ = supabase.from('despesas').select('id, data_despesa, valor, categoria, descricao').eq('excluido', false)
    if (inicio) custosQ = custosQ.gte('data_despesa', inicio)
    if (fim) custosQ = custosQ.lte('data_despesa', fim)

    let pacotesQ = supabase.from('pacotes').select('id, created_at, valor_total, valor_pago, aulas_restantes, forma_pagamento, nome_cliente').eq('excluido', false)
    if (inicio) pacotesQ = pacotesQ.gte('created_at', inicio + 'T00:00:00Z')
    if (fim) pacotesQ = pacotesQ.lte('created_at', fim + 'T23:59:59Z')

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
        const cat = (c.categoria as string) || t.financeiroTab.outros
        acc[cat] = (acc[cat] ?? 0) + Number(c.valor)
        return acc
      }, {} as Record<string, number>)
    )

    const pagamentosMap: Record<string, number> = {}
    const listaTransacoes: Transacao[] = []
    
    aulasList.forEach(a => {
      const valorEfetivo = a.status_pagamento === 'Parcial' ? Number(a.valor_pago || 0) : Number(a.valor_aula || a.valor_pago || 0)
      if (a.status_pagamento === 'Pago' || a.status_pagamento === 'Parcial') {
        const forma = a.forma_pagamento || t.financeiroTab.naoInformado
        if (valorEfetivo > 0) {
          pagamentosMap[forma] = (pagamentosMap[forma] ?? 0) + valorEfetivo
          listaTransacoes.push({
            id: `aula-${a.id}`,
            data: a.data_aula,
            tipo: 'entrada',
            descricao: `Aula: ${a.nome_cliente || 'Avulsa'}`,
            valor: valorEfetivo,
            categoriaOuForma: forma
          })
        }
      }
    })

    pacotesList.forEach(p => {
      const valorPagoPacote = Number(p.valor_pago || 0)
      if (valorPagoPacote > 0) {
        const forma = (p as any).forma_pagamento || t.financeiroTab.naoInformado
        pagamentosMap[forma] = (pagamentosMap[forma] ?? 0) + valorPagoPacote
        listaTransacoes.push({
            id: `pac-${p.id}`,
            data: p.created_at.split('T')[0],
            tipo: 'entrada',
            descricao: `Pacote: ${p.nome_cliente}`,
            valor: valorPagoPacote,
            categoriaOuForma: forma
        })
      }
    })
    
    custosList.forEach(c => {
        listaTransacoes.push({
            id: `desp-${c.id}`,
            data: c.data_despesa,
            tipo: 'saida',
            descricao: c.descricao || 'Despesa',
            valor: Number(c.valor),
            categoriaOuForma: c.categoria || 'Outros'
        })
    })

    // Ordena do mais recente pro mais antigo
    listaTransacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    setTransacoes(listaTransacoes)

    setBreakdownPagamentos(pagamentosMap)

    const faturamentoAulas = aulasList.reduce((s, a) => {
      if (a.status_pagamento === 'Pago') return s + Number(a.valor_aula)
      if (a.status_pagamento === 'Parcial') return s + Number(a.valor_pago || 0)
      return s
    }, 0)

    const faturamentoPacotes = pacotesList.reduce((s, p) => s + Number(p.valor_pago || 0), 0)

    const aReceberAulas = aulasList.reduce((s, a) => {
      if (a.status_pagamento === 'Pendente') return s + Number(a.valor_aula)
      if (a.status_pagamento === 'Parcial') return s + Math.max(0, Number(a.valor_aula) - Number(a.valor_pago || 0))
      return s
    }, 0)

    const aReceberPacotes = pacotesList.reduce((s, p) => s + Math.max(0, Number(p.valor_total) - Number(p.valor_pago || 0)), 0)

    setDados({
      faturamentoBruto: faturamentoAulas + faturamentoPacotes,
      aReceber: aReceberAulas + aReceberPacotes,
      custoProfessores: aulasList.reduce((s, a) => {
        const nomes = parseProfessores(a.nome_professor)
        if (!nomes || nomes.length === 0) return s + 100 
        const custoDessaAula = nomes.reduce((soma, nome) => soma + (profsMap[nome] ?? 100), 0)
        return s + custoDessaAula
      }, 0),
      custosOperacionais: custosList.reduce((s, c) => s + Number(c.valor), 0),
      totalAulas: aulasList.length,
      receitaPacotes: faturamentoPacotes,
      inadimplenciaPacotes: aReceberPacotes,
      aulasARealizar: pacotesList.reduce((s, p) => s + Number(p.aulas_restantes), 0),
    })

    setLoading(false)
  }

  useEffect(() => { fetchDados(periodo) }, [periodo, t])

  const lucroLiquido = dados.faturamentoBruto - dados.custoProfessores - dados.custosOperacionais
  const labelPeriodo = periodosList.find(p => p.id === periodo)?.label ?? ''
  const margem = dados.faturamentoBruto > 0 ? Math.round((lucroLiquido / dados.faturamentoBruto) * 100) : 0

  const tituloPagamento = 
    periodo === 'hoje' ? t.financeiroTab.quemPagarHoje :
    periodo === 'semana' ? t.financeiroTab.quemPagarSemana :
    periodo === 'mes' ? t.financeiroTab.quemPagarMes :
    t.financeiroTab.historicoPagamentos

  return (
    <div className="px-4 py-2 flex flex-col gap-6" id="relatorio-financeiro">

      <div className="flex items-center justify-between -mt-2">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-md">
            <BarChart2 size={22} className="text-pink-400" />
            {t.financeiroTab.titulo}
          </h2>
        </div>
        
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            title={t.financeiroTab.exportar}
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => fetchDados(periodo)}
            className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            title={t.financeiroTab.atualizar}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="hidden print:block text-center mb-4 border-b pb-4">
        <h1 className="text-2xl font-black text-slate-800">Rosa Surf School</h1>
        <p className="text-slate-500">{t.financeiroTab.relatorio} {labelPeriodo}</p>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-[16px] p-1.5 shadow-sm border border-slate-100 flex gap-1 print:hidden">
        {periodosList.map(({ id, label }) => (
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
                  <span className="text-[11px] font-bold text-slate-400 print:text-slate-500 uppercase tracking-widest">{t.financeiroTab.lucroLiquido} ({labelPeriodo})</span>
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
                  {margem}% {t.financeiroTab.margem}
                </div>
                <span className="text-xs font-medium text-slate-500">{t.financeiroTab.sobreFaturamento}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] print:shadow-none print:border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <ArrowUpRight size={16} className="text-emerald-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t.financeiroTab.faturado}</span>
              <span className="text-xl font-black text-slate-800 tracking-tight">{formatarValor(dados.faturamentoBruto)}</span>
            </div>
            <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] print:shadow-none print:border-slate-200">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center mb-3">
                <Clock size={16} className="text-amber-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t.financeiroTab.aReceber}</span>
              <span className="text-xl font-black text-slate-800 tracking-tight">{formatarValor(dados.aReceber)}</span>
            </div>
            <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] print:shadow-none print:border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Users size={16} className="text-slate-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t.financeiroTab.professores}</span>
              <span className="text-xl font-black text-slate-800 tracking-tight">{formatarValor(dados.custoProfessores)}</span>
            </div>
            <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] print:shadow-none print:border-slate-200">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center mb-3">
                <ArrowDownRight size={16} className="text-rose-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t.financeiroTab.custosFixos}</span>
              <span className="text-xl font-black text-slate-800 tracking-tight">{formatarValor(dados.custosOperacionais)}</span>
            </div>
          </div>
          
          {/* BOTAO PARA ABRIR O EXTRATO */}
          <button 
            onClick={() => setExtratoAberto(true)}
            className="w-full bg-slate-800 text-white font-bold text-sm py-4 rounded-[20px] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform print:hidden"
          >
            <List size={18} /> {tEx.btn}
          </button>

          {dados.totalAulas > 0 && (
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center mt-2">
              {t.financeiroTab.baseadoEm} {dados.totalAulas} {dados.totalAulas !== 1 ? t.financeiroTab.aulasConcluidas : t.financeiroTab.aulaConcluida}
            </p>
          )}

          {Object.keys(breakdownPagamentos).length > 0 && (
            <div className="mt-2">
              <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 print:hidden" /> {t.financeiroTab.comoEntrou}
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
                <span className="w-2 h-2 rounded-full bg-rose-500 print:hidden" /> {t.financeiroTab.ondeFoi}
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

          <div className="mt-4 bg-slate-900 rounded-[24px] p-1.5 shadow-xl print:bg-none print:shadow-none print:p-0">
            <div className="px-4 pt-4 pb-3 flex items-center justify-between">
              <h3 className="text-[15px] font-black text-white flex items-center gap-2 print:text-slate-800">
                {tituloPagamento}
              </h3>
              <span className="text-[9px] font-bold text-pink-400 uppercase tracking-widest bg-pink-400/10 px-2 py-0.5 rounded-full border border-pink-400/20 print:hidden">
                {t.financeiroTab.equipe}
              </span>
            </div>
            <div className="bg-white rounded-[20px] p-2 print:p-0 border border-slate-100/50">
              {/* O AcertoProfessores vai mostrar "Tudo" quando a visão principal for "Ano" */}
              <AcertoProfessores periodo={periodo === 'ano' ? 'tudo' : periodo} />
            </div>
          </div>

        </div>
      )}
      
      {/* MODAL TELA CHEIA DO EXTRATO DETALHADO */}
      {extratoAberto && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300 print:hidden">
          <div className="pt-10 pb-4 px-6 bg-slate-900 text-white flex items-center justify-between shadow-md">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                <List size={22} className="text-pink-400" /> {tEx.titulo}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">{tEx.subtitulo}</p>
            </div>
            <button 
              onClick={() => setExtratoAberto(false)}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
            {transacoes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <List size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-medium">{tEx.vazio}</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3 pb-20">
                    {transacoes.map((t, idx) => {
                        const isEntrada = t.tipo === 'entrada'
                        return (
                            <div key={t.id + idx} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isEntrada ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                        {isEntrada ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 leading-tight">{t.descricao}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black uppercase text-slate-400">{t.data.split('-').reverse().join('/')}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                            <span className="text-[10px] font-bold text-slate-500">{t.categoriaOuForma}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className={`text-base font-black ${isEntrada ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {isEntrada ? '+' : '-'} {formatarValor(t.valor)}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
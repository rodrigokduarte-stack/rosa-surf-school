'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RegistroAula, Pacote } from '@/types'
import { formatarValor, hojeEmBrasilia } from '@/lib/dateUtils'
import { CheckCircle, MessageCircle, ChevronDown, ChevronUp, DollarSign, Wallet, CreditCard, Receipt, Calendar } from 'lucide-react'

type ItemDivida = {
  id: string
  tipo: 'aula' | 'pacote'
  descricao: string
  data_referencia: string
  valor_total: number
  valor_pago: number
  original_id: string
  dias_atraso: number
}

type DevedorAgrupado = {
  id: string
  nome: string
  telefone?: string
  valor_total: number
  valor_pago: number
  dias_atraso: number // Pega o atraso do item mais velho
  itens: ItemDivida[]
}

const FORMAS_PAGAMENTO = ['Pix', 'Cartão de Crédito', 'Dinheiro', 'Outro']

function calcularDiasAtraso(dataReferencia: string) {
  const hoje = new Date(hojeEmBrasilia())
  const ref = new Date(dataReferencia)
  const diffTime = Math.abs(hoje.getTime() - ref.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

function configUrgencia(dias: number) {
  if (dias >= 30) return { 
    label: "Crítico", bg: "bg-rose-50", border: "border-rose-200", 
    badge: "bg-rose-500", text: "text-rose-700", bar: "bg-rose-500" 
  }
  if (dias >= 15) return { 
    label: "Atrasado", bg: "bg-amber-50", border: "border-amber-200", 
    badge: "bg-amber-500", text: "text-amber-700", bar: "bg-amber-500" 
  }
  return { 
    label: "Recente", bg: "bg-emerald-50", border: "border-emerald-200", 
    badge: "bg-emerald-500", text: "text-emerald-700", bar: "bg-emerald-500" 
  }
}

function formatarDataCurta(dataStr: string) {
  if (!dataStr) return ''
  const apenasData = dataStr.split('T')[0]
  const partes = apenasData.split('-')
  if (partes.length !== 3) return apenasData
  return `${partes[2]}/${partes[1]}`
}

export default function InadimplentesTab() {
  const [devedores, setDevedores] = useState<DevedorAgrupado[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)
  
  const [devedorSelecionado, setDevedorSelecionado] = useState<DevedorAgrupado | null>(null)
  const [valorRecebido, setValorRecebido] = useState<string>('')
  
  const [formaPagamento, setFormaPagamento] = useState<string>('Pix')
  const [processando, setProcessando] = useState(false)

  const carregarInadimplentes = useCallback(async () => {
    setLoading(true)
    
    const { data: aulasData } = await supabase.from('registro_aulas').select('*').in('status_pagamento', ['Pendente', 'Parcial'])
    const { data: pacotesData } = await supabase.from('pacotes').select('*')
    const { data: alunosData } = await supabase.from('alunos').select('nome, telefone')
    
    const telefonesMap: Record<string, string> = {}
    alunosData?.forEach((aluno: any) => {
      if (aluno.telefone) {
        const numLimpo = aluno.telefone.replace(/\D/g, '')
        telefonesMap[aluno.nome.trim()] = numLimpo.length <= 11 ? `55${numLimpo}` : numLimpo
      }
    })

    const agrupados: Record<string, DevedorAgrupado> = {}

    // Processa Aulas Avulsas
    aulasData?.forEach((a: RegistroAula & { valor_pago?: number }) => {
      const nomeLimpo = (a.nome_cliente || '').trim()
      if (!nomeLimpo) return

      if (!agrupados[nomeLimpo]) {
        agrupados[nomeLimpo] = { id: nomeLimpo, nome: nomeLimpo, telefone: telefonesMap[nomeLimpo], valor_total: 0, valor_pago: 0, dias_atraso: 0, itens: [] }
      }

      const dias = calcularDiasAtraso(a.data_aula)
      agrupados[nomeLimpo].valor_total += Number(a.valor_aula)
      agrupados[nomeLimpo].valor_pago += Number(a.valor_pago || 0)
      agrupados[nomeLimpo].dias_atraso = Math.max(agrupados[nomeLimpo].dias_atraso, dias)
      
      agrupados[nomeLimpo].itens.push({
        id: `aula-${a.id}`,
        tipo: 'aula',
        descricao: `Aula ${a.modalidade}`,
        data_referencia: a.data_aula,
        valor_total: Number(a.valor_aula),
        valor_pago: Number(a.valor_pago || 0),
        original_id: a.id,
        dias_atraso: dias
      })
    })

    // Processa Pacotes Devendo
    pacotesData?.forEach((p: Pacote) => {
      if (Number(p.valor_pago) < Number(p.valor_total)) {
        const nomeLimpo = (p.nome_cliente || '').trim()
        if (!nomeLimpo) return

        if (!agrupados[nomeLimpo]) {
          agrupados[nomeLimpo] = { id: nomeLimpo, nome: nomeLimpo, telefone: telefonesMap[nomeLimpo], valor_total: 0, valor_pago: 0, dias_atraso: 0, itens: [] }
        }

        const dataCriacao = p.created_at ? p.created_at.split('T')[0] : hojeEmBrasilia()
        const dias = calcularDiasAtraso(dataCriacao)
        
        agrupados[nomeLimpo].valor_total += Number(p.valor_total)
        agrupados[nomeLimpo].valor_pago += Number(p.valor_pago || 0)
        agrupados[nomeLimpo].dias_atraso = Math.max(agrupados[nomeLimpo].dias_atraso, dias)

        agrupados[nomeLimpo].itens.push({
          id: `pacote-${p.id}`,
          tipo: 'pacote',
          descricao: `Pacote (${p.aulas_restantes} restantes)`,
          data_referencia: dataCriacao,
          valor_total: Number(p.valor_total),
          valor_pago: Number(p.valor_pago || 0),
          original_id: p.id,
          dias_atraso: dias
        })
      }
    })

    const listaFinal = Object.values(agrupados)
    
    // Ordena os itens DENTRO do aluno do mais velho para o mais novo
    listaFinal.forEach(dev => {
      dev.itens.sort((a, b) => b.dias_atraso - a.dias_atraso)
    })

    // Ordena a lista de alunos para quem deve há mais tempo aparecer no topo
    listaFinal.sort((a, b) => b.dias_atraso - a.dias_atraso)
    
    setDevedores(listaFinal)
    setLoading(false)
  }, [])

  useEffect(() => { carregarInadimplentes() }, [carregarInadimplentes])

  // LÓGICA DE PAGAMENTO INTELIGENTE (FIFO: Abate a dívida mais velha primeiro)
  async function confirmarPagamento(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!devedorSelecionado || !valorRecebido || !formaPagamento) return
    
    setProcessando(true)
    let saldoRestante = parseFloat(valorRecebido)
    
    const promessasAtualizacao = []

    for (const item of devedorSelecionado.itens) {
      if (saldoRestante <= 0.001) break // Evita bugs de casas decimais

      const faltaNesteItem = item.valor_total - item.valor_pago
      
      if (faltaNesteItem > 0) {
        const valorAAbater = Math.min(saldoRestante, faltaNesteItem)
        const novoValorPago = item.valor_pago + valorAAbater
        const quitouTotalmente = novoValorPago >= item.valor_total

        if (item.tipo === 'aula') {
          promessasAtualizacao.push(
            supabase.from('registro_aulas').update({ 
              status_pagamento: quitouTotalmente ? 'Pago' : 'Parcial',
              valor_pago: novoValorPago,
              forma_pagamento: formaPagamento
            }).eq('id', item.original_id)
          )
        } else {
          promessasAtualizacao.push(
            supabase.from('pacotes').update({ 
              valor_pago: novoValorPago,
              forma_pagamento: formaPagamento
            }).eq('id', item.original_id)
          )
        }
        
        saldoRestante -= valorAAbater
      }
    }

    await Promise.all(promessasAtualizacao)

    setProcessando(false)
    setDevedorSelecionado(null)
    setValorRecebido('')
    setFormaPagamento('Pix') 
    carregarInadimplentes()
  }

  function abrirWhatsApp(d: DevedorAgrupado) {
    // Lista o que ele deve formatado
    const msgAulas = d.itens.map(i => `${i.descricao} (${formatarDataCurta(i.data_referencia)})`).join(', ')
    const texto = encodeURIComponent(`Olá, ${d.nome}! Passando para ver como estão as ondas e lembrar sobre o acerto pendente no valor de ${formatarValor(d.valor_total - d.valor_pago)}.\n\nRef: ${msgAulas}\n\nPodemos acertar? 🏄‍♂️`)
    
    if (d.telefone) {
      window.open(`https://wa.me/${d.telefone}?text=${texto}`, '_blank')
    } else {
      window.open(`https://wa.me/?text=${texto}`, '_blank')
    }
  }

  const totalEmAberto = devedores.reduce((s, d) => s + (d.valor_total - d.valor_pago), 0)
  const criticos = devedores.filter(d => d.dias_atraso >= 30).length

  return (
    <div className="px-4 py-2 flex flex-col gap-6 w-full overflow-x-hidden">
      
      <div className="flex gap-3">
        <div className="flex-[1.2] bg-gradient-to-br from-rose-500 to-red-600 rounded-[20px] p-4 flex flex-col shadow-[0_4px_20px_rgba(225,29,72,0.3)] relative overflow-hidden">
          <span className="text-[26px] font-black text-white leading-tight mt-1">
            {formatarValor(totalEmAberto)}
          </span>
          <span className="text-[11px] font-medium text-white/80 mt-1">Total na rua</span>
          <Wallet size={80} className="absolute -bottom-4 -right-4 text-white opacity-10" />
        </div>
        
        <div className="flex-1 flex flex-col gap-2.5">
          <div className="flex-1 bg-white rounded-[16px] p-3 shadow-sm flex flex-col justify-center border border-rose-100">
            <span className="text-[18px] font-bold text-rose-600 leading-tight">{criticos}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Críticos (+30d)</span>
          </div>
          <div className="flex-1 bg-white rounded-[16px] p-3 shadow-sm flex flex-col justify-center border border-slate-100">
            <span className="text-[18px] font-bold text-slate-800 leading-tight">{devedores.length}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Clientes Devendo</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-rose-500" /> Máquina de Cobrança
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : devedores.length === 0 ? (
          <div className="bg-white rounded-[24px] p-8 shadow-sm text-center border border-slate-100">
            <span className="text-4xl mb-3 block">🙌</span>
            <p className="text-slate-500 font-medium text-sm">Ninguém devendo!</p>
            <p className="text-slate-400 text-xs mt-1">O caixa está 100% em dia.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {devedores.map(dev => {
              const cfg = configUrgencia(dev.dias_atraso)
              const restante = dev.valor_total - dev.valor_pago
              const pctPago = Math.round((dev.valor_pago / dev.valor_total) * 100)
              const isOp = expandido === dev.id

              return (
                <div key={dev.id} className={`bg-white rounded-[20px] p-4 border shadow-sm transition-all ${cfg.border}`}>
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandido(isOp ? null : dev.id)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner ${cfg.badge}`}>
                        {dev.nome.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-[15px] leading-tight">{dev.nome}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-white tracking-wider ${cfg.badge}`}>
                            {dev.dias_atraso}d • {cfg.label}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 mt-0.5 block">{dev.itens.length} pendência(s) agrupada(s)</span>
                      </div>
                    </div>
                    {isOp ? <ChevronUp size={16} className="text-slate-400 mt-1" /> : <ChevronDown size={16} className="text-slate-400 mt-1" />}
                  </div>

                  <div className="mt-4 mb-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`} style={{ width: `${pctPago}%` }} />
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Pago: {formatarValor(dev.valor_pago)}
                    </span>
                    <span className={`text-[11px] font-black uppercase tracking-wider ${cfg.text}`}>
                      Falta: {formatarValor(restante)}
                    </span>
                  </div>

                  {isOp && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
                      
                      <div className="bg-slate-50 rounded-xl p-3 mb-2 border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Receipt size={12} className="text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Itens desta dívida</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {dev.itens.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
                              <div className="flex items-center gap-2">
                                <div className="bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded flex items-center gap-1 text-[10px]">
                                  <Calendar size={10} /> {formatarDataCurta(item.data_referencia)}
                                </div>
                                <span className="text-xs font-semibold text-slate-700">{item.descricao}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="font-bold text-slate-800 text-xs">{formatarValor(item.valor_total)}</span>
                                {item.valor_pago > 0 && (
                                  <span className="text-[9px] text-slate-400">Pago: {formatarValor(item.valor_pago)}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={() => abrirWhatsApp(dev)} 
                        className="w-full bg-[#25D366]/10 text-[#075E54] font-black text-[13px] py-3.5 rounded-xl border border-[#25D366]/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                      >
                        <MessageCircle size={16} /> 
                        Notificar via WhatsApp
                      </button>
                      <button 
                        onClick={() => { setDevedorSelecionado(dev); setValorRecebido(restante.toString()); setFormaPagamento('Pix'); }} 
                        className={`w-full text-white font-black text-[13px] py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm ${cfg.badge}`}
                      >
                        <DollarSign size={16} /> 
                        Registrar Recebimento
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {devedorSelecionado && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setDevedorSelecionado(null)} 
          />
          
          <div className="relative bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 pb-32 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
            
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Registrar Recebimento
            </p>
            <h3 className="text-2xl font-black text-slate-800 leading-none mb-1 tracking-tight">
              {devedorSelecionado.nome}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              O valor será abatido das pendências mais antigas primeiro.
            </p>

            <div className="flex gap-3 mb-6">
              <div className="flex-1 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">
                  Dívida Total Consolidada
                </span>
                <span className="text-xl font-black text-rose-700 tracking-tight">
                  {formatarValor(devedorSelecionado.valor_total - devedorSelecionado.valor_pago)}
                </span>
              </div>
            </div>

            <form onSubmit={confirmarPagamento} className="flex flex-col gap-4">
              
              <div>
                <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 block">
                  Quanto o cliente pagou agora?
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    max={devedorSelecionado.valor_total - devedorSelecionado.valor_pago}
                    value={valorRecebido}
                    onChange={e => setValorRecebido(e.target.value)}
                    required
                    className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl pl-10 pr-4 py-4 text-2xl font-black text-emerald-700 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-2 mb-2">
                 <button 
                    type="button" 
                    onClick={() => setValorRecebido(((devedorSelecionado.valor_total - devedorSelecionado.valor_pago) / 2).toFixed(2))} 
                    className="flex-1 bg-slate-50 text-slate-600 font-bold text-sm py-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    Metade (50%)
                  </button>
                 <button 
                    type="button" 
                    onClick={() => setValorRecebido((devedorSelecionado.valor_total - devedorSelecionado.valor_pago).toString())} 
                    className="flex-1 bg-emerald-50 text-emerald-600 font-bold text-sm py-3 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    Quitar Tudo
                  </button>
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CreditCard size={14} /> Como o dinheiro entrou?
                </label>
                <select
                  value={formaPagamento}
                  onChange={e => setFormaPagamento(e.target.value)}
                  required
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-base font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">Selecione...</option>
                  {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <button
                type="submit"
                disabled={processando}
                className="w-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-black py-5 rounded-xl text-lg mt-4 shadow-[0_4px_14px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {processando ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle size={20} />
                )}
                {processando ? 'Confirmando...' : 'Confirmar Recebimento'}
              </button>
              
              <button 
                type="button" 
                onClick={() => setDevedorSelecionado(null)} 
                className="w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors mt-2"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatarValor } from '@/lib/dateUtils'
import { Eye, EyeOff, TrendingUp, TrendingDown, Wallet, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function FinanceiroTab() {
  const [loading, setLoading] = useState(true)
  const [mostrarValores, setMostrarValores] = useState(true)
  
  const [receitas, setReceitas] = useState(0)
  const [despesas, setDespesas] = useState(0)

  // Nomes dos meses para o Header
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const mesAtual = meses[new Date().getMonth()]

  const carregarDadosDoMes = useCallback(async () => {
    setLoading(true)
    
    // Pega o primeiro e o último dia do mês atual
    const hoje = new Date()
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]

    // 1. Busca Receitas (Aulas)
    const { data: aulas } = await supabase
      .from('registro_aulas')
      .select('valor_aula, valor_pago, status_pagamento')
      .gte('data_aula', primeiroDia)
      .lte('data_aula', ultimoDia)

    let totalReceitas = 0
    aulas?.forEach(a => {
      if (a.status_pagamento === 'Pago') totalReceitas += Number(a.valor_aula)
      if (a.status_pagamento === 'Parcial') totalReceitas += Number(a.valor_pago || 0)
    })

    // 2. Busca Receitas (Pacotes) - Baseado na data de criação
    const { data: pacotes } = await supabase
      .from('pacotes')
      .select('valor_pago')
      .gte('created_at', `${primeiroDia}T00:00:00.000Z`)
      .lte('created_at', `${ultimoDia}T23:59:59.999Z`)

    pacotes?.forEach(p => {
      totalReceitas += Number(p.valor_pago || 0)
    })

    // 3. Busca Despesas
    const { data: custos } = await supabase
      .from('registro_custos')
      .select('valor_custo')
      .gte('data_custo', primeiroDia)
      .lte('data_custo', ultimoDia)

    let totalDespesas = 0
    custos?.forEach(c => {
      totalDespesas += Number(c.valor_custo)
    })

    setReceitas(totalReceitas)
    setDespesas(totalDespesas)
    setLoading(false)
  }, [])

  useEffect(() => { carregarDadosDoMes() }, [carregarDadosDoMes])

  const lucroLiquido = receitas - despesas
  const margem = receitas > 0 ? Math.round((lucroLiquido / receitas) * 100) : 0
  
  // Cálculo para a barra visual de proporção (Saúde Financeira)
  const totalMovimentado = receitas + despesas
  const pctReceita = totalMovimentado > 0 ? (receitas / totalMovimentado) * 100 : 50
  const pctDespesa = totalMovimentado > 0 ? (despesas / totalMovimentado) * 100 : 50

  const esconder = (valor: string) => mostrarValores ? valor : 'R$ •••••'

  return (
    <div className="px-4 py-2 flex flex-col gap-6">

      {/* HEADER DA ABA */}
      <div className="flex items-center justify-between -mt-2">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Dashboard</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Visão Geral • {mesAtual}</p>
        </div>
        <button 
          onClick={() => setMostrarValores(!mostrarValores)}
          className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-colors"
        >
          {mostrarValores ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* CARD PRINCIPAL (NUBANK STYLE) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[24px] p-6 shadow-xl relative overflow-hidden">
            {/* Efeito de ruído/textura sutil no fundo */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Wallet size={16} className="text-slate-400" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Lucro Líquido do Mês</span>
              </div>
              
              <div className="flex items-end gap-3 mb-2">
                <span className={`text-4xl font-black tracking-tighter ${lucroLiquido >= 0 ? 'text-white' : 'text-rose-400'}`}>
                  {esconder(formatarValor(lucroLiquido))}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${lucroLiquido >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  <Activity size={12} />
                  {margem}% Margem
                </div>
                <span className="text-xs font-medium text-slate-500">sobre o faturamento</span>
              </div>
            </div>
          </div>

          {/* CARDS DE ENTRADA E SAÍDA */}
          <div className="grid grid-cols-2 gap-3">
            {/* Card Entradas */}
            <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <ArrowUpRight size={16} className="text-emerald-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Entradas</span>
              <span className="text-xl font-black text-slate-800 tracking-tight">
                {esconder(formatarValor(receitas))}
              </span>
            </div>

            {/* Card Saídas */}
            <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center mb-3">
                <ArrowDownRight size={16} className="text-rose-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Saídas</span>
              <span className="text-xl font-black text-slate-800 tracking-tight">
                {esconder(formatarValor(despesas))}
              </span>
            </div>
          </div>

          {/* GRÁFICO DE SAÚDE FINANCEIRA */}
          <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-pink-500" /> Saúde Financeira
            </h3>
            
            {totalMovimentado === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 font-medium italic">Nenhuma movimentação neste mês.</p>
            ) : (
              <div className="space-y-4">
                {/* Barra de Proporção */}
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${pctReceita}%` }} />
                  <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${pctDespesa}%` }} />
                </div>
                
                {/* Legendas da Barra */}
                <div className="flex justify-between items-center text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <TrendingUp size={14} /> {Math.round(pctReceita)}% Receita
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-600">
                    {Math.round(pctDespesa)}% Custo <TrendingDown size={14} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatarValor, parseProfessores } from '@/lib/dateUtils' // <-- ADICIONAMOS A FUNÇÃO DE LIMPEZA AQUI
import { useLanguage } from '@/contexts/LanguageContext'
import { Lightbulb, Building, Flame, PieChart, Users, Package, GraduationCap } from 'lucide-react'

// Função Mágica super-reforçada para limpar qualquer lixo da planilha antiga
function padronizarNomeProf(nomeRaw: string): string {
  if (!nomeRaw) return ''
  // Se vier com aspas ou colchetes perdidos da planilha, limpamos tudo:
  const limpo = nomeRaw.replace(/["\[\]]/g, '').trim().toLowerCase()
  if (limpo === '' || limpo === 'sem professor') return '' 
  
  // Primeira letra maiúscula: arthur -> Arthur
  return limpo.charAt(0).toUpperCase() + limpo.slice(1)
}

export default function InsightsTab() {
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(true)

  const [cnpjData, setCnpjData] = useState({ bancarizado: 0, especie: 0 })
  const [modalidadeData, setModalidadeData] = useState({ particular: 0, grupo: 0 })
  const [pacotesData, setPacotesData] = useState({ avulso: 0, pacote: 0 })
  const [topMeses, setTopMeses] = useState<{ mes: string; total: number }[]>([])
  const [topClientes, setTopClientes] = useState<{ nome: string; total: number }[]>([])
  const [topProfessores, setTopProfessores] = useState<{ nome: string; total: number }[]>([])

  const textosRanking = { pt: 'Ranking de Professores', en: 'Instructors Ranking', es: 'Ranking de Profesores' }
  const labelRankingProfs = textosRanking[language as keyof typeof textosRanking] || 'Ranking de Professores'
  
  const textosTopVol = { pt: 'Top 5 (Volume de Aulas)', en: 'Top 5 (Class Volume)', es: 'Top 5 (Volumen de Clases)' }
  const labelTopVol = textosTopVol[language as keyof typeof textosTopVol] || 'Top 5'

  const textosAulas = { pt: 'aulas', en: 'classes', es: 'clases' }
  const labelAulas = textosAulas[language as keyof typeof textosAulas] || 'aulas'

  useEffect(() => {
    async function fetchInsights() {
      setLoading(true)
      const { data: aulas } = await supabase.from('registro_aulas').select('*').eq('excluido', false)
      const { data: pacotes } = await supabase.from('pacotes').select('*').eq('excluido', false)

      let banc = 0, esp = 0
      let part = 0, grp = 0
      let avulso = 0, pct = 0
      const meses: Record<string, number> = {}
      const clientes: Record<string, number> = {}
      const profs: Record<string, number> = {}

      const somarMes = (dataStr: string, valor: number) => {
        if (!dataStr) return
        const mesAno = dataStr.substring(0, 7)
        meses[mesAno] = (meses[mesAno] || 0) + valor
      }

      const somarCliente = (nome: string, valor: number) => {
        if (!nome) return
        clientes[nome] = (clientes[nome] || 0) + valor
      }

      aulas?.forEach(a => {
        const valorPago = a.status_pagamento === 'Pago' ? Number(a.valor_aula) : (a.status_pagamento === 'Parcial' ? Number(a.valor_pago || 0) : 0)
        
        if (['Pix', 'Cartão de Crédito'].includes(a.forma_pagamento)) banc += valorPago
        else if (['Dinheiro', 'Depix'].includes(a.forma_pagamento)) esp += valorPago

        if (a.modalidade === 'Aula Particular') part += valorPago
        else if (a.modalidade === 'Aula Grupo') grp += valorPago

        if (!a.pacote_id) avulso += valorPago

        // NOVO: Usa a função oficial do sistema (parseProfessores) que quebra a formatação quebrada da planilha
        const arrayProfs = parseProfessores(a.nome_professor)
        if (arrayProfs && arrayProfs.length > 0) {
          arrayProfs.forEach((profNome: string) => {
            const nomeUnificado = padronizarNomeProf(profNome)
            if (nomeUnificado) {
              profs[nomeUnificado] = (profs[nomeUnificado] || 0) + 1
            }
          })
        }

        somarMes(a.data_aula, valorPago)
        somarCliente(a.nome_cliente, valorPago)
      })

      pacotes?.forEach(p => {
        const valorPago = Number(p.valor_pago || 0)

        if (['Pix', 'Cartão de Crédito'].includes(p.forma_pagamento)) banc += valorPago
        else if (['Dinheiro', 'Depix'].includes(p.forma_pagamento)) esp += valorPago

        pct += valorPago

        somarMes(p.created_at, valorPago)
        somarCliente(p.nome_cliente, valorPago)
      })

      setCnpjData({ bancarizado: banc, especie: esp })
      setModalidadeData({ particular: part, grupo: grp })
      setPacotesData({ avulso, pacote: pct })

      const mesesArray = Object.entries(meses)
        .map(([mes, total]) => ({ mes: mes.split('-').reverse().join('/'), total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3)
      setTopMeses(mesesArray)

      const clientesArray = Object.entries(clientes)
        .map(([nome, total]) => ({ nome, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
      setTopClientes(clientesArray)

      const profsArray = Object.entries(profs)
        .map(([nome, total]) => ({ nome, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
      setTopProfessores(profsArray)

      setLoading(false)
    }
    fetchInsights()
  }, [])

  const totalCnpj = cnpjData.bancarizado + cnpjData.especie
  const pctBancarizado = totalCnpj > 0 ? Math.round((cnpjData.bancarizado / totalCnpj) * 100) : 0
  const pctEspecie = totalCnpj > 0 ? Math.round((cnpjData.especie / totalCnpj) * 100) : 0

  const totalMod = modalidadeData.particular + modalidadeData.grupo
  const pctPart = totalMod > 0 ? Math.round((modalidadeData.particular / totalMod) * 100) : 0
  const pctGrp = totalMod > 0 ? Math.round((modalidadeData.grupo / totalMod) * 100) : 0

  const totalPkg = pacotesData.avulso + pacotesData.pacote
  const pctAvulso = totalPkg > 0 ? Math.round((pacotesData.avulso / totalPkg) * 100) : 0
  const pctPct = totalPkg > 0 ? Math.round((pacotesData.pacote / totalPkg) * 100) : 0

  return (
    <div className="px-4 py-2 flex flex-col gap-6 pb-24 animate-in fade-in duration-500 min-h-[80vh]">
      
      <div className="flex items-center gap-3 -mt-2">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
          <Lightbulb size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">
            {t.insightsTab.titulo}
          </h2>
          <p className="text-xs font-medium text-slate-500">
            {t.insightsTab.subtitulo}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="flex flex-col gap-5">

          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Building size={16} className="text-indigo-500" /> {t.insightsTab.radarCnpj}
            </h3>
            <div className="flex justify-between items-end mb-2">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest block">{t.insightsTab.bancarizado}</span>
                <span className="text-lg font-black text-slate-800">{formatarValor(cnpjData.bancarizado)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest block">{t.insightsTab.especie}</span>
                <span className="text-lg font-black text-slate-800">{formatarValor(cnpjData.especie)}</span>
              </div>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div style={{ width: `${pctBancarizado}%` }} className="bg-indigo-500 h-full transition-all" />
              <div style={{ width: `${pctEspecie}%` }} className="bg-emerald-500 h-full transition-all" />
            </div>
            <div className="flex justify-between mt-1 text-[10px] font-bold text-slate-400">
              <span>{pctBancarizado}% Oficial</span>
              <span>{pctEspecie}% Por Fora</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 flex flex-col justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                <PieChart size={16} className="text-rose-500" /> {t.insightsTab.raioX}
              </h3>
              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">{t.insightsTab.particular} ({pctPart}%)</span>
                  <span className="text-sm font-black text-slate-800">{formatarValor(modalidadeData.particular)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">{t.insightsTab.grupo} ({pctGrp}%)</span>
                  <span className="text-sm font-black text-slate-800">{formatarValor(modalidadeData.grupo)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 flex flex-col justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Package size={16} className="text-sky-500" /> {t.insightsTab.pesoPacotes}
              </h3>
              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">{t.insightsTab.avulsas} ({pctAvulso}%)</span>
                  <span className="text-sm font-black text-slate-800">{formatarValor(pacotesData.avulso)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">{t.insightsTab.pacotes} ({pctPct}%)</span>
                  <span className="text-sm font-black text-slate-800">{formatarValor(pacotesData.pacote)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[24px] shadow-sm p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Flame size={16} className="text-orange-500" /> {t.insightsTab.termometro}
            </h3>
            <div className="flex flex-col gap-3">
              {topMeses.map((m, i) => (
                <div key={m.mes} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="text-orange-500 font-black text-sm">#{i + 1}</span>
                    <span className="text-sm font-bold text-slate-200">{m.mes}</span>
                  </div>
                  <span className="text-sm font-black text-white">{formatarValor(m.total)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <GraduationCap size={16} className="text-violet-500" /> {labelRankingProfs}
            </h3>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">{labelTopVol}</span>
            <div className="flex flex-col gap-2">
              {topProfessores.map((p, i) => (
                <div key={p.nome} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-300 w-4">{i + 1}º</span>
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{p.nome}</span>
                  </div>
                  <span className="text-xs font-black text-slate-800">
                    {p.total} <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{labelAulas}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Users size={16} className="text-pink-500" /> {t.insightsTab.fidelidade}
            </h3>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">{t.insightsTab.topAlunos}</span>
            <div className="flex flex-col gap-2">
              {topClientes.map((c, i) => (
                <div key={c.nome} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-300 w-4">{i + 1}º</span>
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{c.nome}</span>
                  </div>
                  <span className="text-xs font-black text-slate-800">{formatarValor(c.total)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
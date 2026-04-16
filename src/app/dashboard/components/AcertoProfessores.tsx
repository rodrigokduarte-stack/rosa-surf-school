'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Periodo, formatarValor, parseProfessores, getRange } from '@/lib/dateUtils'
import { User, Calculator } from 'lucide-react'

// Estrutura nova: Agrupado direto por professor
interface AcertoResumo {
  professor: string
  numAulas: number
  total: number
}

export default function AcertoProfessores({ periodo }: { periodo: Periodo }) {
  const [resumo, setResumo] = useState<AcertoResumo[]>([])
  const [loading, setLoading] = useState(true)

  async function carregarDados() {
    setLoading(true)
    
    // Pega o período exato (Hoje, Semana, Mês ou Tudo)
    let { inicio, fim } = getRange(periodo)
    
    // Se for 'hoje', busca os últimos 3 dias para dar um contexto rápido
    if (periodo === 'hoje') {
      const tresDiasAtras = new Date()
      tresDiasAtras.setDate(tresDiasAtras.getDate() - 3)
      inicio = tresDiasAtras.toISOString().split('T')[0]
    }

    let aulasQ = supabase.from('registro_aulas').select('data_aula, nome_professor')
    if (inicio) aulasQ = aulasQ.gte('data_aula', inicio)
    if (fim) aulasQ = aulasQ.lte('data_aula', fim)

    const profsQ = supabase.from('professores').select('nome, valor_aula')

    const [{ data: aulas }, { data: profs }] = await Promise.all([aulasQ, profsQ])

    const profsList = profs ?? []
    
    // Mapeia os valores atuais de cada professor
    const profsMap = profsList.reduce((acc, prof) => {
      acc[prof.nome] = Number(prof.valor_aula) || 100
      return acc
    }, {} as Record<string, number>)

    // NOVO MOTOR DE AGRUPAMENTO (Agrupa por Professor e não por Data)
    const map: Record<string, AcertoResumo> = {}
    
    for (const aula of aulas ?? []) {
      const professoresParticipantes = parseProfessores(aula.nome_professor)
      
      for (const prof of professoresParticipantes) {
        if (!map[prof]) {
          map[prof] = { professor: prof, numAulas: 0, total: 0 }
        }
        map[prof].numAulas++
        map[prof].total += (profsMap[prof] ?? 100) // Puxa a taxa dinâmica
      }
    }

    // Ordena do professor que tem mais a receber para o menor
    const listaOrdenada = Object.values(map).sort((a, b) => b.total - a.total)
    
    setResumo(listaOrdenada)
    setLoading(false)
  }

  useEffect(() => { carregarDados() }, [periodo])

  const totalPeriodo = resumo.reduce((s, r) => s + r.total, 0)

  if (loading) return <div className="py-6 animate-pulse text-center text-slate-400 text-sm">Calculando repasses...</div>

  return (
    <div className="flex flex-col gap-3">
      {/* Banner de Total */}
      {totalPeriodo > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between print:bg-transparent print:border-none print:px-0">
          <div className="flex flex-col">
            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Total a Repassar</span>
            <span className="text-sm text-slate-500">{periodo === 'hoje' ? 'Últimos 3 dias' : 'No período selecionado'}</span>
          </div>
          <span className="font-black text-slate-800 text-lg">{formatarValor(totalPeriodo)}</span>
        </div>
      )}

      {resumo.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center text-slate-400 text-sm border border-slate-100 print:shadow-none print:border-slate-200">
          Nenhuma aula registrada neste período para repasse.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-slate-200">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/50 border-b border-slate-100 print:bg-slate-100">
            <Calculator size={14} className="text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Resumo Consolidado</span>
          </div>
          
          <div className="divide-y divide-slate-50">
            {resumo.map(item => (
              <div key={item.professor} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm shrink-0 print:border print:border-slate-200">
                  {item.professor.substring(0,2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-[15px] leading-tight">{item.professor}</p>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{item.numAulas} aula(s) dadas</p>
                </div>
                <span className="font-black text-slate-700 text-base">{formatarValor(item.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
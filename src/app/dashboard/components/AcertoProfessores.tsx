'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Periodo, formatarData, formatarValor, parseProfessores, getRange } from '@/lib/dateUtils'
import { User, Calendar, clock } from 'lucide-react'

interface AcertoEntry {
  data: string
  professor: string
  numAulas: number
  total: number
}

export default function AcertoProfessores({ periodo }: { periodo: Periodo }) {
  const [entries, setEntries] = useState<AcertoEntry[]>([])
  const [loading, setLoading] = useState(true)

  async function carregarDados() {
    setLoading(true)
    
    // Lógica para não deixar passar aula não paga:
    // Se estiver em "Hoje", buscamos os últimos 7 dias para garantir que nada ficou para trás.
    let { inicio, fim } = getRange(periodo)
    if (periodo === 'hoje') {
      const seteDiasAtras = new Date()
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
      inicio = seteDiasAtras.toISOString().split('T')[0]
    }

    let aulasQ = supabase.from('registro_aulas').select('data_aula, nome_professor')
    if (inicio) aulasQ = aulasQ.gte('data_aula', inicio)
    if (fim) aulasQ = aulasQ.lte('data_aula', fim)

    const { data: aulas } = await aulasQ

    const map: Record<string, AcertoEntry> = {}
    for (const aula of aulas ?? []) {
      const profs = parseProfessores(aula.nome_professor)
      for (const prof of profs) {
        const key = `${aula.data_aula}|${prof}`
        if (!map[key]) map[key] = { data: aula.data_aula, professor: prof, numAulas: 0, total: 0 }
        map[key].numAulas++
        map[key].total += 100
      }
    }

    setEntries(Object.values(map).sort((a, b) => b.data.localeCompare(a.data)))
    setLoading(false)
  }

  useEffect(() => { carregarDados() }, [periodo])

  const byDate: Record<string, AcertoEntry[]> = {}
  for (const e of entries) {
    if (!byDate[e.data]) byDate[e.data] = []
    byDate[e.data].push(e)
  }
  const datas = Object.keys(byDate).sort((a, b) => b.localeCompare(a))
  const totalPeriodo = entries.reduce((s, e) => s + e.total, 0)

  if (loading) return <div className="py-6 animate-pulse text-center text-slate-400 text-sm">Carregando acertos...</div>

  return (
    <div className="flex flex-col gap-3">
      {totalPeriodo > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-pink-600 font-bold uppercase tracking-wider">Repasses Pendentes</span>
            <span className="text-sm text-pink-700 opacity-70">{periodo === 'hoje' ? 'Últimos 7 dias' : 'No período'}</span>
          </div>
          <span className="font-bold text-pink-700 text-lg">{formatarValor(totalPeriodo)}</span>
        </div>
      )}

      {datas.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center text-slate-400 text-sm">
          Nenhuma aula para pagar nos últimos dias.
        </div>
      ) : (
        datas.map(data => (
          <div key={data} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/50 border-b border-slate-100">
              <Calendar size={12} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase">{formatarData(data)}</span>
            </div>
            <div className="divide-y divide-slate-50">
              {byDate[data].map(entry => (
                <div key={`${entry.data}-${entry.professor}`} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <User size={14} className="text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">{entry.professor}</p>
                    <p className="text-xs text-slate-400">{entry.numAulas} aula(s)</p>
                  </div>
                  <span className="font-bold text-slate-700 text-sm">{formatarValor(entry.total)}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
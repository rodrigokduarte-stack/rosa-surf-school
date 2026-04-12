'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Periodo, formatarData, formatarValor, parseProfessores, getRange } from '@/lib/dateUtils'
import { User, Calendar } from 'lucide-react'

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
    const { inicio, fim } = getRange(periodo)

    let aulasQ = supabase.from('registro_aulas').select('data_aula, nome_professor')
    if (inicio) aulasQ = aulasQ.gte('data_aula', inicio)
    if (fim) aulasQ = aulasQ.lte('data_aula', fim)

    const { data: aulas } = await aulasQ

    // Monta mapa: "data|professor" → AcertoEntry
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

  // Agrupa por data
  const byDate: Record<string, AcertoEntry[]> = {}
  for (const e of entries) {
    if (!byDate[e.data]) byDate[e.data] = []
    byDate[e.data].push(e)
  }
  const datas = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  const totalPeriodo = entries.reduce((s, e) => s + e.total, 0)

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-6 h-6 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center text-slate-400">
        <p className="text-sm">Nenhuma aula com professor no período</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Resumo do total do período */}
      {totalPeriodo > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-pink-700">Total repasses no período</span>
          <span className="font-bold text-pink-700">{formatarValor(totalPeriodo)}</span>
        </div>
      )}

      {/* Agrupado por data */}
      {datas.map(data => (
        <div key={data} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
            <Calendar size={13} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-600">{formatarData(data)}</span>
            <span className="ml-auto text-xs text-slate-400">
              {formatarValor(byDate[data].reduce((s, e) => s + e.total, 0))} total
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {byDate[data].map(entry => {
              const key = `${entry.data}|${entry.professor}`
              return (
                <div key={key} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-pink-100">
                    <User size={16} className="text-pink-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{entry.professor}</p>
                    <p className="text-xs text-slate-400">
                      {entry.numAulas} aula{entry.numAulas !== 1 ? 's' : ''} · {formatarValor(entry.total)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
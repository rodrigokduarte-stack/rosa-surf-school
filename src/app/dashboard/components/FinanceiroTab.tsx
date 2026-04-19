'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Periodo, getRange, parseProfessores, formatarValor } from '@/lib/dateUtils'
import { ChevronDown, ChevronRight, User, Calendar, Receipt } from 'lucide-react'

interface AcertoProfessoresProps {
  periodo: Periodo
}

interface AulaDetalhe {
  id: string
  data_aula: string
  nome_cliente: string
  valor_repasse: number
}

interface ResumoProfessor {
  nome: string
  total: number
  aulas: AulaDetalhe[]
}

// Função local para formatar a data para "18/04"
function formatarDataCurta(dataStr: string) {
  if (!dataStr) return ''
  const partes = dataStr.split('-')
  if (partes.length !== 3) return dataStr
  return `${partes[2]}/${partes[1]}`
}

export default function AcertoProfessores({ periodo }: AcertoProfessoresProps) {
  const [resumo, setResumo] = useState<ResumoProfessor[]>([])
  const [loading, setLoading] = useState(true)
  const [expandidoId, setExpandidoId] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    setLoading(true)
    const { inicio, fim } = getRange(periodo)

    // Busca as aulas (agora trazendo o nome do cliente e id)
    let aulasQ = supabase
      .from('registro_aulas')
      .select('id, data_aula, nome_cliente, nome_professor')
    if (inicio) aulasQ = aulasQ.gte('data_aula', inicio)
    if (fim) aulasQ = aulasQ.lte('data_aula', fim)

    // Busca os valores base dos professores
    const profsQ = supabase.from('professores').select('nome, valor_aula')

    const [{ data: aulas }, { data: profs }] = await Promise.all([aulasQ, profsQ])

    const aulasList = aulas ?? []
    const profsList = profs ?? []

    // Mapa de quanto cada professor cobra (padrão R$100 se não tiver cadastro)
    const profsMap = profsList.reduce((acc, prof) => {
      acc[prof.nome] = Number(prof.valor_aula) || 100
      return acc
    }, {} as Record<string, number>)

    // Agrupamento detalhado
    const agrupamento: Record<string, ResumoProfessor> = {}

    aulasList.forEach(aula => {
      const nomesProfs = parseProfessores(aula.nome_professor)
      if (!nomesProfs || nomesProfs.length === 0) return

      nomesProfs.forEach(nome => {
        const valorRepasse = profsMap[nome] ?? 100

        if (!agrupamento[nome]) {
          agrupamento[nome] = { nome, total: 0, aulas: [] }
        }

        agrupamento[nome].total += valorRepasse
        agrupamento[nome].aulas.push({
          id: aula.id,
          data_aula: aula.data_aula,
          nome_cliente: aula.nome_cliente || 'Aluno não informado',
          valor_repasse: valorRepasse
        })
      })
    })

    // Converte para array e ordena alfabeticamente
    const resultadoFinal = Object.values(agrupamento).sort((a, b) => a.nome.localeCompare(b.nome))

    // Ordena as aulas de cada professor da mais recente para a mais antiga
    resultadoFinal.forEach(prof => {
      prof.aulas.sort((a, b) => new Date(b.data_aula).getTime() - new Date(a.data_aula).getTime())
    })

    setResumo(resultadoFinal)
    setLoading(false)
  }, [periodo])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  function toggleExpandir(nomeProf: string) {
    if (expandidoId === nomeProf) {
      setExpandidoId(null) // Fecha se já estiver aberto
    } else {
      setExpandidoId(nomeProf) // Abre o clicado
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (resumo.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-sm font-medium">
        Nenhuma aula para repasse neste período.
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {resumo.map((prof, index) => {
        const isExpanded = expandidoId === prof.nome
        const isUltimo = index === resumo.length - 1

        return (
          <div key={prof.nome} className={`flex flex-col ${!isUltimo ? 'border-b border-slate-100' : ''}`}>
            
            {/* LINHA DO PROFESSOR (CLICÁVEL) */}
            <button 
              onClick={() => toggleExpandir(prof.nome)}
              className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors active:bg-slate-100 w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${isExpanded ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-500'}`}>
                  <User size={14} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 leading-tight">{prof.nome}</h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">
                    {prof.aulas.length} aula{prof.aulas.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-base font-black text-slate-800 tracking-tight">
                  {formatarValor(prof.total)}
                </span>
                <div className="text-slate-300">
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>
            </button>

            {/* EXTRATO DETALHADO (SANFONA) */}
            {isExpanded && (
              <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Receipt size={12} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Extrato de Aulas</span>
                </div>
                
                {prof.aulas.map((aula, i) => (
                  <div key={aula.id + i} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                        <Calendar size={10} /> {formatarDataCurta(aula.data_aula)}
                      </div>
                      <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                        {aula.nome_cliente}
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-600">
                      {formatarValor(aula.valor_repasse)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        )
      })}
    </div>
  )
}
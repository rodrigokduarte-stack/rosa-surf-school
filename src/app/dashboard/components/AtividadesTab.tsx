'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Activity, Clock, User, Info } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

type Atividade = {
  id: string
  created_at: string
  usuario: string
  acao: string
  detalhes: string
}

export default function AtividadesTab() {
  const { t } = useLanguage()
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [loading, setLoading] = useState(true)

  const carregarAtividades = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('historico_atividades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100) // Puxa os últimos 100 registros para não pesar
      
    setAtividades(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    carregarAtividades()
  }, [carregarAtividades])

  function formatarTempoPassado(dataStr: string) {
    const dataAtividade = new Date(dataStr)
    const hoje = new Date()
    const diffEmMs = hoje.getTime() - dataAtividade.getTime()
    const diffEmDias = Math.floor(diffEmMs / (1000 * 60 * 60 * 24))

    if (diffEmDias === 0) return t.atividadesTab.hoje
    if (diffEmDias === 1) return t.atividadesTab.ontem
    return `${diffEmDias} ${t.atividadesTab.diasAtras}`
  }

  function formatarHora(dataStr: string) {
    return new Date(dataStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="px-4 py-2 flex flex-col gap-6 animate-in fade-in duration-500 min-h-[80vh]">
      
      <div className="flex items-center gap-3 -mt-2">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Activity size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">
            {t.atividadesTab.titulo}
          </h2>
          <p className="text-xs font-medium text-slate-500">
            {t.atividadesTab.subtitulo}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 overflow-hidden pb-24">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : atividades.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center gap-2 text-slate-400">
            <Activity size={32} className="opacity-50" />
            <p className="text-sm font-semibold">{t.atividadesTab.nenhumRegistro}</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 ml-3 flex flex-col gap-6">
            {atividades.map((item) => (
              <div key={item.id} className="relative pl-6">
                {/* Bolinha da timeline */}
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-indigo-500 shadow-sm" />
                
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 transition-all hover:border-indigo-100 hover:bg-indigo-50/30">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-100/50 px-2.5 py-1 rounded-md">
                      {item.acao}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock size={12} />
                      <span className="text-[10px] font-bold">
                        {formatarTempoPassado(item.created_at)} • {formatarHora(item.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-700 font-medium leading-snug mb-3">
                    {item.detalhes}
                  </p>
                  
                  <div className="flex items-center gap-1.5 text-slate-400 pt-3 border-t border-slate-200/60">
                    <User size={12} />
                    <span className="text-[10px] font-bold truncate">
                      {item.usuario}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
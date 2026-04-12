'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RegistroAula } from '@/types'
import { CheckCircle, AlertCircle, Clock, User, DollarSign, MessageCircle, X } from 'lucide-react'
import { formatarData, formatarValor } from '@/lib/dateUtils'

function formatarNumero(value: string): string {
  return value.replace(/[^\d\s\-()+ ]/g, '')
}

export default function InadimplentesTab() {
  const [aulas, setAulas] = useState<RegistroAula[]>([])
  const [loading, setLoading] = useState(true)
  const [liquidando, setLiquidando] = useState<string | null>(null)
  const [cobrancaAula, setCobrancaAula] = useState<RegistroAula | null>(null)
  const [numero, setNumero] = useState('')

  const carregarInadimplentes = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('registro_aulas')
      .select('*')
      .eq('status_pagamento', 'Pendente')
      .order('data_aula', { ascending: false })
      .order('horario', { ascending: true })
    setAulas(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { carregarInadimplentes() }, [carregarInadimplentes])

  async function liquidar(id: string) {
    setLiquidando(id)
    const { error } = await supabase
      .from('registro_aulas')
      .update({ status_pagamento: 'Pago' })
      .eq('id', id)
    setLiquidando(null)
    if (!error) setAulas(prev => prev.filter(a => a.id !== id))
  }

  function abrirCobranca(aula: RegistroAula) {
    setCobrancaAula(aula)
    setNumero('')
  }

  function enviarWhatsApp() {
    if (!cobrancaAula) return
    const digits = numero.replace(/\D/g, '')
    if (digits.length < 7) return

    const data = formatarData(cobrancaAula.data_aula)
    const valor = formatarValor(Number(cobrancaAula.valor_aula))
    const texto = encodeURIComponent(
      `Passando para lembrar o pagamento da aula de surf do dia ${data}, no valor de ${valor}. Podemos acertar?`
    )
    window.open(`https://wa.me/${digits}?text=${texto}`, '_blank')
    setCobrancaAula(null)
    setNumero('')
  }

  const totalPendente = aulas.reduce((s, a) => s + Number(a.valor_aula), 0)

  return (
    <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">

      {/* Título */}
      <div className="flex items-center gap-2">
        <AlertCircle size={20} className="text-amber-500" />
        <h2 className="text-lg font-bold text-slate-800">Inadimplentes</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : aulas.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 shadow-sm text-center">
          <CheckCircle size={44} className="mx-auto mb-3 text-emerald-400" />
          <p className="font-semibold text-slate-700 text-lg">Tudo em dia!</p>
          <p className="text-sm text-slate-400 mt-1">Nenhum pagamento pendente</p>
        </div>
      ) : (
        <>
          {/* Banner total */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-amber-600" />
              <span className="text-sm font-medium text-amber-700">
                {aulas.length} pagamento{aulas.length !== 1 ? 's' : ''} pendente{aulas.length !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="font-bold text-amber-700 text-base">{formatarValor(totalPendente)}</span>
          </div>

          {/* Lista de inadimplentes */}
          <div className="flex flex-col gap-3">
            {aulas.map(aula => (
              <div key={aula.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-semibold text-slate-800">{aula.nome_cliente}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        aula.modalidade === 'Aula Particular'
                          ? 'bg-pink-100 text-pink-700'
                          : 'bg-violet-100 text-violet-700'
                      }`}>
                        {aula.modalidade}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {formatarData(aula.data_aula)} · {aula.horario}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={11} />
                        {Array.isArray(aula.nome_professor)
                          ? aula.nome_professor.join(', ')
                          : aula.nome_professor}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-bold text-slate-800 text-base">
                      {formatarValor(Number(aula.valor_aula))}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => abrirCobranca(aula)}
                        className="p-1.5 text-slate-300 hover:text-[#25D366] hover:bg-green-50 rounded-xl transition-colors"
                        title="Cobrar via WhatsApp"
                      >
                        <MessageCircle size={15} />
                      </button>
                      <button
                        onClick={() => liquidar(aula.id)}
                        disabled={liquidando === aula.id}
                        className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 px-4 py-2 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-1"
                      >
                        {liquidando === aula.id
                          ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <CheckCircle size={13} />}
                        {liquidando === aula.id ? '' : 'Liquidar'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Painel de cobrança inline */}
                {cobrancaAula?.id === aula.id && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-600">Número do WhatsApp</p>
                      <button onClick={() => setCobrancaAula(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={14} />
                      </button>
                    </div>
                    <input
                      type="tel"
                      value={numero}
                      onChange={e => setNumero(formatarNumero(e.target.value))}
                      placeholder="+55 11 99999-9999"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      autoFocus
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Inclua o código do país (ex: +55)</p>
                    <button
                      onClick={enviarWhatsApp}
                      disabled={numero.replace(/\D/g, '').length < 7}
                      className="mt-2 w-full bg-[#25D366] hover:bg-[#1ebe5c] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={15} />
                      Abrir WhatsApp
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="h-4" />
    </div>
  )
}

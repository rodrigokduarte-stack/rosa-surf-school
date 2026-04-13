'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RegistroAula, Pacote } from '@/types'
// Removi o ícone User que estava sem uso
import { CheckCircle, AlertCircle, Clock, DollarSign, MessageCircle, X, Package } from 'lucide-react'
import { formatarData, formatarValor } from '@/lib/dateUtils'

// Criamos um "Aviso" para o TypeScript entender o valor_pago
type AulaComPagamento = RegistroAula & { valor_pago?: number }

function formatarNumero(value: string): string {
  return value.replace(/[^\d\s\-()+ ]/g, '')
}

export default function InadimplentesTab() {
  // Aplicamos a tipagem nova aqui
  const [aulas, setAulas] = useState<AulaComPagamento[]>([])
  const [pacotes, setPacotes] = useState<Pacote[]>([])
  const [loading, setLoading] = useState(true)
  const [liquidando, setLiquidando] = useState<string | null>(null)
  
  const [cobrancaId, setCobrancaId] = useState<string | null>(null)
  const [cobrancaTipo, setCobrancaTipo] = useState<'aula' | 'pacote' | null>(null)
  const [numero, setNumero] = useState('')

  const carregarInadimplentes = useCallback(async () => {
    setLoading(true)
    
    const { data: aulasData } = await supabase
      .from('registro_aulas')
      .select('*')
      .in('status_pagamento', ['Pendente', 'Parcial'])
      .order('data_aula', { ascending: false })
      .order('horario', { ascending: true })
    
    const { data: pacotesData } = await supabase
      .from('pacotes')
      .select('*')
      .order('created_at', { ascending: false })

    const pacotesDevedores = (pacotesData ?? []).filter(p => Number(p.valor_pago) < Number(p.valor_total))

    setAulas(aulasData ?? [])
    setPacotes(pacotesDevedores)
    setLoading(false)
  }, [])

  useEffect(() => { carregarInadimplentes() }, [carregarInadimplentes])

  // Aplicamos a tipagem nova aqui
  async function liquidarAula(aula: AulaComPagamento) {
    setLiquidando(aula.id)
    const { error } = await supabase
      .from('registro_aulas')
      .update({ 
        status_pagamento: 'Pago',
        valor_pago: aula.valor_aula
      })
      .eq('id', aula.id)
    
    setLiquidando(null)
    if (!error) setAulas(prev => prev.filter(a => a.id !== aula.id))
  }

  async function liquidarPacote(pacote: Pacote) {
    setLiquidando(pacote.id)
    const { error } = await supabase
      .from('pacotes')
      .update({ 
        valor_pago: pacote.valor_total
      })
      .eq('id', pacote.id)
    
    setLiquidando(null)
    if (!error) setPacotes(prev => prev.filter(p => p.id !== pacote.id))
  }

  function abrirCobranca(id: string, tipo: 'aula' | 'pacote') {
    setCobrancaId(id)
    setCobrancaTipo(tipo)
    setNumero('')
  }

  function fecharCobranca() {
    setCobrancaId(null)
    setCobrancaTipo(null)
    setNumero('')
  }

  // Aplicamos a tipagem nova aqui
  function enviarWhatsAppAula(aula: AulaComPagamento) {
    const digits = numero.replace(/\D/g, '')
    if (digits.length < 7) return
    const data = formatarData(aula.data_aula)
    const valorDevido = Number(aula.valor_aula) - Number(aula.valor_pago || 0)
    const texto = encodeURIComponent(`Olá! Passando para lembrar o pagamento pendente da aula de surf do dia ${data}, no valor de ${formatarValor(valorDevido)}. Podemos acertar?`)
    window.open(`https://wa.me/${digits}?text=${texto}`, '_blank')
    fecharCobranca()
  }

  function enviarWhatsAppPacote(pacote: Pacote) {
    const digits = numero.replace(/\D/g, '')
    if (digits.length < 7) return
    const valorDevido = Number(pacote.valor_total) - Number(pacote.valor_pago || 0)
    const texto = encodeURIComponent(`Olá, ${pacote.nome_cliente}! Passando para lembrar a parcela pendente do seu pacote de surf, no valor de ${formatarValor(valorDevido)}. Podemos acertar?`)
    window.open(`https://wa.me/${digits}?text=${texto}`, '_blank')
    fecharCobranca()
  }

  const dividaAulas = aulas.reduce((s, a) => s + Math.max(0, Number(a.valor_aula) - Number(a.valor_pago || 0)), 0)
  const dividaPacotes = pacotes.reduce((s, p) => s + Math.max(0, Number(p.valor_total) - Number(p.valor_pago || 0)), 0)
  const totalPendente = dividaAulas + dividaPacotes

  return (
    <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <AlertCircle size={20} className="text-red-500" />
        <h2 className="text-lg font-bold text-slate-800">Inadimplentes</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : aulas.length === 0 && pacotes.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 shadow-sm text-center">
          <CheckCircle size={44} className="mx-auto mb-3 text-emerald-400" />
          <p className="font-semibold text-slate-700 text-lg">Tudo em dia!</p>
          <p className="text-sm text-slate-400 mt-1">Nenhum pagamento pendente no caixa.</p>
        </div>
      ) : (
        <>
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-red-600" />
              <span className="text-sm font-medium text-red-700">Total na rua</span>
            </div>
            <span className="font-bold text-red-700 text-lg">{formatarValor(totalPendente)}</span>
          </div>

          {pacotes.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-500 flex items-center gap-1.5 mt-2 ml-1">
                <Package size={14} /> Pacotes Pendentes
              </h3>
              {pacotes.map(pacote => {
                const devido = Math.max(0, Number(pacote.valor_total) - Number(pacote.valor_pago || 0))
                return (
                  <div key={pacote.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-slate-800">{pacote.nome_cliente}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wider">
                            Pacote
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Total: {formatarValor(Number(pacote.valor_total))}</p>
                        {Number(pacote.valor_pago) > 0 && (
                          <p className="text-xs text-slate-400">Pago: {formatarValor(Number(pacote.valor_pago))}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-xs text-red-500 font-medium block -mb-1">Falta pagar</span>
                          <span className="font-bold text-slate-800 text-base">{formatarValor(devido)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => abrirCobranca(pacote.id, 'pacote')} className="p-1.5 text-slate-300 hover:text-[#25D366] hover:bg-green-50 rounded-xl transition-colors">
                            <MessageCircle size={15} />
                          </button>
                          <button onClick={() => liquidarPacote(pacote)} disabled={liquidando === pacote.id} className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 px-4 py-2 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-1">
                            {liquidando === pacote.id ? <span className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={13} />}
                            {liquidando === pacote.id ? '' : 'Quitar'}
                          </button>
                        </div>
                      </div>
                    </div>
                    {cobrancaId === pacote.id && cobrancaTipo === 'pacote' && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-slate-600">WhatsApp do Cliente</p>
                          <button onClick={fecharCobranca} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                        </div>
                        <input type="tel" value={numero} onChange={e => setNumero(formatarNumero(e.target.value))} placeholder="+55 11 99999-9999" className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        <button onClick={() => enviarWhatsAppPacote(pacote)} disabled={numero.replace(/\D/g, '').length < 7} className="mt-2 w-full bg-[#25D366] hover:bg-[#1ebe5c] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                          <MessageCircle size={15} /> Abrir WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {aulas.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-500 flex items-center gap-1.5 mt-2 ml-1">
                <Clock size={14} /> Aulas Pendentes
              </h3>
              {aulas.map(aula => {
                const devido = Math.max(0, Number(aula.valor_aula) - Number(aula.valor_pago || 0))
                return (
                  <div key={aula.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-semibold text-slate-800">{aula.nome_cliente}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${aula.modalidade === 'Aula Particular' ? 'bg-pink-100 text-pink-700' : 'bg-violet-100 text-violet-700'}`}>{aula.modalidade}</span>
                          {aula.status_pagamento === 'Parcial' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 uppercase tracking-wider">Parcial</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1"><Clock size={11} />{formatarData(aula.data_aula)} · {aula.horario}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-xs text-red-500 font-medium block -mb-1">{aula.status_pagamento === 'Parcial' ? 'Falta pagar' : 'Pendente'}</span>
                          <span className="font-bold text-slate-800 text-base">{formatarValor(devido)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => abrirCobranca(aula.id, 'aula')} className="p-1.5 text-slate-300 hover:text-[#25D366] hover:bg-green-50 rounded-xl transition-colors">
                            <MessageCircle size={15} />
                          </button>
                          <button onClick={() => liquidarAula(aula)} disabled={liquidando === aula.id} className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 px-4 py-2 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-1">
                            {liquidando === aula.id ? <span className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={13} />}
                            {liquidando === aula.id ? '' : 'Quitar'}
                          </button>
                        </div>
                      </div>
                    </div>
                    {cobrancaId === aula.id && cobrancaTipo === 'aula' && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-slate-600">WhatsApp do Cliente</p>
                          <button onClick={fecharCobranca} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                        </div>
                        <input type="tel" value={numero} onChange={e
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { TermoAssinado } from '@/types'
import { FileText, MessageCircle, X, CheckCircle } from 'lucide-react'

function formatarDataHora(ts: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ts))
}

export default function TermosTab() {
  const [termos, setTermos] = useState<TermoAssinado[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarWpp, setMostrarWpp] = useState(false)
  const [numero, setNumero] = useState('')
  const [linkCopiado, setLinkCopiado] = useState(false)

  const carregarTermos = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('termos_assinados')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setTermos(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { carregarTermos() }, [carregarTermos])

  function gerarLinkWhatsApp() {
    const digits = numero.replace(/\D/g, '')
    if (digits.length < 7) return
    const url = typeof window !== 'undefined' ? window.location.origin : ''
    const texto = encodeURIComponent(`Por favor, assine o termo de responsabilidade: ${url}/termo`)
    window.open(`https://wa.me/${digits}?text=${texto}`, '_blank')
    setMostrarWpp(false)
    setNumero('')
  }

  async function copiarLink() {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/termo` : '/termo'
    await navigator.clipboard.writeText(url)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setMostrarWpp(v => !v)}
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5c] text-white font-semibold py-4 rounded-2xl shadow-sm"
        >
          <MessageCircle size={20} />
          Enviar Termo via WhatsApp
        </button>

        {mostrarWpp && (
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-slate-700 text-sm">WhatsApp Aluno</p>
              <button onClick={() => setMostrarWpp(false)} className="text-slate-400">
                <X size={16} />
              </button>
            </div>
            <input
              type="tel"
              value={numero}
              onChange={e => setNumero(e.target.value.replace(/[^\d\s\-()+ ]/g, ''))}
              placeholder="+55 48 99999-9999"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={gerarLinkWhatsApp}
              disabled={numero.replace(/\D/g, '').length < 7}
              className="mt-3 w-full bg-[#25D366] text-white font-semibold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} /> Abrir WhatsApp
            </button>
          </div>
        )}

        <button
          onClick={copiarLink}
          className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 font-medium py-3 rounded-2xl text-sm"
        >
          {linkCopiado ? 'Link copiado!' : 'Copiar link do termo'}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-slate-700 px-1">Recentemente Assinados</h2>
        {loading ? (
          <div className="animate-spin w-6 h-6 border-4 border-pink-500 border-t-transparent rounded-full mx-auto" />
        ) : (
          termos.map(termo => (
            <div key={termo.id} className="bg-white rounded-2xl shadow-sm p-4 flex justify-between">
              <div>
                <p className="font-semibold text-slate-800">{termo.nome_aluno}</p>
                <p className="text-xs text-slate-500">{termo.cpf}</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p className="text-emerald-600 font-bold">Assinado</p>
                <p>{termo.created_at ? formatarDataHora(termo.created_at) : ''}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
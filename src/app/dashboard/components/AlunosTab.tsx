'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { pt } from '@/dictionaries/pt'
import { 
  UserSquare, Search, ChevronDown, ChevronUp, 
  Phone, Calendar, User, FileText, Trash2, Waves, MessageCircle, X, Link
} from 'lucide-react'

export default function AlunosTab() {
  const { t } = useLanguage()
  const [alunos, setAlunos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  
  // Envio de Termo (WhatsApp e Copiar)
  const [mostrarWpp, setMostrarWpp] = useState(false)
  const [numero, setNumero] = useState('')
  const [linkCopiado, setLinkCopiado] = useState(false)

  // CRM States
  const [alunoExpandido, setAlunoExpandido] = useState<string | null>(null)
  const [historicoAulas, setHistoricoAulas] = useState<any[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [apagando, setApagando] = useState<string | null>(null)

  const carregarAlunos = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('alunos')
      .select('*')
      .eq('excluido', false)
      .order('nome', { ascending: true })
    
    setAlunos(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { carregarAlunos() }, [carregarAlunos])

  // Função para enviar o link do termo para um número qualquer
  function gerarLinkWhatsApp() {
    let digits = numero.replace(/[^\d+]/g, '') 
    if (digits.replace(/\D/g, '').length < 7) return
    
    if (!digits.startsWith('+')) {
      digits = '55' + digits
    } else {
      digits = digits.replace('+', '') 
    }

    const url = typeof window !== 'undefined' ? window.location.origin : ''
    const textoPadrao = pt?.termosTab?.textoWpp || 'Olá! Segue o link para assinar o termo de responsabilidade da Rosa Surf School:'
    const texto = encodeURIComponent(`${textoPadrao} ${url}/termo`)
    window.open(`https://wa.me/${digits}?text=${texto}`, '_blank')
    setMostrarWpp(false)
    setNumero('')
  }

  // Função para copiar o link
  async function copiarLink() {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/termo` : '/termo'
    await navigator.clipboard.writeText(url)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  // Função para chamar o aluno direto no WPP
  function chamarAlunoWhatsApp(telefone: string, nome: string) {
    let digits = telefone.replace(/[^\d+]/g, '')
    if (digits.length < 7) return
    if (!digits.startsWith('+')) digits = '55' + digits
    else digits = digits.replace('+', '')
    
    const primeiroNome = nome.split(' ')[0]
    const texto = encodeURIComponent(`Fala ${primeiroNome}! Tudo bem? Aqui é da Rosa Surf School 🏄‍♂️`)
    window.open(`https://wa.me/${digits}?text=${texto}`, '_blank')
  }

  // Busca o histórico do aluno quando clica para expandir
  async function toggleExpandirAluno(aluno: any) {
    if (alunoExpandido === aluno.id) {
      setAlunoExpandido(null)
      return
    }
    
    setAlunoExpandido(aluno.id)
    setLoadingHistorico(true)
    setHistoricoAulas([])

    const { data } = await supabase
      .from('registro_aulas')
      .select('*')
      .eq('nome_cliente', aluno.nome)
      .eq('excluido', false)
      .order('data_aula', { ascending: false })

    setHistoricoAulas(data ?? [])
    setLoadingHistorico(false)
  }

  // Função da FAXINA (Excluir Testes)
  async function excluirAluno(id: string, nome: string) {
    if (!window.confirm(`Tem certeza que deseja excluir o aluno "${nome}"? Isso removerá ele da lista de contatos.`)) return

    setApagando(id)
    const { error } = await supabase
      .from('alunos')
      .update({ excluido: true })
      .eq('id', id)

    if (!error) {
      setAlunos(prev => prev.filter(a => a.id !== id))
      if (alunoExpandido === id) setAlunoExpandido(null)
    } else {
      alert('Erro ao excluir aluno. Tente novamente.')
    }
    setApagando(null)
  }

  function formatarData(dataStr: string) {
    if (!dataStr) return ''
    const [ano, mes, dia] = dataStr.split('-')
    return `${dia}/${mes}/${ano}`
  }

  const alunosFiltrados = alunos.filter(a => 
    a.nome.toLowerCase().includes(busca.toLowerCase()) || 
    (a.telefone && a.telefone.includes(busca))
  )

  return (
    <div className="px-4 py-2 flex flex-col gap-6 w-full overflow-x-hidden">
      
      {/* Header e Busca */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-md">
          <UserSquare size={22} className="text-pink-400" />
          CRM de Alunos
        </h2>

        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="w-full bg-white border-0 rounded-2xl pl-11 pr-4 py-3.5 text-base font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>

      {/* BOTÕES DE ENVIAR TERMO E COPIAR LINK */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setMostrarWpp(v => !v)}
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5c] text-white font-semibold py-4 rounded-2xl shadow-sm transition-colors"
        >
          <MessageCircle size={20} />
          {t.termosTab?.enviarWpp || 'Enviar Link do Termo (WhatsApp)'}
        </button>

        {mostrarWpp && (
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-slate-700 text-sm">Enviar termo para qual número?</p>
              <button onClick={() => setMostrarWpp(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <input
              type="tel"
              value={numero}
              onChange={e => setNumero(e.target.value)}
              placeholder="Ex: 48 9999-9999"
              className="w-full border border-slate-200 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366]"
            />
            <button
              onClick={gerarLinkWhatsApp}
              disabled={numero.replace(/\D/g, '').length < 7}
              className="mt-3 w-full bg-[#25D366] text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <MessageCircle size={18} /> Abrir WhatsApp
            </button>
          </div>
        )}

        <button
          onClick={copiarLink}
          className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 font-medium py-3 rounded-2xl text-sm transition-colors active:bg-slate-50"
        >
          <Link size={16} />
          {linkCopiado ? (t.termosTab?.linkCopiado || 'Link Copiado!') : (t.termosTab?.copiarLink || 'Copiar Link do Termo')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alunosFiltrados.length === 0 ? (
        <div className="bg-white rounded-[24px] p-8 shadow-sm text-center border border-slate-100">
          <span className="text-4xl mb-3 block">🏄‍♂️</span>
          <p className="text-slate-500 font-medium text-sm">Nenhum aluno encontrado.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alunosFiltrados.map(aluno => {
            const isExpanded = alunoExpandido === aluno.id

            return (
              <div key={aluno.id} className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden transition-all">
                
                {/* Cabeçalho do Card */}
                <div 
                  onClick={() => toggleExpandirAluno(aluno)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-bold uppercase shrink-0 border border-slate-200">
                      {aluno.nome.substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-black text-slate-800 leading-tight">{aluno.nome}</h3>
                      {aluno.telefone && (
                        <p className="text-xs font-medium text-slate-400 mt-0.5 flex items-center gap-1">
                          <Phone size={10} /> {aluno.telefone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-slate-400 shrink-0">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* Área Expandida (O CRM) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* Botão de Chamar no WPP se tiver telefone */}
                    {aluno.telefone && (
                      <button 
                        onClick={() => chamarAlunoWhatsApp(aluno.telefone, aluno.nome)}
                        className="w-full mb-4 flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#075e54] border border-[#25D366]/30 font-bold text-[13px] py-2.5 rounded-xl transition-transform active:scale-95"
                      >
                        <MessageCircle size={16} /> Chamar no WhatsApp
                      </button>
                    )}

                    <div className="mb-4">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Waves size={14} className="text-pink-500" />
                        Histórico de Aulas
                      </h4>
                      
                      {loadingHistorico ? (
                        <div className="flex justify-center py-4">
                          <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : historicoAulas.length === 0 ? (
                        <p className="text-xs text-slate-500 italic bg-white p-3 rounded-xl border border-slate-100">
                          Nenhuma aula registrada para este aluno ainda.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                          {historicoAulas.map(aula => (
                            <div key={aula.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                  <Calendar size={10} /> {formatarData(aula.data_aula)}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  {aula.modalidade || 'Surf'}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                                <User size={12} className="text-slate-400" />
                                Prof: <span className="font-bold">{aula.nome_professor || 'Não informado'}</span>
                              </div>

                              {aula.observacoes && (
                                <div className="flex items-start gap-1.5 mt-1 bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
                                  <FileText size={12} className="text-amber-500 mt-0.5 shrink-0" />
                                  <p className="text-[11px] text-slate-600 leading-relaxed italic">
                                    {aula.observacoes}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Botão de Lixeira */}
                    <div className="pt-3 border-t border-slate-200 flex justify-end">
                      <button
                        onClick={() => excluirAluno(aluno.id, aluno.nome)}
                        disabled={apagando === aluno.id}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {apagando === aluno.id ? (
                          <span className="w-3 h-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Excluir Aluno
                      </button>
                    </div>

                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
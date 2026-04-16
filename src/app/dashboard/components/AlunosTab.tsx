'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Plus, Trash2, Search, Phone, Calendar, FileText, CheckCircle, X } from 'lucide-react'
import { formatarData } from '@/lib/dateUtils'

interface Aluno {
  id: string
  nome: string
  telefone?: string
  data_nascimento?: string
  observacoes?: string
}

export default function AlunosTab() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [excluindo, setExcluindo] = useState<string | null>(null)

  // Estados do formulário
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const carregarAlunos = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('alunos')
      .select('*')
      .order('nome', { ascending: true })
    setAlunos(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { carregarAlunos() }, [carregarAlunos])

  async function salvarAluno(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return

    setSalvando(true)
    const { error } = await supabase.from('alunos').insert([{ 
      nome: nome.trim(), 
      telefone: telefone.trim() || null, 
      data_nascimento: dataNascimento || null, 
      observacoes: observacoes.trim() || null 
    }])

    setSalvando(false)
    if (!error) {
      setNome(''); setTelefone(''); setDataNascimento(''); setObservacoes('')
      setModalAberto(false)
      carregarAlunos()
    } else {
      alert('Erro ao salvar aluno.')
    }
  }

  async function excluirAluno(id: string, nomeAluno: string) {
    if (!window.confirm(`Tem certeza que deseja remover o cadastro de ${nomeAluno}?`)) return
    setExcluindo(id)
    const { error } = await supabase.from('alunos').delete().eq('id', id)
    if (!error) setAlunos(prev => prev.filter(a => a.id !== id))
    setExcluindo(null)
  }

  const alunosFiltrados = alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="px-4 py-2 flex flex-col gap-6 w-full overflow-x-hidden">
      
      {/* HEADER */}
      <div className="flex items-center justify-between -mt-2">
        <div className="flex items-center gap-2">
          <Users size={22} className="text-pink-400 drop-shadow-md" />
          <h2 className="text-xl font-black text-white tracking-tight drop-shadow-md">Base de Alunos</h2>
        </div>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar aluno por nome..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full bg-white border border-slate-100 shadow-sm rounded-2xl pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
        />
      </div>

      {/* LISTA DE ALUNOS */}
      <div>
        <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-pink-500" /> Cadastros ({alunosFiltrados.length})
        </h3>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alunosFiltrados.length === 0 ? (
          <div className="bg-white rounded-[24px] p-8 shadow-sm text-center border border-slate-100">
            <span className="text-4xl mb-3 block">📇</span>
            <p className="text-slate-500 font-medium text-sm">Nenhum aluno encontrado.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {alunosFiltrados.map(aluno => (
              <div key={aluno.id} className="bg-white rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-4 border border-slate-100 flex flex-col gap-3 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center text-pink-700 font-black text-sm border border-pink-200/50 shrink-0">
                      {aluno.nome.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 leading-tight">{aluno.nome}</h4>
                      {aluno.telefone && (
                        <span className="text-[11px] font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                          <Phone size={10} /> {aluno.telefone}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => excluirAluno(aluno.id, aluno.nome)}
                    disabled={excluindo === aluno.id}
                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
                  >
                    {excluindo === aluno.id ? <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
                
                {(aluno.data_nascimento || aluno.observacoes) && (
                  <div className="pt-3 border-t border-slate-50 flex flex-col gap-2">
                    {aluno.data_nascimento && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar size={12} className="text-slate-400" /> 
                        <span className="font-medium">Nasc: {formatarData(aluno.data_nascimento)}</span>
                      </div>
                    )}
                    {aluno.observacoes && (
                      <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                        <FileText size={12} className="text-slate-400 mt-0.5 shrink-0" /> 
                        <span className="italic leading-snug">{aluno.observacoes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB - Botão Flutuante (Rosa) */}
      <button
        onClick={() => setModalAberto(true)}
        className="fixed bottom-[88px] right-5 w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-[0_4px_20px_rgba(232,67,106,0.45)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* MODAL BOTTOM SHEET: Novo Aluno */}
      {modalAberto && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setModalAberto(false)}
          />
          
          <div className="relative bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 pb-32 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800">Novo Aluno</h3>
                <p className="text-sm text-slate-500 mt-0.5">Ficha de cadastro</p>
              </div>
              <button 
                onClick={() => setModalAberto(false)}
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={salvarAluno} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Telefone / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChange={e => setTelefone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Nascimento</label>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={e => setDataNascimento(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Observações Médicas / Nível</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Alérgico a abelha. Nível iniciante, dificuldade em dropar."
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 resize-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={salvando || !nome.trim()}
                className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl text-lg mt-2 shadow-[0_4px_14px_rgba(0,0,0,0.2)] active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {salvando ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={20} />}
                {salvando ? 'Salvando...' : 'Salvar Cadastro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
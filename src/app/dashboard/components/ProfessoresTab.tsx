'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, UserPlus, Trash2, DollarSign, CheckCircle } from 'lucide-react'

// Interface atualizada para suportar a taxa por aula
interface Professor {
  id: string
  nome: string
  valor_aula?: number
  ativo: boolean
}

export default function ProfessoresTab() {
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados do Formulário
  const [novoNome, setNovoNome] = useState('')
  const [novoValor, setNovoValor] = useState<number | string>(100) // Padrão R$ 100
  
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState<string | null>(null)

  const carregarProfessores = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('professores')
      .select('*')
      .order('nome', { ascending: true })
    
    setProfessores(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { carregarProfessores() }, [carregarProfessores])

  async function adicionarProfessor(e: React.FormEvent) {
    e.preventDefault()
    if (!novoNome.trim()) return

    setSalvando(true)
    const taxa = Number(novoValor) > 0 ? Number(novoValor) : 100

    const { error } = await supabase
      .from('professores')
      .insert([{ nome: novoNome.trim(), valor_aula: taxa }])

    if (!error) {
      setNovoNome('')
      setNovoValor(100) // Reseta para o padrão
      carregarProfessores()
    } else {
      alert('Erro ao adicionar professor. Talvez esse nome já exista ou a coluna "valor_aula" não foi criada no Supabase.')
    }
    setSalvando(false)
  }

  async function excluirProfessor(id: string, nome: string) {
    if (!window.confirm(`Tem certeza que deseja remover ${nome} da equipe?`)) return

    setExcluindo(id)
    const { error } = await supabase
      .from('professores')
      .delete()
      .eq('id', id)

    if (!error) {
      setProfessores(prev => prev.filter(p => p.id !== id))
    }
    setExcluindo(null)
  }

  return (
    <div className="px-4 py-2 flex flex-col gap-6 w-full overflow-x-hidden">
      
      {/* HEADER PREMIUM (Título ajustado para Branco Brilhante) */}
      <div className="flex items-center gap-2 -mt-2">
        <Users size={22} className="text-pink-400 drop-shadow-md" />
        <h2 className="text-xl font-black text-white tracking-tight drop-shadow-md">Equipe de Professores</h2>
      </div>

      {/* Formulário de Adição de Professor (Modo Card) */}
      <form onSubmit={adicionarProfessor} className="bg-white rounded-[24px] shadow-sm p-5 border border-slate-100 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
            <UserPlus size={16} className="text-pink-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-800 leading-tight">Novo Professor</h3>
            <p className="text-[11px] text-slate-500 font-medium">Cadastre e defina a taxa da aula</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">Nome Completo</label>
            <input
              type="text"
              value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              placeholder="Ex: Gabriel Medina"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
            />
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1 ml-1">
                <DollarSign size={12} /> Valor por Aula
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={novoValor}
                onChange={e => setNovoValor(e.target.value)}
                placeholder="Ex: 100"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={salvando || !novoNome.trim()}
                className="h-[50px] bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white px-6 rounded-xl font-bold transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center min-w-[100px]"
              >
                {salvando ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Salvar'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Lista de Professores Cadastrados */}
      <div>
        <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-pink-500" /> Elenco Atual
        </h3>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : professores.length === 0 ? (
          <div className="bg-white rounded-[24px] p-8 shadow-sm text-center border border-slate-100">
            <span className="text-4xl mb-3 block">🏄‍♂️</span>
            <p className="text-slate-500 font-medium text-sm">Escola vazia.</p>
            <p className="text-slate-400 text-xs mt-1">Nenhum professor cadastrado ainda.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {professores.map(prof => (
              <div key={prof.id} className="bg-white rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-4 border border-slate-100 flex items-center justify-between transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center text-pink-700 font-black text-lg border border-pink-200/50 shrink-0">
                    {prof.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-800 leading-tight">{prof.nome}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                        <DollarSign size={10} strokeWidth={3} />
                        {prof.valor_aula ? prof.valor_aula.toFixed(2).replace('.', ',') : '100,00'}/aula
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => excluirProfessor(prof.id, prof.nome)}
                  disabled={excluindo === prof.id}
                  className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
                  title="Remover Professor"
                >
                  {excluindo === prof.id ? (
                    <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
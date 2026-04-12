'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, UserPlus, Trash2, CheckCircle } from 'lucide-react'

// Criamos a regra do Professor direto aqui para facilitar
interface Professor {
  id: string
  nome: string
  ativo: boolean
}

export default function ProfessoresTab() {
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const [novoNome, setNovoNome] = useState('')
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
    const { error } = await supabase
      .from('professores')
      .insert([{ nome: novoNome.trim() }])

    if (!error) {
      setNovoNome('')
      carregarProfessores()
    } else {
      alert('Erro ao adicionar professor. Talvez esse nome já exista.')
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
    <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">
      
      {/* Título */}
      <div className="flex items-center gap-2 mb-2">
        <Users size={22} className="text-pink-600" />
        <h2 className="text-xl font-bold text-slate-800">Equipe de Professores</h2>
      </div>

      {/* Formulário de Adição */}
      <form onSubmit={adicionarProfessor} className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Adicionar novo professor
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            placeholder="Ex: Gabriel Medina"
            className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button
            type="submit"
            disabled={salvando || !novoNome.trim()}
            className="bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white px-5 rounded-xl font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {salvando ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={18} />
                <span className="hidden sm:inline">Adicionar</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Lista de Professores */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 mb-3 ml-1">Professores Cadastrados</h3>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : professores.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center text-slate-400 border border-slate-100">
            <p className="text-sm">Nenhum professor cadastrado ainda.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {professores.map(prof => (
              <div key={prof.id} className="bg-white rounded-xl shadow-sm p-3 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                    {prof.nome.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-800">{prof.nome}</span>
                </div>
                
                <button
                  onClick={() => excluirProfessor(prof.id, prof.nome)}
                  disabled={excluindo === prof.id}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Remover Professor"
                >
                  {excluindo === prof.id ? (
                    <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
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
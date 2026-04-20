'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
// CORREÇÃO: Trocamos o 'Instagram' por 'AtSign' aqui na linha de baixo
import { Users, Search, UserPlus, Phone, AtSign, Calendar } from 'lucide-react'

export default function AlunosTab() {
  const [alunos, setAlunos] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)

  async function carregarAlunos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .order('created_at', { ascending: false }) 

    if (!error && data) {
      setAlunos(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarAlunos()
  }, [])

  const alunosFiltrados = alunos.filter(aluno =>
    aluno.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    aluno.telefone?.includes(busca)
  )

  return (
    <div className="px-4 py-2 flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-md">
          <Users size={22} className="text-pink-400" />
          Alunos Cadastrados
        </h2>
        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
          {alunos.length} Total
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-white rounded-2xl pl-12 pr-4 py-4 shadow-sm border border-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-medium"
        />
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sincronizando Banco...</p>
          </div>
        ) : alunosFiltrados.length > 0 ? (
          alunosFiltrados.map((aluno) => (
            <div key={aluno.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{aluno.nome}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Cadastrado em: {new Date(aluno.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                    <Phone size={10} /> WhatsApp
                  </span>
                  <span className="text-xs font-bold text-slate-700">{aluno.telefone}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                    {/* CORREÇÃO: E trocamos o ícone aqui também */}
                    <AtSign size={10} /> Instagram
                  </span>
                  <span className="text-xs font-bold text-slate-700">{aluno.instagram || '---'}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 col-span-2 flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                    <Calendar size={10} /> Nascimento
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString('pt-BR') : 'Não informado'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[32px] py-12 flex flex-col items-center justify-center text-center px-6">
            <Users size={40} className="text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold">Nenhum aluno encontrado.</p>
          </div>
        )}
      </div>
    </div>
  )
}
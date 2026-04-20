'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Users, Search, UserPlus, Phone, AtSign, 
  Fingerprint, Plus, Share2, X, CheckCircle 
} from 'lucide-react'

export default function AlunosTab() {
  const [alunos, setAlunos] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Estados para o Modal de Cadastro Manual
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoTelefone, setNovoTelefone] = useState('')
  const [novoInstagram, setNovoInstagram] = useState('')

  async function carregarAlunos() {
    setLoading(true)
    const { data: alunosData, error: alunosError } = await supabase
      .from('alunos')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: termosData } = await supabase
      .from('termos_assinados')
      .select('nome_aluno, cpf')

    if (!alunosError && alunosData) {
      const alunosComCpf = alunosData.map(aluno => {
        const termo = termosData?.find(t => t.nome_aluno === aluno.nome)
        return { ...aluno, cpf: termo?.cpf || 'Termo não assinado' }
      })
      setAlunos(alunosComCpf)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarAlunos()
  }, [])

  async function handleAddManual(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)

    // Apenas o nome é obrigatório agora
    const { error } = await supabase
      .from('alunos')
      .insert([{ 
        nome: novoNome.trim(), 
        telefone: novoTelefone.trim() || null, // Se estiver vazio, envia nulo
        instagram: novoInstagram.trim() || null 
      }])

    if (error) {
      alert("Erro ao cadastrar: " + error.message)
    } else {
      setNovoNome('')
      setNovoTelefone('')
      setNovoInstagram('')
      setIsModalOpen(false)
      carregarAlunos() 
    }
    setSalvando(false)
  }

  function compartilharLink() {
    const link = "https://rosasurf.vercel.app/cadastro" 
    const mensagem = encodeURIComponent(`Olá! Para agilizar sua aula na Rosa Surf School, preencha sua ficha e assine o termo de responsabilidade por este link: ${link}`)
    window.open(`https://wa.me/?text=${mensagem}`, '_blank')
  }

  const alunosFiltrados = alunos.filter(aluno =>
    aluno.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    aluno.telefone?.includes(busca)
  )

  return (
    <div className="px-4 py-2 flex flex-col gap-6 animate-in fade-in duration-500 relative min-h-[80vh]">
      
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-md">
            <Users size={22} className="text-pink-400" />
            Alunos
          </h2>
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{alunos.length} cadastrados</span>
        </div>
        
        <button 
          onClick={compartilharLink}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <Share2 size={14} /> Enviar Link
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Buscar aluno..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-white rounded-2xl pl-12 pr-4 py-4 shadow-sm border border-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-medium text-slate-700"
        />
      </div>

      <div className="flex flex-col gap-3 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alunosFiltrados.map((aluno) => (
          <div key={aluno.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col gap-4 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                <UserPlus size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 leading-tight">{aluno.nome}</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Desde {new Date(aluno.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><Phone size={10} /> WhatsApp</span>
                <span className="text-xs font-bold text-slate-700">{aluno.telefone || '---'}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><AtSign size={10} /> Instagram</span>
                <span className="text-xs font-bold text-slate-700 truncate">{aluno.instagram || '---'}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 col-span-2 flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><Fingerprint size={10} /> CPF (Termo)</span>
                <span className={`text-xs font-bold ${aluno.cpf.includes('não') ? 'text-rose-500' : 'text-slate-700'}`}>{aluno.cpf}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-full shadow-[0_8px_20px_rgba(232,67,106,0.4)] flex items-center justify-center transition-all active:scale-90 z-40 hover:rotate-90 duration-300"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <form onSubmit={handleAddManual} className="relative w-full max-w-md bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Novo Aluno Manual</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-500"><X size={24} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nome Completo</label>
                <input required type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)} className="w-full bg-slate-50 border-slate-100 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-pink-500 outline-none font-bold text-slate-700" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">WhatsApp (Opcional)</label>
                <input type="tel" value={novoTelefone} onChange={e => setNovoTelefone(e.target.value)} className="w-full bg-slate-50 border-slate-100 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-pink-500 outline-none font-bold text-slate-700" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Instagram (Opcional)</label>
                <input type="text" value={novoInstagram} onChange={e => setNovoInstagram(e.target.value)} className="w-full bg-slate-50 border-slate-100 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-pink-500 outline-none font-bold text-slate-700" />
              </div>
            </div>

            <button 
              disabled={salvando}
              type="submit" 
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
            >
              {salvando ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle size={20} /> Finalizar Cadastro</>}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
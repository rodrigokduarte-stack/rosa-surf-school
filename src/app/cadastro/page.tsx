'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Waves, CheckCircle, User, Phone, Calendar, ShieldCheck, AtSign } from 'lucide-react'

export default function CadastroPublico() {
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [nascimento, setNascimento] = useState('')
  const [aceitou, setAceitou] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!aceitou) return alert("Você precisa aceitar os termos para continuar.")
    
    setLoading(true)

    const { data: aluno, error: errorAluno } = await supabase
      .from('alunos')
      .upsert({ 
        nome: nome.trim(), 
        telefone: telefone.trim(), 
        instagram: instagram.trim(),
        data_nascimento: nascimento 
      }, { onConflict: 'nome' }) 
      .select()
      .single()

    if (!errorAluno) {
      await supabase.from('termos_assinados').insert([{
        nome_cliente: nome.trim(),
        data_assinatura: new Date().toISOString(),
        status: 'Assinado'
      }])
      setEnviado(true)
    } else {
      alert("Erro ao processar cadastro. Tente novamente.")
    }
    
    setLoading(false)
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-[#f5f3ef] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 animate-bounce">
          <CheckCircle size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Cadastro Concluído!</h1>
        <p className="text-slate-600 mb-8 font-medium">Tudo pronto, {nome.split(' ')[0]}! Seus dados e o termo de responsabilidade foram registrados. Nos vemos na água! 🏄‍♂️</p>
        <div className="flex items-center gap-2 text-pink-500 font-bold">
          <Waves size={20} />
          <span>Rosa Surf School</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f3ef] flex flex-col font-sans">
      <div className="bg-[#0a1628] p-8 pb-12 rounded-b-[40px] text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Waves size={28} className="text-pink-500" />
          <span className="text-2xl font-bold text-white tracking-tight">Rosa Surf School</span>
        </div>
        <h1 className="text-white text-lg font-bold opacity-90">Ficha de Inscrição & Termo</h1>
      </div>

      <div className="px-6 -mt-8 mb-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-[32px] p-6 shadow-xl border border-slate-100 flex flex-col gap-6">
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" required placeholder="Seu nome completo"
                  value={nome} onChange={e => setNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-pink-500 transition-all font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="tel" required placeholder="(00) 00000-0000"
                  value={telefone} onChange={e => setTelefone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-pink-500 transition-all font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Instagram (opcional)</label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" placeholder="@seu.perfil"
                  value={instagram} onChange={e => setInstagram(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-pink-500 transition-all font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Data de Nascimento</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="date" required
                  value={nascimento} onChange={e => setNascimento(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-pink-500 transition-all font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" /> Termo de Responsabilidade
            </h3>
            <div className="h-40 overflow-y-auto text-[11px] text-slate-500 leading-relaxed pr-2 font-medium">
              <p className="mb-3">1. Declaro estar em perfeitas condições físicas e de saúde para a prática de surf.</p>
              <p className="mb-3">2. Reconheço que o surf é uma atividade que envolve riscos e isento a Rosa Surf School de qualquer responsabilidade em caso de acidentes decorrentes da prática comum do esporte.</p>
              <p className="mb-3">3. Autorizo o uso de minha imagem para fins de divulgação da escola em redes sociais.</p>
              <p>Ao marcar a caixa abaixo, concordo com todos os termos acima citados.</p>
            </div>
            
            <label className="flex items-center gap-3 mt-4 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer active:scale-[0.98] transition-all">
              <input 
                type="checkbox" checked={aceitou} onChange={() => setAceitou(!aceitou)}
                className="w-5 h-5 rounded border-slate-300 text-pink-600 focus:ring-pink-500" 
              />
              <span className="text-xs font-bold text-slate-700">Li e aceito os termos</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !aceitou}
            className="w-full bg-gradient-to-br from-pink-500 to-rose-600 text-white font-black py-5 rounded-2xl text-lg shadow-[0_4px_14px_rgba(232,67,106,0.3)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirmar e Assinar'}
          </button>
        </form>
      </div>
    </div>
  )
}
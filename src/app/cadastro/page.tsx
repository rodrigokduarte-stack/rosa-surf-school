'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Waves, CheckCircle, ShieldCheck } from 'lucide-react'

export default function CadastroPage() {
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [aceito, setAceito] = useState(false)
  
  // ESTE É O ESTADO DA ARMADILHA (HONEYPOT)
  const [honeypot, setHoneypot] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    
    // 1. A VERIFICAÇÃO DA ARMADILHA PARA ROBÔS
    // Se o campo invisível foi preenchido, nós fingimos que deu certo para enganar o bot,
    // mas não salvamos absolutamente nada no Supabase!
    if (honeypot.trim() !== '') {
      console.warn("Robô de spam bloqueado pela armadilha.")
      setSucesso(true) // Finge que deu certo para o robô ir embora feliz
      return
    }

    if (!aceito) {
      setErro("Você precisa aceitar o termo de responsabilidade para surfar com a gente.")
      return
    }

    setLoading(true)

    // 2. SALVA O TERMO NO BANCO DE DADOS (Público -> Supabase)
    const { error } = await supabase
      .from('termos_assinados')
      .insert([{
        nome_aluno: nome.trim(),
        cpf: cpf.trim()
      }])

    setLoading(false)

    if (error) {
      setErro("Ops, tivemos um problema na rede. Tente novamente.")
      console.error(error)
    } else {
      setSucesso(true)
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Tudo pronto!</h2>
        <p className="text-slate-500 max-w-xs">
          Seu cadastro e termo de responsabilidade foram assinados com sucesso. Já pode fechar esta página e ir pra água! 🏄‍♂️
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f3ef] flex flex-col items-center justify-center p-4 md:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500 border border-slate-100">
        
        {/* Cabeçalho */}
        <div className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6e] p-8 text-center relative overflow-hidden">
          <Waves size={100} className="absolute -top-4 -right-4 text-white opacity-5" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 mb-4 shadow-lg">
              <Waves size={32} className="text-pink-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Rosa Surf School</h1>
            <p className="text-white/70 text-sm mt-1 font-medium">Ficha de Inscrição e Termo</p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-6">
          
          {erro && (
            <div className="bg-rose-50 text-rose-600 text-sm font-bold p-4 rounded-2xl border border-rose-100">
              {erro}
            </div>
          )}

          <div className="flex flex-col gap-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Nome Completo</label>
              <input 
                required 
                type="text" 
                placeholder="Digite seu nome igual ao documento"
                value={nome} 
                onChange={e => setNome(e.target.value)} 
                className="w-full bg-slate-50 border-slate-100 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-pink-500 outline-none font-bold text-slate-700 transition-all" 
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">CPF</label>
              <input 
                required 
                type="text" 
                placeholder="000.000.000-00"
                value={cpf} 
                onChange={e => setCpf(e.target.value)} 
                className="w-full bg-slate-50 border-slate-100 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-pink-500 outline-none font-bold text-slate-700 transition-all" 
              />
            </div>
            
            {/* INÍCIO DA ARMADILHA PARA ROBÔS (HONEYPOT) */}
            {/* O "hidden" do Tailwind esconde esse campo dos humanos, mas não dos robôs de leitura de código */}
            <div className="hidden" aria-hidden="true">
              <label>Deixe este campo em branco se você for humano:</label>
              <input 
                type="text" 
                name="website_url" 
                tabIndex={-1} 
                autoComplete="off" 
                value={honeypot} 
                onChange={e => setHoneypot(e.target.value)} 
              />
            </div>
            {/* FIM DA ARMADILHA */}

          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex gap-4 mt-2">
            <label className="relative flex items-start cursor-pointer group">
              <input 
                type="checkbox" 
                checked={aceito}
                onChange={e => setAceito(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-6 h-6 border-2 border-slate-300 rounded-lg peer-checked:bg-pink-500 peer-checked:border-pink-500 flex items-center justify-center transition-all mt-0.5 shadow-sm group-hover:border-pink-400">
                <CheckCircle size={14} className="text-white opacity-0 peer-checked:opacity-100" />
              </div>
              <span className="ml-3 text-xs text-slate-600 leading-relaxed font-medium">
                Declaro que estou em plenas condições de saúde e assumo total responsabilidade por riscos inerentes à prática do surf durante as aulas.
              </span>
            </label>
          </div>

          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-gradient-to-br from-pink-500 to-rose-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(232,67,106,0.3)] active:scale-95 transition-all disabled:opacity-70 disabled:scale-100 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck size={20} /> Assinar e Concluir
              </>
            )}
          </button>
        </form>
      </div>
      
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-8 flex items-center gap-1.5 opacity-60">
        Ambiente Seguro <ShieldCheck size={12}/>
      </p>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User, ShieldCheck, Key, LogOut, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PerfilTab() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setEmail(data.user.email || '')
    })
  }, [])

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setMessage({ text: 'Erro ao atualizar senha. Tente novamente.', type: 'error' })
    } else {
      setMessage({ text: 'Senha atualizada com sucesso!', type: 'success' })
      setNewPassword('')
    }
    setLoading(false)
  }

  async function handleLogout() {
    if(window.confirm('Deseja realmente sair do sistema?')) {
      await supabase.auth.signOut()
      router.replace('/')
    }
  }

  return (
    <div className="px-4 py-2 flex flex-col gap-6 animate-in fade-in duration-500">
      <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-md">
        <User size={22} className="text-pink-400" />
        Meu Perfil
      </h2>

      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
        
        <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center text-white text-2xl font-black shadow-lg">
            {email.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usuário Logado</p>
            <h3 className="text-lg font-bold text-slate-800 leading-tight">{email}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-emerald-600">
              <ShieldCheck size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">Administrador</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Key size={16} className="text-slate-400" /> Segurança da Conta
          </h4>
          
          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Nova Senha
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {message.text && (
              <div className={`px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {message.text}
              </div>
            )}

            <button type="submit" disabled={loading || !newPassword} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-xl transition-all disabled:opacity-50 active:scale-95">
              {loading ? 'Atualizando...' : 'Atualizar Senha'}
            </button>
          </form>
        </div>

        <div className="pt-2">
          <button onClick={handleLogout} className="w-full bg-rose-50 text-rose-600 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors">
            <LogOut size={18} /> Sair do Sistema
          </button>
        </div>
      </div>
    </div>
  )
}
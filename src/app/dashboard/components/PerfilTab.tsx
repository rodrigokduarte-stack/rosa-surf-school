'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User, ShieldCheck, Key, LogOut, CheckCircle, AlertCircle, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LanguageToggle } from './LanguageToggle'
import { useLanguage } from '@/contexts/LanguageContext'

export default function PerfilTab() {
  const { t } = useLanguage() // Cérebro do tradutor ativado!
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
      setMessage({ text: t.perfil.erroSenha, type: 'error' })
    } else {
      setMessage({ text: t.perfil.sucessoSenha, type: 'success' })
      setNewPassword('')
    }
    setLoading(false)
  }

  async function handleLogout() {
    if(window.confirm(t.perfil.confirmaSair)) {
      await supabase.auth.signOut()
      router.replace('/')
    }
  }

  return (
    <div className="px-4 py-2 flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-md">
        <User size={22} className="text-pink-400" />
        {t.perfil.titulo}
      </h2>

      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
        
        <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center text-white text-2xl font-black shadow-lg">
            {email.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.perfil.usuarioLogado}</p>
            <h3 className="text-lg font-bold text-slate-800 leading-tight">{email}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-emerald-600">
              <ShieldCheck size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">{t.perfil.admin}</span>
            </div>
          </div>
        </div>

        <div className="pb-6 border-b border-slate-50">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Globe size={16} className="text-slate-400" /> {t.perfil.prefs}
          </h4>
          
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-700">{t.perfil.idioma}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t.perfil.altereIdioma}</p>
            </div>
            <LanguageToggle />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Key size={16} className="text-slate-400" /> {t.perfil.seguranca}
          </h4>
          
          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {t.perfil.novaSenha}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder={t.perfil.digiteSenha}
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
              {loading ? t.perfil.atualizando : t.perfil.atualizar}
            </button>
          </form>
        </div>

        <div className="pt-2">
          <button onClick={handleLogout} className="w-full bg-rose-50 text-rose-600 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors">
            <LogOut size={18} /> {t.perfil.sair}
          </button>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Waves, ArrowLeft, MailCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  // Novos estados para a troca de tela (Login <-> Recuperação)
  const [view, setView] = useState<'login' | 'forgot'>('login')
  const [resetSuccess, setResetSuccess] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard')
      else setChecking(false)
    })
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
    } else {
      router.replace('/dashboard')
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Envia o link para o e-mail redirecionando de volta para o sistema
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    })

    if (error) {
      setError('Erro ao enviar e-mail. Verifique se o endereço está correto.')
      setLoading(false)
    } else {
      setResetSuccess(true)
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-white">
      {/* Logo / Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="bg-pink-600 text-white p-4 rounded-2xl shadow-lg mb-4">
          <Waves size={40} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Rosa Surf School</h1>
        <p className="text-pink-500 mt-1 text-sm font-medium">Controle de Aulas</p>
      </div>

      {/* Card Principal */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-gray-100 p-6 overflow-hidden relative">
        
        {/* TELA 1: LOGIN */}
        {view === 'login' && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            <h2 className="text-xl font-semibold text-slate-800 mb-6 text-center">Entrar</h2>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Senha</label>
                  <button 
                    type="button"
                    onClick={() => { setView('forgot'); setError(''); setResetSuccess(false); }}
                    className="text-[13px] font-semibold text-pink-600 hover:text-pink-700 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white font-semibold py-4 rounded-xl text-lg transition-colors disabled:opacity-60 mt-2"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        )}

        {/* TELA 2: RECUPERAR SENHA (DIGITAR E-MAIL) */}
        {view === 'forgot' && !resetSuccess && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button 
              onClick={() => { setView('login'); setError(''); }}
              className="text-slate-400 hover:text-slate-600 transition-colors absolute top-6 left-6"
            >
              <ArrowLeft size={20} />
            </button>
            
            <h2 className="text-xl font-semibold text-slate-800 mb-2 text-center mt-1">Recuperar Senha</h2>
            <p className="text-sm text-slate-500 text-center mb-6 px-4">
              Digite seu e-mail abaixo e enviaremos um link para você redefinir sua senha.
            </p>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail cadastrado</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-semibold py-4 rounded-xl text-lg transition-colors disabled:opacity-60 mt-2"
              >
                {loading ? 'Enviando...' : 'Enviar Link'}
              </button>
            </form>
          </div>
        )}

        {/* TELA 3: SUCESSO DO E-MAIL */}
        {view === 'forgot' && resetSuccess && (
          <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <MailCheck size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">E-mail Enviado!</h2>
            <p className="text-sm text-slate-500 mb-6 px-2">
              Enviamos um link de recuperação para <strong>{email}</strong>. Por favor, verifique sua caixa de entrada e a pasta de spam.
            </p>
            <button
              onClick={() => { setView('login'); setResetSuccess(false); setPassword(''); }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-4 rounded-xl text-lg transition-colors"
            >
              Voltar para o Login
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
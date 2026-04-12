'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Waves, CheckCircle, AlertCircle } from 'lucide-react'

function formatarCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export default function TermoPage() {
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [aceito, setAceito] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    const cpfDigits = cpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      setErro('CPF inválido. Digite os 11 dígitos.')
      return
    }
    if (!aceito) {
      setErro('Você precisa aceitar os termos para continuar.')
      return
    }

    setSalvando(true)
    const { error } = await supabase.from('termos_assinados').insert([{
      nome_aluno: nome.trim(),
      cpf: cpf,
      aceitou_termos: true,
    }])
    setSalvando(false)

    if (error) {
      setErro('Erro ao salvar. Tente novamente.')
    } else {
      setSucesso(true)
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Termo assinado!</h2>
          <p className="text-slate-500 text-base">Boa onda! Sua assinatura foi registrada com sucesso.</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-pink-600">
            <Waves size={20} />
            <span className="font-semibold text-sm">Rosa Surf School</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-pink-700 to-pink-500 text-white px-4 py-5">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Waves size={28} />
          <div>
            <h1 className="font-bold text-lg leading-tight">Rosa Surf School</h1>
            <p className="text-pink-200 text-xs">Termo de Responsabilidade</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Texto do Termo */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-base font-bold text-slate-800 mb-4 text-center uppercase tracking-wide">
            Termo de Responsabilidade e Assunção de Riscos
          </h2>

          <div className="text-sm text-slate-600 flex flex-col gap-4 leading-relaxed">

            <p>
              Pelo presente instrumento, o(a) aluno(a) abaixo identificado(a) declara estar ciente
              e concordar com as seguintes cláusulas:
            </p>

            <div>
              <p className="font-semibold text-slate-800 mb-1">1. Condição Física</p>
              <p>
                O(a) aluno(a) declara estar em plenas condições físicas e de saúde para a prática
                do surf, não possuindo qualquer impedimento médico ou físico que contraindique a
                prática de atividades aquáticas e esportivas de alta intensidade. Declara ainda
                saber nadar e não ter ciência de qualquer condição de saúde que represente risco
                durante a prática esportiva.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-800 mb-1">2. Ciência dos Riscos</p>
              <p>
                O(a) aluno(a) reconhece que a prática do surf envolve riscos inerentes à atividade,
                incluindo, mas não se limitando a: afogamento, lesões causadas pela prancha ou
                leash, impacto com o fundo do mar, corais, rochas, exposição a condições climáticas
                adversas, correntes marinhas e outros fatores imprevisíveis do ambiente oceânico.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-800 mb-1">3. Assunção de Riscos</p>
              <p>
                O(a) aluno(a) assume voluntariamente todos os riscos associados à prática do surf
                e às aulas ministradas pela Rosa Surf School, isentando a escola, seus sócios,
                funcionários, professores e instrutores de qualquer responsabilidade civil ou
                criminal decorrente de acidentes, lesões, danos à saúde ou morte ocorridos durante
                a realização das atividades, ainda que decorrentes de caso fortuito ou força maior.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-800 mb-1">4. Zelo pelos Equipamentos</p>
              <p>
                O(a) aluno(a) se compromete a utilizar os equipamentos fornecidos pela escola
                (pranchas, leashs, roupas de borracha, entre outros) com responsabilidade, cuidado
                e respeito. Qualquer dano causado por mau uso ou negligência será de responsabilidade
                do(a) aluno(a), que deverá arcar com os custos de reparo ou reposição.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-800 mb-1">5. Isenção de Responsabilidade</p>
              <p>
                A Rosa Surf School não se responsabiliza por objetos pessoais perdidos, roubados ou
                danificados durante as aulas, bem como por quaisquer custos médicos, hospitalares,
                de transporte ou outros decorrentes de acidentes ocorridos durante as atividades.
                O(a) aluno(a) declara ter ciência de que é recomendável possuir seguro de saúde
                ou seguro de acidentes pessoais.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-800 mb-1">6. Autorização de Imagem</p>
              <p>
                O(a) aluno(a) autoriza gratuitamente o uso de sua imagem e voz captadas durante
                as aulas para fins de divulgação nas redes sociais e materiais de marketing da
                Rosa Surf School, em todo o território nacional e no exterior, por prazo
                indeterminado, sem que isso implique qualquer ônus à escola.
              </p>
            </div>

            <p className="text-xs text-slate-400 text-center pt-2 border-t border-slate-100">
              Ao assinar este termo, o(a) aluno(a) declara ter lido, compreendido e concordado
              com todas as cláusulas acima.
            </p>
          </div>
        </div>

        {/* Formulário de Assinatura */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-4">Assinatura Digital</h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Digite seu nome completo"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
              <input
                type="text"
                required
                inputMode="numeric"
                value={cpf}
                onChange={e => setCpf(formatarCPF(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={aceito}
                  onChange={e => setAceito(e.target.checked)}
                  className="peer sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  aceito ? 'bg-pink-600 border-pink-600' : 'border-slate-300 bg-white'
                }`}>
                  {aceito && <CheckCircle size={14} className="text-white" />}
                </div>
              </div>
              <span className="text-sm text-slate-600 leading-relaxed">
                Li, compreendo e concordo com todos os termos e condições acima descritos,
                assumindo todos os riscos inerentes à prática do surf.
              </span>
            </label>

            {erro && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={16} />
                <span className="text-sm">{erro}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={salvando || !aceito}
              className="w-full bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white font-semibold py-4 rounded-xl text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {salvando ? 'Assinando...' : 'Assinar Termo'}
            </button>
          </form>
        </div>

        <div className="h-4" />
      </div>
    </div>
  )
}

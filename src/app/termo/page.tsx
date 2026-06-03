'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Waves, CheckCircle, AlertCircle, FileText } from 'lucide-react'

// Recriação limpa do cliente apenas para a página pública
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const dicionario = {
  pt: {
    tituloEscola: 'Rosa Surf School',
    subtitulo: 'Termo de Responsabilidade',
    sucessoTitulo: 'Termo assinado!',
    sucessoDesc: 'Boa onda! Sua assinatura foi registrada com sucesso.',
    termoTitulo: 'Termo de Responsabilidade e Assunção de Riscos',
    p1: 'Pelo presente instrumento, o(a) aluno(a) abaixo identificado(a) declara estar ciente e concordar com as seguintes cláusulas:',
    h1: '1. Condição Física',
    t1: 'O(a) aluno(a) declara estar em plenas condições físicas e de saúde para a prática do surf, não possuindo qualquer impedimento médico ou físico que contraindique a prática de atividades aquáticas e esportivas de alta intensidade. Declara ainda saber nadar e não ter ciência de qualquer condição de saúde que represente risco durante a prática esportiva.',
    h2: '2. Ciência dos Riscos',
    t2: 'O(a) aluno(a) reconhece que a prática do surf envolve riscos inerentes à atividade, incluindo, mas não se limitando a: afogamento, lesões causadas pela prancha ou leash, impacto com o fundo do mar, corais, rochas, exposição a condições climáticas adversas, correntes marinhas e outros fatores imprevisíveis do ambiente oceânico.',
    h3: '3. Assunção de Riscos',
    t3: 'O(a) aluno(a) assume voluntariamente todos os riscos associados à prática do surf e às aulas ministradas pela Rosa Surf School, isentando a escola, seus sócios, funcionários, professores e instrutores de qualquer responsabilidade civil ou criminal decorrente de acidentes, lesões, danos à saúde ou morte ocorridos durante a realização das atividades, ainda que decorrentes de caso fortuito ou força maior.',
    h4: '4. Zelo pelos Equipamentos',
    t4: 'O(a) aluno(a) se compromete a utilizar os equipamentos fornecidos pela escola (pranchas, leashs, roupas de borracha, entre outros) com responsabilidade, cuidado e respeito. Qualquer dano causado por mau uso ou negligência será de responsabilidade do(a) aluno(a), que deverá arcar com os custos de reparo ou reposição.',
    h5: '5. Isenção de Responsabilidade',
    t5: 'A Rosa Surf School não se responsabiliza por objetos pessoais perdidos, roubados ou danificados durante as aulas, bem como por quaisquer custos médicos, hospitalares, de transporte ou outros decorrentes de acidentes ocorridos durante as atividades. O(a) aluno(a) declara tener ciência de que é recomendável possuir seguro de saúde ou seguro de acidentes pessoais.',
    h6: '6. Autorização de Imagem',
    t6: 'O(a) aluno(a) autoriza gratuitamente o uso de sua imagem e voz captadas durante as aulas para fins de divulgação nas redes sociais e materiais de marketing da Rosa Surf School, em todo o território nacional e no exterior, por prazo indeterminado, sem que isso implique qualquer ônus à escola.',
    rodapeTermo: 'Ao assinar este termo, o(a) aluno(a) declara ter lido, compreendido e concordado com todas as cláusulas acima.',
    assinaturaTitulo: 'Assinatura Digital',
    labelNome: 'Nome Completo',
    placeholderNome: 'Digite seu nome completo',
    labelCpf: 'CPF',
    checkEstrangeiro: 'Sou Estrangeiro (Não possuo CPF)',
    checkAceito: 'Li, compreendo e concordo com todos os termos e condições acima descritos, assumindo todos os riscos inerentes à prática do surf.',
    erroCpf: 'CPF inválido. Digite os 11 dígitos.',
    erroAceito: 'Você precisa aceitar os termos para continuar.',
    erroNome: 'Por favor, digite seu nome completo.',
    erroSalvar: 'Erro ao salvar. Tente novamente.',
    btnAssinar: 'Assinar Termo',
    btnAssinando: 'Assinando...'
  },
  en: {
    tituloEscola: 'Rosa Surf School',
    subtitulo: 'Liability Waiver',
    sucessoTitulo: 'Waiver signed!',
    sucessoDesc: 'Good waves! Your signature has been successfully registered.',
    termoTitulo: 'Liability Waiver and Assumption of Risk',
    p1: 'By this instrument, the student identified below declares to be aware of and agree to the following clauses:',
    h1: '1. Physical Condition',
    t1: 'The student declares to be in full physical and health conditions for surfing, having no medical or physical impediment that counterindicates the practice of high-intensity aquatic and sports activities. The student also declares to know how to swim and is not aware of any health condition that represents a risk during sports practice.',
    h2: '2. Awareness of Risks',
    t2: 'The student recognizes that surfing involves inherent risks to the activity, including, but not limited to: drowning, injuries caused by the board or leash, impact with the seabed, corals, rocks, exposure to adverse weather conditions, marine currents, and other unpredictable factors of the ocean environment.',
    h3: '3. Assumption of Risks',
    t3: 'The student voluntarily assumes all risks associated with the practice of surfing and classes taught by Rosa Surf School, exempting the school, its partners, employees, teachers, and instructors from any civil or criminal liability resulting from accidents, injuries, damage to health, or death occurring during the performance of activities, even if resulting from acts of God or force majeure.',
    h4: '4. Care for Equipment',
    t4: 'The student undertakes to use the equipment provided by the school (boards, leashes, wetsuits, among others) with responsibility, care, and respect. Any damage caused by misuse or negligence will be the responsibility of the student, who must bear the costs of repair or replacement.',
    h5: '5. Limitation of Liability',
    t5: 'Rosa Surf School is not responsible for personal objects lost, stolen, or damaged during classes, as well as for any medical, hospital, transport, or other costs resulting from accidents occurring during activities. The student declares to be aware that it is recommended to have health insurance or personal accident insurance.',
    h6: '6. Image Authorization',
    t6: 'The student authorizes free of charge the use of their image and voice captured during classes for marketing purposes on social media and marketing materials of Rosa Surf School, nationwide and abroad, for an indefinite period, without implying any burden to the school.',
    rodapeTermo: 'By signing this waiver, the student declares to have read, understood, and agreed to all the clauses above.',
    assinaturaTitulo: 'Digital Signature',
    labelNome: 'Full Name',
    placeholderNome: 'Enter your full name',
    labelCpf: 'CPF (Brazilian Tax ID)',
    checkEstrangeiro: 'I am a Foreigner (No CPF)',
    checkAceito: 'I have read, understand, and agree to all the terms and conditions described above, assuming all risks inherent to the practice of surfing.',
    erroCpf: 'Invalid CPF. Please enter the 11 digits.',
    erroAceito: 'You must accept the terms to continue.',
    erroNome: 'Please enter your full name.',
    erroSalvar: 'Error saving. Please try again.',
    btnAssinar: 'Sign Waiver',
    btnAssinando: 'Signing...'
  },
  es: {
    tituloEscola: 'Rosa Surf School',
    subtitulo: 'Exención de Responsabilidad',
    sucessoTitulo: '¡Término firmado!',
    sucessoDesc: '¡Buenas olas! Tu firma ha sido registrada con éxito.',
    termoTitulo: 'Acuerdo de Responsabilidad y Asunción de Riesgos',
    p1: 'Por el presente instrumento, el/la alumno/a abajo identificado/a declara tener conocimiento y aceptar las siguientes cláusulas:',
    h1: '1. Condición Física',
    t1: 'El/la alumno/a declara estar en plenas condiciones físicas y de salud para la práctica del surf, no poseyendo ningún impedimento médico o físico que contraindique la práctica de actividades acuáticas y deportivas de alta intensidad. Declara además saber nadar y no tener conocimiento de ninguna condición de saúde que represente riesgo durante la práctica deportiva.',
    h2: '2. Conocimiento de los Riesgos',
    t2: 'El/la alumno/a reconoce que la práctica del surf involucra riesgos inherentes a la actividad, incluyendo, pero no limitándose a: ahogamiento, lesiones causadas por la tabla o el leash, impacto con el fondo del mar, corales, rocas, exposición a condiciones climáticas adversas, corrientes marinas y otros factores imprevisibles del ambiente oceánico.',
    h3: '3. Asunción de Riesgos',
    t3: 'El/la alumno/a asume voluntariamente todos los riesgos asociados a la práctica del surf y a las clases dictadas por Rosa Surf School, eximiendo a la escuela, sus socios, empleados, profesores e instructores de cualquier responsabilidad civil o criminal derivada de accidentes, lesiones, daños a la salud o muerte ocurridos durante la realización de las actividades, incluso si se derivan de caso fortuito o fuerza mayor.',
    h4: '4. Cuidado de los Equipos',
    t4: 'El/la alumno/a se compromete a utilizar los equipos provistos por la escuela (tablas, leashes, trajes de neoprene, entre otros) con responsabilidad, cuidado y respeto. Cualquier daño causado por mal uso o negligencia será responsabilidad del/la alumno/a, quien deberá asumir los costos de reparación o reposición.',
    h5: '5. Exención de Responsabilidad',
    t5: 'Rosa Surf School no se responsabiliza por objetos personales perdidos, robados o dañados durante las clases, así como por cualquier costo médico, hospitalario, de transporte u otros derivados de accidentes ocurridos durante las actividades. El/la alumno/a declara tener conocimiento de que es recomendable poseer seguro de salud o seguro de accidentes personales.',
    h6: '6. Autorización de Imagen',
    t6: 'El/la alumno/a autoriza gratuitamente el uso de su imagen y voz captadas durante las clases para fines de difusión en redes sociales y materiales de marketing de Rosa Surf School, en todo el territorio nacional y en el exterior, por plazo indeterminado, sin que esto implique ningún costo para la escuela.',
    rodapeTermo: 'Al firmar este acuerdo, el/la alumno/a declara haber leído, comprendido y aceptado todas las cláusulas anteriores.',
    assinaturaTitulo: 'Firma Digital',
    labelNome: 'Nombre Completo',
    placeholderNome: 'Escribe tu nombre completo',
    labelCpf: 'CPF (ID Fiscal Brasileño)',
    checkEstrangeiro: 'Soy Extranjero (No tengo CPF)',
    checkAceito: 'He leído, comprendo y acepto todos los términos y condiciones descritos anteriormente, asumiendo todos los riesgos inherentes a la práctica del surf.',
    erroCpf: 'CPF inválido. Ingrese os 11 dígitos.',
    erroAceito: 'Debes aceptar los términos para continuar.',
    erroNome: 'Por favor, escribe tu nombre completo.',
    erroSalvar: 'Error al guardar. Inténtalo de nuevo.',
    btnAssinar: 'Firmar Término',
    btnAssinando: 'Firmando...'
  }
}

function formatarCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export default function TermoPage() {
  const [lang, setLang] = useState<'pt' | 'en' | 'es'>('pt') 
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [isEstrangeiro, setIsEstrangeiro] = useState(false)
  const [aceito, setAceito] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  const t = dicionario[lang] 

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!nome.trim()) {
      setErro(t.erroNome)
      return
    }

    if (!isEstrangeiro) {
      const cpfDigits = cpf.replace(/\D/g, '')
      if (cpfDigits.length !== 11) {
        setErro(t.erroCpf)
        return
      }
    }

    if (!aceito) {
      setErro(t.erroAceito)
      return
    }

    setSalvando(true)
    
    try {
      // 1. Salva o termo assinado
      const { error: erroTermo } = await supabase.from('termos_assinados').insert([{
        nome_aluno: nome.trim(),
        cpf: isEstrangeiro ? 'Estrangeiro' : cpf,
        aceitou_termos: true,
      }])
      
      if (erroTermo) throw erroTermo

      // 2. ADICIONADO: Salva o nome no CRM para aparecer na busca de aulas
      await supabase.from('alunos').insert([{ nome: nome.trim() }])
      
      setSucesso(true)
    } catch (err: any) {
      console.error(err)
      setErro(t.erroSalvar)
    } finally {
      setSalvando(false)
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.sucessoTitulo}</h2>
          <p className="text-slate-500 text-base">{t.sucessoDesc}</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-pink-600">
            <Waves size={20} />
            <span className="font-semibold text-sm">{t.tituloEscola}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">

      <div className="bg-gradient-to-r from-pink-700 to-pink-500 text-white px-4 py-5 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Waves size={28} />
            <div>
              <h1 className="font-bold text-lg leading-tight">{t.tituloEscola}</h1>
              <p className="text-pink-200 text-xs">{t.subtitulo}</p>
            </div>
          </div>
          
          <div className="flex bg-black/20 p-1 rounded-xl backdrop-blur-sm gap-1 border border-white/10">
            <button type="button" onClick={() => setLang('pt')} className={`px-2 py-1 text-xs rounded-lg transition-all ${lang === 'pt' ? 'bg-white shadow-sm scale-105' : 'opacity-60'}`}>🇧🇷</button>
            <button type="button" onClick={() => setLang('en')} className={`px-2 py-1 text-xs rounded-lg transition-all ${lang === 'en' ? 'bg-white shadow-sm scale-105' : 'opacity-60'}`}>🇺🇸</button>
            <button type="button" onClick={() => setLang('es')} className={`px-2 py-1 text-xs rounded-lg transition-all ${lang === 'es' ? 'bg-white shadow-sm scale-105' : 'opacity-60'}`}>🇪🇸</button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
          <h2 className="text-base font-bold text-slate-800 mb-4 text-center uppercase tracking-wide leading-snug">
            {t.termoTitulo}
          </h2>

          <div className="text-sm text-slate-600 flex flex-col gap-4 leading-relaxed max-h-[320px] overflow-y-auto pr-2 border-b border-slate-100 pb-4">
            <p>{t.p1}</p>
            <div><p className="font-semibold text-slate-800 mb-1">{t.h1}</p><p>{t.t1}</p></div>
            <div><p className="font-semibold text-slate-800 mb-1">{t.h2}</p><p>{t.t2}</p></div>
            <div><p className="font-semibold text-slate-800 mb-1">{t.h3}</p><p>{t.t3}</p></div>
            <div><p className="font-semibold text-slate-800 mb-1">{t.h4}</p><p>{t.t4}</p></div>
            <div><p className="font-semibold text-slate-800 mb-1">{t.h5}</p><p>{t.t5}</p></div>
            <div><p className="font-semibold text-slate-800 mb-1">{t.h6}</p><p>{t.t6}</p></div>
          </div>
          <p className="text-xs text-slate-400 text-center pt-3 mt-1 font-medium">
            {t.rodapeTermo}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-pink-600" />
            {t.assinaturaTitulo}
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t.labelNome}</label>
              <input
                type="text"
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder={t.placeholderNome}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-slate-50/50"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer py-1 bg-pink-50/30 px-3 rounded-xl border border-pink-100/50 w-fit">
              <input
                type="checkbox"
                checked={isEstrangeiro}
                onChange={e => {
                  setIsEstrangeiro(e.target.checked)
                  setErro('')
                  setCpf('')
                }}
                className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4 border-slate-300"
              />
              <span className="text-xs font-bold text-pink-700">{t.checkEstrangeiro}</span>
            </label>

            {!isEstrangeiro && (
              <div className="animate-in fade-in duration-200">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t.labelCpf}</label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  value={cpf}
                  onChange={e => setCpf(formatarCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-slate-50/50"
                />
              </div>
            )}

            <label className="flex items-start gap-3 cursor-pointer mt-2">
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
              <span className="text-sm text-slate-600 leading-relaxed font-medium">
                {t.checkAceito}
              </span>
            </label>

            {erro && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-in shake duration-200">
                <AlertCircle size={16} />
                <span className="text-sm font-semibold">{erro}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={salvando || !aceito}
              className="w-full bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white font-black py-4 rounded-xl text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-pink-600/20 mt-2"
            >
              {salvando ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {salvando ? t.btnAssinando : t.btnAssinar}
            </button>
          </form>
        </div>

        <div className="h-4" />
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Users, Search, UserPlus, Phone, AtSign, 
  Fingerprint, Plus, Share2, X, CheckCircle, Edit2,
  ChevronDown, ChevronUp, FileText, Waves, Save
} from 'lucide-react'

// Tipagem base
type Aluno = {
  id: string
  nome: string
  telefone?: string
  instagram?: string
  created_at: string
  base_surf?: string
  nivel_surf?: string
  prancha_surf?: string
  cpf?: string
  assinatura_data?: string // Novo campo para o termo
}

export default function AlunosTab() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Controle da Sanfona
  const [alunoExpandido, setAlunoExpandido] = useState<string | null>(null)

  // Estados para o Modal de Cadastro/Edição
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [alunoEditando, setAlunoEditando] = useState<string | null>(null)
  
  const [nomeOriginal, setNomeOriginal] = useState('')
  const [novoNome, setNovoNome] = useState('')
  const [novoTelefone, setNovoTelefone] = useState('')
  const [novoInstagram, setNovoInstagram] = useState('')

  // Estado para feedback visual de salvamento do prontuário
  const [salvandoProntuarioId, setSalvandoProntuarioId] = useState<string | null>(null)

  async function carregarAlunos() {
    setLoading(true)
    
    // Busca alunos ordenados alfabeticamente
    const { data: alunosData, error: alunosError } = await supabase
      .from('alunos')
      .select('*')
      .eq('excluido', false)
      .order('nome', { ascending: true })

    const { data: termosData } = await supabase
      .from('termos_assinados')
      .select('nome_aluno, cpf, created_at')

    if (!alunosError && alunosData) {
      const alunosFormatados = alunosData.map(aluno => {
        const termo = termosData?.find(t => t.nome_aluno === aluno.nome)
        return { 
          ...aluno, 
          cpf: termo?.cpf || 'Não assinado',
          assinatura_data: termo?.created_at || ''
        }
      })
      setAlunos(alunosFormatados)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarAlunos()
  }, [])

  function abrirModalNovo() {
    setAlunoEditando(null)
    setNovoNome('')
    setNomeOriginal('')
    setNovoTelefone('')
    setNovoInstagram('')
    setIsModalOpen(true)
  }

  function abrirModalEditar(aluno: Aluno) {
    setAlunoEditando(aluno.id)
    setNovoNome(aluno.nome)
    setNomeOriginal(aluno.nome) 
    setNovoTelefone(aluno.telefone || '')
    setNovoInstagram(aluno.instagram || '')
    setIsModalOpen(true)
  }

  async function handleSalvarAluno(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)

    const nomeFormatado = novoNome.trim()
    const payload = { 
      nome: nomeFormatado, 
      telefone: novoTelefone.trim() || null, 
      instagram: novoInstagram.trim() || null 
    }

    let error;

    if (alunoEditando) {
      const response = await supabase.from('alunos').update(payload).eq('id', alunoEditando)
      error = response.error

      // Atualiza o nome em outras tabelas para manter integridade
      if (!error && nomeFormatado !== nomeOriginal) {
        await supabase.from('registro_aulas').update({ nome_cliente: nomeFormatado }).eq('nome_cliente', nomeOriginal)
        await supabase.from('pacotes').update({ nome_cliente: nomeFormatado }).eq('nome_cliente', nomeOriginal)
        await supabase.from('termos_assinados').update({ nome_aluno: nomeFormatado }).eq('nome_aluno', nomeOriginal)
      }

    } else {
      const response = await supabase.from('alunos').insert([payload])
      error = response.error
    }

    if (error) {
      alert("Erro ao salvar: " + error.message)
    } else {
      setIsModalOpen(false)
      carregarAlunos() 
    }
    setSalvando(false)
  }

  // Função para salvar dados do prontuário técnico (onBlur = quando tira o foco do campo)
  async function atualizarProntuario(alunoId: string, campo: string, valor: string) {
    setSalvandoProntuarioId(alunoId)
    const { error } = await supabase.from('alunos').update({ [campo]: valor }).eq('id', alunoId)
    if (error) alert("Erro ao salvar prontuário.")
    
    // Atualiza o estado local para não precisar recarregar todos os alunos
    setAlunos(prev => prev.map(a => a.id === alunoId ? { ...a, [campo]: valor } : a))
    
    setTimeout(() => setSalvandoProntuarioId(null), 500) // Feedback visual rápido
  }

  function compartilharLink() {
    const dominio = window.location.origin
    const link = `${dominio}/cadastro` 
    const mensagem = encodeURIComponent(`Olá! Para agilizar sua aula na Rosa Surf School, preencha sua ficha e assine o termo de responsabilidade por este link: ${link}`)
    window.open(`https://wa.me/?text=${mensagem}`, '_blank')
  }

  // Geração da página de impressão do Termo
  function imprimirTermo(aluno: Aluno) {
    if (!aluno.cpf || aluno.cpf === 'Não assinado') return

    const dataAceite = new Date(aluno.assinatura_data || '').toLocaleString('pt-BR')
    const dominio = window.location.origin

    const janelaPrint = window.open('', '_blank')
    if (!janelaPrint) return

    janelaPrint.document.write(`
      <html>
        <head>
          <title>Termo - ${aluno.nome}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin: 10px 0; }
            .subtitle { font-size: 14px; color: #666; }
            .dados { background: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
            .dados p { margin: 5px 0; font-size: 14px; }
            .content { font-size: 12px; text-align: justify; margin-bottom: 40px; }
            .footer { border-top: 1px solid #ddd; padding-top: 20px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Termo de Aceite de Risco e Responsabilidade</h1>
            <p class="subtitle">Rosa Surf School - Documento Digital</p>
          </div>
          
          <div class="dados">
            <p><strong>Nome do Aluno:</strong> ${aluno.nome}</p>
            <p><strong>CPF:</strong> ${aluno.cpf}</p>
            <p><strong>Data de Aceite Digital:</strong> ${dataAceite}</p>
            <p><strong>Validação:</strong> Assinatura eletrônica vinculada ao cadastro no sistema (${dominio}).</p>
          </div>

          <div class="content">
            <p>Reconheço e concordo que a prática do surf envolve riscos iminentes, incluindo, mas não se limitando a, lesões físicas, afogamento e danos a equipamentos. Assumo total responsabilidade por quaisquer acidentes ou lesões que possam ocorrer durante as aulas.</p>
            <p>Confirmo que não possuo restrições médicas que me impeçam de praticar atividades físicas intensas.</p>
            <p>Isento a escola de surf, seus instrutores e funcionários de qualquer responsabilidade civil ou criminal em caso de acidentes.</p>
            <p>Este documento foi lido, compreendido e aceito digitalmente pelo aluno identificado acima, possuindo validade legal conforme a legislação brasileira vigente sobre contratos e aceites eletrônicos.</p>
          </div>

          <div class="footer">
            Documento gerado automaticamente pelo sistema de gestão Rosa Surf School.<br/>
            Impresso em: ${new Date().toLocaleString('pt-BR')}
          </div>
        </body>
      </html>
    `)
    janelaPrint.document.close()
    
    // Aguarda carregar e chama a impressão
    setTimeout(() => {
      janelaPrint.print()
    }, 500)
  }

  const alunosFiltrados = alunos.filter(aluno =>
    aluno.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    aluno.telefone?.includes(busca)
  )

  return (
    <div className="px-4 py-2 flex flex-col gap-6 animate-in fade-in duration-500 relative min-h-[80vh]">
      
      <div className="flex justify-between items-center -mt-2">
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-md">
            <Users size={22} className="text-pink-400" />
            CRM Alunos
          </h2>
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">{alunos.length} cadastrados</span>
        </div>
        
        <button 
          onClick={compartilharLink}
          className="bg-white text-slate-800 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <Share2 size={14} className="text-pink-500" /> Cadastro
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Buscar aluno por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-white rounded-[16px] pl-12 pr-4 py-4 shadow-sm border border-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold text-slate-700"
        />
      </div>

      <div className="flex flex-col gap-2 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alunosFiltrados.length === 0 ? (
          <div className="bg-white rounded-[24px] p-8 text-center border border-slate-100 text-slate-400 text-sm font-medium shadow-sm">
            Nenhum aluno encontrado.
          </div>
        ) : alunosFiltrados.map((aluno) => {
          const isExpandido = alunoExpandido === aluno.id
          const hasTermo = aluno.cpf !== 'Não assinado'

          return (
            <div key={aluno.id} className="bg-white rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden transition-all duration-300">
              
              {/* CABEÇALHO (Sempre visível) */}
              <button 
                onClick={() => setAlunoExpandido(isExpandido ? null : aluno.id)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black text-sm border border-slate-200/50">
                    {aluno.nome.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-[15px] leading-tight">{aluno.nome}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {hasTermo && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                      <span className={`text-[9px] font-black uppercase tracking-widest ${hasTermo ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {hasTermo ? 'Termo OK' : 'Sem termo'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-slate-300">
                  {isExpandido ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {/* CONTEÚDO EXPANDIDO */}
              {isExpandido && (
                <div className="p-4 pt-0 border-t border-slate-50 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300">
                  
                  {/* Contatos Rápido */}
                  <div className="flex gap-2 mt-4">
                     <a href={`https://wa.me/${aluno.telefone?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 bg-[#25D366]/10 text-[#075E54] py-2 rounded-xl flex items-center justify-center gap-2 font-bold text-xs border border-[#25D366]/20">
                        <Phone size={12} /> WhatsApp
                     </a>
                     {aluno.instagram && (
                       <a href={`https://instagram.com/${aluno.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex-1 bg-pink-50 text-pink-700 py-2 rounded-xl flex items-center justify-center gap-2 font-bold text-xs border border-pink-100">
                          <AtSign size={12} /> Insta
                       </a>
                     )}
                     <button onClick={() => abrirModalEditar(aluno)} className="w-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center border border-slate-200">
                        <Edit2 size={12} />
                     </button>
                  </div>

                  {/* Prontuário Técnico */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 relative">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Waves size={12} className="text-pink-500"/> Prontuário Técnico
                      </h4>
                      {salvandoProntuarioId === aluno.id && (
                        <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-1 animate-pulse">
                          <Save size={10} /> Salvo
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Base</label>
                        <select 
                          value={aluno.base_surf || ''} 
                          onChange={e => atualizarProntuario(aluno.id, 'base_surf', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold text-slate-700 outline-none focus:border-pink-500"
                        >
                          <option value="">Não def.</option>
                          <option value="Goofy">Goofy</option>
                          <option value="Regular">Regular</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nível</label>
                        <select 
                          value={aluno.nivel_surf || ''} 
                          onChange={e => atualizarProntuario(aluno.id, 'nivel_surf', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold text-slate-700 outline-none focus:border-pink-500"
                        >
                          <option value="">Não def.</option>
                          <option value="Espuma (Inic.)">Espuma (Inic.)</option>
                          <option value="Dropando">Dropando</option>
                          <option value="Parede (Int.)">Parede (Int.)</option>
                          <option value="Manobras (Av.)">Manobras (Av.)</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Prancha Ideal / Histórico</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Longboard 9'0, Softboard azul..."
                          value={aluno.prancha_surf || ''}
                          onChange={e => setAlunos(prev => prev.map(a => a.id === aluno.id ? { ...a, prancha_surf: e.target.value } : a))}
                          onBlur={e => atualizarProntuario(aluno.id, 'prancha_surf', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Download Termo */}
                  <div className={`rounded-xl p-3 border flex items-center justify-between ${hasTermo ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex items-center gap-2">
                      <Fingerprint size={16} className={hasTermo ? 'text-emerald-600' : 'text-rose-500'} />
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${hasTermo ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {hasTermo ? 'Termo Assinado' : 'Pendente'}
                        </span>
                        <span className={`text-[9px] font-medium ${hasTermo ? 'text-emerald-600/80' : 'text-rose-600/80'}`}>
                          {hasTermo ? `CPF: ${aluno.cpf}` : 'O aluno precisa assinar'}
                        </span>
                      </div>
                    </div>
                    {hasTermo && (
                      <button 
                        onClick={() => imprimirTermo(aluno)}
                        className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 active:scale-90 transition-all shadow-sm"
                        title="Imprimir/Salvar PDF"
                      >
                        <FileText size={14} />
                      </button>
                    )}
                  </div>

                </div>
              )}
            </div>
          )
        })}
      </div>

      <button 
        onClick={abrirModalNovo}
        className="fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-full shadow-[0_8px_20px_rgba(232,67,106,0.4)] flex items-center justify-center transition-all active:scale-90 z-40 hover:rotate-90 duration-300"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* Modal Novo/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <form onSubmit={handleSalvarAluno} className="relative w-full max-w-md bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                {alunoEditando ? 'Editar Aluno' : 'Novo Aluno Manual'}
              </h3>
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

            <div className="flex flex-col gap-3 mt-2">
              <button 
                disabled={salvando}
                type="submit" 
                className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
              >
                {salvando ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle size={20} /> Salvar Dados</>}
              </button>

              {alunoEditando && (
                <button 
                  type="button"
                  onClick={async () => {
                    if (confirm("Arquivar este aluno? Ele sairá da lista principal.")) {
                      await supabase.from('alunos').update({ excluido: true }).eq('id', alunoEditando)
                      setIsModalOpen(false)
                      carregarAlunos()
                    }
                  }}
                  className="w-full text-rose-500 font-bold py-2 text-xs uppercase tracking-widest"
                >
                  Arquivar Aluno
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
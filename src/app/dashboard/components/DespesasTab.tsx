'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatarValor } from '@/lib/dateUtils'
import { 
  Receipt, Plus, Trash2, Calendar, 
  DollarSign, Tag, X, CheckCircle, Search 
} from 'lucide-react'

export default function DespesasTab() {
  const [despesas, setDespesas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)
  
  // Campos do Formulário
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataDespesa, setDataDespesa] = useState(new Date().toISOString().split('T')[0])
  const [categoria, setCategoria] = useState('Manutenção')

  async function carregarDespesas() {
    setLoading(true)
    const { data, error } = await supabase
      .from('despesas')
      .select('*')
      .order('data_despesa', { ascending: false })

    if (!error) setDespesas(data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregarDespesas()
  }, [])

  async function handleAddDespesa(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)

    const { error } = await supabase
      .from('despesas')
      .insert([{
        descricao: descricao.trim(),
        valor: parseFloat(valor),
        data_despesa: dataDespesa,
        categoria: categoria
      }])

    if (error) {
      alert("Erro ao salvar despesa: " + error.message)
    } else {
      setDescricao('')
      setValor('')
      setIsModalOpen(false)
      carregarDespesas()
    }
    setSalvando(false)
  }

  async function excluirDespesa(id: string) {
    if (!window.confirm("Eliminar esta despesa permanentemente?")) return
    const { error } = await supabase.from('despesas').delete().eq('id', id)
    if (!error) carregarDespesas()
  }

  const totalMes = despesas.reduce((acc, current) => acc + Number(current.valor), 0)

  return (
    <div className="px-4 py-2 flex flex-col gap-6 animate-in fade-in duration-500 relative min-h-[80vh]">
      
      {/* Resumo do Mês */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[28px] p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Total de Gastos</span>
          <h2 className="text-3xl font-black text-white mt-1">{formatarValor(totalMes)}</h2>
          <div className="mt-4 flex items-center gap-2">
            <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-3 py-1 rounded-full border border-rose-500/30 flex items-center gap-1">
              <Receipt size={10} /> {despesas.length} Registos
            </span>
          </div>
        </div>
        <DollarSign size={100} className="absolute -bottom-4 -right-4 text-white/5" />
      </div>

      {/* Lista de Despesas */}
      <div className="flex flex-col gap-3 pb-24">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Histórico de Saídas</h3>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : despesas.length > 0 ? (
          despesas.map((item) => (
            <div key={item.id} className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100 flex items-center justify-between animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Receipt size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm leading-tight">{item.descricao}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                      <Calendar size={10} /> {new Date(item.data_despesa).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-[9px] font-bold text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full uppercase">
                      {item.categoria}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-black text-rose-600 text-sm">-{formatarValor(item.valor)}</span>
                <button onClick={() => excluirDespesa(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[32px] py-12 flex flex-col items-center justify-center text-center px-6">
            <Receipt size={40} className="text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold">Nenhum gasto registado.</p>
          </div>
        )}
      </div>

      {/* Botão FAB para Nova Despesa */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 z-40"
      >
        <Plus size={32} />
      </button>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <form onSubmit={handleAddDespesa} className="relative w-full max-w-md bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Registar Gasto</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-500"><X size={24} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">O que comprou?</label>
                <input required type="text" placeholder="Ex: Parafina, Reparo de Prancha..." value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full bg-slate-50 border-slate-100 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-pink-500 outline-none font-bold text-slate-700" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Valor (R$)</label>
                  <input required type="number" step="0.01" placeholder="0,00" value={valor} onChange={e => setValor(e.target.value)} className="w-full bg-slate-50 border-slate-100 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-pink-500 outline-none font-bold text-slate-700" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Data</label>
                  <input required type="date" value={dataDespesa} onChange={e => setDataDespesa(e.target.value)} className="w-full bg-slate-50 border-slate-100 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-pink-500 outline-none font-bold text-slate-700" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Categoria</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full bg-slate-50 border-slate-100 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-pink-500 outline-none font-bold text-slate-700">
                  <option value="Manutenção">Manutenção</option>
                  <option value="Equipamentos">Equipamentos</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>

            <button 
              disabled={salvando}
              type="submit" 
              className="w-full bg-rose-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
            >
              {salvando ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle size={20} /> Confirmar Saída</>}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
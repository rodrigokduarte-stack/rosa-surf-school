import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    // 1. Descobrir as datas do mês passado
    const hoje = new Date()
    // Se hoje é Outubro, ele pega 1º de Setembro até 30 de Setembro
    const primeiroDiaMesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
    const ultimoDiaMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0)

    const dataInicio = primeiroDiaMesPassado.toISOString().split('T')[0]
    const dataFim = ultimoDiaMesPassado.toISOString().split('T')[0]
    
    // Nome do mês para o relatório (ex: "Setembro de 2026")
    const nomeMes = primeiroDiaMesPassado.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    const nomeMesCapitalizado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)

    // Apenas a mensagem informando que o relatório está pronto, sem os valores
    const mensagemRelatorio = `O relatório financeiro de ${nomeMesCapitalizado} já está disponível para download na aba Finanças.`

    // Salvar no Banco para aparecer no Sininho e nas Atividades
    await supabase
      .from('historico_atividades')
      .insert([{
        usuario: 'Sistema Financeiro', // Aparecerá como o "autor" da ação
        acao: `Fechamento Mensal Concluído`,
        detalhes: mensagemRelatorio,
      }])

    // Retorna sucesso para a Vercel saber que deu tudo certo
    return NextResponse.json({ 
      sucesso: true, 
      relatorio: mensagemRelatorio 
    })

  } catch (error) {
    console.error('Erro no fechamento mensal:', error)
    return NextResponse.json({ erro: 'Falha ao processar relatório' }, { status: 500 })
  }
}
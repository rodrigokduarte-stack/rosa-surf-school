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

    // 2. Buscar Faturamento (Aulas) do mês passado
    const { data: aulas } = await supabase
      .from('registro_aulas')
      .select('valor, status_pagamento')
      .gte('data_aula', dataInicio)
      .lte('data_aula', dataFim)
      .eq('excluido', false)

    // 3. Buscar Faturamento (Pacotes) do mês passado
    const { data: pacotes } = await supabase
      .from('pacotes')
      .select('valor_pago')
      .gte('data_compra', dataInicio) // ou data_pacote dependendo do seu banco
      .lte('data_compra', dataFim)
      .eq('excluido', false)

    // 4. Buscar Despesas do mês passado
    const { data: despesas } = await supabase
      .from('despesas')
      .select('valor')
      .gte('data', dataInicio) // ou data_despesa dependendo do seu banco
      .lte('data', dataFim)

    // 5. Fazer a Matemática Financeira
    let faturamentoTotal = 0
    let totalDespesas = 0
    let totalAulas = aulas ? aulas.length : 0

    // Soma aulas pagas
    aulas?.forEach(a => {
      if (a.status_pagamento === 'Pago' && a.valor) {
        faturamentoTotal += Number(a.valor)
      }
    })

    // Soma pacotes pagos
    pacotes?.forEach(p => {
      if (p.valor_pago) faturamentoTotal += Number(p.valor_pago)
    })

    // Soma despesas
    despesas?.forEach(d => {
      if (d.valor) totalDespesas += Number(d.valor)
    })

    // Calcula Lucro e Comissão de 10%
    const lucroLiquido = faturamentoTotal - totalDespesas
    const comissao = lucroLiquido > 0 ? lucroLiquido * 0.10 : 0

    // 6. Gerar a mensagem do Relatório
    const mensagemRelatorio = `Fechamento concluído! Aulas dadas: ${totalAulas} | Faturamento: R$ ${faturamentoTotal.toFixed(2)} | Despesas: R$ ${totalDespesas.toFixed(2)} | Lucro Líquido: R$ ${lucroLiquido.toFixed(2)} | Comissão (10%): R$ ${comissao.toFixed(2)}`

    // 7. Salvar no Banco para aparecer no Sininho e nas Atividades
    await supabase
      .from('historico_atividades')
      .insert([{
        usuario: 'Sistema Financeiro', // Aparecerá como o "autor" da ação
        acao: `Relatório de ${nomeMesCapitalizado}`,
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
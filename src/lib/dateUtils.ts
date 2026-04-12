export type Periodo = 'hoje' | 'semana' | 'mes' | 'tudo'

/** Retorna a data atual no fuso de Brasília no formato YYYY-MM-DD */
export function hojeEmBrasilia(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Retorna o intervalo de datas para o período selecionado, usando fuso Brasília */
export function getRange(periodo: Periodo): { inicio: string | null; fim: string | null } {
  const hoje = hojeEmBrasilia()

  if (periodo === 'hoje') return { inicio: hoje, fim: hoje }

  if (periodo === 'semana') {
    const [ano, mes, dia] = hoje.split('-').map(Number)
    const d = new Date(ano, mes - 1, dia)
    const day = d.getDay() // 0=Dom
    const daysToMonday = day === 0 ? 6 : day - 1
    d.setDate(d.getDate() - daysToMonday)
    const seg = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-')
    return { inicio: seg, fim: hoje }
  }

  if (periodo === 'mes') {
    return { inicio: hoje.substring(0, 7) + '-01', fim: hoje }
  }

  return { inicio: null, fim: null }
}

export function formatarData(data: string): string {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

export function formatarValor(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Aceita tanto string[] (pós-migração) quanto string csv (legacy) */
export function parseProfessores(nome: string | string[]): string[] {
  if (!nome) return []
  if (Array.isArray(nome)) return nome.filter(Boolean)
  return nome.split(',').map(p => p.trim()).filter(Boolean)
}

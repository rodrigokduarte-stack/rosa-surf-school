export interface RegistroAula {
  id: string
  data_aula: string
  horario: string
  modalidade: 'Aula Particular' | 'Aula Grupo'
  nome_cliente: string
  valor_aula: number
  valor_pago?: number  // Adicionamos o campo para salvar os valores parciais
  status_pagamento: 'Pago' | 'Pendente' | 'Parcial' // Adicionamos o status 'Parcial'
  nome_professor: string[]  // array nativo: ['Pet', 'Dodo']
  forma_pagamento?: string
  observacoes?: string
  pacote_id?: string | null
  created_at?: string
}

export type NovaAula = Omit<RegistroAula, 'id' | 'created_at'>

export interface Pacote {
  id: string
  nome_cliente: string
  total_aulas: number
  aulas_restantes: number
  valor_total: number
  valor_pago: number
  status: 'Ativo' | 'Finalizado'
  created_at?: string
}

export type NovoPacote = Omit<Pacote, 'id' | 'created_at'>

export interface RegistroCusto {
  id: string
  data_custo: string
  categoria: string
  descricao: string
  valor_custo: number
  created_at?: string
}

export type NovoCusto = Omit<RegistroCusto, 'id' | 'created_at'>

export interface AcertoProfessor {
  id: string
  data_acerto: string
  nome_professor: string
  created_at?: string
}

export interface TermoAssinado {
  id: string
  nome_aluno: string
  cpf: string
  aceitou_termos: boolean
  created_at?: string
}
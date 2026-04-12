-- Criação da tabela de registro de aulas da escola de surf
CREATE TABLE IF NOT EXISTS registro_aulas (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data_aula           DATE NOT NULL,
  horario             TEXT NOT NULL,
  modalidade          TEXT NOT NULL CHECK (modalidade IN ('PT', 'Grupo')),
  nome_cliente        TEXT NOT NULL,
  valor_aula          NUMERIC(10, 2) NOT NULL,
  status_pagamento    TEXT NOT NULL DEFAULT 'Pendente' CHECK (status_pagamento IN ('Pago', 'Pendente')),
  nome_professor      TEXT NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Habilita Row Level Security
ALTER TABLE registro_aulas ENABLE ROW LEVEL SECURITY;

-- Permite acesso total a usuários autenticados
CREATE POLICY "Acesso total para usuários autenticados"
  ON registro_aulas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

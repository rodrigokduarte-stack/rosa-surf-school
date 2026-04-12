-- =============================================
-- ATUALIZAÇÃO v4 - Sistema de Pacotes
-- Rosa Surf School
-- =============================================

-- 1. Tabela de pacotes de aulas
CREATE TABLE IF NOT EXISTS pacotes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_cliente    TEXT NOT NULL,
  total_aulas     INTEGER NOT NULL CHECK (total_aulas > 0),
  aulas_restantes INTEGER NOT NULL DEFAULT 0,
  valor_total     NUMERIC(10, 2) NOT NULL,
  valor_pago      NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Finalizado')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pacotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total para usuários autenticados"
  ON pacotes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Adicionar novas colunas na tabela de aulas
ALTER TABLE registro_aulas
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS observacoes     TEXT,
  ADD COLUMN IF NOT EXISTS pacote_id       UUID REFERENCES pacotes(id) ON DELETE SET NULL;

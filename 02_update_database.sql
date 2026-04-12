-- =============================================
-- ATUALIZAÇÃO DO BANCO DE DADOS - Rosa Surf School
-- =============================================

-- 1. Nova tabela: registro_custos
CREATE TABLE IF NOT EXISTS registro_custos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data_custo  DATE NOT NULL,
  categoria   TEXT NOT NULL,
  descricao   TEXT NOT NULL,
  valor_custo NUMERIC(10, 2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE registro_custos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total para usuários autenticados"
  ON registro_custos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Adicionar coluna quantidade_professores na tabela registro_aulas
ALTER TABLE registro_aulas
  ADD COLUMN IF NOT EXISTS quantidade_professores INTEGER NOT NULL DEFAULT 1;

-- 3. Atualizar constraint de modalidade
--    (PostgreSQL gera o nome automático como {tabela}_{coluna}_check)
ALTER TABLE registro_aulas
  DROP CONSTRAINT IF EXISTS registro_aulas_modalidade_check;

ALTER TABLE registro_aulas
  ADD CONSTRAINT registro_aulas_modalidade_check
  CHECK (modalidade IN ('Aula Particular', 'Aula Grupo'));

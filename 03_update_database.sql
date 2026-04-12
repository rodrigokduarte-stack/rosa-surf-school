-- =============================================
-- ATUALIZAÇÃO v3 - Rosa Surf School
-- =============================================

-- 1. Tabela de controle de acerto com professores
--    (presença de um registro = professor recebeu por aquele dia)
CREATE TABLE IF NOT EXISTS acerto_professores (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data_acerto     DATE NOT NULL,
  nome_professor  TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(data_acerto, nome_professor)
);

ALTER TABLE acerto_professores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total para usuários autenticados"
  ON acerto_professores
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Remover coluna quantidade_professores
--    (substituída pelo parsing de nome_professor com vírgulas)
ALTER TABLE registro_aulas
  DROP COLUMN IF EXISTS quantidade_professores;

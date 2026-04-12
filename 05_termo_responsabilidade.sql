-- =============================================
-- ATUALIZAÇÃO v5 - Sistema de Termos
-- Rosa Surf School
-- =============================================

CREATE TABLE IF NOT EXISTS termos_assinados (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_aluno     TEXT NOT NULL,
  cpf            TEXT NOT NULL,
  aceitou_termos BOOLEAN NOT NULL CHECK (aceitou_termos = true),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE termos_assinados ENABLE ROW LEVEL SECURITY;

-- Alunos sem login podem assinar (inserir)
CREATE POLICY "Anônimos podem inserir termos"
  ON termos_assinados
  FOR INSERT
  TO anon
  WITH CHECK (aceitou_termos = true);

-- Apenas usuários autenticados (admin) podem ler
CREATE POLICY "Autenticados podem ler termos"
  ON termos_assinados
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- MIGRAÇÃO v8 - nome_professor TEXT → TEXT[]
-- Rosa Surf School
-- =============================================
-- Converte a coluna de professor de texto livre (ex: 'Pet, Dodo')
-- para array nativo do PostgreSQL (ex: '{Pet,Dodo}').
-- O Supabase/PostgREST retorna TEXT[] como array JavaScript automaticamente.
-- =============================================

ALTER TABLE registro_aulas
  ALTER COLUMN nome_professor TYPE TEXT[]
  USING regexp_split_to_array(trim(nome_professor), '\s*,\s*');

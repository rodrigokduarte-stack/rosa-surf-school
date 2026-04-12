-- =============================================
-- LIMPEZA v11 - Pendências e Pacotes de Teste
-- Rosa Surf School
-- =============================================

-- 1. Marca todas as aulas como pagas (zera inadimplentes históricos)
UPDATE registro_aulas
SET status_pagamento = 'Pago'
WHERE status_pagamento = 'Pendente';

-- 2. Garante que todo par (data, professor) tem registro em acerto_professores
--    ON CONFLICT ignora duplicatas já existentes
INSERT INTO acerto_professores (data_acerto, nome_professor)
SELECT DISTINCT data_aula, unnest(nome_professor)
FROM registro_aulas
ON CONFLICT (data_acerto, nome_professor) DO NOTHING;

-- 3. Limpa todos os pacotes de teste
DELETE FROM pacotes;

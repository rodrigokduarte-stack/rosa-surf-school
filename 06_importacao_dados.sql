-- =============================================
-- IMPORTAÇÃO v6 - Histórico Março 2026
-- Rosa Surf School
-- =============================================
-- Notas:
--   • horario = '08:00' (não informado na fonte)
--   • nome_professor: apelidos mantidos como fornecido
--   • Pagamento "Pendente" → status_pagamento = 'Pendente', forma_pagamento = NULL
--   • Demais pagamentos → status_pagamento = 'Pago'
--   • modalidade inferida pelo nº de alunos (1 = Particular, 2+ = Grupo)
-- =============================================

-- ─── AULAS ────────────────────────────────────────────────────────────────────

INSERT INTO registro_aulas
  (data_aula, horario, modalidade, nome_cliente, nome_professor,
   valor_aula, status_pagamento, forma_pagamento, observacoes)
VALUES

  -- 02/03
  ('2026-03-02', '08:00', 'Aula Grupo',      'Grupo Miguel',       'Pet',              600.00, 'Pago',     'Pix',      'grupo miguel'),
  ('2026-03-02', '08:00', 'Aula Particular', 'Greg',               'Dodo',             250.00, 'Pago',     'Outro',    'pago zelle greg'),
  ('2026-03-02', '08:00', 'Aula Particular', 'Dodo',               'Guilherme Kaiser', 250.00, 'Pago',     'Dinheiro', '50 usd dodo'),
  ('2026-03-02', '08:00', 'Aula Particular', 'Miguel',             'Dodo',             150.00, 'Pago',     'Pix',      'pt miguel'),

  -- 03/03
  ('2026-03-03', '08:00', 'Aula Grupo',      'Grupo Daniela',      'Pet',              450.00, 'Pago',     'Pix',      'grupo daniela'),
  ('2026-03-03', '08:00', 'Aula Particular', 'Alexandre',          'Pet',              200.00, 'Pago',     'Pix',      'alexandre'),
  ('2026-03-03', '08:00', 'Aula Particular', 'Amigo de Alexandre', 'Marcelo',          200.00, 'Pago',     'Pix',      'amigo alexandre'),
  ('2026-03-03', '08:00', 'Aula Particular', 'Greg',               'Dodo',             180.00, 'Pago',     'Outro',    '36 usd zelle greg'),
  ('2026-03-03', '08:00', 'Aula Particular', 'Matt',               'Pet',              180.00, 'Pago',     'Dinheiro', '36 usd cash matt'),

  -- 04/03
  ('2026-03-04', '08:00', 'Aula Grupo',      'Rodrigo e amigo',    'Pet',              370.00, 'Pago',     'Pix',      'rodrigo e amigo'),
  ('2026-03-04', '08:00', 'Aula Particular', 'Argentino',          'Guilherme Kaiser', 200.00, 'Pago',     'Pix',      'pt argentino'),
  ('2026-03-04', '08:00', 'Aula Particular', 'Matt',               'Pet',              180.00, 'Pago',     'Dinheiro', '36 usd cash matt'),
  ('2026-03-04', '08:00', 'Aula Particular', 'Greg',               'Dodo',             180.00, 'Pago',     'Outro',    '36 usd zelle greg'),

  -- 05/03
  ('2026-03-05', '08:00', 'Aula Particular', 'Alexandre',          'Pet',              200.00, 'Pendente', NULL,       'alexandre'),
  ('2026-03-05', '08:00', 'Aula Particular', 'Amigo de Alexandre', 'Heitor',           200.00, 'Pendente', NULL,       'amigo alexandre'),
  ('2026-03-05', '08:00', 'Aula Grupo',      'Filhos Adriano',     'Pet',              300.00, 'Pago',     'Pix',      'filhos adriano'),
  ('2026-03-05', '08:00', 'Aula Particular', 'Greg',               'Pet',              180.00, 'Pago',     'Outro',    '36 usd greg'),
  ('2026-03-05', '08:00', 'Aula Particular', 'Matt',               'Dodo',             180.00, 'Pago',     'Dinheiro', '36 usd cash matt'),

  -- 06/03
  ('2026-03-06', '08:00', 'Aula Particular', 'Rayssa',             'Dodo',             166.00, 'Pago',     'Pix',      'pago 50% rayssa'),
  ('2026-03-06', '08:00', 'Aula Particular', 'Israelita',          'Cauan',            250.00, 'Pago',     'Dinheiro', 'israelita pt'),
  ('2026-03-06', '08:00', 'Aula Grupo',      'Casal Argentino',    'Pet',              370.00, 'Pago',     'Pix',      'casal argentino'),

  -- 07/03
  ('2026-03-07', '08:00', 'Aula Particular', 'Rayssa',             'Pet',              166.00, 'Pago',     'Pix',      'rayssa'),
  ('2026-03-07', '08:00', 'Aula Particular', 'Stella',             'Dodo',             200.00, 'Pago',     'Pix',      'stella'),

  -- 08/03
  ('2026-03-08', '08:00', 'Aula Particular', 'Stella',             'Pet',              200.00, 'Pago',     'Pix',      'stella'),
  ('2026-03-08', '08:00', 'Aula Particular', 'Avulsa',             'Guilherme Kaiser', 200.00, 'Pago',     'Pix',      'avulsa'),
  ('2026-03-08', '08:00', 'Aula Particular', 'Avulsa',             'Pet',              200.00, 'Pago',     'Pix',      'avulsa'),
  ('2026-03-08', '08:00', 'Aula Particular', 'Avulsa',             'Guilherme Kaiser', 200.00, 'Pago',     'Pix',      'avulsa'),

  -- 09/03
  ('2026-03-09', '08:00', 'Aula Particular', 'Stella',             'Dodo',             200.00, 'Pago',     'Pix',      'stella'),

  -- 11/03
  ('2026-03-11', '08:00', 'Aula Particular', 'Rayssa',             'Dodo',             166.00, 'Pago',     'Pix',      'rayssa'),
  ('2026-03-11', '08:00', 'Aula Particular', 'Thiago',             'Pet',              200.00, 'Pago',     'Pix',      'thiago');


-- ─── DESPESAS ─────────────────────────────────────────────────────────────────

INSERT INTO registro_custos
  (data_custo, categoria, descricao, valor_custo)
VALUES
  ('2026-03-01', 'Roupas de Borracha', 'Consertos de Roupas de Borracha', 340.00),
  ('2026-03-01', 'Custo MEI',          'Imposto DAS MEI (Matheus)',        75.00),
  ('2026-03-01', 'Marketing',          'Lote 36 Adesivos',                75.00);

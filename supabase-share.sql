-- Tabela de compartilhamento de grades
CREATE TABLE IF NOT EXISTS shared_grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

-- Índice para busca por token
CREATE INDEX IF NOT EXISTS idx_shared_grades_token ON shared_grades(share_token) WHERE active = true;

-- RLS
ALTER TABLE shared_grades ENABLE ROW LEVEL SECURITY;

-- Usuários gerenciam seus próprios shares
CREATE POLICY "Users manage own shares" ON shared_grades
  FOR ALL USING (auth.uid() = user_id);

-- Leitura pública (necessária para buscar por token)
CREATE POLICY "Public read by token" ON shared_grades
  FOR SELECT USING (true);

-- Função RPC para buscar grade compartilhada (bypassa RLS de disciplinas)
CREATE OR REPLACE FUNCTION get_shared_grade(p_token TEXT)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  periodo INTEGER,
  creditos INTEGER,
  "cargaHoraria" INTEGER,
  tipo TEXT,
  status TEXT,
  ga NUMERIC,
  gb NUMERIC,
  "notaFinal" NUMERIC,
  "semestreCursado" TEXT,
  faltas INTEGER
) AS $$
  SELECT
    d.id, d.nome, d.periodo, d.creditos, d."cargaHoraria",
    d.tipo, d.status, d.ga, d.gb, d."notaFinal", d."semestreCursado", d.faltas
  FROM disciplinas d
  JOIN shared_grades sg ON sg.user_id = d.user_id
  WHERE sg.share_token = p_token AND sg.active = true;
$$ LANGUAGE sql SECURITY DEFINER;

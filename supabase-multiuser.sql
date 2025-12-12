-- ============================================
-- SISTEMA MULTI-USUÁRIO - NOTAS FACULDADE
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Tabela de usuários autorizados (quem pagou)
CREATE TABLE IF NOT EXISTS usuarios_autorizados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  data_pagamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  plano TEXT DEFAULT 'basico',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar coluna user_id na tabela disciplinas (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'disciplinas' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE disciplinas ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- 3. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_disciplinas_user_id ON disciplinas(user_id);

-- 4. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Permitir leitura pública" ON disciplinas;
DROP POLICY IF EXISTS "Permitir inserção autenticada" ON disciplinas;
DROP POLICY IF EXISTS "Permitir atualização autenticada" ON disciplinas;
DROP POLICY IF EXISTS "Permitir exclusão autenticada" ON disciplinas;
DROP POLICY IF EXISTS "Usuarios veem suas disciplinas" ON disciplinas;
DROP POLICY IF EXISTS "Usuarios inserem suas disciplinas" ON disciplinas;
DROP POLICY IF EXISTS "Usuarios atualizam suas disciplinas" ON disciplinas;
DROP POLICY IF EXISTS "Usuarios deletam suas disciplinas" ON disciplinas;

-- 5. Habilitar RLS
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_autorizados ENABLE ROW LEVEL SECURITY;

-- 6. Políticas para disciplinas (cada usuário só vê/edita as suas)
CREATE POLICY "Usuarios veem suas disciplinas" ON disciplinas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios inserem suas disciplinas" ON disciplinas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios atualizam suas disciplinas" ON disciplinas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuarios deletam suas disciplinas" ON disciplinas
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Política para verificar se email está autorizado (leitura pública para verificação)
CREATE POLICY "Verificar email autorizado" ON usuarios_autorizados
  FOR SELECT USING (true);

-- 8. Função para verificar se usuário está autorizado
CREATE OR REPLACE FUNCTION verificar_usuario_autorizado(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM usuarios_autorizados 
    WHERE email = LOWER(user_email) AND ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. (OPCIONAL) Migrar suas disciplinas atuais para seu usuário
-- Substitua 'SEU_EMAIL@EXEMPLO.COM' pelo seu email
-- E 'SEU_USER_ID' pelo seu ID de usuário após criar conta
-- UPDATE disciplinas SET user_id = 'SEU_USER_ID' WHERE user_id IS NULL;

-- 10. Inserir você como usuário autorizado (admin)
-- Substitua pelo seu email real
INSERT INTO usuarios_autorizados (email, nome, plano) 
VALUES ('seu-email@exemplo.com', 'Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- APÓS EXECUTAR:
-- 1. Vá em Authentication > Providers
-- 2. Habilite Email e Google
-- 3. Configure as credenciais do Google OAuth
-- ============================================

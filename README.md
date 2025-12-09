# Sistema de Notas Acadêmicas

Sistema para gerenciar notas da faculdade com GA, GB e Nota Final.
Salva localmente e sincroniza na nuvem entre dispositivos.

## 🚀 Deploy na Vercel

### 1. Suba para o GitHub
```bash
git add .
git commit -m "add sync feature"
git push
```

### 2. Configure o Supabase (Gratuito)

1. Acesse https://supabase.com e crie uma conta
2. Clique em **"New Project"**
3. Dê um nome ao projeto e defina uma senha
4. Aguarde criar (1-2 minutos)

### 3. Crie a tabela no Supabase

Vá em **SQL Editor** e execute:

```sql
CREATE TABLE notas_usuarios (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  disciplinas JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permitir acesso anônimo
ALTER TABLE notas_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON notas_usuarios
  FOR ALL USING (true) WITH CHECK (true);
```

### 4. Pegue as credenciais

1. Vá em **Project Settings** > **API**
2. Copie:
   - **Project URL** (ex: https://xxx.supabase.co)
   - **anon public** key

### 5. Configure na Vercel

1. No projeto da Vercel, vá em **Settings** > **Environment Variables**
2. Adicione:
   - `VITE_SUPABASE_URL` = sua URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` = sua anon key
3. Clique **Redeploy** para aplicar

## 💾 Como Funciona

- **Sem login**: dados salvos apenas no navegador (localStorage)
- **Com login**: dados sincronizam na nuvem via Supabase
- **Offline**: funciona normalmente, sincroniza quando voltar online

## 📱 Funcionalidades

- ✅ Cadastro de disciplinas por período
- ✅ Sistema GA, GB e Nota Final
- ✅ Cálculo automático de média
- ✅ Simulador de nota necessária
- ✅ Dashboard com estatísticas
- ✅ Gráficos de desempenho
- ✅ Sincronização entre dispositivos
- ✅ Funciona offline

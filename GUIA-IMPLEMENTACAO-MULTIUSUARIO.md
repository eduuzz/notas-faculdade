# 🚀 Guia de Implementação - Sistema Multi-Usuário

Este guia detalha **todos os passos** para implementar o sistema multi-usuário no Sistema de Notas.

---

## 📋 Índice

1. [Preparação Local](#1-preparação-local)
2. [Configuração do Supabase - Banco de Dados](#2-configuração-do-supabase---banco-de-dados)
3. [Configuração do Supabase - Autenticação](#3-configuração-do-supabase---autenticação)
4. [Configuração do Google OAuth](#4-configuração-do-google-oauth)
5. [Personalizar Dados de Pagamento](#5-personalizar-dados-de-pagamento)
6. [Testar Localmente](#6-testar-localmente)
7. [Deploy no Vercel](#7-deploy-no-vercel)
8. [Migrar Seus Dados Atuais](#8-migrar-seus-dados-atuais)
9. [Gerenciar Usuários](#9-gerenciar-usuários)
10. [Solução de Problemas](#10-solução-de-problemas)

---

## 1. Preparação Local

### 1.1 Baixar e extrair o ZIP

```bash
# Navegue até sua pasta de projetos
cd ~/Projetos

# Se já existe a pasta, faça backup
mv notas-faculdade notas-faculdade-backup

# Extraia o novo ZIP (ajuste o caminho conforme necessário)
unzip ~/Downloads/notas-faculdade-multiuser.zip -d notas-faculdade

# Entre na pasta
cd notas-faculdade
```

### 1.2 Instalar dependências

```bash
npm install
```

### 1.3 Verificar arquivo .env

Certifique-se que o arquivo `.env` existe com suas credenciais do Supabase:

```bash
# Verificar se existe
cat .env
```

Se não existir, crie:

```bash
# Criar .env
cp .env.example .env

# Editar com suas credenciais
nano .env
```

Conteúdo do `.env`:
```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

> **Onde encontrar:** Supabase Dashboard > Settings > API

---

## 2. Configuração do Supabase - Banco de Dados

### 2.1 Acessar o SQL Editor

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **+ New query**

### 2.2 Executar o script SQL

Copie e cole o conteúdo do arquivo `supabase-multiuser.sql` no editor.

**⚠️ IMPORTANTE:** Antes de executar, edite a linha 67:

```sql
-- TROQUE ISSO:
INSERT INTO usuarios_autorizados (email, nome, plano) 
VALUES ('seu-email@exemplo.com', 'Admin', 'admin')

-- PARA SEU EMAIL REAL:
INSERT INTO usuarios_autorizados (email, nome, plano) 
VALUES ('eproencad@gmail.com', 'Eduardo', 'admin')
```

### 2.3 Executar o script

1. Clique no botão **Run** (ou Ctrl+Enter)
2. Aguarde a execução
3. Verifique se não há erros (deve aparecer "Success")

### 2.4 Verificar se funcionou

No menu lateral, vá em **Table Editor** e verifique:

- ✅ Tabela `usuarios_autorizados` existe
- ✅ Tabela `disciplinas` tem coluna `user_id`

Para verificar a tabela de autorizados:
```sql
SELECT * FROM usuarios_autorizados;
```

---

## 3. Configuração do Supabase - Autenticação

### 3.1 Habilitar Email/Senha

1. No menu lateral, clique em **Authentication**
2. Clique em **Providers**
3. Encontre **Email** na lista
4. Certifique-se que está **Enabled**
5. Configure as opções:
   - ✅ Enable Email Signup
   - ✅ Confirm Email (recomendado para produção)
   - ❌ Secure email change (pode deixar desabilitado)

### 3.2 Configurar templates de email (opcional mas recomendado)

1. Em **Authentication**, clique em **Email Templates**
2. Personalize os templates:

**Confirm signup:**
```
Assunto: Confirme seu cadastro - Sistema de Notas

Olá!

Clique no link abaixo para confirmar seu cadastro:
{{ .ConfirmationURL }}

Se você não solicitou este cadastro, ignore este email.
```

**Reset password:**
```
Assunto: Redefinir senha - Sistema de Notas

Olá!

Clique no link abaixo para redefinir sua senha:
{{ .ConfirmationURL }}
```

### 3.3 Configurar URL de redirecionamento

1. Em **Authentication**, clique em **URL Configuration**
2. Adicione em **Redirect URLs**:
   - `http://localhost:5173` (desenvolvimento)
   - `https://notas-faculdade.vercel.app` (produção)
   - `https://seu-dominio.com` (se tiver domínio próprio)

---

## 4. Configuração do Google OAuth

### 4.1 Criar projeto no Google Cloud

1. Acesse [https://console.cloud.google.com](https://console.cloud.google.com)
2. Clique em **Select a project** > **New Project**
3. Nome: `Sistema de Notas` (ou outro nome)
4. Clique em **Create**

### 4.2 Configurar tela de consentimento OAuth

1. No menu lateral, vá em **APIs & Services** > **OAuth consent screen**
2. Selecione **External** e clique **Create**
3. Preencha:
   - **App name:** Sistema de Notas
   - **User support email:** seu email
   - **Developer contact:** seu email
4. Clique **Save and Continue**
5. Em **Scopes**, clique **Add or Remove Scopes**
   - Selecione: `email`, `profile`, `openid`
   - Clique **Update**
6. Clique **Save and Continue** até finalizar

### 4.3 Criar credenciais OAuth

1. Vá em **APIs & Services** > **Credentials**
2. Clique **+ Create Credentials** > **OAuth client ID**
3. Selecione **Web application**
4. Nome: `Sistema de Notas Web`
5. Em **Authorized JavaScript origins**, adicione:
   - `http://localhost:5173`
   - `https://notas-faculdade.vercel.app`
6. Em **Authorized redirect URIs**, adicione:
   - `https://SEU-PROJETO.supabase.co/auth/v1/callback`
   
   > Substitua `SEU-PROJETO` pelo ID do seu projeto Supabase
   
7. Clique **Create**
8. **COPIE** o `Client ID` e `Client Secret`

### 4.4 Adicionar credenciais no Supabase

1. Volte ao Supabase Dashboard
2. Vá em **Authentication** > **Providers**
3. Encontre **Google** e clique para expandir
4. Habilite **Enable Sign in with Google**
5. Cole:
   - **Client ID:** (cole o que copiou)
   - **Client Secret:** (cole o que copiou)
6. Clique **Save**

---

## 5. Personalizar Dados de Pagamento

### 5.1 Editar informações de pagamento

Abra o arquivo `src/Login.jsx` e edite as linhas com seus dados reais:

```jsx
// Linha ~118 - Chave Pix
<div className="font-mono text-white text-sm break-all select-all">
  eproencad@gmail.com  {/* TROQUE PELO SEU EMAIL/CHAVE PIX */}
</div>

// Linha ~124 - WhatsApp
<a 
  href="https://wa.me/5551999999999?text=Olá! Fiz o pagamento do Sistema de Notas. Meu email é: " 
  target="_blank" 
  rel="noopener noreferrer"
  className="font-semibold text-green-400 hover:text-green-300"
>
  (51) 99999-9999  {/* TROQUE PELO SEU NÚMERO */}
</a>
```

### 5.2 Ajustar valor (opcional)

Se quiser mudar o preço, edite a linha ~97:
```jsx
<div className="text-4xl font-bold text-white mt-1">
  R$ 15<span className="text-lg text-slate-400">,00</span>
</div>
```

---

## 6. Testar Localmente

### 6.1 Iniciar o servidor de desenvolvimento

```bash
cd ~/Projetos/notas-faculdade
npm run dev
```

### 6.2 Acessar no navegador

Abra: [http://localhost:5173](http://localhost:5173)

### 6.3 Testar login com email

1. Na tela de login, use seu email autorizado
2. Digite uma senha (mínimo 6 caracteres)
3. Se configurou confirmação de email, verifique sua caixa de entrada

### 6.4 Testar login com Google

1. Clique em **Entrar com Google**
2. Selecione sua conta Google
3. Autorize o aplicativo

### 6.5 Verificar se aparece vazio

Ao fazer login pela primeira vez, o sistema deve estar vazio (sem disciplinas), pois agora cada usuário tem seus próprios dados.

---

## 7. Deploy no Vercel

### 7.1 Commit e push das alterações

```bash
cd ~/Projetos/notas-faculdade

# Verificar status
git status

# Adicionar todos os arquivos
git add .

# Commit
git commit -m "feat: implementa sistema multi-usuario com autenticacao"

# Push
git push origin main
```

### 7.2 Verificar deploy automático

1. Acesse [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione o projeto `notas-faculdade`
3. Aguarde o deploy finalizar (geralmente 1-2 minutos)
4. Verifique se não há erros no build

### 7.3 Testar em produção

Acesse: [https://notas-faculdade.vercel.app](https://notas-faculdade.vercel.app)

---

## 8. Migrar Seus Dados Atuais

Se você já tem disciplinas cadastradas e quer mantê-las vinculadas ao seu usuário:

### 8.1 Descobrir seu user_id

1. Faça login no sistema
2. Abra o Console do navegador (F12 > Console)
3. Digite:
```javascript
// No Supabase v2
const { data } = await supabase.auth.getUser();
console.log(data.user.id);
```

Ou vá no Supabase Dashboard > Authentication > Users e copie o ID do seu usuário.

### 8.2 Migrar disciplinas existentes

No Supabase SQL Editor, execute:

```sql
-- Substitua 'SEU-USER-ID' pelo ID real (ex: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
UPDATE disciplinas 
SET user_id = 'SEU-USER-ID' 
WHERE user_id IS NULL;
```

### 8.3 Verificar migração

```sql
SELECT COUNT(*) as total, user_id 
FROM disciplinas 
GROUP BY user_id;
```

---

## 9. Gerenciar Usuários

### 9.1 Autorizar novo usuário (após pagamento)

No Supabase SQL Editor:

```sql
INSERT INTO usuarios_autorizados (email, nome, plano) 
VALUES ('email-do-cliente@gmail.com', 'Nome do Cliente', 'basico');
```

### 9.2 Verificar usuários autorizados

```sql
SELECT * FROM usuarios_autorizados ORDER BY created_at DESC;
```

### 9.3 Desativar usuário

```sql
UPDATE usuarios_autorizados 
SET ativo = false 
WHERE email = 'email-do-cliente@gmail.com';
```

### 9.4 Ver todos os usuários cadastrados

No Supabase Dashboard > Authentication > Users

### 9.5 Deletar usuário

```sql
-- Primeiro, delete as disciplinas do usuário
DELETE FROM disciplinas WHERE user_id = 'USER-ID-AQUI';

-- Depois, remova da lista de autorizados
DELETE FROM usuarios_autorizados WHERE email = 'email@exemplo.com';

-- Para deletar o usuário do Auth, use o Dashboard:
-- Authentication > Users > Selecione > Delete
```

---

## 10. Solução de Problemas

### ❌ "Email não autorizado"

**Causa:** Email não está na tabela `usuarios_autorizados`

**Solução:**
```sql
INSERT INTO usuarios_autorizados (email, nome, plano) 
VALUES ('email@exemplo.com', 'Nome', 'basico');
```

### ❌ Google login não funciona

**Possíveis causas:**
1. Credenciais erradas no Supabase
2. Redirect URI incorreta

**Soluções:**
1. Verifique Client ID e Secret no Google Cloud
2. Adicione `https://SEU-PROJETO.supabase.co/auth/v1/callback` nas URIs autorizadas

### ❌ "RLS policy violation"

**Causa:** Usuário tentando acessar dados de outro usuário

**Solução:** Verificar se as políticas RLS estão corretas:
```sql
-- Ver políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'disciplinas';
```

### ❌ Disciplinas não aparecem após login

**Possíveis causas:**
1. Dados não foram migrados
2. user_id diferente

**Solução:**
```sql
-- Verificar se existem disciplinas sem user_id
SELECT COUNT(*) FROM disciplinas WHERE user_id IS NULL;

-- Verificar disciplinas do usuário
SELECT * FROM disciplinas WHERE user_id = 'SEU-USER-ID';
```

### ❌ Erro de CORS

**Causa:** URL não autorizada no Supabase

**Solução:**
1. Vá em Authentication > URL Configuration
2. Adicione sua URL em Redirect URLs

### ❌ Build falha no Vercel

**Solução:**
```bash
# Testar build local primeiro
npm run build

# Se houver erros, corrija-os antes de fazer push
```

---

## 📝 Checklist Final

- [ ] .env configurado com credenciais Supabase
- [ ] SQL executado no Supabase
- [ ] Seu email adicionado em usuarios_autorizados
- [ ] Email provider habilitado no Supabase
- [ ] Google OAuth configurado (Google Cloud + Supabase)
- [ ] Redirect URLs configuradas
- [ ] Dados de Pix/WhatsApp personalizados em Login.jsx
- [ ] Testado login com email localmente
- [ ] Testado login com Google localmente
- [ ] Commit e push realizados
- [ ] Deploy no Vercel funcionando
- [ ] Testado em produção

---

## 🎉 Pronto!

Seu sistema agora suporta múltiplos usuários, cada um com suas próprias disciplinas!

**Fluxo de venda:**
1. Cliente acessa o site → vê tela de login
2. Clica em "Quero me cadastrar" → vê instruções de pagamento
3. Faz o Pix e envia comprovante no WhatsApp
4. Você adiciona o email dele na tabela `usuarios_autorizados`
5. Cliente volta, cria conta e usa o sistema

---

*Última atualização: Dezembro 2025*

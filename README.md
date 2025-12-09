# Sistema de Notas Acadêmicas

Sistema para gerenciar notas da faculdade com GA, GB e Nota Final.

## 🚀 Deploy na Vercel (Mais Fácil)

### Passo a Passo:

1. **Crie uma conta no GitHub** (se não tiver): https://github.com

2. **Crie um novo repositório**:
   - Clique em "New repository"
   - Nome: `notas-faculdade`
   - Deixe público
   - Clique "Create repository"

3. **Suba os arquivos**:
   - Extraia o ZIP
   - No terminal, dentro da pasta:
   ```bash
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/notas-faculdade.git
   git push -u origin main
   ```

4. **Deploy na Vercel**:
   - Acesse https://vercel.com
   - Faça login com GitHub
   - Clique "Add New..." > "Project"
   - Selecione o repositório `notas-faculdade`
   - Clique "Deploy"
   - Pronto! Você terá uma URL tipo: `notas-faculdade.vercel.app`

## 💻 Rodar Localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:5173

## 📱 Funcionalidades

- ✅ Cadastro de disciplinas por período
- ✅ Sistema de notas GA, GB e Nota Final
- ✅ Cálculo automático de média
- ✅ Simulador de nota necessária
- ✅ Dashboard com estatísticas
- ✅ Gráficos de desempenho
- ✅ Filtros e busca

## 🔧 Tecnologias

- React + Vite
- Tailwind CSS
- Recharts (gráficos)
- Lucide React (ícones)

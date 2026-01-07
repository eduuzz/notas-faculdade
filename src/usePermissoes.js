import { useMemo } from 'react';
import { useAuth } from './AuthContext';

// Definição das permissões por plano
const PERMISSOES_POR_PLANO = {
  gratuito: {
    limiteDisciplinas: 20,
    dashboardCompleto: false,
    dashboardPersonalizavel: false,
    exportarPdf: false,
    exportarPdfGraficos: false,
    previsaoFormatura: false,
    simuladorNotas: false,
    multiplosCursos: false,
    metasAlertas: false,
    backupExportar: false,
    suportePrioritario: false,
    acessoAdmin: false,
  },
  basico: {
    limiteDisciplinas: 20,
    dashboardCompleto: false,
    dashboardPersonalizavel: false,
    exportarPdf: false,
    exportarPdfGraficos: false,
    previsaoFormatura: false,
    simuladorNotas: false,
    multiplosCursos: false,
    metasAlertas: false,
    backupExportar: false,
    suportePrioritario: false,
    acessoAdmin: false,
  },
  pro: {
    limiteDisciplinas: Infinity,
    dashboardCompleto: true,
    dashboardPersonalizavel: false,
    exportarPdf: true,
    exportarPdfGraficos: false,
    previsaoFormatura: true,
    simuladorNotas: false,
    multiplosCursos: false,
    metasAlertas: false,
    backupExportar: false,
    suportePrioritario: false,
    acessoAdmin: false,
  },
  premium: {
    limiteDisciplinas: Infinity,
    dashboardCompleto: true,
    dashboardPersonalizavel: true,
    exportarPdf: true,
    exportarPdfGraficos: true,
    previsaoFormatura: true,
    simuladorNotas: true,
    multiplosCursos: true,
    metasAlertas: true,
    backupExportar: true,
    suportePrioritario: true,
    acessoAdmin: false,
  },
  admin: {
    limiteDisciplinas: Infinity,
    dashboardCompleto: true,
    dashboardPersonalizavel: true,
    exportarPdf: true,
    exportarPdfGraficos: true,
    previsaoFormatura: true,
    simuladorNotas: true,
    multiplosCursos: true,
    metasAlertas: true,
    backupExportar: true,
    suportePrioritario: true,
    acessoAdmin: true,
  }
};

// Labels amigáveis para cada funcionalidade
export const FUNCIONALIDADES_LABELS = {
  limiteDisciplinas: 'Limite de disciplinas',
  dashboardCompleto: 'Dashboard completo',
  dashboardPersonalizavel: 'Dashboard personalizável',
  exportarPdf: 'Exportar PDF',
  exportarPdfGraficos: 'PDF com gráficos',
  previsaoFormatura: 'Previsão de formatura',
  simuladorNotas: 'Simulador de notas',
  multiplosCursos: 'Múltiplos cursos',
  metasAlertas: 'Metas e alertas',
  backupExportar: 'Backup/Exportar dados',
  suportePrioritario: 'Suporte prioritário',
  acessoAdmin: 'Painel administrativo',
};

// Plano mínimo necessário para cada funcionalidade
export const PLANO_MINIMO = {
  limiteDisciplinas: 'gratuito',
  dashboardCompleto: 'pro',
  dashboardPersonalizavel: 'premium',
  exportarPdf: 'pro',
  exportarPdfGraficos: 'premium',
  previsaoFormatura: 'pro',
  simuladorNotas: 'premium',
  multiplosCursos: 'premium',
  metasAlertas: 'premium',
  backupExportar: 'premium',
  suportePrioritario: 'premium',
  acessoAdmin: 'admin',
};

export function usePermissoes() {
  const { userPlano, userPlanoExpiraEm } = useAuth();
  
  // Plano padrão é 'gratuito' para novos usuários
  const planoAtual = userPlano || 'gratuito';
  
  // Verificar se o plano expirou
  const planoExpirado = useMemo(() => {
    if (!userPlanoExpiraEm) return false;
    if (planoAtual === 'admin') return false; // Admin nunca expira
    return new Date(userPlanoExpiraEm) < new Date();
  }, [userPlanoExpiraEm, planoAtual]);
  
  // Calcular dias restantes
  const diasRestantes = useMemo(() => {
    if (!userPlanoExpiraEm) return null;
    if (planoAtual === 'admin') return null;
    const hoje = new Date();
    const expiracao = new Date(userPlanoExpiraEm);
    const diff = expiracao - hoje;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [userPlanoExpiraEm, planoAtual]);
  
  const permissoes = useMemo(() => {
    return PERMISSOES_POR_PLANO[planoAtual] || PERMISSOES_POR_PLANO.gratuito;
  }, [planoAtual]);

  // Verifica se tem permissão para uma funcionalidade específica
  const temPermissao = (funcionalidade) => {
    // Se expirou, só permite visualização (não edição)
    if (planoExpirado && funcionalidade !== 'visualizar') {
      return false;
    }
    return permissoes[funcionalidade] === true || 
           (typeof permissoes[funcionalidade] === 'number' && permissoes[funcionalidade] > 0);
  };

  // Verifica se pode editar (não expirou)
  const podeEditar = !planoExpirado;

  // Retorna o limite de disciplinas
  const getLimiteDisciplinas = () => {
    return permissoes.limiteDisciplinas;
  };

  // Verifica se pode adicionar mais disciplinas
  const podeAdicionarDisciplina = (quantidadeAtual) => {
    if (planoExpirado) return false;
    return quantidadeAtual < permissoes.limiteDisciplinas;
  };

  // Retorna qual plano é necessário para uma funcionalidade
  const planoNecessario = (funcionalidade) => {
    return PLANO_MINIMO[funcionalidade];
  };

  // Verifica se o plano atual é igual ou superior ao necessário
  const planoSuficiente = (planoNecessario) => {
    const hierarquia = { gratuito: 0, basico: 1, pro: 2, premium: 3, admin: 4 };
    return hierarquia[planoAtual] >= hierarquia[planoNecessario];
  };

  // Verifica se é admin
  const isAdmin = planoAtual === 'admin';

  return {
    planoAtual,
    permissoes,
    temPermissao,
    getLimiteDisciplinas,
    podeAdicionarDisciplina,
    planoNecessario,
    planoSuficiente,
    isAdmin,
    planoExpirado,
    diasRestantes,
    podeEditar,
  };
}

export default usePermissoes;

import { useMemo } from 'react';
import { useAuth } from './AuthContext';

// Definição das permissões por plano
const PERMISSOES_POR_PLANO = {
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
  limiteDisciplinas: 'basico',
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
  const { userPlano } = useAuth();
  
  // Plano padrão é 'pro' para usuários existentes
  const planoAtual = userPlano || 'pro';
  
  const permissoes = useMemo(() => {
    return PERMISSOES_POR_PLANO[planoAtual] || PERMISSOES_POR_PLANO.pro;
  }, [planoAtual]);

  // Verifica se tem permissão para uma funcionalidade específica
  const temPermissao = (funcionalidade) => {
    return permissoes[funcionalidade] === true || 
           (typeof permissoes[funcionalidade] === 'number' && permissoes[funcionalidade] > 0);
  };

  // Retorna o limite de disciplinas
  const getLimiteDisciplinas = () => {
    return permissoes.limiteDisciplinas;
  };

  // Verifica se pode adicionar mais disciplinas
  const podeAdicionarDisciplina = (quantidadeAtual) => {
    return quantidadeAtual < permissoes.limiteDisciplinas;
  };

  // Retorna qual plano é necessário para uma funcionalidade
  const planoNecessario = (funcionalidade) => {
    return PLANO_MINIMO[funcionalidade];
  };

  // Verifica se o plano atual é igual ou superior ao necessário
  const planoSuficiente = (planoNecessario) => {
    const hierarquia = { basico: 1, pro: 2, premium: 3, admin: 4 };
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
  };
}

export default usePermissoes;

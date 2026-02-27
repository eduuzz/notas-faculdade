import React, { useState, useCallback, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Info, File, Loader2, Eye, EyeOff, Sparkles, Zap, Globe } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function ImportModal({ onClose, onImport, disciplinasExistentes = [] }) {
  const [modo, setModo] = useState('texto');
  const [texto, setTexto] = useState('');
  const [disciplinasPreview, setDisciplinasPreview] = useState([]);
  const [expandido, setExpandido] = useState(false);
  const [processandoPdf, setProcessandoPdf] = useState(false);
  const [processandoIA, setProcessandoIA] = useState(false);
  const [arquivoPdf, setArquivoPdf] = useState(null);
  const [erroPdf, setErroPdf] = useState(null);
  const [mostrarTextoExtraido, setMostrarTextoExtraido] = useState(false);
  const [textoExtraidoPdf, setTextoExtraidoPdf] = useState('');
  const [filtroObrigatorias, setFiltroObrigatorias] = useState(true);
  const [filtroTrilhas, setFiltroTrilhas] = useState(false);
  const [filtroOptativas, setFiltroOptativas] = useState(false);
  const fileInputRef = useRef(null);

  // Portal automático
  const [ra, setRa] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenhaPortal, setMostrarSenhaPortal] = useState(false);
  const [buscandoPortal, setBuscandoPortal] = useState(false);
  const [erroPortal, setErroPortal] = useState(null);
  const [importando, setImportando] = useState(false);

  // Análise inteligente com Claude API
  const analisarComIA = useCallback(async (textoParaAnalisar) => {
    setProcessandoIA(true);
    setErroPdf(null);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          messages: [
            {
              role: 'user',
              content: `Analise este texto de grade curricular universitária e extraia as disciplinas.

ESTRUTURA DO PDF:
- "Seq." = Semestre (1-8 para obrigatórias, 9+ ou "Trilha X" para optativas/trilhas)
- "N." = Código da disciplina (número de 5 dígitos, ex: 60963)
- "Atividades Acadêmicas" = Nome da disciplina
- "Cred." = Créditos
- "Horas-Aula" = Carga horária principal (usar este valor)
- "Horas Práticas" = ignorar para carga horária
- "Horas de Estágio" = ignorar
- "Pré-requisitos" = códigos das disciplinas necessárias antes
- "Correquisitos" = códigos das disciplinas que devem ser cursadas junto
- "Obs." = ignorar

REGRAS IMPORTANTES:
1. Extrair APENAS disciplinas reais (que tem código de 5 dígitos)
2. O período/semestre vem da coluna "Seq." (1-8 = semestre regular, outros = optativas/trilhas)
3. Trilhas como "Trilha Empreendedorismo", "Trilha Mestrado", etc. devem ter periodo = 9
4. Disciplinas optativas sem semestre definido devem ter periodo = 0
5. NÃO duplicar disciplinas (mesmo código = mesma disciplina)
6. Ignorar cabeçalhos, totais, observações e textos que não são disciplinas

Retorne APENAS um JSON válido:
{
  "disciplinas": [
    {
      "codigo": "60963",
      "nome": "Raciocínio Lógico",
      "creditos": 4,
      "cargaHoraria": 60,
      "periodo": 1
    }
  ]
}

IMPORTANTE: Retorne SOMENTE o JSON, sem explicações.

Texto do PDF:
${textoParaAnalisar.substring(0, 20000)}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Erro na API');
      }

      const data = await response.json();
      const conteudo = data.content[0].text;

      const jsonMatch = conteudo.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const resultado = JSON.parse(jsonMatch[0]);
        if (resultado.disciplinas && Array.isArray(resultado.disciplinas)) {
          const codigosVistos = new Set();
          const disciplinasProcessadas = resultado.disciplinas
            .filter(d => {
              if (!d.codigo || codigosVistos.has(d.codigo)) return false;
              codigosVistos.add(d.codigo);
              return true;
            })
            .map(d => ({
              codigo: d.codigo,
              nome: d.nome,
              creditos: d.creditos || 4,
              cargaHoraria: d.cargaHoraria || 60,
              periodo: d.periodo || 1,
              fonte: 'ia'
            }));

          setDisciplinasPreview(disciplinasProcessadas.sort((a, b) => 
            a.periodo - b.periodo || a.nome.localeCompare(b.nome)
          ));
          return true;
        }
      }
      throw new Error('Formato inválido');
    } catch (error) {
      console.error('Erro na análise IA:', error);
      setErroPdf('Erro na análise inteligente. Tente o modo manual.');
      return false;
    } finally {
      setProcessandoIA(false);
    }
  }, []);

  // Detectar se é disciplina de trilha pelo nome
  const ehTrilha = useCallback((nome) => {
    const nomeLower = nome.toLowerCase();
    return nomeLower.includes('projeto aplicado') ||
           nomeLower.includes('trilha') ||
           nomeLower.includes('modelagem de negócios') ||
           nomeLower.includes('consolidação do modelo') ||
           nomeLower.includes('design e gestão para inovação') ||
           nomeLower.includes('soluções criativas') ||
           nomeLower.includes('atividade no mestrado');
  }, []);

  // Parser manual otimizado para PDFs UNISINOS
  // Formato: SEQ. | N. (código 5 dígitos) | ATIVIDADES ACADÊMICAS | OBS. | CRED. | HORAS-AULA | ...
  const parseTextoManual = useCallback((text) => {
    const disciplinas = [];
    const codigosAdicionados = new Set();
    const nomesAdicionados = new Set();

    // Palavras/frases que indicam NÃO é disciplina
    const ignorarLinhas = [
      'seq.', 'cred.', 'horas-aula', 'horas práticas', 'pré-requisitos',
      'correquisitos', 'obs.', 'atividades acadêmicas', 'universidade',
      'unisinos', 'coordenação', 'reconhecimento', 'portaria', 'duração',
      'telefone', 'e-mail', 'observações', 'quadro de atividades',
      'atividades complementares', 'grupos', 'paridade', 'limite máximo',
      'horas extraclasse', 'horas de estágio', 'ch teórica', 'ch de prática',
      'projetos aplicados da trilha', 'optativas da trilha', 'cod.'
    ];

    // Nomes genéricos que não são disciplinas reais
    const nomesGenericos = [
      'atividades complementares', 'livre escolha', 'atividade optativa'
    ];

    const linhas = text.split(/[\n\r]+/);
    let semestreAtual = 1;
    let secaoAtual = 'obrigatoria'; // 'obrigatoria', 'trilha', 'optativa'
    
    for (const linha of linhas) {
      const trimmed = linha.trim();
      if (trimmed.length < 5) continue;
      
      const linhaLower = trimmed.toLowerCase();
      
      // Pular linhas de cabeçalho/metadados
      if (ignorarLinhas.some(p => linhaLower.startsWith(p) || linhaLower === p)) continue;
      
      // Detectar seções de trilhas
      if (linhaLower.includes('trilha empreendedorismo')) {
        secaoAtual = 'trilha';
        semestreAtual = 11; // Trilha Empreendedorismo
        continue;
      }
      if (linhaLower.includes('trilha inovação social')) {
        secaoAtual = 'trilha';
        semestreAtual = 12; // Trilha Inovação Social
        continue;
      }
      if (linhaLower.includes('trilha internacionalização')) {
        secaoAtual = 'trilha';
        semestreAtual = 13; // Trilha Internacionalização
        continue;
      }
      if (linhaLower.includes('trilha mestrado')) {
        secaoAtual = 'trilha';
        semestreAtual = 14; // Trilha Mestrado
        continue;
      }
      if (linhaLower.includes('trilhas específicas') || linhaLower.includes('trilha específica')) {
        secaoAtual = 'optativa';
        semestreAtual = 15; // Optativas do Curso
        continue;
      }

      // PADRÃO 1: Linha começa com código de 5 dígitos (formato página 2 das trilhas)
      // Exemplo: "61627 Projeto Aplicado I - Trilha Empreendedorismo 4 60"
      // Exemplo: "50759 Modelagem de Negócios Inovadores 4 60"
      const matchInicioCodigo = trimmed.match(/^(\d{5})\s+(.+)/);
      if (matchInicioCodigo) {
        const codigo = matchInicioCodigo[1];
        if (codigosAdicionados.has(codigo)) continue;
        
        const resto = matchInicioCodigo[2].trim();
        const tokens = resto.split(/\s+/);
        
        // Encontrar números no final
        let indiceFimNome = tokens.length;
        let numerosFinais = [];
        
        for (let i = tokens.length - 1; i >= 0; i--) {
          if (/^\d+$/.test(tokens[i])) {
            numerosFinais.unshift(parseInt(tokens[i]));
            indiceFimNome = i;
          } else if (numerosFinais.length > 0) {
            break;
          }
        }
        
        let nome = tokens.slice(0, indiceFimNome).join(' ').trim();
        nome = nome.replace(/\s+(ou|OU|e|,)\s*$/i, '').replace(/\s+/g, ' ').trim();
        
        // Extrair créditos e carga
        let creditos = 4;
        let cargaHoraria = 60;
        
        if (numerosFinais.length >= 1) {
          for (const num of numerosFinais) {
            if (num >= 1 && num <= 8 && creditos === 4) {
              creditos = num;
            } else if (num >= 15 && num <= 200 && cargaHoraria === 60) {
              cargaHoraria = num;
              break;
            }
          }
        }
        
        if (nome.length >= 3 && nome.length <= 200 && !/^\d+$/.test(nome)) {
          const nomeLower = nome.toLowerCase();
          if (!nomesAdicionados.has(nomeLower) && !nomesGenericos.some(g => nomeLower.includes(g))) {
            let tipo = secaoAtual;
            let periodo = semestreAtual;
            
            if (ehTrilha(nome) && secaoAtual === 'obrigatoria') {
              tipo = 'trilha';
              periodo = 11;
            }
            
            disciplinas.push({
              codigo,
              nome,
              creditos,
              cargaHoraria,
              periodo,
              tipo,
              fonte: 'manual'
            });
            
            codigosAdicionados.add(codigo);
            nomesAdicionados.add(nomeLower);
          }
        }
        continue;
      }

      // PADRÃO 2: [SEQ] CÓDIGO NOME [OBS] CRED HORAS ... (formato página 1)
      const codigoMatch = trimmed.match(/\b(\d{5})\b/);
      
      if (codigoMatch) {
        const codigo = codigoMatch[1];
        
        // Evitar duplicatas
        if (codigosAdicionados.has(codigo)) continue;
        
        // Extrair semestre (número de 1-2 dígitos ANTES do código)
        const antesCodigo = trimmed.substring(0, codigoMatch.index).trim();
        const semMatch = antesCodigo.match(/^(\d{1,2})$/);
        if (semMatch && secaoAtual === 'obrigatoria') {
          const sem = parseInt(semMatch[1]);
          if (sem >= 1 && sem <= 10) semestreAtual = sem;
        }
        
        // Extrair tudo após o código
        const depoisCodigo = trimmed.substring(codigoMatch.index + 5).trim();
        
        // Separar em tokens
        const tokens = depoisCodigo.split(/\s+/);
        
        // Encontrar onde começam os números (créditos, carga horária)
        let indiceFimNome = tokens.length;
        let numerosFinais = [];
        
        // Procurar de trás pra frente por números
        for (let i = tokens.length - 1; i >= 0; i--) {
          if (/^\d+$/.test(tokens[i])) {
            numerosFinais.unshift(parseInt(tokens[i]));
            indiceFimNome = i;
          } else if (numerosFinais.length > 0) {
            break;
          }
        }
        
        // Nome = tokens do início até onde começam os números
        let nome = tokens.slice(0, indiceFimNome).join(' ').trim();
        
        // Limpar "ou", "OU", números soltos no final do nome
        nome = nome
          .replace(/\s+(ou|OU|e|,)\s*$/i, '')
          .replace(/\s+\d+\s*$/, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Extrair créditos e carga horária
        let creditos = 4;
        let cargaHoraria = 60;
        
        if (numerosFinais.length >= 2) {
          for (const num of numerosFinais) {
            if (num >= 1 && num <= 8 && creditos === 4) {
              creditos = num;
            } else if (num >= 15 && num <= 200 && cargaHoraria === 60) {
              cargaHoraria = num;
              break;
            }
          }
        } else if (numerosFinais.length === 1) {
          const num = numerosFinais[0];
          if (num >= 15 && num <= 200) {
            cargaHoraria = num;
          } else if (num >= 1 && num <= 8) {
            creditos = num;
          }
        }
        
        // Validações do nome
        if (nome.length < 3 || nome.length > 200) continue;
        if (/^\d+$/.test(nome)) continue;
        if (nomesGenericos.some(g => nome.toLowerCase().includes(g))) continue;
        
        const nomeLower = nome.toLowerCase();
        if (nomesAdicionados.has(nomeLower)) continue;
        
        // Determinar tipo da disciplina
        let tipo = secaoAtual;
        let periodo = semestreAtual;
        
        // Se está em seção obrigatória mas nome indica trilha
        if (secaoAtual === 'obrigatoria' && ehTrilha(nome)) {
          tipo = 'trilha';
          periodo = 11; // Genérico para trilhas encontradas fora de seção
        }
        
        disciplinas.push({
          codigo,
          nome,
          creditos,
          cargaHoraria,
          periodo,
          tipo, // 'obrigatoria', 'trilha', 'optativa'
          fonte: 'manual'
        });
        
        codigosAdicionados.add(codigo);
        nomesAdicionados.add(nomeLower);
      }
    }

    return disciplinas.sort((a, b) => a.periodo - b.periodo || a.nome.localeCompare(b.nome));
  }, [ehTrilha]);

  // Processar PDF
  const processarPdf = useCallback(async (file, usarIA = true) => {
    setProcessandoPdf(true);
    setErroPdf(null);
    setArquivoPdf(file);
    setTextoExtraidoPdf('');
    setDisciplinasPreview([]);

    try {
      if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve();
          };
          script.onerror = () => reject(new Error('Falha ao carregar pdf.js'));
          document.head.appendChild(script);
        });
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let textoCompleto = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let ultimoY = null;
        let linhaAtual = '';
        
        for (const item of textContent.items) {
          if (ultimoY !== null && Math.abs(item.transform[5] - ultimoY) > 5) {
            textoCompleto += linhaAtual.trim() + '\n';
            linhaAtual = '';
          }
          linhaAtual += item.str + ' ';
          ultimoY = item.transform[5];
        }
        if (linhaAtual.trim()) {
          textoCompleto += linhaAtual.trim() + '\n';
        }
        textoCompleto += '\n';
      }

      setTextoExtraidoPdf(textoCompleto);
      setTexto(textoCompleto);
      setProcessandoPdf(false);

      if (usarIA) {
        const sucesso = await analisarComIA(textoCompleto);
        if (!sucesso) {
          // Fallback para parser manual
          const disciplinas = parseTextoManual(textoCompleto);
          setDisciplinasPreview(disciplinas);
          if (disciplinas.length === 0) {
            setErroPdf('Nenhuma disciplina com código de 5 dígitos encontrada. Verifique se o PDF é uma grade curricular da UNISINOS.');
          }
        }
      } else {
        const disciplinas = parseTextoManual(textoCompleto);
        setDisciplinasPreview(disciplinas);
        if (disciplinas.length === 0) {
          setErroPdf('Nenhuma disciplina encontrada. O formato esperado é: SEQ | CÓDIGO (5 dígitos) | NOME | CRED | HORAS');
        }
      }

    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      setErroPdf('Erro ao ler o PDF.');
      setProcessandoPdf(false);
    }
  }, [analisarComIA, parseTextoManual]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      processarPdf(file, true);
    } else {
      setErroPdf('Por favor, selecione um arquivo PDF.');
    }
  };

  const [statusPortal, setStatusPortal] = useState('');

  const buscarDoPortal = useCallback(async () => {
    setBuscandoPortal(true);
    setErroPortal(null);
    setDisciplinasPreview([]);
    setStatusPortal('');

    try {
      let token = null;
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      // Acordar o servidor (free tier do Render dorme após inatividade ~50s)
      setStatusPortal('Acordando servidor (pode levar até 1 min)...');
      try {
        const wake = await fetch(`${apiUrl}/api/health`, { signal: AbortSignal.timeout(90000) });
        if (!wake.ok) throw new Error();
      } catch {
        throw new Error('Servidor indisponível. Tente novamente em alguns instantes.');
      }

      setStatusPortal('Buscando dados do portal (pode levar ~40s)...');
      const res = await fetch(`${apiUrl}/api/portal/historico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ra: ra.trim(), senha }),
        signal: AbortSignal.timeout(120000), // 2 minutos
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Erro ${res.status}`);
      }

      const { data: disciplinas } = await res.json();

      if (!disciplinas || disciplinas.length === 0) {
        throw new Error('Nenhuma disciplina encontrada no portal.');
      }

      // 1. Filtrar metadata, extracurriculares e lixo do portal TOTVS
      const disciplinasReais = disciplinas.filter(d => {
        const nome = (d.nome || '').toLowerCase();
        const codigo = (d.codigo || '');
        // Resumos e totais HTML
        if (nome.includes('<i>') || nome.includes('</i>')) return false;
        if (nome.startsWith('total ch') || codigo.toLowerCase() === 'totchintegralizada') return false;
        // Cabeçalhos de seção e totais de modalidade
        if (codigo === '-1' || codigo.toLowerCase() === 'totaismodalidade') return false;
        // Cabeçalhos "Modalidade: ..."
        if (nome.startsWith('modalidade:')) return false;
        // Extracurriculares (CODDISC vazio): Code@Night, estágios, atividades acadêmicas
        if (!codigo || codigo.trim() === '') return false;
        // Nome vazio
        if (!d.nome || d.nome.trim().length === 0) return false;
        return true;
      });

      // 2. Deduplicar por nome: o portal retorna tanto o slot da grade (sem nota)
      //    quanto a entrada cursada (com nota/semestre). Mantemos a melhor.
      const porNome = {};
      for (const d of disciplinasReais) {
        const key = d.nome.toLowerCase().trim();
        if (!porNome[key]) porNome[key] = [];
        porNome[key].push(d);
      }

      const deduplicadas = [];
      for (const entries of Object.values(porNome)) {
        const cursadas = entries.filter(e => e.semestreCursado);
        const templates = entries.filter(e => !e.semestreCursado);

        // Determinar o periodo correto da grade (períodos 1-10 são normais)
        const templateGrade = templates.find(t => t.periodo > 0 && t.periodo <= 10)
          || entries.find(e => e.periodo > 0 && e.periodo <= 10);
        const periodoGrade = templateGrade ? templateGrade.periodo : 0;

        if (cursadas.length > 0) {
          const aprovadas = cursadas.filter(e => e.status === 'APROVADA');

          // Preferir aprovadas COM nota (real) sobre sem nota (dispensa/equivalência)
          const comNota = aprovadas.filter(e => e.notaFinal !== null && e.notaFinal !== undefined);
          const semNota = aprovadas.filter(e => e.notaFinal === null || e.notaFinal === undefined);
          const melhorAprovada = comNota.length > 0
            ? comNota.sort((a, b) => (b.semestreCursado || '').localeCompare(a.semestreCursado || ''))[0]
            : semNota.sort((a, b) => (b.semestreCursado || '').localeCompare(a.semestreCursado || ''))[0];

          const emCurso = cursadas.find(e => e.status === 'EM_CURSO');
          const melhor = melhorAprovada || emCurso || cursadas[cursadas.length - 1];

          // Usar periodo da grade curricular (1-10), não os especiais (97, 100, 999)
          if (periodoGrade > 0) {
            melhor.periodo = periodoGrade;
          } else if (melhor.periodo >= 90) {
            melhor.periodo = 0; // período especial sem equivalente na grade
          }
          deduplicadas.push(melhor);
        } else {
          // Nunca cursada — manter o template da grade
          const t = templates[0];
          if (t.periodo >= 90) t.periodo = periodoGrade || 0;
          deduplicadas.push(t);
        }
      }

      // 3. Mapear para formato final — usar tipo da API (baseado no SUBGRUPO do TOTVS)
      const formatadas = deduplicadas.map(d => ({
        ...d,
        periodo: d.periodo > 0 ? d.periodo : 0,
        // tipo vem da API (parser classifica via SUBGRUPO): 'obrigatoria' ou 'optativa'
        tipo: d.tipo || (ehTrilha(d.nome) ? 'trilha' : 'obrigatoria'),
        fonte: 'portal',
      }));

      setDisciplinasPreview(formatadas.sort((a, b) => a.periodo - b.periodo || a.nome.localeCompare(b.nome)));
      setFiltroObrigatorias(true);
      setFiltroTrilhas(true);
      setFiltroOptativas(true);
    } catch (err) {
      setErroPortal(err.message);
    } finally {
      setBuscandoPortal(false);
    }
  }, [ra, senha, ehTrilha]);

  const analisarTexto = useCallback(async (usarIA = false) => {
    if (usarIA) {
      await analisarComIA(texto);
    } else {
      const disciplinas = parseTextoManual(texto);
      setDisciplinasPreview(disciplinas);
    }
  }, [texto, analisarComIA, parseTextoManual]);

  const verificarDuplicata = (d) => {
    return disciplinasExistentes.some(existente => 
      existente.nome.toLowerCase().trim() === d.nome.toLowerCase().trim()
    );
  };

  // Função para obter nome do período
  const getNomePeriodo = (periodo) => {
    if (periodo >= 1 && periodo <= 10) return `${periodo}º Semestre`;
    if (periodo === 11) return 'Trilha Empreendedorismo';
    if (periodo === 12) return 'Trilha Inovação Social';
    if (periodo === 13) return 'Trilha Internacionalização';
    if (periodo === 14) return 'Trilha Mestrado';
    if (periodo === 15) return 'Optativas do Curso';
    return `Período ${periodo}`;
  };

  // Filtrar disciplinas baseado nos checkboxes
  const disciplinasFiltradas = disciplinasPreview.filter(d => {
    if (d.tipo === 'obrigatoria' && filtroObrigatorias) return true;
    if (d.tipo === 'trilha' && filtroTrilhas) return true;
    if (d.tipo === 'optativa' && filtroOptativas) return true;
    return false;
  });

  // Contagens por tipo
  const contagens = {
    obrigatorias: disciplinasPreview.filter(d => d.tipo === 'obrigatoria').length,
    trilhas: disciplinasPreview.filter(d => d.tipo === 'trilha').length,
    optativas: disciplinasPreview.filter(d => d.tipo === 'optativa').length
  };

  const confirmarImportacao = async () => {
    const disciplinasParaImportar = disciplinasFiltradas
      .filter(d => !verificarDuplicata(d))
      .map(d => ({
        nome: d.nome,
        periodo: d.periodo,
        creditos: d.creditos || 4,
        cargaHoraria: d.cargaHoraria || 60,
        notaMinima: 6.0,
        faltas: d.fonte === 'portal' ? (d.faltas ?? 0) : 0,
        // Portal: preserva status e notas reais; PDF/texto: inicia como NAO_INICIADA
        status: d.fonte === 'portal' ? (d.status || 'NAO_INICIADA') : 'NAO_INICIADA',
        ga: d.fonte === 'portal' ? (d.ga ?? null) : null,
        gb: d.fonte === 'portal' ? (d.gb ?? null) : null,
        notaFinal: d.fonte === 'portal' ? (d.notaFinal ?? null) : null,
        semestreCursado: d.fonte === 'portal' ? (d.semestreCursado ?? null) : null,
        observacao: '',
      }));

    if (disciplinasParaImportar.length > 0) {
      setImportando(true);
      try {
        await onImport(disciplinasParaImportar);
      } finally {
        setImportando(false);
      }
      onClose();
    }
  };

  const disciplinasNovas = disciplinasFiltradas.filter(d => !verificarDuplicata(d));
  const disciplinasDuplicadas = disciplinasFiltradas.filter(d => verificarDuplicata(d));
  
  const disciplinasPorPeriodo = disciplinasFiltradas.reduce((acc, d) => {
    const p = d.periodo || 1;
    if (!acc[p]) acc[p] = [];
    acc[p].push(d);
    return acc;
  }, {});

  const isProcessando = processandoPdf || processandoIA || buscandoPortal || importando;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Upload size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Importar Cadeiras</h2>
              <p className="text-slate-400 text-sm">Análise inteligente com IA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-white/10">
          <button
            onClick={() => { setModo('texto'); setDisciplinasPreview([]); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              modo === 'texto' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <FileText size={18} />
            Colar Texto
          </button>
          <button
            onClick={() => { setModo('pdf'); setDisciplinasPreview([]); setErroPdf(null); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              modo === 'pdf'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <File size={18} />
            Upload PDF
          </button>
          <button
            onClick={() => { setModo('portal'); setDisciplinasPreview([]); setErroPortal(null); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              modo === 'portal'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <Globe size={18} />
            Portal Auto
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {modo === 'texto' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  Cole a lista de disciplinas
                </label>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 resize-none font-mono"
                  placeholder="Cole aqui o texto do PDF ou lista de disciplinas..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => analisarTexto(true)}
                  disabled={!texto.trim() || isProcessando}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {processandoIA ? (
                    <><Loader2 size={18} className="animate-spin" /> Analisando...</>
                  ) : (
                    <><Sparkles size={18} /> Análise com IA</>
                  )}
                </button>
                <button
                  onClick={() => analisarTexto(false)}
                  disabled={!texto.trim() || isProcessando}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-medium hover:bg-white/10 transition-all disabled:opacity-50"
                  title="Análise manual sem IA"
                >
                  <Zap size={18} />
                </button>
              </div>

              <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-3 flex items-start gap-2">
                <Sparkles size={16} className="text-violet-400 mt-0.5 flex-shrink-0" />
                <p className="text-violet-300 text-xs">
                  <strong>IA ativada:</strong> O Claude analisa o texto e extrai as disciplinas automaticamente.
                </p>
              </div>
            </div>
          )}

          {modo === 'pdf' && (
            <div className="space-y-4">
              <div
                onClick={() => !isProcessando && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isProcessando 
                    ? 'border-violet-500/50 bg-violet-500/10 cursor-wait' 
                    : arquivoPdf && disciplinasPreview.length > 0
                      ? 'border-emerald-500/50 bg-emerald-500/10' 
                      : 'border-white/20 hover:border-amber-500/50 hover:bg-amber-500/5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {processandoPdf ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={40} className="text-amber-400 animate-spin" />
                    <p className="text-amber-300 font-medium">Extraindo texto do PDF...</p>
                  </div>
                ) : processandoIA ? (
                  <div className="flex flex-col items-center gap-3">
                    <Sparkles size={40} className="text-violet-400 animate-pulse" />
                    <p className="text-violet-300 font-medium">IA analisando disciplinas...</p>
                  </div>
                ) : arquivoPdf && disciplinasPreview.length > 0 ? (
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle size={40} className="text-emerald-400" />
                    <p className="text-emerald-300 font-medium">{arquivoPdf.name}</p>
                    <p className="text-slate-500 text-sm">Clique para selecionar outro</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload size={40} className="text-slate-500" />
                    <p className="text-white font-medium">Clique para selecionar o PDF</p>
                    <p className="text-slate-500 text-sm">A IA vai analisar automaticamente</p>
                  </div>
                )}
              </div>

              {erroPdf && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-amber-300 text-sm">{erroPdf}</p>
                </div>
              )}

              {textoExtraidoPdf && (
                <div className="space-y-2">
                  <button
                    onClick={() => setMostrarTextoExtraido(!mostrarTextoExtraido)}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-all"
                  >
                    {mostrarTextoExtraido ? <EyeOff size={16} /> : <Eye size={16} />}
                    {mostrarTextoExtraido ? 'Ocultar texto extraído' : 'Ver texto extraído'}
                  </button>
                  
                  {mostrarTextoExtraido && (
                    <div className="space-y-2">
                      <textarea
                        value={textoExtraidoPdf}
                        readOnly
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none resize-none font-mono"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigator.clipboard.writeText(textoExtraidoPdf)}
                          className="text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          📋 Copiar texto
                        </button>
                        <button
                          onClick={() => analisarComIA(textoExtraidoPdf)}
                          disabled={processandoIA}
                          className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                        >
                          <Sparkles size={12} /> Reanalisar com IA
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {modo === 'portal' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">
                Busca automaticamente todas as cadeiras e notas diretamente do portal UNISINOS.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Nome de usuário</label>
                  <input
                    type="text"
                    value={ra}
                    onChange={e => setRa(e.target.value)}
                    placeholder="Ex: sobrenomenome"
                    disabled={buscandoPortal}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Senha do portal</label>
                  <div className="relative">
                    <input
                      type={mostrarSenhaPortal ? 'text' : 'password'}
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder="Sua senha do portal.unisinos.br"
                      disabled={buscandoPortal}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 pr-12 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenhaPortal(!mostrarSenhaPortal)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {mostrarSenhaPortal ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={buscarDoPortal}
                disabled={!ra.trim() || !senha.trim() || buscandoPortal}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {buscandoPortal ? (
                  <><Loader2 size={18} className="animate-spin" /> {statusPortal || 'Buscando no portal...'}</>
                ) : (
                  <><Globe size={18} /> Buscar do Portal</>
                )}
              </button>

              {erroPortal && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{erroPortal}</p>
                </div>
              )}

              <div className="bg-slate-700/30 border border-white/5 rounded-xl p-3">
                <p className="text-slate-500 text-xs leading-relaxed">
                  🔒 Suas credenciais são usadas apenas para acessar o portal e <strong className="text-slate-400">nunca ficam salvas</strong> no servidor.
                  O processo abre um browser automático e demora ~30 segundos.
                </p>
              </div>
            </div>
          )}

          {/* Preview */}
          {disciplinasPreview.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  {disciplinasPreview.length} cadeiras encontradas
                  {disciplinasPreview[0]?.fonte === 'ia' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      <Sparkles size={10} className="inline mr-1" />via IA
                    </span>
                  )}
                  {disciplinasPreview[0]?.fonte === 'portal' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      <Globe size={10} className="inline mr-1" />via Portal
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => setExpandido(!expandido)}
                  className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {expandido ? 'Recolher' : 'Expandir'}
                </button>
              </div>

              {/* Filtros por tipo */}
              <div className="bg-slate-700/30 rounded-xl p-4 space-y-3">
                <p className="text-sm text-slate-400 font-medium">Selecione o que importar:</p>
                <div className="flex flex-wrap gap-3">
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    filtroObrigatorias 
                      ? 'bg-emerald-500/20 border border-emerald-500/50' 
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}>
                    <input
                      type="checkbox"
                      checked={filtroObrigatorias}
                      onChange={(e) => setFiltroObrigatorias(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-500"
                    />
                    <span className="text-sm text-white">Obrigatórias</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300">
                      {contagens.obrigatorias}
                    </span>
                  </label>
                  
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    filtroTrilhas 
                      ? 'bg-violet-500/20 border border-violet-500/50' 
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}>
                    <input
                      type="checkbox"
                      checked={filtroTrilhas}
                      onChange={(e) => setFiltroTrilhas(e.target.checked)}
                      className="w-4 h-4 rounded accent-violet-500"
                    />
                    <span className="text-sm text-white">Trilhas</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/30 text-violet-300">
                      {contagens.trilhas}
                    </span>
                  </label>
                  
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    filtroOptativas 
                      ? 'bg-amber-500/20 border border-amber-500/50' 
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}>
                    <input
                      type="checkbox"
                      checked={filtroOptativas}
                      onChange={(e) => setFiltroOptativas(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-500"
                    />
                    <span className="text-sm text-white">Optativas</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300">
                      {contagens.optativas}
                    </span>
                  </label>
                </div>
              </div>

              {/* Resumo da seleção */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{disciplinasNovas.length}</p>
                  <p className="text-xs text-slate-400">Serão importadas</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-400">{disciplinasDuplicadas.length}</p>
                  <p className="text-xs text-slate-400">Já existem</p>
                </div>
              </div>
              
              {/* Badges por período */}
              <div className="flex flex-wrap gap-2">
                {Object.keys(disciplinasPorPeriodo).sort((a, b) => Number(a) - Number(b)).map(p => (
                  <span key={p} className={`text-xs px-2 py-1 rounded-lg border ${
                    Number(p) <= 10 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : Number(p) <= 14
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {getNomePeriodo(Number(p))}: {disciplinasPorPeriodo[p].length}
                  </span>
                ))}
              </div>

              {expandido && disciplinasFiltradas.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {disciplinasFiltradas.map((d, i) => {
                    const isDuplicada = verificarDuplicata(d);
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border ${
                          isDuplicada 
                            ? 'bg-amber-500/10 border-amber-500/30 opacity-60' 
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {d.codigo && (
                                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                                  {d.codigo}
                                </span>
                              )}
                              <p className="text-white font-medium text-sm truncate">{d.nome}</p>
                              {isDuplicada && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                                  Já existe
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span className={`px-1.5 py-0.5 rounded ${
                                d.tipo === 'obrigatoria' 
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : d.tipo === 'trilha'
                                    ? 'bg-violet-500/20 text-violet-400'
                                    : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {getNomePeriodo(d.periodo)}
                              </span>
                              <span>{d.creditos} cr</span>
                              <span>{d.cargaHoraria}h</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {disciplinasFiltradas.length === 0 && (
                <div className="text-center py-4 text-slate-500">
                  <p>Selecione pelo menos um tipo de disciplina para importar</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-medium hover:bg-white/10 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={confirmarImportacao}
            disabled={disciplinasNovas.length === 0 || isProcessando}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {importando ? (
              <><Loader2 size={18} className="animate-spin" /> Salvando...</>
            ) : (
              <>Importar {disciplinasNovas.length} Cadeiras</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
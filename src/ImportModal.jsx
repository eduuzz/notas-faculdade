import React, { useState, useCallback, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Link2, ChevronDown, ChevronUp, Info, Sparkles, File, Loader2 } from 'lucide-react';

// Mapa de códigos para nomes (baseado no currículo UNISINOS CC)
const CURRICULO_UNISINOS = {
  '60963': { nome: 'Raciocínio Lógico', creditos: 4, cargaHoraria: 60, periodo: 1 },
  '60964': { nome: 'Algoritmos e Programação: Fundamentos', creditos: 8, cargaHoraria: 120, periodo: 1 },
  '60965': { nome: 'Computação: Conceitos e Tendências da Profissão', creditos: 4, cargaHoraria: 60, periodo: 1 },
  '60803': { nome: 'Fundamentos de Álgebra Linear', creditos: 4, cargaHoraria: 60, periodo: 1 },
  '30850': { nome: 'Pensamento Computacional', creditos: 4, cargaHoraria: 60, periodo: 1 },
  '10539': { nome: 'Desenvolvimento Pessoal e Profissional: Colaboração', creditos: 4, cargaHoraria: 60, periodo: 1 },
  '31113': { nome: 'Exame de Proficiência em Pensamento Computacional', creditos: 1, cargaHoraria: 15, periodo: 1 },
  '60966': { nome: 'Algoritmos e Programação: Estruturas Lineares', creditos: 8, cargaHoraria: 120, periodo: 2, preRequisitos: ['60964'] },
  '60662': { nome: 'Matemática para Computação', creditos: 4, cargaHoraria: 60, periodo: 2, preRequisitos: ['60963'] },
  '99274': { nome: 'Probabilidade e Inferência Estatística', creditos: 4, cargaHoraria: 60, periodo: 2 },
  '60967': { nome: 'Projeto de Sistemas Digitais', creditos: 4, cargaHoraria: 60, periodo: 2, preRequisitos: ['60963'] },
  '10534': { nome: 'Comunicação da Ciência', creditos: 4, cargaHoraria: 60, periodo: 2 },
  '10535': { nome: 'Exame de Proficiência em Comunicação da Ciência', creditos: 1, cargaHoraria: 15, periodo: 2 },
  '10536': { nome: 'Ética e Tecnocultura', creditos: 4, cargaHoraria: 60, periodo: 2 },
  '10537': { nome: 'Cultura e Ecologia Integral', creditos: 4, cargaHoraria: 60, periodo: 2 },
  '10356': { nome: 'Afrodescendentes na América Latina', creditos: 4, cargaHoraria: 60, periodo: 2 },
  '10357': { nome: 'Povos Indígenas na América Latina Contemporânea', creditos: 4, cargaHoraria: 60, periodo: 2 },
  '10540': { nome: 'Desenvolvimento Pessoal e Profissional: Liderança', creditos: 1, cargaHoraria: 15, periodo: 2, preRequisitos: ['10539'] },
  '60968': { nome: 'Fundamentos de Sistemas Operacionais', creditos: 4, cargaHoraria: 60, periodo: 3, preRequisitos: ['60967', '60966'] },
  '60969': { nome: 'Análise e Projeto de Algoritmos', creditos: 4, cargaHoraria: 60, periodo: 3, coRequisitos: ['60970'] },
  '60970': { nome: 'Algoritmos e Programação: Árvores e Ordenação', creditos: 4, cargaHoraria: 60, periodo: 3, preRequisitos: ['60966'] },
  '60971': { nome: 'Engenharia de Software: Requisitos', creditos: 4, cargaHoraria: 60, periodo: 3, preRequisitos: ['60963', '60966'] },
  '60800': { nome: 'Cálculo Diferencial', creditos: 4, cargaHoraria: 60, periodo: 3, preRequisitos: ['60662'] },
  '50758': { nome: 'Empreendedorismo e Solução de Problemas', creditos: 4, cargaHoraria: 60, periodo: 3 },
  '51125': { nome: 'Entrepreneurship and Problem Solving', creditos: 4, cargaHoraria: 60, periodo: 3 },
  '51203': { nome: 'Community Engagement and Local Problem Solving', creditos: 4, cargaHoraria: 60, periodo: 3 },
  '10541': { nome: 'Desenvolvimento Pessoal e Profissional: Protagonismo', creditos: 1, cargaHoraria: 15, periodo: 3, preRequisitos: ['10539'] },
  '60972': { nome: 'Algoritmos e Programação: Grafos, Hashing e Heaps', creditos: 4, cargaHoraria: 60, periodo: 4, preRequisitos: ['60970'] },
  '60973': { nome: 'Redes de Computadores: Aplicação e Transporte', creditos: 4, cargaHoraria: 60, periodo: 4, preRequisitos: ['60968'] },
  '60974': { nome: 'Fundamentos de Banco de Dados', creditos: 4, cargaHoraria: 60, periodo: 4, preRequisitos: ['60970'] },
  '60975': { nome: 'Análise e Aplicação de Sistemas Operacionais', creditos: 4, cargaHoraria: 60, periodo: 4, preRequisitos: ['60968'] },
  '60976': { nome: 'Engenharia de Software: Análise', creditos: 4, cargaHoraria: 60, periodo: 4, preRequisitos: ['60971'] },
  '10533': { nome: 'Análise de dados para tomada de decisão', creditos: 4, cargaHoraria: 60, periodo: 4 },
  '10542': { nome: 'Desenvolvimento Pessoal e Profissional: Interfaces', creditos: 1, cargaHoraria: 15, periodo: 4, preRequisitos: ['10539'] },
  '60977': { nome: 'Linguagens Formais e Autômatos', creditos: 4, cargaHoraria: 60, periodo: 5, preRequisitos: ['60966', '60662'] },
  '60023': { nome: 'Paradigmas de Programação', creditos: 4, cargaHoraria: 60, periodo: 5, preRequisitos: ['60966'] },
  '60375': { nome: 'Processamento Gráfico', creditos: 4, cargaHoraria: 60, periodo: 5, preRequisitos: ['60803', '60966'] },
  '60978': { nome: 'Inteligência Artificial e Aprendizado de Máquina', creditos: 4, cargaHoraria: 60, periodo: 5, coRequisitos: ['60972'], preRequisitos: ['60963', '60023', '99274'] },
  '60979': { nome: 'Engenharia de Software: Projeto', creditos: 4, cargaHoraria: 60, periodo: 5, preRequisitos: ['60976'] },
  '60801': { nome: 'Cálculo Integral', creditos: 4, cargaHoraria: 60, periodo: 5, preRequisitos: ['60800'] },
  '10543': { nome: 'Desenvolvimento Pessoal e Profissional: Conexões', creditos: 1, cargaHoraria: 15, periodo: 5, preRequisitos: ['10539'] },
  '60031': { nome: 'Teoria da Computação', creditos: 4, cargaHoraria: 60, periodo: 6, preRequisitos: ['60977'] },
  '60980': { nome: 'Redes de Computadores: Internetworking, Roteamento e Transmissão', creditos: 4, cargaHoraria: 60, periodo: 6, preRequisitos: ['60973'] },
  '60981': { nome: 'Sistemas de Gerência de Banco de Dados', creditos: 4, cargaHoraria: 60, periodo: 6, preRequisitos: ['60974'] },
  '60982': { nome: 'Arquitetura de Sistemas Digitais', creditos: 4, cargaHoraria: 60, periodo: 6, preRequisitos: ['60967'] },
  '60983': { nome: 'Teoria da Informação: Compressão e Criptografia', creditos: 4, cargaHoraria: 60, periodo: 6, preRequisitos: ['60966', '99274'] },
  '93903': { nome: 'Elaboração de Projetos', creditos: 4, cargaHoraria: 60, periodo: 6, preRequisitos: ['100 créditos'] },
  '60984': { nome: 'Engenharia de Software: Implementação e Teste', creditos: 4, cargaHoraria: 60, periodo: 6, preRequisitos: ['60979'] },
  '93926': { nome: 'Tradutores', creditos: 4, cargaHoraria: 60, periodo: 7, preRequisitos: ['60977'] },
  '93923': { nome: 'Sistemas Distribuídos', creditos: 4, cargaHoraria: 60, periodo: 7, preRequisitos: ['60973'] },
  '60985': { nome: 'Design de Interação Humano-Computador', creditos: 4, cargaHoraria: 60, periodo: 7, preRequisitos: ['60971'] },
  '60986': { nome: 'Computação de Alto Desempenho', creditos: 4, cargaHoraria: 60, periodo: 7, preRequisitos: ['60023', '60973'] },
  '60381': { nome: 'Computação Gráfica', creditos: 4, cargaHoraria: 60, periodo: 7, preRequisitos: ['60375'] },
  '60988': { nome: 'Internet das Coisas: Sensores, Protocolos e Aplicações', creditos: 4, cargaHoraria: 60, periodo: 8, preRequisitos: ['60023', '60973'] },
  '60989': { nome: 'Ciência de Dados e Big Data', creditos: 4, cargaHoraria: 60, periodo: 8, preRequisitos: ['60974', '99274'] },
  '65072': { nome: 'Simulação e Modelagem de Sistemas', creditos: 4, cargaHoraria: 60, periodo: 8, preRequisitos: ['60966', '99274'] },
  // Optativas
  '10530': { nome: 'Inclusão e Acessibilidade em Contextos Profissionais', creditos: 4, cargaHoraria: 60, periodo: 0 },
  '62390': { nome: 'Tópicos Especiais em Computação: Introdução à Computação Quântica', creditos: 4, cargaHoraria: 60, periodo: 0, preRequisitos: ['60972'] },
  '10532': { nome: 'Pensamento Projetual e Criativo', creditos: 4, cargaHoraria: 60, periodo: 0 },
  '10792': { nome: 'Design Thinking for a Sustainable Future', creditos: 4, cargaHoraria: 60, periodo: 0 },
  '60382': { nome: 'Realidade Virtual', creditos: 4, cargaHoraria: 60, periodo: 0, preRequisitos: ['60375'] },
  '60394': { nome: 'Técnicas Avançadas de Computação Gráfica', creditos: 4, cargaHoraria: 60, periodo: 0, preRequisitos: ['60381'] },
  '60411': { nome: 'Processos de Teste de Software', creditos: 4, cargaHoraria: 60, periodo: 0, preRequisitos: ['60966'] },
  '60525': { nome: 'Gerência de Projetos de Software', creditos: 4, cargaHoraria: 60, periodo: 0, preRequisitos: ['60979'] },
  '60528': { nome: 'Arquitetura de Software', creditos: 4, cargaHoraria: 60, periodo: 0, preRequisitos: ['60979'] },
  '60575': { nome: 'Fundamentos de Segurança da Informação', creditos: 4, cargaHoraria: 60, periodo: 0, preRequisitos: ['60973'] },
  '60580': { nome: 'Segurança de aplicações', creditos: 4, cargaHoraria: 60, periodo: 0, preRequisitos: ['60966'] },
  '60642': { nome: 'Ubiquitous and Mobile Computing', creditos: 4, cargaHoraria: 60, periodo: 0, preRequisitos: ['60980'] },
  '60876': { nome: 'Séries de Potências e de Fourier', creditos: 4, cargaHoraria: 60, periodo: 0, preRequisitos: ['60801'] },
  '93891': { nome: 'Computação Móvel e Ubíqua', creditos: 4, cargaHoraria: 60, periodo: 0, preRequisitos: ['60980'] },
  '93902': { nome: 'Desenvolvimento para a Web', creditos: 4, cargaHoraria: 60, periodo: 0, preRequisitos: ['60973', '60974'] },
  '93907': { nome: 'Sistemas de Recomendação', creditos: 4, cargaHoraria: 60, periodo: 0, preRequisitos: ['60974', '60978'] },
  '93916': { nome: 'Gerência de Redes', creditos: 4, cargaHoraria: 60, periodo: 0, preRequisitos: ['60973'] },
  '93933': { nome: 'Redes Avançadas', creditos: 4, cargaHoraria: 60, periodo: 0, preRequisitos: ['60966'] },
  '30318': { nome: 'Inglês Técnico para Computação', creditos: 4, cargaHoraria: 60, periodo: 0 },
  '96653': { nome: 'Cultura Surda e LIBRAS', creditos: 4, cargaHoraria: 60, periodo: 0 },
  '70333': { nome: 'Cidades Audiovisuais, Inteligentes e Sustentáveis', creditos: 4, cargaHoraria: 60, periodo: 0 },
};

export default function ImportModal({ onClose, onImport, disciplinasExistentes = [] }) {
  const [modo, setModo] = useState('pdf'); // 'pdf', 'texto', 'curriculo'
  const [texto, setTexto] = useState('');
  const [disciplinasPreview, setDisciplinasPreview] = useState([]);
  const [expandido, setExpandido] = useState(false);
  const [curriculoSelecionado, setCurriculoSelecionado] = useState('unisinos_cc');
  const [processandoPdf, setProcessandoPdf] = useState(false);
  const [arquivoPdf, setArquivoPdf] = useState(null);
  const [erroPdf, setErroPdf] = useState(null);
  const fileInputRef = useRef(null);

  // Função para extrair código de disciplina
  const extrairCodigo = (texto) => {
    const match = texto.match(/^\d{5}/);
    return match ? match[0] : null;
  };

  // Parser inteligente para texto (do PDF ou colado)
  const parseTexto = useCallback((text) => {
    const linhas = text.split('\n').filter(l => l.trim());
    const disciplinas = [];
    const disciplinasAdicionadas = new Set();

    for (const linha of linhas) {
      const trimmed = linha.trim();
      if (!trimmed || trimmed.includes('Atividades Complementares') || trimmed.includes('ATIVIDADES ACADÊMICAS')) continue;

      // Procurar por códigos de 5 dígitos na linha
      const codigosMatch = trimmed.match(/\b\d{5}\b/g);
      
      if (codigosMatch) {
        for (const codigo of codigosMatch) {
          if (CURRICULO_UNISINOS[codigo] && !disciplinasAdicionadas.has(codigo)) {
            const info = CURRICULO_UNISINOS[codigo];
            disciplinas.push({
              codigo,
              nome: info.nome,
              creditos: info.creditos,
              cargaHoraria: info.cargaHoraria,
              periodo: info.periodo,
              preRequisitos: info.preRequisitos || [],
              coRequisitos: info.coRequisitos || [],
              fonte: 'curriculo'
            });
            disciplinasAdicionadas.add(codigo);
          }
        }
      }
    }

    // Se não encontrou nenhuma pelo código, tentar extrair nomes
    if (disciplinas.length === 0) {
      for (const linha of linhas) {
        const trimmed = linha.trim();
        if (!trimmed || trimmed.length < 5) continue;

        // Verificar se é um nome de disciplina conhecido
        for (const [codigo, info] of Object.entries(CURRICULO_UNISINOS)) {
          if (trimmed.toLowerCase().includes(info.nome.toLowerCase()) && !disciplinasAdicionadas.has(codigo)) {
            disciplinas.push({
              codigo,
              nome: info.nome,
              creditos: info.creditos,
              cargaHoraria: info.cargaHoraria,
              periodo: info.periodo,
              preRequisitos: info.preRequisitos || [],
              coRequisitos: info.coRequisitos || [],
              fonte: 'curriculo'
            });
            disciplinasAdicionadas.add(codigo);
          }
        }

        // Se não encontrou no currículo, adicionar como nova
        if (disciplinas.length === 0 || !disciplinasAdicionadas.has(trimmed)) {
          const partes = trimmed.split(/\s{2,}|\t/);
          let nome = partes[0];
          
          // Limpar nome
          nome = nome
            .replace(/^\d+\s*/, '')
            .replace(/\d+\s*$/, '')
            .replace(/\s+\d+\s+\d+.*$/, '')
            .trim();

          if (nome && nome.length > 3 && !nome.match(/^\d+$/) && !disciplinasAdicionadas.has(nome.toLowerCase())) {
            disciplinas.push({
              codigo: null,
              nome,
              creditos: 4,
              cargaHoraria: 60,
              periodo: 1,
              preRequisitos: [],
              coRequisitos: [],
              fonte: 'texto'
            });
            disciplinasAdicionadas.add(nome.toLowerCase());
          }
        }
      }
    }

    return disciplinas.sort((a, b) => a.periodo - b.periodo || a.nome.localeCompare(b.nome));
  }, []);

  // Processar arquivo PDF usando pdf.js
  const processarPdf = useCallback(async (file) => {
    setProcessandoPdf(true);
    setErroPdf(null);
    setArquivoPdf(file);

    try {
      // Carregar pdf.js dinamicamente
      const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.mjs';

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let textoCompleto = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        textoCompleto += pageText + '\n';
      }

      setTexto(textoCompleto);
      const disciplinas = parseTexto(textoCompleto);
      setDisciplinasPreview(disciplinas);

      if (disciplinas.length === 0) {
        setErroPdf('Nenhuma disciplina reconhecida. Tente colar o texto manualmente.');
      }
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      setErroPdf('Erro ao ler o PDF. Tente colar o texto manualmente na aba "Colar Texto".');
    } finally {
      setProcessandoPdf(false);
    }
  }, [parseTexto]);

  // Handler para upload de arquivo
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        processarPdf(file);
      } else {
        setErroPdf('Por favor, selecione um arquivo PDF.');
      }
    }
  };

  // Importar currículo completo
  const importarCurriculoCompleto = useCallback(() => {
    const disciplinas = Object.entries(CURRICULO_UNISINOS)
      .filter(([codigo, info]) => info.periodo > 0) // Apenas obrigatórias
      .map(([codigo, info]) => ({
        codigo,
        nome: info.nome,
        creditos: info.creditos,
        cargaHoraria: info.cargaHoraria,
        periodo: info.periodo,
        preRequisitos: info.preRequisitos || [],
        coRequisitos: info.coRequisitos || [],
        fonte: 'curriculo'
      }))
      .sort((a, b) => a.periodo - b.periodo || a.nome.localeCompare(b.nome));

    setDisciplinasPreview(disciplinas);
  }, []);

  // Analisar texto
  const analisarTexto = useCallback(() => {
    const disciplinas = parseTexto(texto);
    setDisciplinasPreview(disciplinas);
  }, [texto, parseTexto]);

  // Verificar duplicatas
  const verificarDuplicata = (nome) => {
    return disciplinasExistentes.some(d => 
      d.nome.toLowerCase().trim() === nome.toLowerCase().trim()
    );
  };

  // Confirmar importação
  const confirmarImportacao = () => {
    const disciplinasParaImportar = disciplinasPreview
      .filter(d => !verificarDuplicata(d.nome))
      .map(d => ({
        nome: d.nome,
        periodo: d.periodo || 1,
        creditos: d.creditos || 4,
        cargaHoraria: d.cargaHoraria || 60,
        notaMinima: 6.0,
        status: 'NAO_INICIADA',
        ga: null,
        gb: null,
        notaFinal: null,
        semestreCursado: null,
        observacao: '',
        codigo: d.codigo || null,
        preRequisitos: d.preRequisitos || [],
        coRequisitos: d.coRequisitos || []
      }));

    if (disciplinasParaImportar.length > 0) {
      onImport(disciplinasParaImportar);
      onClose();
    }
  };

  const disciplinasNovas = disciplinasPreview.filter(d => !verificarDuplicata(d.nome));
  const disciplinasDuplicadas = disciplinasPreview.filter(d => verificarDuplicata(d.nome));
  const comPreRequisitos = disciplinasPreview.filter(d => d.preRequisitos && d.preRequisitos.length > 0);

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
              <p className="text-slate-400 text-sm">Upload de PDF, cole texto ou importe currículo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-white/10">
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
            onClick={() => { setModo('curriculo'); setDisciplinasPreview([]); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              modo === 'curriculo' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <Sparkles size={18} />
            Currículo
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {modo === 'pdf' && (
            <div className="space-y-4">
              {/* Área de upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  processandoPdf 
                    ? 'border-amber-500/50 bg-amber-500/10' 
                    : arquivoPdf 
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
                    <p className="text-amber-300 font-medium">Processando PDF...</p>
                    <p className="text-slate-500 text-sm">Extraindo disciplinas do documento</p>
                  </div>
                ) : arquivoPdf ? (
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle size={40} className="text-emerald-400" />
                    <p className="text-emerald-300 font-medium">{arquivoPdf.name}</p>
                    <p className="text-slate-500 text-sm">Clique para selecionar outro arquivo</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload size={40} className="text-slate-500" />
                    <p className="text-white font-medium">Clique para selecionar o PDF</p>
                    <p className="text-slate-500 text-sm">ou arraste o arquivo aqui</p>
                  </div>
                )}
              </div>

              {erroPdf && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-400 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-medium">Erro ao processar</p>
                    <p className="text-red-200/70 text-sm">{erroPdf}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Info size={14} />
                <span>O sistema reconhece automaticamente códigos de disciplinas da UNISINOS</span>
              </div>
            </div>
          )}

          {modo === 'texto' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  Cole o texto das cadeiras (do PDF ou site)
                </label>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 resize-none font-mono"
                  placeholder="60963 Raciocínio Lógico 4 60&#10;60964 Algoritmos e Programação: Fundamentos 8 120&#10;60965 Computação: Conceitos e Tendências 4 60&#10;&#10;Ou apenas os nomes:&#10;Cálculo I&#10;Física I&#10;Programação I"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Info size={14} />
                <span>O sistema reconhece automaticamente códigos do currículo UNISINOS CC</span>
              </div>

              <button
                onClick={analisarTexto}
                disabled={!texto.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                Analisar Texto
              </button>
            </div>
          )}

          {modo === 'curriculo' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Selecione o currículo</label>
                <select
                  value={curriculoSelecionado}
                  onChange={(e) => setCurriculoSelecionado(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                >
                  <option value="unisinos_cc" className="bg-slate-800">UNISINOS - Ciência da Computação (GR16031)</option>
                </select>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-emerald-300 font-medium">Currículo com pré-requisitos</p>
                    <p className="text-emerald-200/70 text-sm mt-1">
                      Inclui {Object.keys(CURRICULO_UNISINOS).filter(k => CURRICULO_UNISINOS[k].periodo > 0).length} cadeiras obrigatórias com todos os pré-requisitos e correquisitos mapeados.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={importarCurriculoCompleto}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium hover:scale-[1.02] transition-all"
              >
                Carregar Currículo Completo
              </button>
            </div>
          )}

          {/* Preview */}
          {disciplinasPreview.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {disciplinasPreview.length} cadeiras encontradas
                </h3>
                <button
                  onClick={() => setExpandido(!expandido)}
                  className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {expandido ? 'Recolher' : 'Expandir'}
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{disciplinasNovas.length}</p>
                  <p className="text-xs text-slate-400">Novas</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-400">{disciplinasDuplicadas.length}</p>
                  <p className="text-xs text-slate-400">Duplicadas</p>
                </div>
                <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-violet-400">{comPreRequisitos.length}</p>
                  <p className="text-xs text-slate-400">Com Pré-req.</p>
                </div>
              </div>

              {/* Lista */}
              {expandido && (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {disciplinasPreview.map((d, i) => {
                    const isDuplicada = verificarDuplicata(d.nome);
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
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium text-sm">{d.nome}</p>
                              {isDuplicada && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                                  Já existe
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              {d.codigo && <span>Cód: {d.codigo}</span>}
                              <span>{d.creditos} cr</span>
                              <span>{d.cargaHoraria}h</span>
                              <span>{d.periodo > 0 ? `${d.periodo}º sem` : 'Optativa'}</span>
                            </div>
                            {d.preRequisitos && d.preRequisitos.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <Link2 size={12} className="text-violet-400" />
                                <span className="text-xs text-violet-400">
                                  Pré-req: {d.preRequisitos.map(pr => {
                                    const info = CURRICULO_UNISINOS[pr];
                                    return info ? info.nome.substring(0, 20) + '...' : pr;
                                  }).join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
            disabled={disciplinasNovas.length === 0}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            Importar {disciplinasNovas.length} Cadeiras
          </button>
        </div>
      </div>
    </div>
  );
}

// Exportar o currículo para uso em outros componentes
export { CURRICULO_UNISINOS };

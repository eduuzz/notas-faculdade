export function exportarPDF({ disciplinas, estatisticas, userName, userCurso, periodos }) {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    throw new Error('jsPDF não está disponível!');
  }

  const doc = new jsPDF();

  // Paleta de cores — consistente com o app
  const violet = [124, 58, 237];
  const emerald = [16, 185, 129];
  const blue = [59, 130, 246];
  const red = [239, 68, 68];
  const gray700 = [55, 65, 81];
  const gray600 = [75, 85, 99];
  const gray400 = [156, 163, 175];
  const gray200 = [229, 231, 235];
  const gray100 = [243, 244, 246];
  const black = [17, 24, 39];
  const white = [255, 255, 255];

  const statusLabel = {
    'APROVADA': 'Aprovada',
    'EM_CURSO': 'Em Curso',
    'REPROVADA': 'Reprovada',
    'NAO_INICIADA': 'Pendente',
  };

  const statusColor = {
    'APROVADA': emerald,
    'EM_CURSO': blue,
    'REPROVADA': red,
    'NAO_INICIADA': gray400,
  };

  // Cálculos de formatura
  const creditosPorSemestre = 30;
  const creditosFaltando = disciplinas
    .filter(d => d.tipo !== 'optativa' && d.status !== 'APROVADA')
    .reduce((sum, d) => sum + (d.creditos || 4), 0);
  const semestresRestantes = Math.ceil(creditosFaltando / creditosPorSemestre);
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();
  const semestreAtual = mesAtual < 6 ? 1 : 2;
  let anoFormatura = anoAtual;
  let semestreFormatura = semestreAtual;
  for (let i = 0; i < semestresRestantes; i++) {
    semestreFormatura++;
    if (semestreFormatura > 2) {
      semestreFormatura = 1;
      anoFormatura++;
    }
  }

  const top5Notas = disciplinas
    .filter(d => d.notaFinal && d.status === 'APROVADA')
    .sort((a, b) => b.notaFinal - a.notaFinal)
    .slice(0, 5);

  const pageWidth = 210;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // ============ PÁGINA 1: CAPA + RESUMO ============

  // Header violeta sólido
  doc.setFillColor(...violet);
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...white);
  doc.text('Grade Curricular', margin, 18);

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(userCurso || 'Curso', margin, 30);

  // Info do aluno
  let y = 52;
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...black);
  doc.text(userName || 'Estudante', margin, y);

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...gray400);
  doc.text(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }), pageWidth - margin, y, { align: 'right' });

  // Linha separadora
  y += 6;
  doc.setDrawColor(...gray200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // Stats cards (4 em linha)
  y += 10;
  const cardW = (contentWidth - 12) / 4; // 12 = 3 gaps de 4
  const statsData = [
    { label: 'Total', value: String(estatisticas.total), color: gray700 },
    { label: 'Aprovadas', value: String(estatisticas.aprovadas), color: emerald },
    { label: 'Em Curso', value: String(estatisticas.emCurso), color: blue },
    { label: 'Media', value: estatisticas.mediaGeral.toFixed(1), color: violet },
  ];

  statsData.forEach((card, i) => {
    const x = margin + i * (cardW + 4);

    doc.setFillColor(...gray100);
    doc.roundedRect(x, y, cardW, 30, 3, 3, 'F');

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...card.color);
    doc.text(card.value, x + cardW / 2, y + 15, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...gray600);
    doc.text(card.label, x + cardW / 2, y + 24, { align: 'center' });
  });

  // Progresso geral (barra)
  y += 40;
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...gray700);
  doc.text('Progresso Geral', margin, y);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...gray400);
  doc.text(`${estatisticas.progresso.toFixed(0)}%`, pageWidth - margin, y, { align: 'right' });

  y += 4;
  doc.setFillColor(...gray200);
  doc.roundedRect(margin, y, contentWidth, 5, 2, 2, 'F');
  if (estatisticas.progresso > 0) {
    doc.setFillColor(...violet);
    doc.roundedRect(margin, y, Math.max((estatisticas.progresso / 100) * contentWidth, 3), 5, 2, 2, 'F');
  }

  // Previsão de formatura
  y += 16;
  doc.setDrawColor(...gray200);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'S');

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...gray600);
  doc.text('Previsao de Formatura', margin + 8, y + 13);

  doc.setFont(undefined, 'bold');
  doc.setTextColor(...violet);
  if (semestresRestantes > 0) {
    doc.text(`${semestreFormatura}. Semestre de ${anoFormatura}  (${semestresRestantes} semestre${semestresRestantes > 1 ? 's' : ''} restante${semestresRestantes > 1 ? 's' : ''})`, pageWidth - margin - 8, y + 13, { align: 'right' });
  } else {
    doc.setTextColor(...emerald);
    doc.text('Curso Concluido!', pageWidth - margin - 8, y + 13, { align: 'right' });
  }

  // ============ DISCIPLINAS POR SEMESTRE ============
  doc.addPage();

  // Header leve
  doc.setFillColor(...gray100);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...gray700);
  doc.text('Disciplinas por Semestre', margin, 13);
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...gray400);
  doc.text(`${userName} — ${userCurso}`, pageWidth - margin, 13, { align: 'right' });

  y = 30;

  periodos.forEach(periodo => {
    const discs = disciplinas.filter(d => d.periodo === periodo);
    if (discs.length === 0) return;

    const aprovadas = discs.filter(d => d.status === 'APROVADA').length;
    const percentual = Math.round((aprovadas / discs.length) * 100);

    // Estimar espaço: header (12) + linhas da tabela (~7 cada) + margem (8)
    const espacoEstimado = 12 + discs.length * 7 + 8;
    if (y + espacoEstimado > 280) {
      doc.addPage();
      doc.setFillColor(...gray100);
      doc.rect(0, 0, pageWidth, 15, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...gray400);
      doc.text('Disciplinas (continuacao)', margin, 10);
      y = 22;
    }

    // Título do semestre com linha
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...black);
    doc.text(`${periodo}. Semestre`, margin, y);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(...gray400);
    doc.text(`${aprovadas}/${discs.length} (${percentual}%)`, pageWidth - margin, y, { align: 'right' });

    y += 2;
    doc.setDrawColor(...violet);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    // Tabela com autoTable
    const tableBody = discs.map(d => {
      const nota = d.notaFinal ? d.notaFinal.toFixed(1) : '-';
      return [d.nome, String(d.creditos), statusLabel[d.status] || d.status, nota];
    });

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Disciplina', 'Cr', 'Status', 'Nota']],
      body: tableBody,
      theme: 'plain',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: gray700,
        lineColor: gray200,
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: gray100,
        textColor: gray700,
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 16, halign: 'center' },
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        // Colorir texto do status
        if (data.section === 'body' && data.column.index === 2) {
          const disc = discs[data.row.index];
          if (disc) {
            data.cell.styles.textColor = statusColor[disc.status] || gray400;
            data.cell.styles.fontStyle = 'bold';
          }
        }
        // Colorir nota
        if (data.section === 'body' && data.column.index === 3) {
          const disc = discs[data.row.index];
          if (disc && disc.notaFinal) {
            data.cell.styles.textColor = disc.notaFinal >= 6 ? emerald : red;
          }
        }
      },
    });

    y = doc.lastAutoTable.finalY + 8;
  });

  // ============ PÁGINA DE DESEMPENHO ============
  doc.addPage();

  // Header
  doc.setFillColor(...violet);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...white);
  doc.text('Desempenho', margin, 20);

  y = 44;

  // Barras de progresso por semestre
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...black);
  doc.text('Progresso por Semestre', margin, y);
  y += 8;

  const barMaxWidth = 110;
  const barLeft = 38;

  periodos.forEach(periodo => {
    const discs = disciplinas.filter(d => d.periodo === periodo);
    if (discs.length === 0) return;

    const aprovadas = discs.filter(d => d.status === 'APROVADA').length;
    const percentual = (aprovadas / discs.length) * 100;
    const filledWidth = (percentual / 100) * barMaxWidth;

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...gray600);
    doc.text(`${periodo}. Sem`, margin, y + 3.5);

    doc.setFillColor(...gray200);
    doc.roundedRect(barLeft, y, barMaxWidth, 5, 2, 2, 'F');

    if (filledWidth > 0) {
      doc.setFillColor(...violet);
      doc.roundedRect(barLeft, y, Math.max(filledWidth, 3), 5, 2, 2, 'F');
    }

    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...gray700);
    doc.text(`${percentual.toFixed(0)}%`, barLeft + barMaxWidth + 4, y + 3.5);

    // Contagem discreta
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...gray400);
    doc.text(`${aprovadas}/${discs.length}`, barLeft + barMaxWidth + 18, y + 3.5);

    y += 9;
  });

  // Top 5 notas
  y += 8;
  if (top5Notas.length > 0) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...black);
    doc.text('Melhores Notas', margin, y);
    y += 8;

    top5Notas.forEach((d, i) => {
      // Ranking number
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...violet);
      doc.text(`${i + 1}.`, margin, y);

      // Discipline name
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...gray700);
      doc.text(d.nome, margin + 8, y);

      // Grade
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...emerald);
      doc.text(d.notaFinal.toFixed(1), pageWidth - margin, y, { align: 'right' });

      y += 7;
    });
  }

  // Caixa de formatura
  y += 8;
  doc.setDrawColor(...gray200);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'S');

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...gray600);

  if (semestresRestantes > 0) {
    doc.text(`${semestresRestantes} semestre${semestresRestantes > 1 ? 's' : ''} restante${semestresRestantes > 1 ? 's' : ''} para a formatura`, margin + 8, y + 9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...violet);
    doc.text(`Previsao: ${semestreFormatura}. Semestre de ${anoFormatura}`, margin + 8, y + 17);
  } else {
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...emerald);
    doc.text('Curso Concluido!', margin + 8, y + 13);
  }

  // Rodapé
  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...gray400);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} — Semestry`, pageWidth / 2, 290, { align: 'center' });

  doc.save(`grade-curricular-${new Date().toISOString().split('T')[0]}.pdf`);
}
